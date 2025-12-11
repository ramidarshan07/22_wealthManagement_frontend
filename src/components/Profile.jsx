import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Spinner,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    upiId: "", // Added upiId
    bankDetails: {
      accountName: "",
      accountNumber: "",
      bankName: "",
      ifscCode: "",
      branchName: "",
    },
  });

  const [qrcode, setQrcode] = useState(null);
  const [qrcodePreview, setQrcodePreview] = useState(null);

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const API_URL = import.meta.env.VITE_API_URL;
  const BASE_URL = API_URL.replace(/\/api$/, "");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setUserData({
          ...data.user,
          upiId: data.user.upiId || "",
          bankDetails: data.user.bankDetails || {
            accountName: "",
            accountNumber: "",
            bankName: "",
            ifscCode: "",
            branchName: "",
          },
        });
        if (data.user.qrcode) {
          setQrcodePreview(`${BASE_URL}/${data.user.qrcode}`);
        }
      } else {
        toast.error(data.message || "Failed to fetch profile");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setUserData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setUserData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQrcode(file);
      setQrcodePreview(URL.createObjectURL(file));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append("name", userData.name);
      formData.append("email", userData.email);
      formData.append("phone", userData.phone || "");
      formData.append("upiId", userData.upiId || "");
      formData.append("bankDetails", JSON.stringify(userData.bankDetails));

      if (qrcode) {
        formData.append("qrcode", qrcode);
      }

      const response = await fetch(`${API_URL}/user/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Profile updated successfully");
        localStorage.setItem("name", userData.name);
        localStorage.setItem("email", userData.email);
        // Optionally update context or trigger a re-render of header
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error updating profile");
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      return toast.error("New passwords do not match");
    }

    setPasswordUpdating(true);
    try {
      const response = await fetch(`${API_URL}/user/reset-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Password changed successfully. Please login again.");
        setPasswordData({
          oldPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });

        // Clear local storage and redirect to login
        setTimeout(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("name");
          localStorage.removeItem("email");
          localStorage.removeItem("rememberedEmail");
          navigate("/login");
        }, 1000);
      } else {
        toast.error(data.message || "Password change failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error changing password");
    } finally {
      setPasswordUpdating(false);
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "80vh" }}
      >
        <Spinner animation="border" variant="success" />
      </div>
    );
  }

  return (
    <Container className="profile-container">
      <h2 className="mb-4 title">MY PROFILE</h2>

      <Row className="g-4">
        <Col lg={8}>
          <Card className="profile-card mb-4">
            <div className="profile-header">
              <h3 className="profile-title">Personal Information</h3>
            </div>
            <Form onSubmit={handleProfileUpdate}>
              <div className="profile-section">
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={userData.name}
                      onChange={handleUserChange}
                      className="form-control-custom"
                      required
                      disabled
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={userData.email}
                      onChange={handleUserChange}
                      className="form-control-custom"
                      required
                      disabled
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={userData.phone || ""}
                      onChange={handleUserChange}
                      className="form-control-custom"
                      placeholder="Enter phone number"
                    />
                  </Col>
                </Row>
              </div>

              {/* <div className="profile-header border-top border-secondary">
                <h3 className="profile-title">Bank Details</h3>
              </div>
              <div className="profile-section">
                <Row>
                  <Col md={12} className="mb-3">
                    <Form.Label>QR Code</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="form-control-custom"
                    />
                    {qrcodePreview && (
                      <div className="mt-3">
                        <label className="d-block mb-2 text-muted">
                          Preview:
                        </label>
                        <img
                          src={qrcodePreview}
                          alt="QR Code Preview"
                          style={{
                            maxWidth: "200px",
                            borderRadius: "8px",
                            border: "1px solid #444",
                          }}
                        />
                      </div>
                    )}
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Account Holder Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="bankDetails.accountName"
                      value={userData.bankDetails.accountName || ""}
                      onChange={handleUserChange}
                      className="form-control-custom"
                      placeholder="Name on bank account"
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Account Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="bankDetails.accountNumber"
                      value={userData.bankDetails.accountNumber || ""}
                      onChange={handleUserChange}
                      className="form-control-custom"
                      placeholder="Account Number"
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Bank Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="bankDetails.bankName"
                      value={userData.bankDetails.bankName || ""}
                      onChange={handleUserChange}
                      className="form-control-custom"
                      placeholder="Bank Name"
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>IFSC Code</Form.Label>
                    <Form.Control
                      type="text"
                      name="bankDetails.ifscCode"
                      value={userData.bankDetails.ifscCode || ""}
                      onChange={handleUserChange}
                      className="form-control-custom"
                      placeholder="IFSC Code"
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Branch Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="bankDetails.branchName"
                      value={userData.bankDetails.branchName || ""}
                      onChange={handleUserChange}
                      className="form-control-custom"
                      placeholder="Branch Name"
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>UPI ID</Form.Label>
                    <Form.Control
                      type="text"
                      name="upiId"
                      value={userData.upiId || ""}
                      onChange={handleUserChange}
                      className="form-control-custom"
                      placeholder="Enter UPI ID"
                    />
                  </Col>
                </Row>

                <div className="mt-4 d-flex justify-content-end">
                  <Button
                    type="submit"
                    className="btn-update"
                    disabled={updating}
                  >
                    {updating ? "Saving..." : "Save Profile Details"}
                  </Button>
                </div>
              </div> */}
            </Form>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="profile-card">
            <div className="profile-header">
              <h3 className="profile-title">Security</h3>
            </div>
            <div className="profile-section password-reset-section">
              <h5 className="section-title">Change Password</h5>
              <Form onSubmit={handlePasswordReset}>
                <Form.Group className="mb-3">
                  <Form.Label>Current Password</Form.Label>
                  <div className="password-input-wrapper position-relative">
                    <Form.Control
                      type={showOldPassword ? "text" : "password"}
                      name="oldPassword"
                      value={passwordData.oldPassword}
                      onChange={handlePasswordChange}
                      className="form-control-custom"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                    >
                      {showOldPassword ? (
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
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
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
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <div className="password-input-wrapper position-relative">
                    <Form.Control
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="form-control-custom"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
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
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
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
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label>Confirm New Password</Form.Label>
                  <div className="password-input-wrapper position-relative">
                    <Form.Control
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmNewPassword"
                      value={passwordData.confirmNewPassword}
                      onChange={handlePasswordChange}
                      className="form-control-custom"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
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
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
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
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                </Form.Group>

                <Button
                  type="submit"
                  className="btn-update w-100"
                  disabled={passwordUpdating}
                >
                  {passwordUpdating ? "Updating..." : "Update Password"}
                </Button>
              </Form>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
