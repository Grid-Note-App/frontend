import React, { useState, useRef, useEffect } from "react";
import { Card } from "react-bootstrap";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ChatWindow from "./ChatWindow";

export default function ChatSidebar({ currentUser }) {
    const [open, setOpen] = useState(false);
    const [width, setWidth] = useState(380);
    const [dragging, setDragging] = useState(false);
    const sidebarRef = useRef(null);

    // === Закрытие при клике вне панели ===
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (open && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    // === Ресайз ===
    const startDragging = () => setDragging(true);
    const stopDragging = () => setDragging(false);

    const handleMouseMove = (e) => {
        if (!dragging) return;
        const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, 300), 700);
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
            >
                <Card className="border-0 shadow-sm h-100">
                    <Card.Body className="p-0">
                        <ChatWindow currentUser={currentUser} />
                    </Card.Body>
                </Card>

                <div
                    className="resize-handle"
                    onMouseDown={startDragging}
                    title="Drag to resize"
                ></div>
            </div>

            <div
                className={`chat-toggle-fixed ${open ? 'open' : ''} ${dragging ? 'dragging' : ''}`}
                style={{ right: `${open ? width : 0}px` }}
                onClick={() => setOpen(!open)}
            >
                {open ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
            </div>

        </>
    );
}
