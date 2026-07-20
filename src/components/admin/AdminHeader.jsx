import { Search, Bell, LogOut, UserCircle2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminHeader.css";

function AdminHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout } = useAuth();

  const pageName = location.pathname
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replace("-", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="admin-header">

      <div className="header-left">

        <h2>{pageName || "Dashboard"}</h2>

        <p>
          Home / Admin / <span>{pageName || "Dashboard"}</span>
        </p>

      </div>

      <div className="header-right">

        <div className="search-box">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search..."
          />

        </div>

        <button className="icon-btn">

          <Bell size={20} />

          <span className="notification-dot"></span>

        </button>

        <div className="profile-box">

          <UserCircle2 size={42} />

          <div>

            <h4>{user?.name || "Administrator"}</h4>

            <span>{user?.role || "ADMIN"}</span>

          </div>

        </div>

        <button
          className="logout-btn"
          onClick={handleLogout}
        >

          <LogOut size={18} />

          Logout

        </button>

      </div>

    </header>
  );
}

export default AdminHeader;