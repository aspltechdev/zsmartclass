import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Award,
  CheckCheck,
  Trash2,
  RefreshCw,
  Megaphone,
  CalendarDays
} from "lucide-react";
import api from "../../services/api";
import "./Notification.css";
import "./MentorShared.css";

function label(value) {
  return String(value || "GENERAL")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function dateText(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function metaFor(type) {
  if (type === "CERTIFICATE") {
    return { Icon: Award, color: "#059669" };
  }
  if (type === "ANNOUNCEMENT") {
    return { Icon: Megaphone, color: "#6366f1" };
  }
  if (type === "PAYMENT" || type === "SUCCESS") {
    return { Icon: CheckCircle, color: "#059669" };
  }
  if (type === "ERROR" || type === "WARNING") {
    return { Icon: AlertTriangle, color: "#dc2626" };
  }
  return { Icon: Bell, color: "#6366f1" };
}

export default function MentorNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(null);

  const operationLock = useRef(false);
  const loadSequence = useRef(0);

  useEffect(() => {
    fetchNotifications();

    return () => {
      loadSequence.current += 1;
    };
  }, []);

  async function fetchNotifications() {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setLoadError("");

    try {
      const response = await api.get("/notifications");
      const data = response.data?.data ?? response.data;

      if (!Array.isArray(data)) throw new Error("Invalid response.");
      if (sequence === loadSequence.current) setNotifications(data);
    } catch (error) {
      if (sequence === loadSequence.current) {
        setLoadError(
          error.response?.data?.message || "Unable to load notifications."
        );
      }
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }

  async function performAction(id, kind) {
    if (operationLock.current) return;

    if (kind === "delete" &&
        !window.confirm("Remove this notification from your inbox?")) {
      return;
    }

    operationLock.current = true;
    setBusy(id);
    setActionError("");

    try {
      if (kind === "delete") {
        await api.delete(`/notifications/${id}`);
        setNotifications((items) => items.filter((item) => item.id !== id));
      } else if (kind === "all") {
        await api.put("/notifications/read-all");
        setNotifications((items) =>
          items.map((item) => ({ ...item, isRead: true }))
        );
      } else {
        await api.put(`/notifications/${id}/read`);
        setNotifications((items) => items.map((item) =>
          item.id === id ? { ...item, isRead: true } : item
        ));
      }
    } catch (error) {
      setActionError(
        error.response?.data?.message || "Action failed. Please try again."
      );
    } finally {
      operationLock.current = false;
      setBusy(null);
    }
  }

  const unread = notifications.filter((item) => !item.isRead).length;
  const query = search.trim().toLowerCase();

  const visible = notifications.filter((item) => {
    const text = [
      item.title,
      item.message,
      item.sender?.name,
      item.sender?.role,
      item.receiver?.name
    ].filter(Boolean).join(" ").toLowerCase();

    return (
      (filter === "all" || !item.isRead) &&
      (!query || text.includes(query))
    );
  });

  return (
    <div className="mentor-notifications">
      <div className="page-header">
        <div>
          <h1><Bell size={24} /> Notifications</h1>
          <p className="subtitle">
            {unread ? `${unread} unread notifications` : "Your notification inbox"}
          </p>
        </div>

        <div className="header-buttons">
          <button
            className="refresh-btn"
            onClick={fetchNotifications}
            disabled={loading || busy !== null}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>

          {unread > 0 && (
            <button
              className="btn-secondary"
              onClick={() => performAction("all", "all")}
              disabled={loading || busy !== null}
            >
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          aria-label="Search notifications"
          placeholder="Search messages or sender..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: 12,
            border: "1px solid #e2e8f0",
            borderRadius: 8
          }}
        />
      </div>

      <div className="ntf-filter" role="tablist">
        <button
          role="tab"
          aria-selected={filter === "all"}
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          All ({notifications.length})
        </button>
        <button
          role="tab"
          aria-selected={filter === "unread"}
          className={filter === "unread" ? "active" : ""}
          onClick={() => setFilter("unread")}
        >
          Unread ({unread})
        </button>
      </div>

      {actionError && (
        <p className="error-text" role="alert">{actionError}</p>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading notifications...</p>
        </div>
      ) : loadError ? (
        <div className="error-text" role="alert">
          <p>{loadError}</p>
          <button className="btn-secondary" onClick={fetchNotifications}>
            Try again
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <Bell size={38} />
          <h3>No notifications to show</h3>
          <p>{query ? "Try another search." : "New messages will appear here."}</p>
        </div>
      ) : (
        <div className="ntf-list">
          {visible.map((notification) => {
            const { Icon, color } = metaFor(notification.type);
            const sender = notification.sender;
            const receiver = notification.receiver;

            return (
              <div
                key={notification.id}
                className={`notification-card ${notification.isRead ? "read" : "unread"}`}
              >
                <div
                  className="notification-icon"
                  style={{ backgroundColor: color }}
                >
                  <Icon size={19} color="#fff" />
                </div>

                <div className="notification-content" style={{ minWidth: 0 }}>
                  <div className="ntf-card-top">
                    <h3>{notification.title}</h3>
                    {!notification.isRead && <span className="unread-dot" title="Unread" />}
                  </div>

                  <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                    {notification.message}
                  </p>

                  <div style={{
                    margin: "12px 0",
                    padding: 12,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 13,
                    lineHeight: 1.8,
                    color: "#334155",
                    overflowWrap: "anywhere"
                  }}>
                    <div>
                      From: <strong>{sender?.name || "Sender not recorded"}</strong>
                      {sender?.role && <> · {label(sender.role)}</>}
                    </div>

                    <div>
                      To: <strong>{receiver?.name || "You"}</strong>
                      {receiver?.role && <> · {label(receiver.role)}</>}
                      {receiver?.email && <div>{receiver.email}</div>}
                    </div>

                    <div>
                      {label(notification.type)} · In-app notification
                    </div>
                    <div>{notification.isRead ? "Read" : "Unread"}</div>
                  </div>

                  <div className="notification-meta">
                    <CalendarDays size={13} />
                    <small>{dateText(notification.createdAt)}</small>
                  </div>
                </div>

                <div className="ntf-card-actions">
                  {!notification.isRead && (
                    <button
                      className="read-btn"
                      onClick={() => performAction(notification.id, "read")}
                      disabled={busy !== null}
                      title="Mark as read"
                    >
                      <CheckCheck size={15} /> Read
                    </button>
                  )}
                  <button
                    className="delete-lesson-btn"
                    onClick={() => performAction(notification.id, "delete")}
                    disabled={busy !== null}
                    title="Remove from inbox"
                    aria-label="Remove from inbox"
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