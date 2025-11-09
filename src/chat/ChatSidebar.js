import React, { useState, useRef, useEffect } from "react";
import { Card } from "react-bootstrap";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ChatWindow from "./ChatWindow";

export default function ChatSidebar({ currentUser, onNotesUpdated }) {
    const [open, setOpen] = useState(false);
    const [width, setWidth] = useState(window.innerWidth * 0.4);
    const [dragging, setDragging] = useState(false);
    const sidebarRef = useRef(null);

    // === Закрытие при клике вне панели ===
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!open) return;
            if (sidebarRef.current && sidebarRef.current.contains(e.target)) return;
            if (e.target.closest(".modal")) return; // не закрываем при клике на confirm-модалку
            setOpen(false);
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    // === Ресайз ===
    const startDragging = () => setDragging(true);
    const stopDragging = () => setDragging(false);

    const handleMouseMove = (e) => {
        if (!dragging) return;
        const screenWidth = window.innerWidth;
        const minWidth = screenWidth * 0.4; // ← минимум 40%
        const maxWidth = screenWidth * 0.75; // ← максимум 75%
        const newWidth = Math.min(Math.max(screenWidth - e.clientX, minWidth), maxWidth);
        setWidth(newWidth);
    };

    useEffect(() => {
        if (dragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", stopDragging);
        } else {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", stopDragging);
        }
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", stopDragging);
        };
    }, [dragging]);

    return (
        <>
            {open && <div className="chat-overlay" onClick={() => setOpen(false)} />}

            <div
                ref={sidebarRef}
                className={`chat-sidebar ${open ? "open" : ""}`}
                style={{ width: `${width}px` }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* === Прикреплённый шеврон справа от сайдбара === */}
                <div
                    className="chat-toggle-attached"
                    onClick={() => setOpen(!open)}
                    title={open ? "Close chat" : "Open chat"}
                >
                    {open ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
                </div>

                {/* === Контент чата === */}
                <Card className="border-0 shadow-sm h-100 rounded-0">
                    <Card.Body className="p-0 position-relative">
                        <ChatWindow currentUser={currentUser} onNotesUpdated={onNotesUpdated} />
                    </Card.Body>
                </Card>

                {/* === Ресайз === */}
                <div
                    className="resize-handle"
                    onMouseDown={startDragging}
                    title="Drag to resize"
                ></div>
            </div>
        </>
    );
}
