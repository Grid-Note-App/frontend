import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button, Modal, Form, Card, Spinner } from 'react-bootstrap';
import MarkdownView from './MarkdownView';


const CUSTOM_API_URL = process.env.REACT_APP_API_URL; // "/api"
const AI_API_URL = `${CUSTOM_API_URL}/ai`;

export default function ChatWindow({ currentUser, onNotesUpdated }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [socket, setSocket] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmData, setConfirmData] = useState(null);
    const [suggestion, setSuggestion] = useState(null);
    const [sending, setSending] = useState(false);

    const chatEndRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }, [input]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);


    useEffect(() => {
        if (!currentUser) return;

        const ws = new WebSocket(`${window.location.origin}${AI_API_URL}/chat?chatId=${currentUser.id}&token=${currentUser.idToken}`);

        ws.onopen = () => console.log('✅ WebSocket connected');
        ws.onclose = () => console.log('❌ WebSocket closed');
        ws.onerror = (e) => console.error('WebSocket error:', e);
        ws.onmessage = (event) => handleIncoming(JSON.parse(event.data));

        setSocket(ws);
        return () => ws.close();
    }, [currentUser]);


    const handleIncoming = (msg) => {
        switch (msg.type) {
            case 'TOKEN': {
                setMessages((prev) => {
                    if (prev.length === 0 || prev[prev.length - 1].type !== 'ASSISTANT') {
                        return [...prev, { id: 'stream', type: 'ASSISTANT', content: msg.content }];
                    } else {
                        const updated = [...prev];
                        updated[updated.length - 1].content += msg.content;
                        return updated;
                    }
                });
                break;
            }
            case 'END':
                // финальный сигнал, ничего не делаем
                break;
            case 'ASSISTANT':
                // заменяем стриминговое сообщение финальным
                setMessages((prev) => {
                    const updated = [...prev];
                    if (updated.length > 0 && updated[updated.length - 1].id === 'stream') {
                        updated[updated.length - 1] = msg;
                    } else {
                        updated.push(msg);
                    }
                    return updated;
                });
                break;
            case 'USER':
                setMessages((prev) => [...prev, msg]);
                break;
            case 'CONFIRM': {
                const payload = msg.noteSuggestion || msg.requestedSchema || null;
                setSuggestion(payload);
                setConfirmData(msg);
                setShowConfirm(true);
                break;
            }
            case 'ERROR':
                setMessages((prev) => [...prev, msg]);
                break;
            default:
                console.warn('Unknown message type:', msg);
        }
    };


    const sendMessage = () => {
        if (!socket || socket.readyState !== WebSocket.OPEN || !input.trim()) return;
        setSending(true);
        socket.send(JSON.stringify({ content: input }));
        setMessages((prev) => [...prev, { id: Date.now(), type: 'USER', content: input }]);
        setInput('');
        setSending(false);
    };


    const handleConfirm = async (confirmed) => {
        if (!confirmData) return;
        try {
            await axios.post(`${AI_API_URL}/note-chat/confirm-creation`, null, {
                params: { chatId: currentUser.id, confirmed },
            });

            if (confirmed && typeof onNotesUpdated === 'function') {
                onNotesUpdated();
            }
        } catch (err) {
            console.error('Error sending confirmation', err);
        } finally {
            setShowConfirm(false);
            setConfirmData(null);
            setSuggestion(null);
        }
    };


    const handleClear = async () => {
        try {
            await axios.post(`${AI_API_URL}/note-chat/clear/${currentUser.id}`);
            setMessages([]);
        } catch (e) {
            console.error('Clear failed:', e);
        }
    };

    const formatDateTime = (iso) => {
        if (!iso) return '—';
        try {
            return new Date(iso).toLocaleString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return iso;
        }
    };

    return (
        <Card className="shadow-sm h-100 border-0 rounded-0">
            <Card.Header className="d-flex justify-content-between align-items-center bg-light border-0 border-bottom">
                <strong>AI Chat Assistant</strong>
                <Button size="sm" variant="outline-danger" onClick={handleClear}>
                    Clear
                </Button>
            </Card.Header>

            <Card.Body className="chat-body flex-grow-1">
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={`chat-message ${m.type === 'USER' ? 'from-user' : 'from-assistant'}`}
                    >
                        <div className="bubble">
                            {m.type === 'ASSISTANT'
                                ? <MarkdownView content={m.content} />
                                : <span style={{ whiteSpace: 'pre-wrap' }}>{m.content}</span>}
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef}></div>
            </Card.Body>


            <Card.Footer className="chat-footer bg-light">
                <Form
                    onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                    }}
                    className="d-flex align-items-end gap-2 w-100"
                >
                    <Form.Control
                        as="textarea"
                        ref={textareaRef}
                        rows={1}
                        placeholder="Type your message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={sending}
                        className="chat-textarea"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                    />
                    <Button
                        type="submit"
                        disabled={sending}
                        className="align-self-end"
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        {sending ? <Spinner animation="border" size="sm" /> : 'Send'}
                    </Button>
                </Form>
            </Card.Footer>

            <Modal show={showConfirm} onHide={() => handleConfirm(false)} centered>
                <Modal.Header closeButton className="bg-warning bg-opacity-25">
                    <Modal.Title className="fw-bold text-dark">📒 Confirm Note Creation</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {suggestion ? (
                        <div className="note-preview p-3">
                            <div className="text-muted small mb-3">
                                Пожалуйста, проверьте данные заметки перед созданием:
                            </div>

                            <div className="note-preview-card p-3">
                                <h5 className="fw-bold mb-2">{suggestion.title || 'Без названия'}</h5>

                                <div className="text-start mb-3" style={{ whiteSpace: 'pre-wrap' }}>
                                    {suggestion.description || 'Нет описания'}
                                </div>

                                <div className="small text-muted d-flex align-items-center justify-content-between">
                                    <div>
                                        <i className="bi bi-bell me-1"></i>
                                        {suggestion.remindAt
                                            ? formatDateTime(suggestion.remindAt)
                                            : 'Без напоминания'}
                                    </div>
                                    <span className="fw-semibold text-secondary">🕓</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center">{confirmData?.content || 'Confirm action?'}</p>
                    )}
                </Modal.Body>

                <Modal.Footer className="bg-light bg-opacity-25">
                    <Button variant="secondary" onClick={() => handleConfirm(false)}>
                        ❌ Decline
                    </Button>
                    <Button variant="success" onClick={() => handleConfirm(true)}>
                        ✅ Accept
                    </Button>
                </Modal.Footer>
            </Modal>
        </Card>
    );
}
