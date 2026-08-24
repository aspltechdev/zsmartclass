// src/components/admin/AdminHeader.jsx
import { useState, useEffect, useRef } from "react";
import {
  Bell,
  LogOut,
  Menu,
  ChevronRight,
  User,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import "./AdminHeader.css";

const PAGE_LABELS = {
  dashboard: "Dashboard",
  users: "User Management",
  categories: "Categories",
  courses: "Courses",
  modules: "Modules",
  lessons: "Lessons",
  enrollments: "Enrollments",
  payments: "Payments",
  certificates: "Certificates",
  notifications: "Notifications",
  reports: "Reports",
  profile: "Profile",
};

function AdminHeader({ collapsed = false, onToggleCollapse, onToggleMobile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [pendingCerts, setPendingCerts] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const pageKey =
    location.pathname.split("/").filter(Boolean).pop() || "dashboard";
  const pageLabel = PAGE_LABELS[pageKey] || pageKey.replace(/-/g, " ");

  useEffect(() => {
    let cancelled = false;

    const fetchPendingCerts = async () => {
      try {
        const res = await api.get("/certificates/admin/pending");
        const data = res.data?.data || res.data || [];
        if (!cancelled) setPendingCerts(Array.isArray(data) ? data.length : 0);
      } catch {
        // silent — the badge is non-critical
      }
    };

    fetchPendingCerts();
    return () => {
      cancelled = true;
    };
  }, []);

  // Close the profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close the profile dropdown on route change
  useEffect(() => {
    setIsProfileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="admin-header">
      {/* Left */}
      <div className="ah-left">
        {/* Mobile: open the drawer */}
        <button
          className="ah-menu-btn"
          onClick={onToggleMobile}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Desktop: collapse / expand the rail */}
        <button
          className="ah-collapse-btn"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
        </button>

        <div className="ah-breadcrumb">
          <span className="ah-breadcrumb-parent">Admin</span>
          <ChevronRight size={14} className="ah-breadcrumb-sep" />
          <span className="ah-breadcrumb-current">{pageLabel}</span>
        </div>
      </div>

      {/* Right */}
      <div className="ah-right">
        <button
          className="ah-icon-btn"
          onClick={() => navigate("/admin/notifications")}
          aria-label="Pending certificates"
          title="Pending certificates"
        >
          <Bell size={18} />
          {pendingCerts > 0 && <span className="ah-badge">{pendingCerts}</span>}
        </button>

        {/* Profile */}
        <div className="ah-profile-wrapper" ref={profileRef}>
          <button
            className="ah-profile"
            onClick={() => setIsProfileOpen((v) => !v)}
            aria-expanded={isProfileOpen}
          >
            <div className="ah-avatar">
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user?.name || "Admin"}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                user?.name?.charAt(0) || "A"
              )}
            </div>
            <div className="ah-profile-info">
              <span className="ah-profile-name">{user?.name || "Admin"}</span>
              <span className="ah-profile-role">Administrator</span>
            </div>
            <ChevronDown
              size={14}
              className={`ah-profile-arrow ${isProfileOpen ? "open" : ""}`}
            />
          </button>

          {isProfileOpen && (
            <div className="ah-profile-dropdown">
              <div className="ah-dropdown-user">
                <div className="ah-dropdown-avatar">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user?.name || "Admin"}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    user?.name?.charAt(0) || "A"
                  )}
                </div>
                <div>
                  <h4>{user?.name || "Admin"}</h4>
                  <span>{user?.email || "admin@zsmartclass.com"}</span>
                </div>
              </div>

              <div className="ah-dropdown-divider"></div>

              <Link
                to="/admin/profile"
                className="ah-dropdown-item"
                onClick={() => setIsProfileOpen(false)}
              >
                <User size={16} />
                <span>Profile</span>
              </Link>

              <div className="ah-dropdown-divider"></div>

              <button
                className="ah-dropdown-item ah-dropdown-logout"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;