import { useState, useEffect } from "react";
import { Container, Table, Button, Modal, Form, Alert } from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "./Category.css";

function Category() {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

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
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to fetch categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Error fetching categories");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name });
    } else {
      setEditingCategory(null);
      setFormData({ name: "" });
    }
    setError("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
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

      const url = editingCategory
        ? `${API_URL}/categories/${editingCategory._id}`
        : `${API_URL}/categories`;
      const method = editingCategory ? "PUT" : "POST";

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
          editingCategory
            ? "Category updated successfully"
            : "Category created successfully"
        );
        handleCloseModal();
        fetchCategories();
      } else {
        setError(data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving category:", error);
      setError("Error saving category");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (category) => {
    const newStatus = category.status === "active" ? "inactive" : "active";
    const statusText = newStatus === "active" ? "activate" : "deactivate";

    const result = await Swal.fire({
      title: "Change Status?",
      text: `Do you want to ${statusText} "${category.name}"?`,
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
          `${API_URL}/categories/${category._id}/status`,
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
          toast.success(`Category status updated to ${newStatus}`);
          fetchCategories();
        } else {
          toast.error(data.message || "Failed to update status");
        }
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("Error updating status");
      }
    }
  };

  const handleDelete = async (category) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete "${category.name}"?`,
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

        const response = await fetch(`${API_URL}/categories/${category._id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          toast.success("Category deleted successfully");
          fetchCategories();
          Swal.fire({
            title: "Deleted!",
            text: "Category has been deleted.",
            icon: "success",
            confirmButtonColor: "#39FF14",
            background: "#1a1a1a",
            color: "#f5f5f5",
          });
        } else {
          toast.error(data.message || "Failed to delete category");
        }
      } catch (error) {
        console.error("Error deleting category:", error);
        toast.error("Error deleting category");
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

  // Filter categories based on search query (case-insensitive)
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredCategories = normalizedQuery
    ? categories.filter((cat) =>
        (cat.name || "").toLowerCase().includes(normalizedQuery)
      )
    : categories;

  return (
    <div className="category-container">
      <Container fluid className="category-content">
        <div className="category-header">
          <p className="account-eyebrow">PERSONAL LEDGER</p>
          <h1 className="category-title">CATEGORY</h1>

          <div className="category-toolbar">
            {/* Search input */}
            <Form className="category-search">
              <Form.Control
                type="search"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="category-search-input"
              />
            </Form>

            <div className="category-actions">
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
                Add Category
              </Button>
              {/* Clear search button (visible only when there's a query) */}
              {searchQuery && (
                <Button
                  variant="secondary"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="category-table-wrapper">
          <Table responsive className="category-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Created Date</th>
                <th>Updated Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center no-data">
                    {categories.length === 0
                      ? 'No categories found. Click "Add Category" to create one.'
                      : "No categories match your search."}
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category._id}>
                    <td>{category.name}</td>
                    <td>{formatDate(category.createdAt)}</td>
                    <td>{formatDate(category.updatedAt)}</td>
                    <td>
                      <button
                        className={`status-toggle ${
                          category.status || "active"
                        }`}
                        onClick={() => handleStatusToggle(category)}
                        title={`Click to ${
                          (category.status || "active") === "active"
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
                          onClick={() => handleOpenModal(category)}
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
                          onClick={() => handleDelete(category)}
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
          className="category-modal"
          centered
        >
          <Modal.Header closeButton className="modal-header">
            <Modal.Title>
              {editingCategory ? "Edit Category" : "Add Category"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Category Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter category name"
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
                    : editingCategory
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

export default Category;
