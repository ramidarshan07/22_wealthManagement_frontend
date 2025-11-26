import { useState, useEffect } from "react";
import { Container, Table, Button, Modal, Form, Alert } from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "./PaymentMethod.css";

function PaymentMethod() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState(null);
  const [formData, setFormData] = useState({ name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  const fetchPaymentMethods = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_URL}/payment-methods`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.data || []);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to fetch payment methods");
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      toast.error("Error fetching payment methods");
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handleOpenModal = (paymentMethod = null) => {
    if (paymentMethod) {
      setEditingPaymentMethod(paymentMethod);
      setFormData({ name: paymentMethod.name });
    } else {
      setEditingPaymentMethod(null);
      setFormData({ name: "" });
    }
    setError("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPaymentMethod(null);
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

      const url = editingPaymentMethod
        ? `${API_URL}/payment-methods/${editingPaymentMethod._id}`
        : `${API_URL}/payment-methods`;
      const method = editingPaymentMethod ? "PUT" : "POST";

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
          editingPaymentMethod
            ? "Payment method updated successfully"
            : "Payment method created successfully"
        );
        handleCloseModal();
        fetchPaymentMethods();
      } else {
        setError(data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving payment method:", error);
      setError("Error saving payment method");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (paymentMethod) => {
    const newStatus = paymentMethod.status === "active" ? "inactive" : "active";
    const statusText = newStatus === "active" ? "activate" : "deactivate";

    const result = await Swal.fire({
      title: "Change Status?",
      text: `Do you want to ${statusText} "${paymentMethod.name}"?`,
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
          `${API_URL}/payment-methods/${paymentMethod._id}/status`,
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
          toast.success(`Payment method status updated to ${newStatus}`);
          fetchPaymentMethods();
        } else {
          toast.error(data.message || "Failed to update status");
        }
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("Error updating status");
      }
    }
  };

  const handleDelete = async (paymentMethod) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete "${paymentMethod.name}"?`,
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
          `${API_URL}/payment-methods/${paymentMethod._id}`,
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
          toast.success("Payment method deleted successfully");
          fetchPaymentMethods();
          Swal.fire({
            title: "Deleted!",
            text: "Payment method has been deleted.",
            icon: "success",
            confirmButtonColor: "#39FF14",
            background: "#1a1a1a",
            color: "#f5f5f5",
          });
        } else {
          toast.error(data.message || "Failed to delete payment method");
        }
      } catch (error) {
        console.error("Error deleting payment method:", error);
        toast.error("Error deleting payment method");
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
    <div className="payment-method-container">
      <Container fluid className="payment-method-content">
        <div className="payment-method-header">
          <h1 className="payment-method-title">PAYMENT METHOD</h1>
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
            Add Payment Method
          </Button>
        </div>

        <div className="payment-method-table-wrapper">
          <Table responsive className="payment-method-table">
            <thead>
              <tr>
                <th>Payment Method Name</th>
                <th>Created Date</th>
                <th>Updated Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paymentMethods.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center no-data">
                    No payment methods found. Click "Add Payment Method" to
                    create one.
                  </td>
                </tr>
              ) : (
                paymentMethods.map((paymentMethod) => (
                  <tr key={paymentMethod._id}>
                    <td>{paymentMethod.name}</td>
                    <td>{formatDate(paymentMethod.createdAt)}</td>
                    <td>{formatDate(paymentMethod.updatedAt)}</td>
                    <td>
                      <button
                        className={`status-toggle ${
                          paymentMethod.status || "active"
                        }`}
                        onClick={() => handleStatusToggle(paymentMethod)}
                        title={`Click to ${
                          (paymentMethod.status || "active") === "active"
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
                          onClick={() => handleOpenModal(paymentMethod)}
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
                          onClick={() => handleDelete(paymentMethod)}
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
          className="payment-method-modal"
          centered
        >
          <Modal.Header closeButton className="modal-header">
            <Modal.Title>
              {editingPaymentMethod
                ? "Edit Payment Method"
                : "Add Payment Method"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Payment Method Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter payment method name"
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
                    : editingPaymentMethod
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

export default PaymentMethod;
