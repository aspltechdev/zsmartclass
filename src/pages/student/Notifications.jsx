import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Trash2,
  CheckCheck,
  RefreshCw
} from "lucide-react";
import api from "../../services/api";
import "./Notifications.css";

function typeLabel(value) {
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

function getMeta(type) {
  if (type === "CERTIFICATE") return { Icon: Award, color: "#059669" };
  if (type === "ANNOUNCEMENT") return { Icon: MessageCircle, color: "#7c3aed" };
  if (type === "PAYMENT") return { Icon: CheckCircle, color: "#059669" };
  if (type === "ERROR" || type === "WARNING") {
    return { Icon: AlertCircle, color: "#dc2626" };
  }
  if (type === "ENROLLMENT" || type === "NEW_ARRIVAL") {
    return { Icon: BookOpen, color: "#2563eb" };
  }
  return { Icon: Bell, color: "#6366f1" };
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [busy, setBusy] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

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
        if (expandedId === id) setExpandedId(null);
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
    <div className="notifications-container">
      <div className="notifications-header">
        <div className="notifications-heading">
          <div className="notifications-heading-icon"><Bell size={26} /></div>
          <div>
            <h1 className="notifications-title">Notifications</h1>
            <p className="notifications-subtitle">
              Messages and updates sent to you.
            </p>
          </div>
        </div>

        <div className="notifications-actions">
          <button
            className="mark-all-btn"
            onClick={fetchNotifications}
            disabled={loading || busy !== null}
            title="Refresh"
          >
            <RefreshCw size={17} />
          </button>

          {unread > 0 && (
            <button
              className="mark-all-btn"
              onClick={() => performAction("all", "all")}
              disabled={loading || busy !== null}
            >
              <CheckCheck size={18} /> Mark all read ({unread})
            </button>
          )}
        </div>
      </div>

      <div style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        marginBottom: 20
      }}>
        <input
          aria-label="Search notifications"
          placeholder="Search messages or sender..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{
            flex: "1 1 220px",
            padding: 12,
            border: "1px solid #e2e8f0",
            borderRadius: 8
          }}
        />
        <select
          aria-label="Filter notifications"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          style={{
            padding: 12,
            border: "1px solid #e2e8f0",
            borderRadius: 8
          }}
        >
          <option value="all">All notifications</option>
          <option value="unread">Unread only</option>
        </select>
      </div>

      {actionError && (
        <p role="alert" style={{ color: "#b91c1c" }}>{actionError}</p>
      )}

      {loading ? (
        <div className="notifications-loading">
          <div className="loading-spinner" />
          <p>Loading notifications...</p>
        </div>
      ) : loadError ? (
        <div className="notifications-error" role="alert">
          <AlertCircle size={36} />
          <p>{loadError}</p>
          <button className="retry-btn" onClick={fetchNotifications}>Try again</button>
        </div>
      ) : visible.length === 0 ? (
        <div className="notifications-empty">
          <Bell size={30} />
          <h2>No notifications to show</h2>
          <p>{query ? "Try another search." : "New messages will appear here."}</p>
        </div>
      ) : (
        <div className="notifications-list">
          {visible.map((notification) => {
            const { Icon, color } = getMeta(notification.type);
            const expanded = expandedId === notification.id;
            const sender = notification.sender;
            const receiver = notification.receiver;

            return (
              <div
                key={notification.id}
                className={`notification-item ${notification.isRead ? "" : "unread"}`}
              >
                <div
                  className="notification-icon"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  <Icon size={18} />
                </div>

                <div className="notification-content" style={{ minWidth: 0 }}>
                  <div className="notification-header">
                    <div className="notification-top">
                      <span className="notification-type">
                        {typeLabel(notification.type)}
                      </span>
                      {!notification.isRead && (
                        <span className="unread-dot" title="Unread" />
                      )}
                    </div>
                    <span className="notification-time">
                      {dateText(notification.createdAt)}
                    </span>
                  </div>

                  <h4 className="notification-title">{notification.title}</h4>

                  <p
                    className={`notification-message ${expanded ? "expanded" : "collapsed"}`}
                    style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
                  >
                    {notification.message}
                  </p>

                  <button
                    className="expand-btn"
                    onClick={() => setExpandedId(expanded ? null : notification.id)}
                  >
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {expanded ? "Show less" : "Show more"}
                  </button>

                  <div style={{
                    marginTop: 10,
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
                      {sender?.role && <> · {typeLabel(sender.role)}</>}
                    </div>
                    <div>
                      To: <strong>{receiver?.name || "You"}</strong>
                      {receiver?.role && <> · {typeLabel(receiver.role)}</>}
                      {receiver?.email && <div>{receiver.email}</div>}
                    </div>
                    <div>
                      In-app notification · {notification.isRead ? "Read" : "Unread"}
                    </div>
                  </div>
                </div>

                <div className="notification-actions">
                  {!notification.isRead && (
                    <button
                      className="action-btn read-btn"
                      onClick={() => performAction(notification.id, "read")}
                      disabled={busy !== null}
                      aria-label="Mark as read"
                      title="Mark as read"
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  <button
                    className="action-btn delete-btn"
                    onClick={() => performAction(notification.id, "delete")}
                    disabled={busy !== null}
                    aria-label="Remove from inbox"
                    title="Remove from inbox"
                  >
                    <Trash2 size={18} />
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