// src/components/student/StudentHeader.jsx
import { useState, useEffect, useRef } from "react";
import { Bell, LogOut, Menu, ChevronRight, User, ChevronDown , PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./StudentHeader.css";

const PAGE_LABELS = {
  dashboard: "Dashboard",
  courses: "My Courses",
  lessons: "Lessons",
  students: "Students",
  certificates: "Certificates",
  earnings: "Earnings",
  reviews: "Reviews",
  assignments: "Assignments",
  quiz: "Quiz",
  profile: "Profile",
  notifications: "Notifications",
  player: "Course Player",
  "my-courses": "My Courses",
  course: "Course",
};

function StudentHeader({ collapsed = false, onToggleCollapse, onToggleMobile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  /*
   * Walk the URL backwards and use the last NON-numeric segment.
   * Routes like /student/player/22 would otherwise show the raw id ("22")
   * in the breadcrumb instead of a readable page name.
   */
  const segments = location.pathname.split("/").filter(Boolean);
  const pageKey =
    [...segments].reverse().find((seg) => !/^\d+$/.test(seg)) || "dashboard";
  const pageLabel = PAGE_LABELS[pageKey] || pageKey.replace(/-/g, " ");

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

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  return (
    <>
      <header className="student-header">
        {/* Left */}
        <div className="sh-left">
          <button className="sh-menu-btn" onClick={onToggleMobile} aria-label="Menu">
            <Menu size={20} />
          </button>

          <button
            className="sh-collapse-btn"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
          </button>
          <div className="sh-breadcrumb">
            <span className="sh-breadcrumb-parent">Student</span>
            <ChevronRight size={14} className="sh-breadcrumb-sep" />
            <span className="sh-breadcrumb-current">{pageLabel}</span>
          </div>
        </div>

        {/* Right */}
        <div className="sh-right">
          {/* Notifications */}
          <button
            className="sh-icon-btn"
            onClick={() => navigate("/student/notifications")}
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>

          {/* Profile with Dropdown */}
          <div className="sh-profile-wrapper" ref={profileRef}>
            <button className="sh-profile" onClick={toggleProfile}>
              <div className="sh-avatar">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user?.name || "Student"}
                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  user?.name?.charAt(0) || "S"
                )}
              </div>
              <div className="sh-profile-info">
                <span className="sh-profile-name">{user?.name || "Student"}</span>
                <span className="sh-profile-role">Student</span>
              </div>
              <ChevronDown 
                size={14} 
                className={`sh-profile-arrow ${isProfileOpen ? 'open' : ''}`} 
              />
            </button>

            {isProfileOpen && (
              <div className="sh-profile-dropdown">
                <div className="sh-dropdown-user">
                  <div className="sh-dropdown-avatar">
                    {user?.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user?.name || "Student"}
                        style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                      />
                    ) : (
                      user?.name?.charAt(0) || "S"
                    )}
                  </div>
                  <div>
                    <h4>{user?.name || "Student"}</h4>
                    <span>{user?.email || "student@zsmartclass.com"}</span>
                  </div>
                </div>
                <div className="sh-dropdown-divider"></div>
                <Link to="/student/profile" className="sh-dropdown-item" onClick={() => setIsProfileOpen(false)}>
                  <User size={16} />
                  <span>Profile</span>
                </Link>
                <div className="sh-dropdown-divider"></div>
                <button className="sh-dropdown-item sh-dropdown-logout" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

export default StudentHeader;