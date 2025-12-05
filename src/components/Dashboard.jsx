import { useState, useEffect } from "react";
import { Container, Card, Modal, Form, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Dashboard.css";

function Dashboard() {
  const [totalBalance, setTotalBalance] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethodBalances, setPaymentMethodBalances] = useState([]);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState(null);
  const [balanceInput, setBalanceInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, [API_URL]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Fetch payment methods, payment method balances, and expense stats
      const [paymentMethodsRes, paymentMethodBalancesRes, statsRes] =
        await Promise.all([
          fetch(`${API_URL}/payment-methods`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_URL}/payment-method-balances`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_URL}/expenses/stats`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

      let allPaymentMethods = [];
      if (paymentMethodsRes.ok) {
        const pmData = await paymentMethodsRes.json();
        allPaymentMethods = pmData.data || [];
        setPaymentMethods(allPaymentMethods);
      }

      if (paymentMethodBalancesRes.ok) {
        const balancesData = await paymentMethodBalancesRes.json();
        const balances = balancesData.data || [];

        // Create a map of existing balances
        const balanceMap = {};
        balances.forEach((pmb) => {
          const pmId = pmb.paymentMethodId._id || pmb.paymentMethodId;
          balanceMap[pmId] = {
            paymentMethodId: pmId,
            name: pmb.paymentMethodId?.name || "",
            balance: pmb.balance || 0,
          };
        });

        // Ensure all active payment methods have a balance entry
        const allBalances = allPaymentMethods
          .filter((pm) => pm.status === "active")
          .map((pm) => {
            if (balanceMap[pm._id]) {
              return balanceMap[pm._id];
            }
            return {
              paymentMethodId: pm._id,
              name: pm.name,
              balance: 0,
            };
          });

        // Calculate total balance from payment method balances
        const total = allBalances.reduce(
          (sum, pmb) => sum + (pmb.balance || 0),
          0
        );
        setTotalBalance(total);

        // Store payment method balances
        setPaymentMethodBalances(allBalances);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.data?.paymentMethodStats) {
          // Merge stats with balances to get credit/debit info
          const statsMap = {};
          statsData.data.paymentMethodStats.forEach((stat) => {
            statsMap[stat.paymentMethodId] = {
              credit: stat.credit,
              debit: stat.debit,
            };
          });

          setPaymentMethodBalances((prev) =>
            prev.map((pmb) => ({
              ...pmb,
              credit: statsMap[pmb.paymentMethodId]?.credit || 0,
              debit: statsMap[pmb.paymentMethodId]?.debit || 0,
            }))
          );
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Error fetching dashboard data");
    }
  };

  const handleDoubleClick = (paymentMethod) => {
    // Find balance for this payment method
    const balance = paymentMethodBalances.find(
      (b) => b.paymentMethodId === paymentMethod._id
    );
    setEditingPaymentMethod(paymentMethod);
    setBalanceInput(balance ? balance.balance.toString() : "0");
    setError("");
    setShowBalanceModal(true);
  };

  const handleCloseModal = () => {
    setShowBalanceModal(false);
    setEditingPaymentMethod(null);
    setBalanceInput("");
    setError("");
  };

  const handleUpdateBalance = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login again");
        return;
      }

      const newBalance = parseFloat(balanceInput);
      if (isNaN(newBalance)) {
        setError("Please enter a valid number");
        setLoading(false);
        return;
      }

      // Update the specific payment method balance
      const response = await fetch(
        `${API_URL}/payment-method-balances/${editingPaymentMethod._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ balance: newBalance }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Payment method balance updated successfully");
        handleCloseModal();
        fetchDashboardData();
      } else {
        setError(data.message || "Failed to update balance");
      }
    } catch (error) {
      console.error("Error updating balance:", error);
      setError("Error updating balance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <Container fluid className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <p className="account-eyebrow">FINANCIAL INSIGHTS</p>
            <h1 className="dashboard-title">DASHBOARD</h1>
          </div>
          <div className="total-balance-badge">
            <span className="balance-label">Total Balance:</span>
            <span className="balance-value">₹ {totalBalance.toFixed(2)}</span>
          </div>
        </div>

        <div className="payment-methods-section">
          <div className="payment-methods-grid">
            {paymentMethods
              .filter((pm) => pm.status === "active")
              .map((paymentMethod) => {
                const balance = paymentMethodBalances.find(
                  (b) => b.paymentMethodId === paymentMethod._id
                ) || {
                  balance: 0,
                  credit: 0,
                  debit: 0,
                  name: paymentMethod.name,
                };
                return (
                  <Card
                    key={paymentMethod._id}
                    className="payment-method-card"
                    onDoubleClick={() => handleDoubleClick(paymentMethod)}
                    title="Double-click to update balance"
                  >
                    <Card.Body>
                      <div className="pm-card-header">
                        <h4 className="pm-name">{paymentMethod.name}</h4>
                      </div>
                      <div className="pm-balance">
                        <span className="pm-balance-label">Balance:</span>
                        <span className="pm-balance-value">
                          ₹ {balance.balance.toFixed(2)}
                        </span>
                      </div>
                      {/* <div className="pm-stats">
                        <div className="pm-stat">
                          <span className="pm-stat-label">Credit:</span>
                          <span className="pm-stat-value credit">
                            ₹ {(balance.credit || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="pm-stat">
                          <span className="pm-stat-label">Debit:</span>
                          <span className="pm-stat-value debit">
                            ₹ {(balance.debit || 0).toFixed(2)}
                          </span>
                        </div>
                      </div> */}
                    </Card.Body>
                  </Card>
                );
              })}
          </div>
        </div>

        <div className="quick-actions-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions-grid">
            <Button
              className="quick-action-btn"
              onClick={() => navigate("/expense")}
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
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              Expense
            </Button>
            <Button
              className="quick-action-btn"
              onClick={() => navigate("/saving")}
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
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              Saving
            </Button>
            <Button
              className="quick-action-btn"
              onClick={() => navigate("/account")}
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
                <path d="M2 7l10-4 10 4-10 4-10-4z"></path>
                <path d="M4 10v6c0 2 4 4 8 4s8-2 8-4v-6"></path>
                <path d="M22 10l-10 4-10-4"></path>
              </svg>
              Account
            </Button>
            <Button
              className="quick-action-btn"
              onClick={() => navigate("/category")}
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
                <path d="M4 7h16M4 12h16M4 17h16"></path>
              </svg>
              Category
            </Button>
            <Button
              className="quick-action-btn"
              onClick={() => navigate("/payment-method")}
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
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
              Payment Method
            </Button>
            <Button
              className="quick-action-btn"
              onClick={() => navigate("/amount-type")}
            >
              <span style={{ fontSize: "24px", fontWeight: "bold" }}>₹</span>
              Amount Type
            </Button>
          </div>
        </div>

        {/* Balance Update Modal */}
        <Modal
          show={showBalanceModal}
          onHide={handleCloseModal}
          className="balance-modal"
          centered
        >
          <Modal.Header closeButton className="modal-header">
            <Modal.Title>
              Update Balance - {editingPaymentMethod?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleUpdateBalance}>
              <Form.Group className="mb-3">
                <Form.Label>New Balance</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  placeholder="Enter new balance"
                  required
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
                  {loading ? "Updating..." : "Update Balance"}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      </Container>
    </div>
  );
}

export default Dashboard;
