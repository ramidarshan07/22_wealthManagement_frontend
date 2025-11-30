import { useState } from "react";
import { Navbar, Dropdown } from "react-bootstrap";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import "./Header.css";

function Header({ toggleMobileSidebar, isMobileSidebarOpen }) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const navigate = useNavigate();
  const userName = localStorage.getItem("name") || "User";
  const userEmail = localStorage.getItem("email") || "";

  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to logout?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#39FF14",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, logout!",
      cancelButtonText: "Cancel",
      background: "#1a1a1a",
      color: "#f5f5f5",
    }).then((result) => {
      if (result.isConfirmed) {
        // Clear all localStorage
        localStorage.clear();
        // Redirect to login
        navigate("/login");
        Swal.fire({
          title: "Logged out!",
          text: "You have been successfully logged out.",
          icon: "success",
          confirmButtonColor: "#39FF14",
          background: "#1a1a1a",
          color: "#f5f5f5",
        });
      }
    });
  };

  return (
    <Navbar className="header-navbar" expand="lg">
      <div className="header-container">
        <div className="header-left">
          <button
            className="mobile-sidebar-toggle"
            onClick={toggleMobileSidebar}
            aria-label="Toggle sidebar"
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
              {isMobileSidebarOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </>
              )}
            </svg>
          </button>
          <div
            onClick={() => navigate("/dashboard")}
            style={{ cursor: "pointer", marginLeft: "0.5rem" }}
          >
            <img src="/D-logo.png" alt="Logo" className="header-logo" />
          </div>
        </div>
        <div className="header-center">
          <h2 className="header-user-name">{userName}</h2>
        </div>
        <div className="header-right">
          <Dropdown
            show={showProfileDropdown}
            onToggle={setShowProfileDropdown}
            align="end"
          >
            <Dropdown.Toggle
              as="div"
              className="profile-toggle"
              id="profile-dropdown"
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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </Dropdown.Toggle>

            <Dropdown.Menu className="profile-dropdown-menu">
              <Dropdown.ItemText className="profile-info">
                <div className="profile-name">{userName}</div>
                <div className="profile-email">{userEmail}</div>
              </Dropdown.ItemText>
            </Dropdown.Menu>
          </Dropdown>

          <button className="logout-button" onClick={handleLogout}>
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
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </Navbar>
  );
}

export default Header;
