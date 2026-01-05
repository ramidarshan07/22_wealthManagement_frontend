import { useState, useEffect } from "react";
import {
  Container,
  Card,
  Modal,
  Form,
  Button,
  Alert,
  Spinner,
} from "react-bootstrap";
import { toast } from "react-toastify";
import "./Notes.css";

function Notes() {
  const [notes, setNotes] = useState([]);
  const [showModal, setShowModal] = useState(false); // For Create/Edit
  const [showDeleteModal, setShowDeleteModal] = useState(false); // For Delete Confirmation
  const [currentNote, setCurrentNote] = useState(null); // The note being edited or deleted
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setFetching(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_URL}/notes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setNotes(data.data || []);
      } else {
        toast.error("Failed to load notes");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading notes");
    } finally {
      setFetching(false);
    }
  };

  const handleOpenModal = (note = null) => {
    if (note) {
      setCurrentNote(note);
      setTitle(note.title);
      setContent(note.content);
    } else {
      setCurrentNote(null);
      setTitle("");
      setContent("");
    }
    setError("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentNote(null);
    setTitle("");
    setContent("");
    setError("");
  };

  const handleOpenDeleteModal = (e, note) => {
    e.stopPropagation();
    setCurrentNote(note);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setCurrentNote(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const url = currentNote
        ? `${API_URL}/notes/${currentNote._id}`
        : `${API_URL}/notes`;
      const method = currentNote ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          currentNote
            ? "Note updated successfully"
            : "Note created successfully"
        );
        handleCloseModal();
        fetchNotes();
      } else {
        setError(data.message || "Operation failed");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentNote) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/notes/${currentNote._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("Note deleted successfully");
        handleCloseDeleteModal();
        fetchNotes();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to delete note");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notes-container">
      <Container fluid className="notes-content">
        <div className="notes-header">
          <p className="account-eyebrow">PERSONAL NOTES</p>
          <h1 className="notes-title">NOTES</h1>
        </div>

        {fetching ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ height: "50vh" }}
          >
            <Spinner animation="border" variant="success" />
          </div>
        ) : (
          <div className="notes-grid">
            {notes.length === 0 ? (
              <div
                className="text-center w-100"
                style={{ gridColumn: "1 / -1", color: "#888" }}
              >
                <p>No notes found. Create your first note!</p>
              </div>
            ) : (
              notes.map((note) => (
                <Card
                  key={note._id}
                  className="note-card"
                  onClick={() => handleOpenModal(note)}
                >
                  <div className="note-card-body">
                    <h3 className="note-title">{note.title}</h3>
                    <div className="note-content-preview">{note.content}</div>
                    <div className="note-footer">
                      <span className="note-date">
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </span>
                      <div className="note-actions">
                        <button
                          className="note-action-btn delete"
                          onClick={(e) => handleOpenDeleteModal(e, note)}
                          title="Delete Note"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        <button
          className="fab-add-note"
          onClick={() => handleOpenModal()}
          title="Add New Note"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>

        {/* Create/Edit Modal */}
        <Modal
          show={showModal}
          onHide={handleCloseModal}
          className="note-modal"
          centered
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {currentNote ? "Edit Note" : "Create New Note"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter note title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-control-custom"
                  required
                  maxLength={100}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Content</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={10}
                  placeholder="Write your note here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="form-control-custom"
                  required
                />
              </Form.Group>
              <div className="modal-actions">
                <Button
                  variant="secondary"
                  onClick={handleCloseModal}
                  className="cancel-button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="save-button"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Note"}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          show={showDeleteModal}
          onHide={handleCloseDeleteModal}
          className="note-modal"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Delete Note</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p style={{ color: "var(--text-light)" }}>
              Are you sure you want to delete this note? This action cannot be
              undone.
            </p>
            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={handleCloseDeleteModal}
                className="cancel-button"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                className="save-button"
                style={{
                  background: "#dc3545",
                  boxShadow: "0 4px 15px rgba(220, 53, 69, 0.3)",
                }}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </Modal.Body>
        </Modal>
      </Container>
    </div>
  );
}

export default Notes;
