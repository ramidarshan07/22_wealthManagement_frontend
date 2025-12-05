import { useState, useEffect } from "react";
import { Container, Table, Button, Modal, Form, Alert } from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "./AmountType.css";

function AmountType() {
  const [amountTypes, setAmountTypes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAmountType, setEditingAmountType] = useState(null);
  const [formData, setFormData] = useState({ name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  const fetchAmountTypes = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_URL}/amount-types`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAmountTypes(data.data || []);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to fetch amount types");
      }
    } catch (error) {
      console.error("Error fetching amount types:", error);
      toast.error("Error fetching amount types");
    }
  };

  useEffect(() => {
    fetchAmountTypes();
  }, []);

  const handleOpenModal = (amountType = null) => {
    if (amountType) {
      setEditingAmountType(amountType);
      setFormData({ name: amountType.name });
    } else {
      setEditingAmountType(null);
      setFormData({ name: "" });
    }
    setError("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAmountType(null);
    setFormData({ name: "" });
    setError("");
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login again");
        return;
      }

      const url = editingAmountType
        ? `${API_URL}/amount-types/${editingAmountType._id}`
        : `${API_URL}/amount-types`;
      const method = editingAmountType ? "PUT" : "POST";

      // Convert user input
      const formattedData = {
        name: capitalizeWords(formData.name),
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formattedData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          editingAmountType
            ? "Amount type updated successfully"
            : "Amount type created successfully"
        );
        handleCloseModal();
        fetchAmountTypes();
      } else {
        setError(data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving amount type:", error);
      setError("Error saving amount type");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (amountType) => {
    const newStatus = amountType.status === "active" ? "inactive" : "active";
    const statusText = newStatus === "active" ? "activate" : "deactivate";

    const result = await Swal.fire({
      title: "Change Status?",
      text: `Do you want to ${statusText} "${amountType.name}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#39FF14",
      cancelButtonColor: "#d33",
      confirmButtonText: `Yes, ${statusText}!`,
      cancelButtonText: "Cancel",
      background: "#1a1a1a",
      color: "#f5f5f5",
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please login again");
          return;
        }

        const response = await fetch(
          `${API_URL}/amount-types/${amountType._id}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: newStatus }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          toast.success(`Amount type status updated to ${newStatus}`);
          fetchAmountTypes();
        } else {
          toast.error(data.message || "Failed to update status");
        }
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("Error updating status");
      }
    }
  };

  const handleDelete = async (amountType) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete "${amountType.name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#39FF14",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      background: "#1a1a1a",
      color: "#f5f5f5",
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please login again");
          return;
        }

        const response = await fetch(
          `${API_URL}/amount-types/${amountType._id}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          toast.success("Amount type deleted successfully");
          fetchAmountTypes();
          Swal.fire({
            title: "Deleted!",
            text: "Amount type has been deleted.",
            icon: "success",
            confirmButtonColor: "#39FF14",
            background: "#1a1a1a",
            color: "#f5f5f5",
          });
        } else {
          toast.error(data.message || "Failed to delete amount type");
        }
      } catch (error) {
        console.error("Error deleting amount type:", error);
        toast.error("Error deleting amount type");
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const capitalizeWords = (str) => {
    return str
      .trim()
      .split(" ")
      .filter((word) => word !== "")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div className="amount-type-container">
      <Container fluid className="amount-type-content">
        <div className="amount-type-header">
          <div>
            <p className="account-eyebrow">MANAGE AMOUNT TYPES</p>
            <h1 className="amount-type-title">AMOUNT TYPE</h1>
          </div>
          <Button className="add-button" onClick={() => handleOpenModal()}>
            <svg
              width="20"
              height="20"
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
            Add Amount Type
          </Button>
        </div>

        <div className="amount-type-table-wrapper">
          <Table responsive className="amount-type-table">
            <thead>
              <tr>
                <th>Amount Type Name</th>
                <th>Created Date</th>
                <th>Updated Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {amountTypes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center no-data">
                    No amount types found. Click "Add Amount Type" to create
                    one.
                  </td>
                </tr>
              ) : (
                amountTypes.map((amountType) => (
                  <tr key={amountType._id}>
                    <td>{amountType.name}</td>
                    <td>{formatDate(amountType.createdAt)}</td>
                    <td>{formatDate(amountType.updatedAt)}</td>
                    <td>
                      <button
                        className={`status-toggle ${
                          amountType.status || "active"
                        }`}
                        onClick={() => handleStatusToggle(amountType)}
                        title={`Click to ${
                          (amountType.status || "active") === "active"
                            ? "deactivate"
                            : "activate"
                        }`}
                      >
                        <span className="status-slider"></span>
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="edit-button"
                          onClick={() => handleOpenModal(amountType)}
                          title="Edit"
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
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => handleDelete(amountType)}
                          title="Delete"
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        {/* Add/Edit Modal */}
        <Modal
          show={showModal}
          onHide={handleCloseModal}
          className="amount-type-modal"
          centered
        >
          <Modal.Header closeButton className="modal-header">
            <Modal.Title>
              {editingAmountType ? "Edit Amount Type" : "Add Amount Type"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Amount Type Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter amount type name"
                  required
                  minLength={2}
                  maxLength={50}
                  className="form-control-custom"
                />
              </Form.Group>
              <div className="modal-actions">
                <Button
                  type="button"
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
                  {loading
                    ? "Saving..."
                    : editingAmountType
                    ? "Update"
                    : "Create"}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      </Container>
    </div>
  );
}

export default AmountType;
