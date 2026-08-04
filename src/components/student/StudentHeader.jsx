// src/components/student/StudentHeader.jsx
import { useState, useEffect } from "react";
import { Search, Bell, LogOut, Menu, X, ChevronRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import "./StudentHeader.css";

const PAGE_LABELS = {
  dashboard: "Dashboard",
  courses: "Browse courses",
  "my-courses": "My courses",
  certificates: "Certificates",
  notifications: "Notifications",
  profile: "Profile",
};

function StudentHeader({ onToggleMobile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const segments = location.pathname.split("/").filter(Boolean);
  const pageKey = segments.length > 2 ? segments[1] : segments.pop() || "dashboard";
  const pageLabel = PAGE_LABELS[pageKey] || pageKey.replace(/-/g, " ");

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      // GET /notifications is scoped server-side to the logged-in user
      // (see AdminNotifications.jsx comments) — no /my suffix needed.
      const res = await api.get("/notifications");
      const data = res.data?.data || res.data || [];
      const list = Array.isArray(data) ? data : [];
      setUnreadCount(list.filter((n) => !n.isRead).length);
    } catch {
      // silent — notification badge is non-critical
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/student/courses?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowMobileSearch(false);
    }
  };

  return (
    <>
      <header className="student-header">
        <div className="sh-left">
          <button className="sh-menu-btn" onClick={onToggleMobile} aria-label="Menu">
            <Menu size={20} />
          </button>
          <div className="sh-breadcrumb">
            <span className="sh-breadcrumb-parent">My learning</span>
            <ChevronRight size={14} className="sh-breadcrumb-sep" />
            <span className="sh-breadcrumb-current">{pageLabel}</span>
          </div>
        </div>

        <div className="sh-right">
          <div className="sh-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search courses…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>

          <button
            className="sh-icon-btn mobile-search-toggle"
            onClick={() => setShowMobileSearch(true)}
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          <button
            className="sh-icon-btn"
            onClick={() => navigate("/student/notifications")}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="sh-badge">{unreadCount}</span>}
          </button>

          <div className="sh-profile" onClick={() => navigate("/student/profile")}>
            <div className="sh-avatar">{user?.name?.charAt(0) || "S"}</div>
            <div className="sh-profile-info">
              <span className="sh-profile-name">{user?.name || "Student"}</span>
              <span className="sh-profile-role">Student</span>
            </div>
          </div>

          <button className="sh-logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {showMobileSearch && (
        <div className="sh-mobile-search">
          <div className="sh-search expanded">
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
          <button className="sh-icon-btn" onClick={() => setShowMobileSearch(false)}>
            <X size={18} />
          </button>
        </div>
      )}
    </>
  );
}

export default StudentHeader;