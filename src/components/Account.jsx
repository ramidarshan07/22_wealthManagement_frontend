import { useEffect, useMemo, useState } from "react";
import {
  Container,
  Button,
  Modal,
  Form,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Spinner,
} from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "./Account.css";

const defaultDate = () => new Date().toISOString().split("T")[0];

function Account() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [accountFormData, setAccountFormData] = useState({
    name: "",
    accountType: "borrowed",
    initialAmount: "",
    date: defaultDate(),
    paymentChannel: "Cash",
    note: "Opening balance",
    description: "",
  });
  const [transactionFormData, setTransactionFormData] = useState({
    type: "",
    amount: "",
    paymentChannel: "Cash",
    date: defaultDate(),
    note: "",
  });
  const [accountSubmitting, setAccountSubmitting] = useState(false);
  const [transactionSubmitting, setTransactionSubmitting] = useState(false);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }),
    []
  );

  useEffect(() => {
    fetchAccounts();
  }, []);

  const getToken = () => localStorage.getItem("token");

  const fetchAccounts = async () => {
    try {
      const token = getToken();
      if (!token) return;

      setListLoading(true);
      const response = await fetch(`${API_URL}/accounts`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        setAccounts(data.data || []);
        if (!data.data?.length) {
          setSelectedAccount(null);
          return;
        }

        if (
          data.data.length &&
          (!selectedAccount ||
            !data.data.find((account) => account._id === selectedAccount._id))
        ) {
          handleSelectAccount(data.data[0]._id);
        } else if (selectedAccount) {
          handleSelectAccount(selectedAccount._id);
        }
      } else {
        toast.error(data.message || "Failed to fetch accounts");
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Error fetching accounts");
    } finally {
      setListLoading(false);
    }
  };

  const fetchAccountDetail = async (accountId) => {
    try {
      const token = getToken();
      if (!token) return;

      setDetailLoading(true);
      const response = await fetch(`${API_URL}/accounts/${accountId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setSelectedAccount(data.data);
      } else {
        toast.error(data.message || "Failed to fetch account");
      }
    } catch (error) {
      console.error("Error fetching account detail:", error);
      toast.error("Error fetching account detail");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSelectAccount = (accountId) => {
    fetchAccountDetail(accountId);
  };

  const handleOpenAccountModal = () => {
    setAccountFormData({
      name: "",
      accountType: "borrowed",
      initialAmount: "",
      date: defaultDate(),
      paymentChannel: "Cash",
      note: "Opening balance",
      description: "",
    });
    setShowAccountModal(true);
  };

  const handleAccountChange = (e) => {
    setAccountFormData({
      ...accountFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTransactionChange = (e) => {
    setTransactionFormData({
      ...transactionFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      toast.error("Please login again");
      return;
    }

    const initialAmount = parseFloat(accountFormData.initialAmount);
    if (Number.isNaN(initialAmount) || initialAmount <= 0) {
      toast.error("Enter a valid amount greater than zero");
      return;
    }

    try {
      setAccountSubmitting(true);
      const response = await fetch(`${API_URL}/accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: accountFormData.name.trim(),
          accountType: accountFormData.accountType,
          initialAmount,
          date: accountFormData.date,
          paymentChannel: accountFormData.paymentChannel,
          note: accountFormData.note,
          description: accountFormData.description,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Account created successfully");
        setShowAccountModal(false);
        await fetchAccounts();
        if (data.data?._id) {
          handleSelectAccount(data.data._id);
        }
      } else {
        toast.error(data.message || "Failed to create account");
      }
    } catch (error) {
      console.error("Error creating account:", error);
      toast.error("Error creating account");
    } finally {
      setAccountSubmitting(false);
    }
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAccount) {
      toast.error("Select an account first");
      return;
    }
    const token = getToken();
    if (!token) {
      toast.error("Please login again");
      return;
    }

    const parsedAmount = parseFloat(transactionFormData.amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter a valid amount greater than zero");
      return;
    }

    try {
      setTransactionSubmitting(true);
      const response = await fetch(
        `${API_URL}/accounts/${selectedAccount._id}/transactions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: parsedAmount,
            type: transactionFormData.type,
            paymentChannel: transactionFormData.paymentChannel,
            date: transactionFormData.date,
            note: transactionFormData.note,
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast.success("Entry added successfully");
        const defaultType =
          selectedAccount.accountType === "lent" ? "received" : "repay";
        setTransactionFormData({
          type: defaultType,
          amount: "",
          paymentChannel: "Cash",
          date: defaultDate(),
          note: "",
        });
        setShowTransactionModal(false);
        setSelectedAccount(data.data);
        fetchAccounts();
      } else {
        toast.error(data.message || "Failed to add entry");
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Error adding transaction");
    } finally {
      setTransactionSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (transaction) => {
    if (!selectedAccount) return;
    const result = await Swal.fire({
      title: "Delete entry?",
      text: "This will remove the selected record permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#39FF14",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      background: "#1a1a1a",
      color: "#f5f5f5",
    });

    if (!result.isConfirmed) return;

    try {
      const token = getToken();
      const response = await fetch(
        `${API_URL}/accounts/${selectedAccount._id}/transactions/${transaction._id}`,
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
        toast.success("Entry deleted successfully");
        setSelectedAccount(data.data);
        fetchAccounts();
      } else {
        toast.error(data.message || "Failed to delete entry");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Error deleting entry");
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "₹ 0";
    return currencyFormatter.format(value);
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const outstandingAmount = selectedAccount?.summary?.outstanding || 0;

  return (
    <div className="account-container">
      <Container fluid className="account-content">
        <div className="account-header">
          <div>
            <p className="account-eyebrow">PERSONAL LEDGER</p>
            <h1 className="account-title">ACCOUNTS</h1>
          </div>
          <div className="account-actions">
            <Button
              className="add-account-btn"
              onClick={handleOpenAccountModal}
            >
              <span>+</span> Add Account
            </Button>
          </div>
        </div>

        <div className="account-layout">
          <div className="account-list-panel">
            <div className="panel-heading">
              <h3>Your Accounts</h3>
              {listLoading && <Spinner animation="border" size="sm" />}
            </div>
            {accounts.length === 0 && !listLoading ? (
              <div className="empty-state">
                <p>No account found</p>
                <span>Create your first account to track dues.</span>
              </div>
            ) : (
              <div className="account-cards">
                {accounts.map((account) => (
                  <Card
                    key={account._id}
                    className={`account-card ${
                      selectedAccount?._id === account._id ? "active" : ""
                    }`}
                    onClick={() => handleSelectAccount(account._id)}
                  >
                    <div className="account-card-header">
                      <h4>
                        {account.name} -{" "}
                        {account.accountType === "lent" ? "Lent" : "Borrowed"}
                      </h4>
                      <Badge
                        bg={
                          account.summary?.outstanding > 0
                            ? "warning"
                            : "success"
                        }
                      >
                        {account.summary?.outstanding > 0
                          ? "Pending"
                          : "Settled"}
                      </Badge>
                    </div>
                    <div className="account-card-body">
                      <div>
                        <small>
                          {account.accountType === "lent"
                            ? "Total Lent"
                            : "Total Borrowed"}
                        </small>
                        <p className="amount-display">
                          {formatCurrency(account.summary?.totalBorrowed)}
                        </p>
                      </div>
                      <div>
                        <small>
                          {account.accountType === "lent"
                            ? "Total Received"
                            : "Total Paid"}
                        </small>
                        <p className="amount-display">
                          {formatCurrency(account.summary?.totalRepaid)}
                        </p>
                      </div>
                      <div>
                        <small>Remaining</small>
                        <p className="outstanding">
                          {formatCurrency(account.summary?.outstanding)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="account-detail-panel">
            {!selectedAccount ? (
              <div className="empty-detail">
                <p>Select any account to view full history</p>
              </div>
            ) : detailLoading ? (
              <div className="empty-detail">
                <Spinner animation="border" />
              </div>
            ) : (
              <>
                <div className="detail-header">
                  <div>
                    <p className="detail-eyebrow">Account Holder</p>
                    <h2>{selectedAccount.name}</h2>
                    {selectedAccount.description && (
                      <p className="detail-description">
                        {selectedAccount.description}
                      </p>
                    )}
                  </div>
                  <Button
                    className="add-transaction-btn"
                    onClick={() => {
                      const defaultType =
                        selectedAccount.accountType === "lent"
                          ? "received"
                          : "repay";
                      setTransactionFormData({
                        type: defaultType,
                        amount: "",
                        paymentChannel: "Cash",
                        date: defaultDate(),
                        note: "",
                      });
                      setShowTransactionModal(true);
                    }}
                  >
                    <span>+</span> Add Entry
                  </Button>
                </div>

                <div className="summary-grid">
                  <div className="summary-card">
                    <p>
                      {selectedAccount.accountType === "lent"
                        ? "Total Lent"
                        : "Total Borrowed"}
                    </p>
                    <h3 className="amount-display">
                      {formatCurrency(selectedAccount.summary?.totalBorrowed)}
                    </h3>
                  </div>
                  <div className="summary-card highlight">
                    <p>
                      {selectedAccount.accountType === "lent"
                        ? "Total Received"
                        : "Total Paid"}
                    </p>
                    <h3 className="amount-display">
                      {formatCurrency(selectedAccount.summary?.totalRepaid)}
                    </h3>
                  </div>
                  <div className="summary-card highlight-2">
                    <p>Remaining</p>
                    <h3>{formatCurrency(Math.max(outstandingAmount, 0))}</h3>
                  </div>
                  <div className="summary-card">
                    <p>
                      {selectedAccount.accountType === "lent"
                        ? "Last Received"
                        : "Last Payment"}
                    </p>
                    <h4>
                      {formatDate(selectedAccount.summary?.lastRepaymentDate)}
                    </h4>
                  </div>
                </div>

                <div className="transactions-section">
                  <div className="panel-heading">
                    <h3>Entry History</h3>
                  </div>
                  <div className="transactions-table">
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Mode</th>
                          <th>Note</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAccount.transactions?.length ? (
                          selectedAccount.transactions
                            .slice()
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .map((txn) => (
                              <tr key={txn._id}>
                                <td>{formatDate(txn.date)}</td>
                                <td>
                                  <span
                                    className={`txn-pill ${
                                      txn.type === "borrow" ||
                                      txn.type === "lent"
                                        ? "txn-borrow"
                                        : "txn-repay"
                                    }`}
                                  >
                                    {txn.type === "borrow"
                                      ? "Borrow"
                                      : txn.type === "lent"
                                      ? "Lent"
                                      : txn.type === "received"
                                      ? "Received"
                                      : "Repay"}
                                  </span>
                                </td>
                                <td
                                  className={
                                    txn.type === "borrow" || txn.type === "lent"
                                      ? "text-danger"
                                      : "text-success"
                                  }
                                >
                                  {formatCurrency(txn.amount)}
                                </td>
                                <td>{txn.paymentChannel}</td>
                                <td className="note-cell">{txn.note || "-"}</td>
                                <td>
                                  <button
                                    className="delete-entry-btn"
                                    onClick={() => handleDeleteTransaction(txn)}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center text-muted">
                              No entries yet
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
        show={showAccountModal}
        onHide={() => setShowAccountModal(false)}
        centered
        className="account-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAccountSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Account Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={accountFormData.name}
                onChange={handleAccountChange}
                placeholder="enter account name"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Account Type</Form.Label>
              <Form.Select
                name="accountType"
                value={accountFormData.accountType}
                onChange={handleAccountChange}
                required
              >
                <option value="borrowed">
                  Borrowed (I borrowed money from this person)
                </option>
                <option value="lent">Lent (I lent money to this person)</option>
              </Form.Select>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {accountFormData.accountType === "lent"
                      ? "Amount Lent"
                      : "Amount Borrowed"}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="initialAmount"
                    min="0"
                    step="0.01"
                    value={accountFormData.initialAmount}
                    onChange={handleAccountChange}
                    placeholder="e.g. 500000"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={accountFormData.date}
                    onChange={handleAccountChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mode</Form.Label>
                  <Form.Select
                    name="paymentChannel"
                    value={accountFormData.paymentChannel}
                    onChange={handleAccountChange}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Note</Form.Label>
                  <Form.Control
                    type="text"
                    name="note"
                    value={accountFormData.note}
                    onChange={handleAccountChange}
                    placeholder="Optional note"
                    maxLength={120}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={accountFormData.description}
                onChange={handleAccountChange}
                placeholder="Add short description (optional)"
                maxLength={250}
              />
            </Form.Group>

            <div className="modal-actions">
              <Button
                variant="secondary"
                className="cancel-button"
                onClick={() => setShowAccountModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="save-button"
                disabled={accountSubmitting}
              >
                {accountSubmitting ? "Saving..." : "Create"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal
        show={showTransactionModal}
        onHide={() => setShowTransactionModal(false)}
        centered
        className="account-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Entry</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleTransactionSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Entry Type</Form.Label>
                  <Form.Select
                    name="type"
                    value={transactionFormData.type}
                    onChange={handleTransactionChange}
                    required
                  >
                    {selectedAccount?.accountType === "lent" ? (
                      <>
                        <option value="lent">Lent (gave money)</option>
                        <option value="received">
                          Received (got money back)
                        </option>
                      </>
                    ) : (
                      <>
                        <option value="borrow">Borrow (took money)</option>
                        <option value="repay">Repay (gave money)</option>
                      </>
                    )}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Amount</Form.Label>
                  <Form.Control
                    type="number"
                    name="amount"
                    min="0"
                    step="0.01"
                    value={transactionFormData.amount}
                    onChange={handleTransactionChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={transactionFormData.date}
                    onChange={handleTransactionChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mode</Form.Label>
                  <Form.Select
                    name="paymentChannel"
                    value={transactionFormData.paymentChannel}
                    onChange={handleTransactionChange}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Note</Form.Label>
              <Form.Control
                type="text"
                name="note"
                value={transactionFormData.note}
                onChange={handleTransactionChange}
                placeholder="Optional note"
                maxLength={200}
              />
            </Form.Group>

            <div className="modal-actions">
              <Button
                variant="secondary"
                className="cancel-button"
                onClick={() => setShowTransactionModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="save-button"
                disabled={transactionSubmitting}
              >
                {transactionSubmitting ? "Saving..." : "Add Entry"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Account;
