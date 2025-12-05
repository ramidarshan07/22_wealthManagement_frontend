import { useState, useEffect } from "react";
import {
  Container,
  Table,
  Button,
  Modal,
  Form,
  Alert,
  Row,
  Col,
} from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "./Saving.css";

function Saving() {
  const [savings, setSavings] = useState([]);
  const [filteredSavings, setFilteredSavings] = useState([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [amountTypes, setAmountTypes] = useState([]);
  const [showSavingModal, setShowSavingModal] = useState(false);
  const [editingSaving, setEditingSaving] = useState(null);
  const [filters, setFilters] = useState({
    category: "",
    paymentMethod: "",
    amountType: "",
    startDate: "",
    endDate: "",
  });
  const [savingFormData, setSavingFormData] = useState({
    amount: "",
    category: "",
    amountType: "",
    paymentMethod: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchSavings();
    fetchTotalSavings();
    fetchCategories();
    fetchPaymentMethods();
    fetchAmountTypes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, savings]);

  const fetchSavings = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_URL}/savings`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSavings(data.data || []);
        setFilteredSavings(data.data || []);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to fetch savings");
      }
    } catch (error) {
      console.error("Error fetching savings:", error);
      toast.error("Error fetching savings");
    }
  };

  const fetchTotalSavings = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_URL}/savings/total`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTotalSavings(data.total || 0);
      }
    } catch (error) {
      console.error("Error fetching total savings:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_URL}/categories`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

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
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  };

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
      }
    } catch (error) {
      console.error("Error fetching amount types:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...savings];

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(
        (saving) =>
          saving.category?._id === filters.category ||
          saving.category === filters.category
      );
    }

    // Payment method filter
    if (filters.paymentMethod) {
      filtered = filtered.filter(
        (saving) =>
          saving.paymentMethod?._id === filters.paymentMethod ||
          saving.paymentMethod === filters.paymentMethod
      );
    }

    // Amount type filter
    if (filters.amountType) {
      filtered = filtered.filter(
        (saving) =>
          saving.amountType?._id === filters.amountType ||
          saving.amountType === filters.amountType
      );
    }

    // Date range filter
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((saving) => {
        const savingDate = new Date(saving.date);
        savingDate.setHours(0, 0, 0, 0);
        return savingDate >= startDate;
      });
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((saving) => {
        const savingDate = new Date(saving.date);
        return savingDate <= endDate;
      });
    }

    setFilteredSavings(filtered);
  };

  const handleOpenSavingModal = (saving = null) => {
    if (saving) {
      setEditingSaving(saving);
      setSavingFormData({
        amount: saving.amount.toString(),
        category: saving.category._id || saving.category,
        amountType: saving.amountType._id || saving.amountType,
        paymentMethod: saving.paymentMethod._id || saving.paymentMethod,
        date: saving.date
          ? new Date(saving.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        description: saving.description || "",
      });
    } else {
      setEditingSaving(null);
      setSavingFormData({
        amount: "",
        category: "",
        amountType: "",
        paymentMethod: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
      });
    }
    setError("");
    setShowSavingModal(true);
  };

  const handleCloseSavingModal = () => {
    setShowSavingModal(false);
    setEditingSaving(null);
    setSavingFormData({
      amount: "",
      category: "",
      amountType: "",
      paymentMethod: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
    });
    setError("");
  };

  const handleSavingChange = (e) => {
    setSavingFormData({
      ...savingFormData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSavingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login again");
        return;
      }

      const url = editingSaving
        ? `${API_URL}/savings/${editingSaving._id}`
        : `${API_URL}/savings`;
      const method = editingSaving ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(savingFormData.amount),
          category: savingFormData.category,
          amountType: savingFormData.amountType,
          paymentMethod: savingFormData.paymentMethod,
          date: savingFormData.date,
          description: savingFormData.description,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          editingSaving
            ? "Saving updated successfully"
            : "Saving created successfully"
        );
        handleCloseSavingModal();
        await fetchSavings();
        await fetchTotalSavings();
      } else {
        setError(data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving saving:", error);
      setError("Error saving saving");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (saving) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete this saving?`,
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

        const response = await fetch(`${API_URL}/savings/${saving._id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          toast.success("Saving deleted successfully");
          fetchSavings();
          fetchTotalSavings();
          Swal.fire({
            title: "Deleted!",
            text: "Saving has been deleted.",
            icon: "success",
            confirmButtonColor: "#39FF14",
            background: "#1a1a1a",
            color: "#f5f5f5",
          });
        } else {
          toast.error(data.message || "Failed to delete saving");
        }
      } catch (error) {
        console.error("Error deleting saving:", error);
        toast.error("Error deleting saving");
      }
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      paymentMethod: "",
      amountType: "",
      startDate: "",
      endDate: "",
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isCreditType = (amountType) => {
    if (!amountType) return false;
    const name =
      typeof amountType === "string" ? amountType : amountType.name || "";
    return (
      name.toLowerCase().includes("credit") ||
      name.toLowerCase().includes("income")
    );
  };

  return (
    <div className="saving-container">
      <Container fluid className="saving-content">
        {/* Header: title / total / add button in one line */}
        <div className="saving-header">
          <div className="saving-header-item header-left">
            <div>
              <p className="account-eyebrow">SAVINGS TRACKER</p>
              <h1 className="saving-title">SAVING</h1>
            </div>
          </div>

          <div className="saving-header-item header-center">
            <div className="total-saving-badge">
              <span className="saving-label">Total Saving:</span>
              <span className="saving-value">₹ {totalSavings.toFixed(2)}</span>
            </div>
          </div>

          <div className="saving-header-item header-right">
            <Button
              className="add-button"
              onClick={() => handleOpenSavingModal()}
            >
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
              Add Saving
            </Button>
          </div>
        </div>

        <div className="filters-section">
          <Row className="g-3 align-items-end">
            {/* Use smaller column sizes so all five filters fit on one row on desktop */}
            <Col xs={12} md={2}>
              <Form.Group>
                <Form.Label>Category</Form.Label>
                <Form.Select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="form-control-custom"
                >
                  <option value="">All Categories</option>
                  {categories
                    .filter((cat) => cat.status === "active")
                    .map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12} md={2}>
              <Form.Group>
                <Form.Label>Payment Method</Form.Label>
                <Form.Select
                  name="paymentMethod"
                  value={filters.paymentMethod}
                  onChange={handleFilterChange}
                  className="form-control-custom"
                >
                  <option value="">All Payment Methods</option>
                  {paymentMethods
                    .filter((pm) => pm.status === "active")
                    .map((paymentMethod) => (
                      <option key={paymentMethod._id} value={paymentMethod._id}>
                        {paymentMethod.name}
                      </option>
                    ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12} md={2}>
              <Form.Group>
                <Form.Label>Amount Type</Form.Label>
                <Form.Select
                  name="amountType"
                  value={filters.amountType}
                  onChange={handleFilterChange}
                  className="form-control-custom"
                >
                  <option value="">All Amount Types</option>
                  {amountTypes
                    .filter((at) => at.status === "active")
                    .map((amountType) => (
                      <option key={amountType._id} value={amountType._id}>
                        {amountType.name}
                      </option>
                    ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12} md={2}>
              <Form.Group>
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="form-control-custom"
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={2}>
              <Form.Group>
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="form-control-custom"
                />
              </Form.Group>
            </Col>

            {/* Spacer column so clear button doesn't crowd the filters on wide screens */}
            <Col xs={12} md={2} className="d-flex justify-content-end">
              <div className="filter-actions">
                <Button
                  variant="secondary"
                  onClick={clearFilters}
                  className="clear-filters-btn"
                >
                  Clear Filters
                </Button>
              </div>
            </Col>
          </Row>
        </div>

        <div className="saving-table-wrapper">
          <Table responsive className="saving-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Payment Method</th>
                <th>Amount Type</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Description</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSavings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center no-data">
                    {savings.length === 0
                      ? 'No savings found. Click "Add Saving" to create one.'
                      : "No savings match the selected filters."}
                  </td>
                </tr>
              ) : (
                filteredSavings.map((saving) => {
                  return (
                    <tr key={saving._id}>
                      <td>{saving.category?.name || saving.category}</td>
                      <td>
                        {saving.paymentMethod?.name || saving.paymentMethod}
                      </td>
                      <td>{saving.amountType?.name || saving.amountType}</td>
                      <td
                        className={
                          isCreditType(saving.amountType)
                            ? "credit-amount"
                            : "debit-amount"
                        }
                      >
                        ₹ {saving.amount.toFixed(2)}
                      </td>
                      <td>{formatDate(saving.date)}</td>
                      <td>
                        <span className="description-text">
                          {saving.description || "-"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="edit-button"
                            onClick={() => handleOpenSavingModal(saving)}
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
                            onClick={() => handleDelete(saving)}
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
                  );
                })
              )}
            </tbody>
          </Table>
        </div>

        {/* Add/Edit Saving Modal */}
        <Modal
          show={showSavingModal}
          onHide={handleCloseSavingModal}
          className="saving-modal"
          centered
        >
          <Modal.Header closeButton className="modal-header">
            <Modal.Title>
              {editingSaving ? "Edit Saving" : "Add Saving"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSavingSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Amount</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="amount"
                      value={savingFormData.amount}
                      onChange={handleSavingChange}
                      placeholder="Enter amount"
                      required
                      min="0"
                      className="form-control-custom"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="date"
                      value={savingFormData.date}
                      onChange={handleSavingChange}
                      required
                      className="form-control-custom"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Select
                      name="category"
                      value={savingFormData.category}
                      onChange={handleSavingChange}
                      required
                      className="form-control-custom"
                    >
                      <option value="">Select Category</option>
                      {categories
                        .filter((cat) => cat.status === "active")
                        .map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Amount Type</Form.Label>
                    <Form.Select
                      name="amountType"
                      value={savingFormData.amountType}
                      onChange={handleSavingChange}
                      required
                      className="form-control-custom"
                    >
                      <option value="">Select Amount Type</option>
                      {amountTypes
                        .filter((at) => at.status === "active")
                        .map((amountType) => (
                          <option key={amountType._id} value={amountType._id}>
                            {amountType.name}
                          </option>
                        ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Payment Method</Form.Label>
                    <Form.Select
                      name="paymentMethod"
                      value={savingFormData.paymentMethod}
                      onChange={handleSavingChange}
                      required
                      className="form-control-custom"
                    >
                      <option value="">Select Payment Method</option>
                      {paymentMethods
                        .filter((pm) => pm.status === "active")
                        .map((paymentMethod) => (
                          <option
                            key={paymentMethod._id}
                            value={paymentMethod._id}
                          >
                            {paymentMethod.name}
                          </option>
                        ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={savingFormData.description}
                  onChange={handleSavingChange}
                  placeholder="Enter description (optional)"
                  maxLength={500}
                  className="form-control-custom"
                />
              </Form.Group>
              <div className="modal-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCloseSavingModal}
                  className="cancel-button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="save-button"
                  disabled={loading}
                >
                  {loading ? "Saving..." : editingSaving ? "Update" : "Create"}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      </Container>
    </div>
  );
}

export default Saving;
