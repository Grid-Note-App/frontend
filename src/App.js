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
    ToastContainer
} from 'react-bootstrap';

const CUSTOM_API_URL = process.env.REACT_APP_API_URL;

function App() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

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
            const response = await axios.get(CUSTOM_API_URL);
            setNotes(response.data);
        } catch (error) {
            console.error("Error fetching notes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNote = async () => {
        if (newNoteTitle.trim() === "" || newNoteBody.trim() === "") {
            alert("Title and text are required.");
            return;
        }
        try {
            const response = await axios.post(CUSTOM_API_URL, {
                Title: newNoteTitle,
                Text: newNoteBody
            });
            setNotes([response.data, ...notes]);
            handleCloseModal();
            setNewNoteTitle("");
            setNewNoteBody("");
        } catch (error) {
            console.error("Error adding note:", error);
        }
    };

    const confirmDelete = async () => {
        if (!noteToDelete) return;
        try {
            await axios.delete(`${CUSTOM_API_URL}/${noteToDelete}`);
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

    useEffect(() => {
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
                    <Navbar.Brand href="#home">Notes App</Navbar.Brand>
                    <div className="d-flex gap-2">
                        <Button variant="outline-green" onClick={handleShowModal}>
                            Add Note
                        </Button>

                        <Button
                            variant="outline-danger"
                            onClick={handleLogout}
                            className="rounded-pill px-4"
                        >
                            Logout
                        </Button>
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
                                <Card className="note-card h-100">
                                    <Card.Body>
                                        <Card.Title>{note.Title}</Card.Title>
                                        <Card.Text style={{ whiteSpace: 'pre-wrap' }}>
                                            {note.Text}
                                        </Card.Text>
                                    </Card.Body>
                                    <Card.Footer className="d-flex justify-content-between align-items-center">
                                        <small className="text-muted">
                                            {formatDate(note.CreatedAt)}
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
