import { useState, useEffect, useMemo } from "react";
import {
  Container,
  Card,
  Modal,
  Form,
  Button,
  Alert,
  Spinner,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./Dashboard.css";

const formatDateKey = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getInitialDates = () => {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 6);
  return {
    startDate: formatDateKey(sevenDaysAgo),
    endDate: formatDateKey(today),
  };
};

const formatChartDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

function Dashboard() {
  const [totalBalance, setTotalBalance] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethodBalances, setPaymentMethodBalances] = useState([]);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState(null);
  const [balanceInput, setBalanceInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFetchingData, setIsFetchingData] = useState(true);
  const initialDates = useMemo(() => getInitialDates(), []);
  const [datePreset, setDatePreset] = useState("7days");
  const [startDate, setStartDate] = useState(initialDates.startDate);
  const [endDate, setEndDate] = useState(initialDates.endDate);
  const [analyticsExpenses, setAnalyticsExpenses] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, [API_URL]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchAnalyticsData(startDate, endDate);
    }
  }, [startDate, endDate, API_URL]);

  const fetchAnalyticsData = async (start, end) => {
    setAnalyticsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(
        `${API_URL}/expenses?startDate=${start}&endDate=${end}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setAnalyticsExpenses(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching analytics expenses:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    const today = new Date();
    if (preset === "7days") {
      const d = new Date();
      d.setDate(today.getDate() - 6);
      setStartDate(formatDateKey(d));
      setEndDate(formatDateKey(today));
    } else if (preset === "thisMonth") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDateKey(firstDay));
      setEndDate(formatDateKey(today));
    } else if (preset === "30days") {
      const d = new Date();
      d.setDate(today.getDate() - 29);
      setStartDate(formatDateKey(d));
      setEndDate(formatDateKey(today));
    }
  };

  const handleCustomDateChange = (type, value) => {
    setDatePreset("custom");
    if (type === "start") setStartDate(value);
    if (type === "end") setEndDate(value);
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

  const trendData = useMemo(() => {
    if (!startDate || !endDate) return [];
    const map = {};
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");
    const current = new Date(start);

    while (current <= end) {
      const key = formatDateKey(current);
      map[key] = {
        date: key,
        label: formatChartDate(key),
        income: 0,
        expense: 0,
      };
      current.setDate(current.getDate() + 1);
    }

    analyticsExpenses.forEach((exp) => {
      if (!exp.date) return;
      const expDateStr = exp.date.split("T")[0];
      if (map[expDateStr]) {
        const isCredit = isCreditType(exp.amountType);
        if (isCredit) {
          map[expDateStr].income += exp.amount || 0;
        } else {
          map[expDateStr].expense += exp.amount || 0;
        }
      }
    });

    return Object.values(map);
  }, [analyticsExpenses, startDate, endDate]);

  const categoryData = useMemo(() => {
    const debitExpenses = analyticsExpenses.filter(
      (exp) => !isCreditType(exp.amountType)
    );

    const totalDebit = debitExpenses.reduce(
      (sum, exp) => sum + (exp.amount || 0),
      0
    );
    const catMap = {};

    debitExpenses.forEach((exp) => {
      const catName = exp.category?.name || "Other";
      catMap[catName] = (catMap[catName] || 0) + (exp.amount || 0);
    });

    const neonColors = [
      "#39FF14", // Neon Green
      "#00E5FF", // Neon Cyan
      "#FFB300", // Amber Gold
      "#FF3366", // Neon Coral Pink
      "#7C4DFF", // Vivid Purple
      "#00E676", // Bright Mint
      "#FF6D00", // Vibrant Orange
      "#E040FB", // Neon Magenta
      "#2979FF", // Electric Blue
      "#FFD600", // Bright Yellow
    ];

    const sortedCategories = Object.entries(catMap)
      .map(([name, value], idx) => ({
        name,
        value,
        percentage:
          totalDebit > 0 ? ((value / totalDebit) * 100).toFixed(1) : 0,
        color: neonColors[idx % neonColors.length],
      }))
      .sort((a, b) => b.value - a.value);

    return { items: sortedCategories, total: totalDebit };
  }, [analyticsExpenses]);

  const CustomTrendTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const incomeVal =
        payload.find((p) => p.dataKey === "income")?.value || 0;
      const expenseVal =
        payload.find((p) => p.dataKey === "expense")?.value || 0;
      const netVal = incomeVal - expenseVal;
      return (
        <div className="chart-tooltip">
          <div className="tooltip-date">{label}</div>
          <div className="tooltip-row income">
            <span className="tooltip-label">Income:</span>
            <span className="tooltip-val">₹ {incomeVal.toFixed(2)}</span>
          </div>
          <div className="tooltip-row expense">
            <span className="tooltip-label">Expense:</span>
            <span className="tooltip-val">₹ {expenseVal.toFixed(2)}</span>
          </div>
          <div
            className={`tooltip-row net ${
              netVal >= 0 ? "positive" : "negative"
            }`}
          >
            <span className="tooltip-label">Net:</span>
            <span className="tooltip-val">
              {netVal >= 0 ? "+" : ""}₹ {netVal.toFixed(2)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomDonutTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="chart-tooltip">
          <div
            className="tooltip-category"
            style={{ color: data.payload.color }}
          >
            {data.name}
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">Amount:</span>
            <span className="tooltip-val">₹ {data.value.toFixed(2)}</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">Share:</span>
            <span className="tooltip-val">{data.payload.percentage}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

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
    } finally {
      setIsFetchingData(false);
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
          {isFetchingData ? (
            <div
              className="d-flex justify-content-center align-items-center"
              style={{ minHeight: "100px", width: "100%" }}
            >
              <Spinner animation="border" variant="success" />
            </div>
          ) : (
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
          )}
        </div>

        {/* Financial Analytics & Trends */}
        <div className="analytics-section">
          <div className="analytics-header">
            <div className="analytics-title-group">
              <span className="account-eyebrow">FINANCIAL OVERVIEW</span>
              <h2 className="section-title">Analytics & Trends</h2>
            </div>
            <div className="analytics-controls">
              <div className="preset-buttons">
                <button
                  type="button"
                  className={`preset-btn ${
                    datePreset === "7days" ? "active" : ""
                  }`}
                  onClick={() => handlePresetChange("7days")}
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  className={`preset-btn ${
                    datePreset === "thisMonth" ? "active" : ""
                  }`}
                  onClick={() => handlePresetChange("thisMonth")}
                >
                  This Month
                </button>
                <button
                  type="button"
                  className={`preset-btn ${
                    datePreset === "30days" ? "active" : ""
                  }`}
                  onClick={() => handlePresetChange("30days")}
                >
                  Last 30 Days
                </button>
                <button
                  type="button"
                  className={`preset-btn ${
                    datePreset === "custom" ? "active" : ""
                  }`}
                  onClick={() => handlePresetChange("custom")}
                >
                  Custom
                </button>
              </div>
              <div className="date-inputs-wrapper">
                <div className="date-input-item">
                  <label>From</label>
                  <Form.Control
                    type="date"
                    className="analytics-date-input"
                    value={startDate}
                    onChange={(e) =>
                      handleCustomDateChange("start", e.target.value)
                    }
                  />
                </div>
                <div className="date-input-item">
                  <label>To</label>
                  <Form.Control
                    type="date"
                    className="analytics-date-input"
                    value={endDate}
                    onChange={(e) =>
                      handleCustomDateChange("end", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {analyticsLoading ? (
            <div className="analytics-loading">
              <Spinner animation="border" variant="success" />
              <span>Loading analytics data...</span>
            </div>
          ) : (
            <div className="analytics-grid">
              {/* Left Chart: Income vs Expense Trend */}
              <div className="chart-card">
                <div className="chart-card-header">
                  <div className="chart-card-title-group">
                    <h3 className="chart-title">Income vs Expense Trend</h3>
                    <span className="chart-subtitle">
                      Daily cash flow comparison
                    </span>
                  </div>
                  <div className="chart-legend-pills">
                    <span className="legend-pill income">
                      <span className="legend-dot income"></span> Income
                    </span>
                    <span className="legend-pill expense">
                      <span className="legend-dot expense"></span> Expense
                    </span>
                  </div>
                </div>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart
                      data={trendData}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="incomeGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#39FF14"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#39FF14"
                            stopOpacity={0.0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="expenseGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#FF4D4D"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#FF4D4D"
                            stopOpacity={0.0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255, 255, 255, 0.07)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        stroke="#666"
                        tick={{ fill: "#888", fontSize: 11 }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#666"
                        tick={{ fill: "#888", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) =>
                          v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
                        }
                      />
                      <RechartsTooltip content={<CustomTrendTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="income"
                        name="Income"
                        stroke="#39FF14"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#incomeGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="expense"
                        name="Expense"
                        stroke="#FF4D4D"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#expenseGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Chart: Category Donut Chart */}
              <div className="chart-card">
                <div className="chart-card-header">
                  <div className="chart-card-title-group">
                    <h3 className="chart-title">Expense by Category</h3>
                    <span className="chart-subtitle">
                      Spending breakdown
                    </span>
                  </div>
                  <span className="chart-badge">
                    {categoryData.items.length} Categories
                  </span>
                </div>

                {categoryData.items.length === 0 ? (
                  <div className="chart-empty-state">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>No expense records found for this period</span>
                  </div>
                ) : (
                  <div className="donut-content-wrapper">
                    <div className="donut-chart-box">
                      <ResponsiveContainer width="100%" height={210}>
                        <PieChart>
                          <Pie
                            data={categoryData.items}
                            cx="50%"
                            cy="50%"
                            innerRadius={58}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="#1e1e1e"
                            strokeWidth={3}
                          >
                            {categoryData.items.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip content={<CustomDonutTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="donut-center-info">
                        <span className="donut-center-label">TOTAL SPENT</span>
                        <span className="donut-center-value">
                          ₹{categoryData.total.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    <div className="category-legend-list">
                      {categoryData.items.map((cat, idx) => (
                        <div key={idx} className="category-legend-row">
                          <div className="legend-left">
                            <span
                              className="category-color-dot"
                              style={{ backgroundColor: cat.color }}
                            ></span>
                            <span
                              className="category-legend-name"
                              title={cat.name}
                            >
                              {cat.name}
                            </span>
                          </div>
                          <div className="legend-right">
                            <span className="category-legend-amt">
                              ₹{cat.value.toFixed(0)}
                            </span>
                            <span className="category-legend-pct">
                              {cat.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
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

        {/* Notes FAB */}
        <button
          className="fab-notes-nav"
          onClick={() => navigate("/notes")}
          title="Notes"
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
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </button>
      </Container>
    </div>
  );
}

export default Dashboard;
