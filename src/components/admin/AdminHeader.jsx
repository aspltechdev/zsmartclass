// src/components/admin/AdminHeader.jsx
import { useState, useEffect, useRef } from "react";
import { Search, Bell, LogOut, Menu, X, ChevronRight, User, Settings, ChevronDown } from "lucide-react";
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
  reviews: "Reviews",
  reports: "Reports",
  settings: "Settings",
};

function AdminHeader({ onToggleMobile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [pendingCerts, setPendingCerts] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const pageKey = location.pathname.split("/").filter(Boolean).pop() || "dashboard";
  const pageLabel = PAGE_LABELS[pageKey] || pageKey.replace(/-/g, " ");

  useEffect(() => {
    fetchPendingCerts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPendingCerts = async () => {
    try {
      const res = await api.get("/certificates/admin/pending");
      const data = res.data?.data || res.data || [];
      setPendingCerts(Array.isArray(data) ? data.length : 0);
    } catch {
      // silent
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/admin/users?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowMobileSearch(false);
    }
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  return (
    <>
      <header className="admin-header">
        {/* Left */}
        <div className="ah-left">
          <button className="ah-menu-btn" onClick={onToggleMobile} aria-label="Menu">
            <Menu size={20} />
          </button>
          <div className="ah-breadcrumb">
            <span className="ah-breadcrumb-parent">Admin</span>
            <ChevronRight size={14} className="ah-breadcrumb-sep" />
            <span className="ah-breadcrumb-current">{pageLabel}</span>
          </div>
        </div>

        {/* Right */}
        <div className="ah-right">
          {/* Desktop search */}
          <div className="ah-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search users, courses…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>

          {/* Mobile search toggle */}
          <button
            className="ah-icon-btn mobile-search-toggle"
            onClick={() => setShowMobileSearch(true)}
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          {/* Notifications */}
          <button
            className="ah-icon-btn"
            onClick={() => navigate("/admin/notifications")}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {pendingCerts > 0 && (
              <span className="ah-badge">{pendingCerts}</span>
            )}
          </button>

          {/* Profile with Dropdown */}
          <div className="ah-profile-wrapper" ref={profileRef}>
            <button className="ah-profile" onClick={toggleProfile}>
              <div className="ah-avatar">{user?.name?.charAt(0) || "A"}</div>
              <div className="ah-profile-info">
                <span className="ah-profile-name">{user?.name || "Admin"}</span>
                <span className="ah-profile-role">Administrator</span>
              </div>
              <ChevronDown 
                size={14} 
                className={`ah-profile-arrow ${isProfileOpen ? 'open' : ''}`} 
              />
            </button>

            {isProfileOpen && (
              <div className="ah-profile-dropdown">
                <div className="ah-dropdown-user">
                  <div className="ah-dropdown-avatar">
                    {user?.name?.charAt(0) || "A"}
                  </div>
                  <div>
                    <h4>{user?.name || "Admin"}</h4>
                    <span>{user?.email || "admin@zsmartclass.com"}</span>
                  </div>
                </div>
                <div className="ah-dropdown-divider"></div>
                <Link to="/admin/profile" className="ah-dropdown-item" onClick={() => setIsProfileOpen(false)}>
                  <User size={16} />
                  <span>Profile</span>
                </Link>
                <Link to="/admin/settings" className="ah-dropdown-item" onClick={() => setIsProfileOpen(false)}>
                  <Settings size={16} />
                  <span>Settings</span>
                </Link>
                <div className="ah-dropdown-divider"></div>
                <button className="ah-dropdown-item ah-dropdown-logout" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Logout Button (Hidden when profile dropdown is used) */}
          {/* <button className="ah-logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
            <span>Logout</span>
          </button> */}
        </div>
      </header>

      {/* Mobile search overlay */}
      {showMobileSearch && (
        <div className="ah-mobile-search">
          <div className="ah-search expanded">
            <Search size={16} />
            <input
              autoFocus
              type="text"
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
          <button className="ah-icon-btn" onClick={() => setShowMobileSearch(false)}>
            <X size={18} />
          </button>
        </div>
      )}
    </>
  );
}

export default AdminHeader;