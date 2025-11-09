import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Container,
    Navbar,
    Button,
    Modal,
    Form,
    Card,
    Row,
    Col,
    Spinner,
    Toast,
    ToastContainer,
    Image,
    Dropdown
} from 'react-bootstrap';
import './App.css';

const CUSTOM_API_URL = process.env.REACT_APP_API_URL;

function App() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [remindAt, setRemindAt] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [newNoteTitle, setNewNoteTitle] = useState("");
    const [newNoteBody, setNewNoteBody] = useState("");

    const [showToast, setShowToast] = useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState(null);

    const handleCloseModal = () => setShowModal(false);
    const handleShowModal = () => setShowModal(true);

    const handleCloseDeleteConfirm = () => {
        setNoteToDelete(null);
        setShowDeleteConfirm(false);
    };

    const handleShowDeleteConfirm = (id) => {
        setNoteToDelete(id);
        setShowDeleteConfirm(true);
    };

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const response = await axios.get(CUSTOM_API_URL + '/notes');
            setNotes(response.data);
        } catch (error) {
            console.error("Error fetching notes:", error);
        } finally {
            setLoading(false);
        }
    };

    const isExpired = (remindAt) => {
        if (!remindAt) return false;
        return new Date(remindAt) < new Date();
    };

    const handleSaveNote = async () => {
        if (newNoteTitle.trim() === "" || newNoteBody.trim() === "") {
            alert("Title and text are required.");
            return;
        }
        try {
            const response = await axios.post(CUSTOM_API_URL + '/notes', {
                Title: newNoteTitle,
                Text: newNoteBody,
                remindAt: remindAt ? new Date(remindAt).toISOString() : null
            });
            setNotes([response.data, ...notes]);
            handleCloseModal();
            setNewNoteTitle("");
            setNewNoteBody("");
            setRemindAt("");
        } catch (error) {
            console.error("Error adding note:", error);
        }
    };

    const confirmDelete = async () => {
        if (!noteToDelete) return;
        try {
            await axios.delete(`${CUSTOM_API_URL}/notes/${noteToDelete}`);
            setNotes(notes.filter(note => note._id !== noteToDelete));
            setShowToast(true);
        } catch (error) {
            console.error("Error deleting note:", error);
        } finally {
            handleCloseDeleteConfirm();
        }
    };

    const handleLogout = async () => {
        try {
            await axios.post(`${CUSTOM_API_URL}/logout`, {}, { withCredentials: true });
            window.location.href = '/';
        } catch (error) {
            console.error("Error during logout:", error);
            alert("Logout failed.");
        }
    };

    const fetchCurrentUser = async () => {
        try {
            const res = await axios.get(`${CUSTOM_API_URL}/currentUser`, { withCredentials: true });
            setCurrentUser(res.data);
        } catch (err) {
            console.error("Error loading current user", err);
        }
    };

    useEffect(() => {
        fetchCurrentUser();
        fetchNotes();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return null;
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    return (
        <div className="App">
            <Navbar className="navbar-custom mb-4" expand="lg">
                <Container className="d-flex justify-content-between align-items-center">
                    <Navbar.Brand href="#">Notes App</Navbar.Brand>

                    <div className="d-flex align-items-center gap-3">
                        <Button variant="outline-green" onClick={() => setShowModal(true)}>
                            Add Note
                        </Button>

                        <Button variant="outline-danger" className="rounded-pill px-3" onClick={() => window.location.href = '/logout'}>
                            Logout
                        </Button>

                        {currentUser && (
                            <Dropdown align="end">
                                <Dropdown.Toggle
                                    variant="link"
                                    id="dropdown-user"
                                    className="d-flex align-items-center text-decoration-none"
                                >
                                    <Image
                                        src={currentUser.pictureUrl}
                                        roundedCircle
                                        width={38}
                                        height={38}
                                        className="me-2 border"
                                        alt="User Avatar"
                                    />
                                    <span className="fw-semibold">{currentUser.firstName}</span>
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                    <Dropdown.Header>
                                        <div>{currentUser.firstName} {currentUser.lastName}</div>
                                        <div className="text-muted small">{currentUser.email}</div>
                                    </Dropdown.Header>
                                </Dropdown.Menu>
                            </Dropdown>
                        )}
                    </div>
                </Container>
            </Navbar>
            <Container>
                {loading ? (
                    <div className="text-center">
                        <Spinner animation="border" variant="primary" />
                        <p>Loading notes...</p>
                    </div>
                ) : (
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {notes.map((note) => (
                            <Col key={note._id}>
                                <Card className={`note-card h-100 ${isExpired(note.remindAt) ? 'expired-note' : ''}`}>
                                    <Card.Body>
                                        <Card.Title>{note.Title}</Card.Title>
                                        <Card.Text style={{ whiteSpace: 'pre-wrap' }}>
                                            {note.Text}
                                        </Card.Text>

                                        {note.remindAt && (
                                            <div className={`mt-2 small ${isExpired(note.remindAt) ? 'text-muted' : 'text-warning'}`}>
                                                <i className="bi bi-bell"></i> Reminder: {formatDate(note.remindAt)}
                                            </div>
                                        )}
                                    </Card.Body>

                                    <Card.Footer className="d-flex justify-content-between align-items-center">
                                        <small className="text-muted">
                                            Created: {formatDate(note.CreatedAt)}
                                        </small>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleShowDeleteConfirm(note._id)}
                                        >
                                            Delete
                                        </Button>
                                    </Card.Footer>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </Container>

            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Add a New Note</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3" controlId="formNoteTitle">
                            <Form.Label>Title</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter title"
                                value={newNoteTitle}
                                onChange={(e) => setNewNoteTitle(e.target.value)}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formNoteBody">
                            <Form.Label>Body / Text</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={5}
                                placeholder="Enter your note..."
                                value={newNoteBody}
                                onChange={(e) => setNewNoteBody(e.target.value)}
                                className="textarea-notepad"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formRemindAt">
                            <Form.Label>Remind at</Form.Label>
                            <Form.Control
                                type="datetime-local"
                                value={remindAt}
                                onChange={(e) => setRemindAt(e.target.value)}
                            />
                            <Form.Text className="text-muted">
                                Optional — choose when you want to be reminded.
                            </Form.Text>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleSaveNote}>
                        Save Note
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showDeleteConfirm} onHide={handleCloseDeleteConfirm} centered size="sm">
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete this note?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseDeleteConfirm}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmDelete}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>

            <ToastContainer className="p-3" position="bottom-end" style={{ zIndex: 1060 }}>
                <Toast
                    onClose={() => setShowToast(false)}
                    show={showToast}
                    delay={3000}
                    autohide
                    bg="success"
                >
                    <Toast.Body className="text-white">Note deleted successfully!</Toast.Body>
                </Toast>
            </ToastContainer>
        </div>
    );
}

export default App;
