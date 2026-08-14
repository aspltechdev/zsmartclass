import { useEffect, useState } from "react";
import axios from "axios";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
} from "lucide-react";
import "./Notification.css";

function MentorNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:5000/api/notifications/${id}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "SUCCESS":
        return <CheckCircle className="success" />;
      case "WARNING":
        return <AlertTriangle className="warning" />;
      case "ERROR":
        return <XCircle className="error" />;
      default:
        return <Info className="info" />;
    }
  };

  if (loading) {
    return <h3>Loading notifications...</h3>;
  }

  return (
    <div className="mentor-notifications">

      <div className="page-header">
        <h1>
          <Bell size={28} />
          Notifications
        </h1>
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <Bell size={55} />
          <h3>No Notifications</h3>
          <p>You don't have any notifications.</p>
        </div>
      ) : (
        notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification-card ${
              notification.isRead ? "read" : "unread"
            }`}
          >
            <div className="notification-icon">
              {getIcon(notification.type)}
            </div>

            <div className="notification-content">
              <h3>{notification.title}</h3>

              <p>{notification.message}</p>

              <small>
                {new Date(notification.createdAt).toLocaleString()}
              </small>
            </div>

            {!notification.isRead && (
              <button
                className="read-btn"
                onClick={() => markAsRead(notification.id)}
              >
                Mark Read
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default MentorNotifications;