// src/pages/mentor/Notification.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  CheckCheck,
  Trash2,
  RefreshCw,
  Megaphone,
  Sparkles,
  TrendingUp,
  CalendarDays,
} from "lucide-react";
import api from "../../services/api";
import "./Notification.css";
import "./MentorShared.css";

// Channel/type -> icon + tone. Falls back to a neutral "info" look.
const TYPE_META = {
  SUCCESS: { icon: CheckCircle, tone: "success" },
  WARNING: { icon: AlertTriangle, tone: "warning" },
  ERROR: { icon: XCircle, tone: "error" },
  ANNOUNCEMENT: { icon: Megaphone, tone: "info" },
  NEW_ARRIVAL: { icon: Sparkles, tone: "success" },
  PROGRESS: { icon: TrendingUp, tone: "warning" },
  EVENT: { icon: CalendarDays, tone: "info" },
  PAYMENT: { icon: CheckCircle, tone: "success" },
  GENERAL: { icon: Info, tone: "info" },
};

const metaFor = (type) => TYPE_META[(type || "").toUpperCase()] || TYPE_META.GENERAL;

function MentorNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all | unread
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");
      // Uses the shared api client: correct base URL per environment and the
      // auth token attached by the interceptor (no hardcoded localhost).
      const res = await api.get("/notifications");
      const data = res.data?.data ?? res.data ?? [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Couldn't load notifications. Please refresh or check the server."
      );
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      setBusyId(id);
      await api.put(`/notifications/${id}/read`);
      // Update locally instead of refetching the whole list.
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't mark this as read.");
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    try {
      setBusyId("all");
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't mark all as read.");
    } finally {
      setBusyId(null);
    }
  };

  const removeNotification = async (id) => {
    try {
      setBusyId(id);
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't delete this notification.");
    } finally {
      setBusyId(null);
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const visible = useMemo(
    () => (filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications),
    [notifications, filter]
  );

  const fmt = (d) =>
    d
      ? new Date(d).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  if (loading) {
    return (
      <div className="mentor-notifications">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading notifications…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mentor-notifications">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>
            <Bell size={24} /> Notifications
          </h1>
          <p className="subtitle">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "You're all caught up."}
          </p>
        </div>

        <div className="header-buttons">
          <button className="refresh-btn" onClick={fetchNotifications} title="Refresh">
            <RefreshCw size={16} />
          </button>
          {unreadCount > 0 && (
            <button
              className="btn-secondary"
              onClick={markAllRead}
              disabled={busyId === "all"}
            >
              <CheckCheck size={16} />
              {busyId === "all" ? "Marking…" : "Mark all read"}
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-text">{error}</div>}

      {/* Filter tabs */}
      <div className="ntf-filter">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          All ({notifications.length})
        </button>
        <button
          className={filter === "unread" ? "active" : ""}
          onClick={() => setFilter("unread")}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="empty-state">
          <Bell size={48} />
          <h3>{filter === "unread" ? "No unread notifications" : "No notifications"}</h3>
          <p>
            {filter === "unread"
              ? "Everything here has been read."
              : "Updates about your courses and students will appear here."}
          </p>
        </div>
      ) : (
        <div className="ntf-list">
          {visible.map((n) => {
            const meta = metaFor(n.type);
            const Icon = meta.icon;
            return (
              <div
                key={n.id}
                className={`notification-card ${n.isRead ? "read" : "unread"}`}
              >
                <div className={`notification-icon ${meta.tone}`}>
                  <Icon size={18} />
                </div>

                <div className="notification-content">
                  <div className="ntf-card-top">
                    <h3>{n.title}</h3>
                    {!n.isRead && <span className="unread-dot" />}
                  </div>
                  <p>{n.message}</p>
                  <small>{fmt(n.createdAt)}</small>
                </div>

                <div className="ntf-card-actions">
                  {!n.isRead && (
                    <button
                      className="read-btn"
                      onClick={() => markAsRead(n.id)}
                      disabled={busyId === n.id}
                      title="Mark as read"
                    >
                      <CheckCheck size={15} /> Read
                    </button>
                  )}
                  <button
                    className="delete-lesson-btn"
                    onClick={() => removeNotification(n.id)}
                    disabled={busyId === n.id}
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MentorNotifications;