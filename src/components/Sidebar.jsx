import { Nav } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
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
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      ),
      path: "/dashboard",
    },
    {
      id: "expense",
      label: "Expense",
      icon: (
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
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
      path: "/expense",
    },
    {
      id: "saving",
      label: "Saving",
      icon: (
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
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
      ),
      path: "/saving",
    },
    {
      id: "account",
      label: "Account",
      icon: (
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
          <path d="M2 7l10-4 10 4-10 4-10-4z"></path>
          <path d="M4 10v6c0 2 4 4 8 4s8-2 8-4v-6"></path>
          <path d="M22 10l-10 4-10-4"></path>
        </svg>
      ),
      path: "/account",
    },
    {
      id: "category",
      label: "Category",
      icon: (
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
          <path d="M4 7h16M4 12h16M4 17h16"></path>
        </svg>
      ),
      path: "/category",
    },
    {
      id: "payment-method",
      label: "Payment Method",
      icon: (
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
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
          <line x1="1" y1="10" x2="23" y2="10"></line>
        </svg>
      ),
      path: "/payment-method",
    },
    {
      id: "amount-type",
      label: "Amount Type",
      icon: <span style={{ fontSize: "20px", fontWeight: "bold" }}>₹</span>,
      path: "/amount-type",
    },
  ];

  const handleNavClick = (path) => {
    navigate(path);
  };

  return (
    <div className="sidebar">
      <div>
        <Nav className="flex-column sidebar-nav">
          {menuItems.map((item) => (
            <Nav.Link
              key={item.id}
              className={`sidebar-item ${
                location.pathname === item.path ? "active" : ""
              }`}
              onClick={() => handleNavClick(item.path)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Nav.Link>
          ))}
        </Nav>
      </div>
      <div
        className="p-2 text-center position-fixed-bottom"
        style={{ fontSize: "15px", color: "#00CC33" }}
      >
        Design & Develope By Darshan
      </div>
    </div>
  );
}

export default Sidebar;
