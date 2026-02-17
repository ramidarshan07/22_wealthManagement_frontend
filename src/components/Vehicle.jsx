import { useEffect, useState } from "react";
import {
  Container,
  Button,
  Modal,
  Form,
  Row,
  Col,
  Card,
  Table,
  Spinner,
  Dropdown,
} from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "./Vehicle.css";

const defaultDate = () => new Date().toISOString().split("T")[0];

function Vehicle() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingLogId, setEditingLogId] = useState(null);
  const [editingVehicleId, setEditingVehicleId] = useState(null);

  const [vehicleFormData, setVehicleFormData] = useState({
    name: "",
    number: "",
    purchaseDate: defaultDate(),
  });

  const [logFormData, setLogFormData] = useState({
    date: defaultDate(),
    fuelAmount: "",
    fuelCapacity: "",
    km: "",
    tripA: "",
    tripB: "",
    average: "",
    range: "",
  });

  const [vehicleSubmitting, setVehicleSubmitting] = useState(false);
  const [logSubmitting, setLogSubmitting] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const getToken = () => localStorage.getItem("token");

  const fetchVehicles = async () => {
    try {
      const token = getToken();
      if (!token) return;

      setListLoading(true);
      const response = await fetch(`${API_URL}/vehicles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        setVehicles(data.data || []);
        if (data.data && data.data.length > 0) {
          if (!selectedVehicle) {
            handleSelectVehicle(data.data[0]);
          } else {
            const updated = data.data.find(
              (v) => v._id === selectedVehicle._id,
            );
            if (updated) setSelectedVehicle(updated);
            else handleSelectVehicle(data.data[0]);
          }
        } else {
          setSelectedVehicle(null);
        }
      } else {
        toast.error(data.message || "Failed to fetch vehicles");
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Error fetching vehicles");
    } finally {
      setListLoading(false);
    }
  };

  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleOpenVehicleModal = (vehicle = null) => {
    if (vehicle) {
      setEditingVehicleId(vehicle._id);
      setVehicleFormData({
        name: vehicle.name,
        number: vehicle.number,
        purchaseDate: vehicle.purchaseDate
          ? new Date(vehicle.purchaseDate).toISOString().split("T")[0]
          : defaultDate(),
      });
    } else {
      setEditingVehicleId(null);
      setVehicleFormData({
        name: "",
        number: "",
        purchaseDate: defaultDate(),
      });
    }
    setShowVehicleModal(true);
  };

  const handleOpenLogModal = (log = null) => {
    if (log) {
      setEditingLogId(log._id);
      setLogFormData({
        date: log.date
          ? new Date(log.date).toISOString().split("T")[0]
          : defaultDate(),
        fuelAmount: log.fuelAmount,
        fuelCapacity: log.fuelCapacity,
        km: log.km,
        tripA: log.tripA,
        tripB: log.tripB,
        average: log.average,
        range: log.range,
      });
    } else {
      setEditingLogId(null);
      setLogFormData({
        date: defaultDate(),
        fuelAmount: "",
        fuelCapacity: "",
        km: "",
        tripA: "",
        tripB: "",
        average: "",
        range: "",
      });
    }
    setShowLogModal(true);
  };

  const handleVehicleChange = (e) => {
    setVehicleFormData({
      ...vehicleFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogChange = (e) => {
    setLogFormData({
      ...logFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      toast.error("Please login again");
      return;
    }

    try {
      setVehicleSubmitting(true);
      const method = editingVehicleId ? "PUT" : "POST";
      const url = editingVehicleId
        ? `${API_URL}/vehicles/${editingVehicleId}`
        : `${API_URL}/vehicles`;

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(vehicleFormData),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(
          editingVehicleId
            ? "Vehicle updated successfully"
            : "Vehicle added successfully",
        );
        setShowVehicleModal(false);
        fetchVehicles();
      } else {
        toast.error(data.message || "Failed to save vehicle");
      }
    } catch (error) {
      console.error("Error saving vehicle:", error);
      toast.error("Error saving vehicle");
    } finally {
      setVehicleSubmitting(false);
    }
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    const token = getToken();
    if (!token) return;

    try {
      setLogSubmitting(true);
      const method = editingLogId ? "PUT" : "POST";
      const url = editingLogId
        ? `${API_URL}/vehicles/${selectedVehicle._id}/logs/${editingLogId}`
        : `${API_URL}/vehicles/${selectedVehicle._id}/logs`;

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(logFormData),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(
          editingLogId ? "Log updated successfully" : "Log added successfully",
        );
        setShowLogModal(false);
        setLogFormData({
          date: defaultDate(),
          fuelAmount: "",
          fuelCapacity: "",
          km: "",
          tripA: "",
          tripB: "",
          average: "",
          range: "",
        });
        fetchVehicles();
      } else {
        toast.error(data.message || "Failed to save log");
      }
    } catch (error) {
      console.error("Error saving log:", error);
      toast.error("Error saving log");
    } finally {
      setLogSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    const result = await Swal.fire({
      title: "Delete vehicle?",
      text: "All logs for this vehicle will also be removed permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#39ff14",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      background: "#1a1a1a",
      color: "#f5f5f5",
    });

    if (!result.isConfirmed) return;

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/vehicles/${vehicleId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("Vehicle deleted successfully");
        if (selectedVehicle?._id === vehicleId) {
          setSelectedVehicle(null);
        }
        fetchVehicles();
      } else {
        toast.error("Failed to delete vehicle");
      }
    } catch (error) {
      toast.error("Error deleting vehicle");
    }
  };

  const handleDeleteLog = async (logId) => {
    const result = await Swal.fire({
      title: "Delete log entry?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#39ff14",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      background: "#1a1a1a",
      color: "#f5f5f5",
    });

    if (!result.isConfirmed) return;

    try {
      const token = getToken();
      const response = await fetch(
        `${API_URL}/vehicles/${selectedVehicle._id}/logs/${logId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        toast.success("Log deleted successfully");
        fetchVehicles();
      } else {
        toast.error("Failed to delete log");
      }
    } catch (error) {
      toast.error("Error deleting log");
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="vehicle-container">
      <Container fluid className="vehicle-content">
        <div className="vehicle-header">
          <div>
            <p className="vehicle-eyebrow">VEHICLE LOGBOOK</p>
            <h1 className="vehicle-title">MY VEHICLES</h1>
          </div>
          <div className="vehicle-actions">
            <Button
              className="add-vehicle-btn"
              onClick={handleOpenVehicleModal}
            >
              <span>+</span> Add Vehicle
            </Button>
          </div>
        </div>

        <div className="vehicle-layout">
          <div className="vehicle-list-panel">
            <div className="panel-heading">
              <h3>Your Vehicles</h3>
              {listLoading && <Spinner animation="border" size="sm" />}
            </div>
            {vehicles.length === 0 && !listLoading ? (
              <div className="empty-state">
                <p>No vehicles found</p>
                <span>Add your first vehicle to track analytics.</span>
              </div>
            ) : (
              <div className="vehicle-cards">
                {vehicles.map((v) => (
                  <Card
                    key={v._id}
                    className={`vehicle-card ${
                      selectedVehicle?._id === v._id ? "active" : ""
                    }`}
                    onClick={() => handleSelectVehicle(v)}
                  >
                    <div className="vehicle-card-header">
                      <h4>{v.name}</h4>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Dropdown align="end" className="vehicle-dropdown">
                          <Dropdown.Toggle as="div" className="dropdown-dots">
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
                              <circle cx="12" cy="12" r="1"></circle>
                              <circle cx="12" cy="5" r="1"></circle>
                              <circle cx="12" cy="19" r="1"></circle>
                            </svg>
                          </Dropdown.Toggle>
                          <Dropdown.Menu variant="dark">
                            <Dropdown.Item
                              onClick={() => handleOpenVehicleModal(v)}
                            >
                              Edit
                            </Dropdown.Item>
                            <Dropdown.Item
                              className="text-danger"
                              onClick={() => handleDeleteVehicle(v._id)}
                            >
                              Delete
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </div>
                    <div className="vehicle-card-body">
                      <p>
                        <small>Number:</small> {v.number}
                      </p>
                      <p>
                        <small>Pur. Date:</small> {formatDate(v.purchaseDate)}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="vehicle-detail-panel">
            {!selectedVehicle ? (
              <div className="empty-detail">
                <p>Select a vehicle to view logs</p>
              </div>
            ) : (
              <>
                <div className="detail-header">
                  <div>
                    <p className="detail-eyebrow">Vehicle Details</p>
                    <h2>{selectedVehicle.name}</h2>
                  </div>
                  <Button
                    className="add-log-btn"
                    onClick={() => setShowLogModal(true)}
                  >
                    <span>+</span> Add Log
                  </Button>
                </div>

                <div className="logs-section">
                  <div className="panel-heading">
                    <h3>Analytic Logs</h3>
                  </div>
                  <div className="logs-table">
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Fuel Amount</th>
                          <th>Fuel Capacity</th>
                          <th>KM</th>
                          <th>Trip A</th>
                          <th>Trip B</th>
                          <th>Avg</th>
                          <th>Range</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedVehicle.logs &&
                        selectedVehicle.logs.length > 0 ? (
                          selectedVehicle.logs
                            .slice()
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .map((log) => (
                              <tr key={log._id}>
                                <td>{formatDate(log.date)}</td>
                                <td>{log.fuelAmount}</td>
                                <td>{log.fuelCapacity}</td>
                                <td>{log.km}</td>
                                <td>{log.tripA}</td>
                                <td>{log.tripB}</td>
                                <td>{log.average}</td>
                                <td>{log.range}</td>
                                <td>
                                  <button
                                    className="edit-entry-btn"
                                    onClick={() => handleOpenLogModal(log)}
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
                                    className="delete-entry-btn"
                                    onClick={() => handleDeleteLog(log._id)}
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
                                      <line
                                        x1="10"
                                        y1="11"
                                        x2="10"
                                        y2="17"
                                      ></line>
                                      <line
                                        x1="14"
                                        y1="11"
                                        x2="14"
                                        y2="17"
                                      ></line>
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan="9" className="text-center">
                              No logs found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Container>

      <Modal
        show={showVehicleModal}
        onHide={() => setShowVehicleModal(false)}
        centered
        className="vehicle-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editingVehicleId ? "Edit Vehicle" : "Add Vehicle"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleVehicleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Vehicle Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={vehicleFormData.name}
                onChange={handleVehicleChange}
                placeholder="e.g. Activa 6G"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Vehicle Number</Form.Label>
              <Form.Control
                type="text"
                name="number"
                value={vehicleFormData.number}
                onChange={handleVehicleChange}
                placeholder="e.g. GJ01 XX 0000"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Purchase Date</Form.Label>
              <Form.Control
                type="date"
                name="purchaseDate"
                value={vehicleFormData.purchaseDate}
                onChange={handleVehicleChange}
                required
              />
            </Form.Group>
            <div className="modal-actions">
              <Button
                variant="secondary"
                className="cancel-button"
                onClick={() => setShowVehicleModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="save-button"
                disabled={vehicleSubmitting}
              >
                {vehicleSubmitting
                  ? "Saving..."
                  : editingVehicleId
                    ? "Update Vehicle"
                    : "Add Vehicle"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal
        show={showLogModal}
        onHide={() => setShowLogModal(false)}
        centered
        className="vehicle-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editingLogId ? "Edit Analytic Log" : "Add Analytic Log"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleLogSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fuel Amount</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="fuelAmount"
                    value={logFormData.fuelAmount}
                    onChange={handleLogChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fuel Capacity (L)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="fuelCapacity"
                    value={logFormData.fuelCapacity}
                    onChange={handleLogChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={logFormData.date}
                    onChange={handleLogChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Total KM</Form.Label>
                  <Form.Control
                    type="number"
                    name="km"
                    value={logFormData.km}
                    onChange={handleLogChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Trip A</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    name="tripA"
                    value={logFormData.tripA}
                    onChange={handleLogChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Trip B</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    name="tripB"
                    value={logFormData.tripB}
                    onChange={handleLogChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Average</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    name="average"
                    value={logFormData.average}
                    onChange={handleLogChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Range</Form.Label>
                  <Form.Control
                    type="number"
                    name="range"
                    value={logFormData.range}
                    onChange={handleLogChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="modal-actions">
              <Button
                variant="secondary"
                className="cancel-button"
                onClick={() => setShowLogModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="save-button"
                disabled={logSubmitting}
              >
                {logSubmitting
                  ? "Saving..."
                  : editingLogId
                    ? "Update Log"
                    : "Save Log"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Vehicle;
