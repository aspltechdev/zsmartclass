// src/components/student/StudentSidebar.jsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "./StudentSidebar.css";

const menuItems = [
  {
    path: "/student/dashboard",
    icon: "📊",
    label: "Dashboard"
  },
  {
    path: "/student/my-courses",
    icon: "📚",
    label: "My Courses"
  },
  {
    path: "/student/certificates",
    icon: "🎓",
    label: "Certificates"
  },
  {
    path: "/student/payments",
    icon: "💳",
    label: "Payments"
  },
  {
    path: "/student/notifications",
    icon: "🔔",
    label: "Notifications"
  },
  {
    path: "/student/profile",
    icon: "👤",
    label: "Profile"
  }
];

function StudentSidebar({ isOpen, onToggle, onLogout, currentPath }) {
  return (
    <motion.aside 
      className={`student-sidebar ${isOpen ? 'open' : 'closed'}`}
      animate={{ width: isOpen ? 280 : 80 }}
      transition={{ duration: 0.3 }}
    >
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">ZC</div>
        {isOpen && <span className="sidebar-logo-text">ZsmartClass</span>}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-link ${currentPath === item.path ? 'active' : ''}`}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            {isOpen && <span className="sidebar-link-label">{item.label}</span>}
            {currentPath === item.path && (
              <motion.div 
                className="sidebar-active-indicator"
                layoutId="activeIndicator"
              />
            )}
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="sidebar-footer">
        <button onClick={onLogout} className="sidebar-logout-btn">
          <span className="sidebar-link-icon">🚪</span>
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
}

export default StudentSidebar;