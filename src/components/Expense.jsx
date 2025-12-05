import { useState, useEffect, useRef } from "react";
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
import "./Expense.css";

function Expense() {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [amountTypes, setAmountTypes] = useState([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filters, setFilters] = useState({
    category: "",
    startDate: "",
    endDate: "",
    type: "", // "credit", "debit", or ""
    paymentMethod: "",
  });
  const [expenseFormData, setExpenseFormData] = useState({
    amount: "",
    category: "",
    amountType: "",
    paymentMethod: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;
  const categoryDropdownRef = useRef(null);
  const categorySearchInputRef = useRef(null);

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
    fetchPaymentMethods();
    fetchAmountTypes();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_URL}/expenses`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setExpenses(data.data || []);
        setFilteredExpenses(data.data || []);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to fetch expenses");
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Error fetching expenses");
    }
  };

  useEffect(() => {
    applyFilters();
  }, [filters, expenses]);

  const applyFilters = () => {
    let filtered = [...expenses];

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(
        (expense) =>
          expense.category?._id === filters.category ||
          expense.category === filters.category
      );
    }

    // Date range filter
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((expense) => {
        const expenseDate = new Date(expense.date);
        expenseDate.setHours(0, 0, 0, 0);
        return expenseDate >= startDate;
      });
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate <= endDate;
      });
    }

    // Credit/Debit filter
    if (filters.type) {
      filtered = filtered.filter((expense) => {
        const isCredit = isCreditType(expense.amountType);
        return filters.type === "credit" ? isCredit : !isCredit;
      });
    }

    // Payment Method filter
    if (filters.paymentMethod) {
      filtered = filtered.filter(
        (expense) =>
          expense.paymentMethod?._id === filters.paymentMethod ||
          expense.paymentMethod === filters.paymentMethod
      );
    }

    setFilteredExpenses(filtered);
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

  const handleOpenExpenseModal = (expense = null) => {
    if (expense) {
      const resolvedCategoryName =
        typeof expense.category === "string"
          ? getCategoryNameById(expense.category)
          : expense.category?.name ||
            getCategoryNameById(expense.category?._id);
      setEditingExpense(expense);
      setExpenseFormData({
        amount: expense.amount.toString(),
        category: expense.category._id || expense.category,
        amountType: expense.amountType._id || expense.amountType,
        paymentMethod: expense.paymentMethod._id || expense.paymentMethod,
        date: expense.date
          ? new Date(expense.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        description: expense.description || "",
      });
      setCategorySearch(resolvedCategoryName || "");
    } else {
      setEditingExpense(null);
      setExpenseFormData({
        amount: "",
        category: "",
        amountType: "",
        paymentMethod: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
      });
      setCategorySearch("");
    }
    setError("");
    setIsCategoryDropdownOpen(false);
    setShowExpenseModal(true);
  };

  const handleCloseExpenseModal = () => {
    setShowExpenseModal(false);
    setEditingExpense(null);
    setExpenseFormData({
      amount: "",
      category: "",
      amountType: "",
      paymentMethod: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
    });
    setError("");
    setCategorySearch("");
    setIsCategoryDropdownOpen(false);
  };

  const handleExpenseChange = (e) => {
    setExpenseFormData({
      ...expenseFormData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!expenseFormData.category) {
      setError("Please select a category");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login again");
        return;
      }

      const url = editingExpense
        ? `${API_URL}/expenses/${editingExpense._id}`
        : `${API_URL}/expenses`;
      const method = editingExpense ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(expenseFormData.amount),
          category: expenseFormData.category,
          amountType: expenseFormData.amountType,
          paymentMethod: expenseFormData.paymentMethod,
          date: expenseFormData.date,
          description: expenseFormData.description,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          editingExpense
            ? "Expense updated successfully"
            : "Expense created successfully"
        );
        handleCloseExpenseModal();
        await fetchExpenses();
      } else {
        setError(data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving expense:", error);
      setError("Error saving expense");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expense) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete this expense?`,
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

        const response = await fetch(`${API_URL}/expenses/${expense._id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          toast.success("Expense deleted successfully");
          fetchExpenses();
          Swal.fire({
            title: "Deleted!",
            text: "Expense has been deleted.",
            icon: "success",
            confirmButtonColor: "#39FF14",
            background: "#1a1a1a",
            color: "#f5f5f5",
          });
        } else {
          toast.error(data.message || "Failed to delete expense");
        }
      } catch (error) {
        console.error("Error deleting expense:", error);
        toast.error("Error deleting expense");
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
      startDate: "",
      endDate: "",
      type: "",
      paymentMethod: "",
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

  const capitalizeWords = (str) => {
    return str
      .trim()
      .split(" ")
      .filter((word) => word !== "")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getCategoryNameById = (categoryId) => {
    if (!categoryId) return "";
    const found = categories.find((cat) => cat._id === categoryId);
    return found?.name || "";
  };

  useEffect(() => {
    if (!showExpenseModal) return;
    if (!expenseFormData.category) return;
    const selectedName = getCategoryNameById(expenseFormData.category);
    if (selectedName && categorySearch !== selectedName) {
      setCategorySearch(selectedName);
    }
  }, [showExpenseModal, expenseFormData.category, categories]);

  const handleCategorySearchChange = (event) => {
    const value = event.target.value;
    setCategorySearch(value);
    setIsCategoryDropdownOpen(true);

    const selectedName = getCategoryNameById(expenseFormData.category);
    if (selectedName && value.trim() !== selectedName) {
      setExpenseFormData((prev) => ({
        ...prev,
        category: "",
      }));
    }
  };

  const handleCategorySelect = (category) => {
    setExpenseFormData((prev) => ({
      ...prev,
      category: category._id,
    }));
    setCategorySearch(category.name);
    setIsCategoryDropdownOpen(false);
  };

  const handleToggleCategoryDropdown = () => {
    setIsCategoryDropdownOpen((prev) => !prev);
    categorySearchInputRef.current?.focus();
  };

  const clearCategorySelection = () => {
    setExpenseFormData((prev) => ({
      ...prev,
      category: "",
    }));
    setCategorySearch("");
    setIsCategoryDropdownOpen(true);
    categorySearchInputRef.current?.focus();
  };

  const activeCategories = categories.filter((cat) => cat.status === "active");
  const selectedCategoryName = getCategoryNameById(expenseFormData.category);
  const normalizedCategorySearch = categorySearch.trim().toLowerCase();
  const shouldShowAllCategories =
    isCategoryDropdownOpen &&
    selectedCategoryName &&
    normalizedCategorySearch === selectedCategoryName.trim().toLowerCase();
  const filteredCategoryOptions =
    normalizedCategorySearch && !shouldShowAllCategories
      ? activeCategories.filter((cat) =>
          (cat.name || "").toLowerCase().includes(normalizedCategorySearch)
        )
      : activeCategories;

  return (
    <div className="expense-container">
      <Container fluid className="expense-content">
        <div className="expense-header">
          <div>
            <p className="account-eyebrow">EXPENSE TRACKER</p>
            <h1 className="expense-title">EXPENSE</h1>
          </div>
          <Button
            className="add-button"
            onClick={() => handleOpenExpenseModal()}
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
            Add Expense
          </Button>
        </div>

        <div className="filters-section">
          <Row className="g-3 align-items-end">
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
                  {activeCategories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
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

            <Col xs={12} md={2}>
              <Form.Group>
                <Form.Label>Type</Form.Label>
                <Form.Select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="form-control-custom"
                >
                  <option value="">All</option>
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
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

            {/* Clear Filters placed in its own column so everything stays in one row */}
            <Col
              xs={12}
              md={2}
              className="d-flex justify-content-end align-items-end"
            >
              <Button
                variant="secondary"
                onClick={clearFilters}
                className="clear-filters-btn"
              >
                Clear Filters
              </Button>
            </Col>
          </Row>
        </div>

        <div className="expense-table-wrapper">
          <Table responsive className="expense-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Credit</th>
                <th>Debit</th>
                <th>Payment Method</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center no-data">
                    {expenses.length === 0
                      ? 'No expenses found. Click "Add Expense" to create one.'
                      : "No expenses match the selected filters."}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => {
                  const credit = isCreditType(expense.amountType)
                    ? expense.amount
                    : 0;
                  const debit = !isCreditType(expense.amountType)
                    ? expense.amount
                    : 0;
                  return (
                    <tr key={expense._id}>
                      <td>{formatDate(expense.date)}</td>
                      <td>{expense.category?.name || expense.category}</td>
                      <td>
                        <span className="description-text">
                          {expense.description || "-"}
                        </span>
                      </td>
                      <td className={credit > 0 ? "credit-amount" : ""}>
                        {credit > 0 ? `₹ ${credit.toFixed(2)}` : "-"}
                      </td>
                      <td className={debit > 0 ? "debit-amount" : ""}>
                        {debit > 0 ? `₹ ${debit.toFixed(2)}` : "-"}
                      </td>
                      <td>
                        {expense.paymentMethod?.name || expense.paymentMethod}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="edit-button"
                            onClick={() => handleOpenExpenseModal(expense)}
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
                            onClick={() => handleDelete(expense)}
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

        {/* Add/Edit Expense Modal */}
        <Modal
          show={showExpenseModal}
          onHide={handleCloseExpenseModal}
          className="expense-modal"
          centered
        >
          <Modal.Header closeButton className="modal-header">
            <Modal.Title>
              {editingExpense ? "Edit Expense" : "Add Expense"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleExpenseSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Amount</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="amount"
                      value={expenseFormData.amount}
                      onChange={handleExpenseChange}
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
                      value={expenseFormData.date}
                      onChange={handleExpenseChange}
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
                    <div
                      className={`category-select-search ${
                        isCategoryDropdownOpen ? "open" : ""
                      }`}
                      ref={categoryDropdownRef}
                    >
                      <Form.Control
                        ref={categorySearchInputRef}
                        type="search"
                        placeholder="Search or select category..."
                        value={categorySearch}
                        onChange={handleCategorySearchChange}
                        onFocus={(event) => {
                          setIsCategoryDropdownOpen(true);
                          event.target.select();
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Escape") {
                            setIsCategoryDropdownOpen(false);
                            event.currentTarget.blur();
                          }
                        }}
                        className="form-control-custom category-search-input"
                        aria-label="Search categories"
                        autoComplete="off"
                      />
                      {categorySearch && (
                        <button
                          type="button"
                          className="category-clear-btn"
                          onClick={clearCategorySelection}
                          aria-label="Clear category search"
                        >
                          ×
                        </button>
                      )}
                      <button
                        type="button"
                        className="category-dropdown-toggle"
                        onClick={handleToggleCategoryDropdown}
                        aria-label={
                          isCategoryDropdownOpen
                            ? "Collapse category list"
                            : "Expand category list"
                        }
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
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>
                      {isCategoryDropdownOpen && (
                        <div className="category-options-list">
                          {filteredCategoryOptions.length > 0 ? (
                            filteredCategoryOptions.map((category) => (
                              <button
                                type="button"
                                key={category._id}
                                className={`category-option ${
                                  expenseFormData.category === category._id
                                    ? "selected"
                                    : ""
                                }`}
                                onClick={() => handleCategorySelect(category)}
                              >
                                {category.name}
                              </button>
                            ))
                          ) : (
                            <div className="category-option empty">
                              No categories match your search
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <input
                      type="hidden"
                      name="category"
                      value={expenseFormData.category}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Amount Type</Form.Label>
                    <Form.Select
                      name="amountType"
                      value={expenseFormData.amountType}
                      onChange={handleExpenseChange}
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
                      value={expenseFormData.paymentMethod}
                      onChange={handleExpenseChange}
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
                  value={expenseFormData.description}
                  onChange={handleExpenseChange}
                  placeholder="Enter description (optional)"
                  maxLength={500}
                  className="form-control-custom"
                />
              </Form.Group>
              <div className="modal-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCloseExpenseModal}
                  className="cancel-button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="save-button"
                  disabled={loading}
                >
                  {loading ? "Saving..." : editingExpense ? "Update" : "Create"}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      </Container>
    </div>
  );
}

export default Expense;
