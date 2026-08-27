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

/* =========================================================
   NOTIFICATION TYPE → ICON + COLOR
   Same notification types used by Admin
   ========================================================= */

const TYPE_META = {
  SUCCESS: {
    icon: CheckCircle,
    color: "#10b981",
    tone: "success",
  },

  WARNING: {
    icon: AlertTriangle,
    color: "#f59e0b",
    tone: "warning",
  },

  ERROR: {
    icon: XCircle,
    color: "#ef4444",
    tone: "error",
  },

  ANNOUNCEMENT: {
    icon: Megaphone,
    color: "#6366f1",
    tone: "announcement",
  },

  NEW_ARRIVAL: {
    icon: Sparkles,
    color: "#10b981",
    tone: "new-arrival",
  },

  PROGRESS: {
    icon: TrendingUp,
    color: "#f59e0b",
    tone: "progress",
  },

  EVENT: {
    icon: CalendarDays,
    color: "#ec4899",
    tone: "event",
  },

  PAYMENT: {
    icon: CheckCircle,
    color: "#10b981",
    tone: "payment",
  },

  GENERAL: {
    icon: Bell,
    color: "#64748b",
    tone: "general",
  },
};


/* =========================================================
   FALLBACK
   ========================================================= */

const metaFor = (type) => {
  const normalizedType = (type || "").toUpperCase();

  return TYPE_META[normalizedType] || TYPE_META.GENERAL;
};


/* =========================================================
   COMPONENT
   ========================================================= */

