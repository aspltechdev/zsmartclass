import React, { useState, useEffect } from "react";

import {
  Bell,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Award,
  Clock,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Trash2,
  CheckCheck,
  FileText,
  Info
} from "lucide-react";

import api from "../../services/api";

import "./Notifications.css";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // ==========================================
  // FETCH NOTIFICATIONS
  // ==========================================

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/notifications");

      if (response.data?.success) {
        setNotifications(response.data.data || []);
      } else {
        setError(
          response.data?.message ||
            "Failed to load notifications"
        );
      }
    } catch (err) {
      console.error(
        "Notification fetch error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load notifications"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // MARK ONE AS READ
  // ==========================================

  const handleMarkAsRead = async (id) => {
    try {
      const response = await api.put(
        `/notifications/${id}/read`
      );

      if (response.data?.success) {
        setNotifications((previous) =>
          previous.map((notification) =>
            notification.id === id
              ? {
                  ...notification,
                  isRead: true
                }
              : notification
          )
        );
      }
    } catch (err) {
      console.error(
        "Failed to mark as read:",
        err
      );
    }
  };

  // ==========================================
  // MARK ALL AS READ
  // ==========================================

  const handleMarkAllAsRead = async () => {
    try {
      const response = await api.put(
        "/notifications/read-all"
      );

      if (response.data?.success) {
        setNotifications((previous) =>
          previous.map((notification) => ({
            ...notification,
            isRead: true
          }))
        );
      }
    } catch (err) {
      console.error(
        "Failed to mark all as read:",
        err
      );
    }
  };

  // ==========================================
  // DELETE NOTIFICATION
  // ==========================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Delete this notification?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await api.delete(
        `/notifications/${id}`
      );

      if (response.data?.success) {
        setNotifications((previous) =>
          previous.filter(
            (notification) =>
              notification.id !== id
          )
        );

        if (expandedId === id) {
          setExpandedId(null);
        }
      }
    } catch (err) {
      console.error(
        "Failed to delete notification:",
        err
      );
    }
  };

  // ==========================================
  // EXPAND / COLLAPSE
  // ==========================================

  const toggleExpand = (id) => {
    setExpandedId((previous) =>
      previous === id ? null : id
    );
  };

  // ==========================================
  // TYPE ICON
  // ==========================================

  const getTypeIcon = (type) => {
    const notificationType =
      String(type || "").toUpperCase();

    if (
      notificationType.includes("COURSE") ||
      notificationType.includes("LESSON")
    ) {
      return <BookOpen size={18} />;
    }

    if (
      notificationType.includes("ASSIGNMENT")
    ) {
      return <FileText size={18} />;
    }

    if (
      notificationType.includes("CERTIFICATE")
    ) {
      return <Award size={18} />;
    }

    if (
      notificationType.includes("REMINDER")
    ) {
      return <Clock size={18} />;
    }

    if (
      notificationType.includes("ANNOUNCEMENT")
    ) {
      return <MessageCircle size={18} />;
    }

    if (
      notificationType.includes("ALERT")
    ) {
      return <AlertCircle size={18} />;
    }

    if (
      notificationType.includes("INFO")
    ) {
      return <Info size={18} />;
    }

    return <Bell size={18} />;
  };

  // ==========================================
  // TYPE COLOR
  // ==========================================

  const getTypeColor = (type) => {
    const notificationType =
      String(type || "").toUpperCase();

    if (
      notificationType.includes("COURSE") ||
      notificationType.includes("LESSON")
    ) {
      return "#1976d2";
    }

    if (
      notificationType.includes("CERTIFICATE")
    ) {
      return "#0a9d5a";
    }

    if (
      notificationType.includes("ASSIGNMENT")
    ) {
      return "#e37400";
    }

    if (
      notificationType.includes("REMINDER")
    ) {
      return "#e37400";
    }

    if (
      notificationType.includes("ANNOUNCEMENT")
    ) {
      return "#7c3aed";
    }

    if (
      notificationType.includes("ALERT")
    ) {
      return "#dc3545";
    }

    if (
      notificationType.includes("PAYMENT")
    ) {
      return "#7c3aed";
    }

    return "#6b6b8a";
  };

  // ==========================================
  // TYPE LABEL
  // ==========================================

  const getTypeLabel = (type) => {
    if (!type) {
      return "Notification";
    }

    const notificationType =
      String(type).toUpperCase();

    if (
      notificationType.includes("COURSE")
    ) {
      return "Course Update";
    }

    if (
      notificationType.includes("LESSON")
    ) {
      return "Lesson Update";
    }

    if (
      notificationType.includes("ASSIGNMENT")
    ) {
      return "Assignment";
    }

    if (
      notificationType.includes("CERTIFICATE")
    ) {
      return "Certificate";
    }

    if (
      notificationType.includes("REMINDER")
    ) {
      return "Reminder";
    }

    if (
      notificationType.includes("ANNOUNCEMENT")
    ) {
      return "Announcement";
    }

    if (
      notificationType.includes("ALERT")
    ) {
      return "Alert";
    }

    if (
      notificationType.includes("PAYMENT")
    ) {
      return "Payment";
    }

    if (
      notificationType.includes("INFO")
    ) {
      return "Information";
    }

    return String(type)
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (dateString) => {
    if (!dateString) {
      return "";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const now = new Date();

    const diff = now - date;

    if (diff < 60000) {
      return "Just now";
    }

    if (diff < 3600000) {
      return `${Math.floor(
        diff / 60000
      )}m ago`;
    }

    if (diff < 86400000) {
      return `${Math.floor(
        diff / 3600000
      )}h ago`;
    }

    if (diff < 604800000) {
      return `${Math.floor(
        diff / 86400000
      )}d ago`;
    }

    return date.toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric"
      }
    );
  };

  // ==========================================
  // UNREAD COUNT
  // ==========================================

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.isRead
    ).length;

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="notifications-loading">
        <div className="loading-spinner"></div>

        <p>
          Loading notifications...
        </p>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="notifications-error">
        <AlertCircle
          size={48}
          className="error-icon"
        />

        <h3>
          Unable to load notifications
        </h3>

        <p>
          {error}
        </p>

        <button
          onClick={fetchNotifications}
          className="retry-btn"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="notifications-container">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="notifications-header">

        <div className="notifications-heading">
          <div className="notifications-heading-icon">
            <Bell size={26} />
          </div>

          <div>
            <h1 className="notifications-title">
              Notifications
            </h1>

            <p className="notifications-subtitle">
              Stay updated with your learning progress
            </p>
          </div>
        </div>

        <div className="notifications-actions">

          {unreadCount > 0 && (
            <span className="unread-badge">
              {unreadCount} unread
            </span>
          )}

          {notifications.length > 0 &&
            unreadCount > 0 && (
              <button
                className="mark-all-btn"
                onClick={handleMarkAllAsRead}
              >
                <CheckCheck size={18} />

                Mark All Read
              </button>
            )}

        </div>

      </div>

      {/* ======================================
          EMPTY
      ====================================== */}

      {notifications.length === 0 ? (

        <div className="notifications-empty">

          <div className="empty-icon">
            <Bell size={30} />
          </div>

          <h2>
            No Notifications
          </h2>

          <p>
            You're all caught up!
            Check back later for updates.
          </p>

        </div>

      ) : (

        /* ====================================
           LIST
        ==================================== */

        <div className="notifications-list">

          {notifications.map(
            (notification) => {

              const typeColor =
                getTypeColor(
                  notification.type
                );

              const isExpanded =
                expandedId ===
                notification.id;

              return (
                <div
                  key={notification.id}
                  className={`notification-item ${
                    !notification.isRead
                      ? "unread"
                      : ""
                  }`}
                >

                  {/* ICON */}

                  <div
                    className="notification-icon"
                    style={{
                      backgroundColor:
                        `${typeColor}20`,
                      color: typeColor
                    }}
                  >
                    {getTypeIcon(
                      notification.type
                    )}
                  </div>

                  {/* CONTENT */}

                  <div
                    className="notification-content"
                    onClick={() =>
                      toggleExpand(
                        notification.id
                      )
                    }
                  >

                    <div className="notification-header">

                      <div className="notification-top">

                        <span className="notification-type">
                          {getTypeLabel(
                            notification.type
                          )}
                        </span>

                        {!notification.isRead && (
                          <span className="unread-dot"></span>
                        )}

                      </div>

                      <span className="notification-time">
                        {formatDate(
                          notification.createdAt
                        )}
                      </span>

                    </div>

                    <h4 className="notification-title">
                      {notification.title}
                    </h4>

                    <p
                      className={`notification-message ${
                        isExpanded
                          ? "expanded"
                          : "collapsed"
                      }`}
                    >
                      {notification.message}
                    </p>

                    {/* SHOW MORE */}

                    <button
                      className="expand-btn"
                      onClick={(event) => {
                        event.stopPropagation();

                        toggleExpand(
                          notification.id
                        );
                      }}
                    >

                      {isExpanded ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}

                      {isExpanded
                        ? "Show Less"
                        : "Show More"}

                    </button>

                  </div>

                  {/* ACTIONS */}

                  <div className="notification-actions">

                    {!notification.isRead && (
                      <button
                        className="action-btn read-btn"
                        onClick={() =>
                          handleMarkAsRead(
                            notification.id
                          )
                        }
                        aria-label="Mark as read"
                        data-tip="Mark as read"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}

                    <button
                      className="action-btn delete-btn"
                      onClick={() =>
                        handleDelete(
                          notification.id
                        )
                      }
                      aria-label="Delete"
                      data-tip="Delete"
                    >
                      <Trash2 size={18} />
                    </button>

                  </div>

                </div>
              );
            }
          )}

        </div>
      )}

    </div>
  );
};

export default Notifications;