// src/components/student/StudentHeader.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "./StudentHeader.css";

function StudentHeader({ user, onToggleSidebar }) {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.data.slice(0, 5));
      setUnreadCount(res.data.data.filter(n => !n.read).length);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <header className="student-header">
      <div className="header-left">
        <button onClick={onToggleSidebar} className="header-toggle-btn">
          ☰
        </button>
        <div className="header-greeting">
          <h2>{getGreeting()}, {user?.name?.split(' ')[0] || 'Student'} 👋</h2>
          <p>Let's continue your learning journey</p>
        </div>
      </div>

      <div className="header-right">
        {/* Notifications */}
        <div className="header-notifications">
          <button 
            className="header-notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            🔔
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-dropdown-header">
                <h3>Notifications</h3>
                <Link to="/student/notifications">View All</Link>
              </div>
              <div className="notification-dropdown-body">
                {notifications.length === 0 ? (
                  <p className="no-notifications">No notifications</p>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className={`notification-item ${!notif.read ? 'unread' : ''}`}>
                      <p className="notification-title">{notif.title}</p>
                      <p className="notification-message">{notif.message}</p>
                      <span className="notification-time">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <Link to="/student/profile" className="header-profile">
          <div className="header-avatar">
            {user?.name?.charAt(0) || 'S'}
          </div>
        </Link>
      </div>
    </header>
  );
}

export default StudentHeader;