function MentorNotifications() {
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [filter, setFilter] = useState("all");

  const [busyId, setBusyId] = useState(null);


  /* =======================================================
     FETCH NOTIFICATIONS
     ======================================================= */

  useEffect(() => {
    fetchNotifications();
  }, []);


  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/notifications");

      const data =
        res.data?.data ??
        res.data ??
        [];

      setNotifications(
        Array.isArray(data)
          ? data
          : []
      );
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


  /* =======================================================
     MARK ONE AS READ
     ======================================================= */

  const markAsRead = async (id) => {
    try {
      setBusyId(id);

      await api.put(
        `/notifications/${id}/read`
      );

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? {
                ...n,
                isRead: true,
              }
            : n
        )
      );
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Couldn't mark this as read."
      );
    } finally {
      setBusyId(null);
    }
  };


  /* =======================================================
     MARK ALL AS READ
     ======================================================= */

  const markAllRead = async () => {
    try {
      setBusyId("all");

      await api.put(
        "/notifications/read-all"
      );

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
        }))
      );
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Couldn't mark all as read."
      );
    } finally {
      setBusyId(null);
    }
  };


  /* =======================================================
     DELETE NOTIFICATION
     ======================================================= */

  const removeNotification = async (id) => {
    try {
      setBusyId(id);

      await api.delete(
        `/notifications/${id}`
      );

      setNotifications((prev) =>
        prev.filter(
          (n) => n.id !== id
        )
      );
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Couldn't delete this notification."
      );
    } finally {
      setBusyId(null);
    }
  };


  /* =======================================================
     UNREAD COUNT
     ======================================================= */

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (n) => !n.isRead
      ).length,
    [notifications]
  );


  /* =======================================================
     FILTERED NOTIFICATIONS
     ======================================================= */

  const visible = useMemo(
    () => {
      if (filter === "unread") {
        return notifications.filter(
          (n) => !n.isRead
        );
      }

      return notifications;
    },
    [notifications, filter]
  );


  /* =======================================================
     DATE FORMAT
     ======================================================= */

  const fmt = (date) => {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };


  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <div className="mentor-notifications">

        <div className="loading-state">

          <div className="spinner" />

          <p>
            Loading notifications…
          </p>

        </div>

      </div>
    );
  }


  /* =======================================================
     PAGE
     ======================================================= */

  return (
    <div className="mentor-notifications">

      {/* =================================================
          HEADER
          ================================================= */}

      <div className="page-header">

        <div>

          <h1>
            <Bell size={24} />
            Notifications
          </h1>

          <p className="subtitle">

            {unreadCount > 0
              ? `${unreadCount} unread notification${
                  unreadCount === 1
                    ? ""
                    : "s"
                }`
              : "You're all caught up."}

          </p>

        </div>


        <div className="header-buttons">

          {/* Refresh */}

          <button
            className="refresh-btn"
            onClick={fetchNotifications}
            title="Refresh"
            type="button"
          >
            <RefreshCw size={16} />
          </button>


          {/* Mark all read */}

          {unreadCount > 0 && (

            <button
              className="btn-secondary"
              onClick={markAllRead}
              disabled={busyId === "all"}
              type="button"
            >

              <CheckCheck size={16} />

              {busyId === "all"
                ? "Marking…"
                : "Mark all read"}

            </button>

          )}

        </div>

      </div>


      {/* =================================================
          ERROR
          ================================================= */}

      {error && (
        <div className="error-text">
          {error}
        </div>
      )}


      {/* =================================================
          FILTER TABS
          ================================================= */}

      <div
        className="ntf-filter"
        role="tablist"
      >

        <button
          type="button"
          role="tab"
          aria-selected={
            filter === "all"
          }
          className={
            filter === "all"
              ? "active"
              : ""
          }
          onClick={() =>
            setFilter("all")
          }
        >
          All ({notifications.length})
        </button>


        <button
          type="button"
          role="tab"
          aria-selected={
            filter === "unread"
          }
          className={
            filter === "unread"
              ? "active"
              : ""
          }
          onClick={() =>
            setFilter("unread")
          }
        >
          Unread ({unreadCount})
        </button>

      </div>


      {/* =================================================
          EMPTY STATE
          ================================================= */}

      {visible.length === 0 ? (

        <div className="empty-state">

          <div className="empty-icon">
            <Bell size={38} />
          </div>

          <h3>
            {filter === "unread"
              ? "No unread notifications"
              : "No notifications"}
          </h3>

          <p>
            {filter === "unread"
              ? "Everything here has been read."
              : "Updates about your courses and students will appear here."}
          </p>

        </div>

      ) : (

        /* =================================================
           NOTIFICATION LIST
           ================================================= */

        <div className="ntf-list">

          {visible.map((notification) => {

            /*
             * IMPORTANT:
             * Admin uses notification.type.
             * We do the same here.
             */

            const meta = metaFor(
              notification.type
            );

            const Icon = meta.icon;


            return (

              <div
                key={notification.id}
                className={`notification-card ${
                  notification.isRead
                    ? "read"
                    : "unread"
                }`}
              >

                {/* ======================================
                    COLORED NOTIFICATION ICON
                    ====================================== */}

                <div
                  className={`notification-icon ${meta.tone}`}
                  style={{
                    backgroundColor:
                      meta.color,
                  }}
                  title={
                    notification.type ||
                    "GENERAL"
                  }
                >

                  <Icon
                    size={19}
                    color="#ffffff"
                    strokeWidth={2}
                  />

                </div>


                {/* ======================================
                    NOTIFICATION CONTENT
                    ====================================== */}

                <div className="notification-content">

                  <div className="ntf-card-top">

                    <h3>
                      {notification.title}
                    </h3>


                    {!notification.isRead && (
                      <span
                        className="unread-dot"
                        title="Unread"
                      />
                    )}

                  </div>


                  <p>
                    {notification.message}
                  </p>


                  <div className="notification-meta">

                    <CalendarDays
                      size={13}
                    />

                    <small>
                      {fmt(
                        notification.createdAt
                      )}
                    </small>

                  </div>

                </div>


                {/* ======================================
                    ACTIONS
                    ====================================== */}

                <div className="ntf-card-actions">

                  {/* Mark as read */}

                  {!notification.isRead && (

                    <button
                      type="button"
                      className="read-btn"
                      onClick={() =>
                        markAsRead(
                          notification.id
                        )
                      }
                      disabled={
                        busyId ===
                        notification.id
                      }
                      title="Mark as read"
                    >

                      <CheckCheck
                        size={15}
                      />

                      {busyId ===
                      notification.id
                        ? "..."
                        : "Read"}

                    </button>

                  )}


                  {/* Delete */}

                  <button
                    type="button"
                    className="delete-lesson-btn"
                    onClick={() =>
                      removeNotification(
                        notification.id
                      )
                    }
                    disabled={
                      busyId ===
                      notification.id
                    }
                    title="Delete notification"
                  >

                    <Trash2
                      size={15}
                    />

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