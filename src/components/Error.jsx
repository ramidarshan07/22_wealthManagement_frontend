import { useNavigate } from "react-router-dom";
import "./Error.css";

const Error = () => {
  const navigate = useNavigate();

  return (
    <div className="error-wrapper">
      <div className="error-content">
        <h1 className="error-code">404</h1>
        <br />
        <h2 className="error-message">Oops! Page Not Found</h2>
        <p className="error-description">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <button className="home-btn" onClick={() => navigate("/")}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Error;
