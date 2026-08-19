// src/components/mentor/MentorHeader.jsx
import { useState, useEffect, useRef } from "react";
import { Bell, LogOut, Menu, ChevronRight, User, ChevronDown } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./MentorHeader.css";

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
};

function MentorHeader({ onToggleMobile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const pageKey = location.pathname.split("/").filter(Boolean).pop() || "dashboard";
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

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  return (
    <>
      <header className="mentor-header">
        {/* Left */}
        <div className="mh-left">
          <button className="mh-menu-btn" onClick={onToggleMobile} aria-label="Menu">
            <Menu size={20} />
          </button>
          <div className="mh-breadcrumb">
            <span className="mh-breadcrumb-parent">Mentor</span>
            <ChevronRight size={14} className="mh-breadcrumb-sep" />
            <span className="mh-breadcrumb-current">{pageLabel}</span>
          </div>
        </div>

        {/* Right */}
        <div className="mh-right">
          {/* Notifications */}
          <button
            className="mh-icon-btn"
            onClick={() => navigate("/mentor/notifications")}
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>

          {/* Profile with Dropdown */}
          <div className="mh-profile-wrapper" ref={profileRef}>
            <button className="mh-profile" onClick={toggleProfile}>
              <div className="mh-avatar">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user?.name || "Mentor"}
                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  user?.name?.charAt(0) || "M"
                )}
              </div>
              <div className="mh-profile-info">
                <span className="mh-profile-name">{user?.name || "Mentor"}</span>
                <span className="mh-profile-role">Mentor</span>
              </div>
              <ChevronDown 
                size={14} 
                className={`mh-profile-arrow ${isProfileOpen ? 'open' : ''}`} 
              />
            </button>

            {isProfileOpen && (
              <div className="mh-profile-dropdown">
                <div className="mh-dropdown-user">
                  <div className="mh-dropdown-avatar">
                    {user?.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user?.name || "Mentor"}
                        style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                      />
                    ) : (
                      user?.name?.charAt(0) || "M"
                    )}
                  </div>
                  <div>
                    <h4>{user?.name || "Mentor"}</h4>
                    <span>{user?.email || "mentor@zsmartclass.com"}</span>
                  </div>
                </div>
                <div className="mh-dropdown-divider"></div>
                <Link to="/mentor/profile" className="mh-dropdown-item" onClick={() => setIsProfileOpen(false)}>
                  <User size={16} />
                  <span>Profile</span>
                </Link>
                <div className="mh-dropdown-divider"></div>
                <button className="mh-dropdown-item mh-dropdown-logout" onClick={handleLogout}>
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

export default MentorHeader;