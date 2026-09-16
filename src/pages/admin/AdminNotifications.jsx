import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  Send,
  Inbox,
  Search,
  RefreshCw,
  Plus,
  X,
  Trash2,
  Users,
  BookOpen,
  UserCheck,
  User,
  Megaphone,
  Sparkles,
  TrendingUp,
  CalendarDays,
  CheckCheck,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./AdminNotifications.css";
import "./AdminShared.css";

const CHANNELS = [
  {
    value: "ANNOUNCEMENT",
    label: "Announcement",
    icon: Megaphone,
    color: "#6366f1"
  },
  {
    value: "NEW_ARRIVAL",
    label: "New Arrival",
    icon: Sparkles,
    color: "#10b981"
  },
  {
    value: "PROGRESS",
    label: "Progress",
    icon: TrendingUp,
    color: "#f59e0b"
  },
  {
    value: "EVENT",
    label: "Event",
    icon: CalendarDays,
    color: "#ec4899"
  },
  {
    value: "GENERAL",
    label: "General",
    icon: Bell,
    color: "#64748b"
  }
];

const RECEIVED_META = {
  SUCCESS: { icon: CheckCircle, color: "#10b981" },
  WARNING: { icon: AlertTriangle, color: "#f59e0b" },
  ERROR: { icon: XCircle, color: "#ef4444" },
  ANNOUNCEMENT: { icon: Megaphone, color: "#6366f1" },
  NEW_ARRIVAL: { icon: Sparkles, color: "#10b981" },
  PROGRESS: { icon: TrendingUp, color: "#f59e0b" },
  EVENT: { icon: CalendarDays, color: "#ec4899" },
  PAYMENT: { icon: CheckCircle, color: "#10b981" },
  CERTIFICATE: { icon: CheckCircle, color: "#10b981" },
  ENROLLMENT: { icon: BookOpen, color: "#6366f1" },
  SYSTEM: { icon: Info, color: "#64748b" },
  GENERAL: { icon: Info, color: "#64748b" }
};

const AUDIENCES = [
  { value: "ALL", label: "All users", icon: Users },
  { value: "COURSE", label: "Course students", icon: BookOpen },
  { value: "ROLE", label: "By role", icon: UserCheck },
  { value: "USER", label: "Single user", icon: User }
];

const EMPTY_FORM = {
  title: "",
  message: "",
  channel: "ANNOUNCEMENT",
  audience: "ALL",
  courseId: "",
  role: "STUDENT",
  userId: ""
};

function prettyLabel(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function channelMeta(value) {
  const found = CHANNELS.find((item) => item.value === value);

  return found || {
    value,
    label: prettyLabel(value) || "General",
    icon: Bell,
    color: "#64748b"
  };
}

function receivedMeta(type) {
  return (
    RECEIVED_META[String(type || "").toUpperCase()] ||
    RECEIVED_META.GENERAL
  );
}

function fmtDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function readArray(response) {
  const data = response.data?.data ?? response.data;

  if (!Array.isArray(data)) {
    throw new Error("Unexpected server response.");
  }

  return data;
}

function personText(person, fallback) {
  if (!person) return fallback;

  return [
    person.name || fallback,
    person.role ? prettyLabel(person.role) : null,
    person.email || null
  ].filter(Boolean).join(" · ");
}

export default function AdminNotifications() {
  const { user: currentUser } = useAuth();
  const currentUserId = Number(currentUser?.id);

  const [view, setView] = useState("sent");
  const [history, setHistory] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [actionError, setActionError] = useState("");

  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [inboxFilter, setInboxFilter] = useState("all");

  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(null);

  const operationLock = useRef(false);
  const loadSequence = useRef(0);

  useEffect(() => {
    refresh();

    return () => {
      loadSequence.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!showCompose) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event) {
      if (event.key === "Escape" && !operationLock.current) {
        setShowCompose(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [showCompose]);

  async function fetchAllUsers() {
    const collected = new Map();
    let page = 1;

    while (true) {
      const response = await api.get("/users", {
        params: {
          page,
          limit: 100,
          sortBy: "createdAt",
          sortOrder: "asc"
        }
      });

      const data = response.data?.data ?? response.data;
      const rows = Array.isArray(data) ? data : data?.users;

      if (!Array.isArray(rows)) {
        throw new Error("Couldn't read the receiver list.");
      }

      rows.forEach((item) => {
        collected.set(Number(item.id), item);
      });

      const pagination =
        response.data?.pagination || data?.pagination;

      if (!pagination) break;

      const hasMore =
        typeof pagination.hasMore === "boolean"
          ? pagination.hasMore
          : page < Number(pagination.totalPages || 1);

      if (!hasMore) break;

      if (!rows.length) {
        throw new Error("Receiver list could not be loaded completely.");
      }

      page += 1;
    }

    return [...collected.values()];
  }

  async function refresh() {
    const sequence = ++loadSequence.current;
    setLoading(true);

    const results = await Promise.allSettled([
      api.get("/notifications/admin").then(readArray),
      api.get("/notifications").then(readArray),
      fetchAllUsers(),
      api.get("/courses").then(readArray)
    ]);

    if (sequence !== loadSequence.current) return;

    const keys = ["history", "inbox", "users", "courses"];
    const setters = [setHistory, setInbox, setUsers, setCourses];
    const nextErrors = {};

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        setters[index](result.value);
      } else {
        nextErrors[keys[index]] =
          result.reason?.response?.data?.message ||
          `Couldn't load ${keys[index]}. Please refresh.`;
      }
    });

    setErrors(nextErrors);
    setLoading(false);
  }

  const selectableUsers = useMemo(() => {
    if (!Number.isSafeInteger(currentUserId) || currentUserId <= 0) {
      return [];
    }

    return users.filter(
      (item) => Number(item.id) !== currentUserId
    );
  }, [users, currentUserId]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return history.filter((item) => {
      const people = (item.receivers || []).flatMap((receiver) => [
        receiver.name,
        receiver.email,
        receiver.role
      ]);

      const searchable = [
        item.title,
        item.message,
        item.audienceLabel,
        item.sender?.name,
        item.sender?.email,
        ...people
      ].filter(Boolean).join(" ").toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (channelFilter === "all" || item.channel === channelFilter)
      );
    });
  }, [history, search, channelFilter]);

  const inboxUnread = inbox.filter((item) => !item.isRead).length;

  const filteredInbox = useMemo(() => {
    const query = search.trim().toLowerCase();

    return inbox.filter((item) => {
      const searchable = [
        item.title,
        item.message,
        item.sender?.name,
        item.sender?.role,
        item.receiver?.name
      ].filter(Boolean).join(" ").toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (inboxFilter === "all" || !item.isRead)
      );
    });
  }, [inbox, search, inboxFilter]);

  const stats = useMemo(() => {
    const totalSent = history.reduce(
      (total, item) => total + (item.recipientCount || 0), 0
    );

    const totalRead = history.reduce(
      (total, item) => total + (item.readCount || 0), 0
    );

    return {
      broadcasts: history.length,
      totalSent,
      readRate: totalSent
        ? Math.round((totalRead / totalSent) * 100)
        : 0
    };
  }, [history]);

  const filterChannels = useMemo(() => {
    const values = new Set([
      ...CHANNELS.map((item) => item.value),
      ...history.map((item) => item.channel)
    ]);

    return [...values].map(channelMeta);
  }, [history]);

  function openCompose() {
    setForm({ ...EMPTY_FORM });
    setFormError("");
    setShowCompose(true);
  }

  function closeCompose() {
    if (!operationLock.current) {
      setShowCompose(false);
    }
  }

  function changeForm(name, value) {
    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  async function submit() {
    if (operationLock.current) return;

    setFormError("");

    if (!form.title.trim()) {
      return setFormError("Please add a title.");
    }

    if (!form.message.trim()) {
      return setFormError("Please write a message.");
    }

    if (form.audience === "COURSE" && !form.courseId) {
      return setFormError("Please choose a course.");
    }

    if (form.audience === "USER") {
      if (!form.userId) {
        return setFormError("Please choose a user.");
      }

      if (Number(form.userId) === currentUserId) {
        return setFormError("You cannot send a notification to yourself.");
      }
    }

    const payload = {
      title: form.title.trim(),
      message: form.message.trim(),
      channel: form.channel,
      audience: form.audience
    };

    if (form.audience === "COURSE") {
      payload.courseId = Number(form.courseId);
    }

    if (form.audience === "ROLE") {
      payload.role = form.role;
    }

    if (form.audience === "USER") {
      payload.userId = Number(form.userId);
    }

    operationLock.current = true;
    setBusy("send");
    setActionError("");

    try {
      const response = await api.post(
        "/notifications/admin/send",
        payload
      );

      setShowCompose(false);
      setForm({ ...EMPTY_FORM });
      await refresh();

      alert(response.data?.message || "Notification sent.");
    } catch (error) {
      setFormError(
        error.response?.data?.message ||
        "Couldn't send the notification. Please try again."
      );
    } finally {
      operationLock.current = false;
      setBusy(null);
    }
  }

  async function runAction(key, request, confirmation) {
    if (operationLock.current) return;

    if (confirmation && !window.confirm(confirmation)) {
      return;
    }

    operationLock.current = true;
    setBusy(key);
    setActionError("");

    try {
      await request();
      await refresh();
    } catch (error) {
      setActionError(
        error.response?.data?.message ||
        "Couldn't complete this action."
      );
    } finally {
      operationLock.current = false;
      setBusy(null);
    }
  }

  const isBusy = busy !== null;
  const sending = busy === "send";

  const receiverListUnavailable =
    form.audience === "USER" &&
    (!!errors.users || !selectableUsers.length);

  const courseListUnavailable =
    form.audience === "COURSE" && !!errors.courses;

  return (
    <div className="ntf-page">
      <div className="ntf-header">
        <div className="ntf-heading">
          <div className="ntf-heading-icon">
            <Bell size={26} />
          </div>
          <div>
            <h1 className="ntf-title">Notifications</h1>
            <p className="ntf-subtitle">
              Send announcements and updates to your users, and review
              the ones you've received.
            </p>
          </div>
        </div>

        <div className="ntf-actions">
          <button
            className="ntf-btn ntf-btn-ghost"
            onClick={refresh}
            title="Refresh"
            disabled={loading || isBusy}
          >
            <RefreshCw size={18} />
          </button>

          <button
            className="ntf-btn ntf-btn-primary"
            onClick={openCompose}
            disabled={loading || isBusy}
          >
            <Plus size={18} /> New notification
          </button>
        </div>
      </div>

      {actionError && (
        <div className="ntf-alert" role="alert">
          {actionError}
        </div>
      )}

      <div className="ntf-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={view === "sent"}
          className={`ntf-tab ${view === "sent" ? "active" : ""}`}
          onClick={() => setView("sent")}
        >
          <Send size={16} /> Sent
          <span className="ntf-tab-count">{history.length}</span>
        </button>

        <button
          role="tab"
          aria-selected={view === "received"}
          className={`ntf-tab ${view === "received" ? "active" : ""}`}
          onClick={() => setView("received")}
        >
          <Inbox size={16} /> Received
          {inboxUnread > 0 && (
            <span className="ntf-tab-count unread">{inboxUnread}</span>
          )}
        </button>
      </div>

      {view === "sent" && (
        <>
          <div className="ntf-stats">
            <div className="ntf-stat">
              <div className="ntf-stat-icon indigo">
                <Send size={20} />
              </div>
              <div>
                <div className="ntf-stat-value">{stats.broadcasts}</div>
                <div className="ntf-stat-label">Notifications Sent</div>
              </div>
            </div>

            <div className="ntf-stat">
              <div className="ntf-stat-icon green">
                <Users size={20} />
              </div>
              <div>
                <div className="ntf-stat-value">{stats.totalSent}</div>
                <div className="ntf-stat-label">Total Deliveries</div>
              </div>
            </div>

            <div className="ntf-stat">
              <div className="ntf-stat-icon amber">
                <CheckCheck size={20} />
              </div>
              <div>
                <div className="ntf-stat-value">{stats.readRate}%</div>
                <div className="ntf-stat-label">Read Rate</div>
              </div>
            </div>
          </div>

          <div className="ntf-toolbar">
            <div className="ntf-search">
              <Search size={18} />
              <input
                placeholder="Search sent notifications…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              className="ntf-select"
              value={channelFilter}
              onChange={(event) => setChannelFilter(event.target.value)}
            >
              <option value="all">All channels</option>
              {filterChannels.map((channel) => (
                <option key={channel.value} value={channel.value}>
                  {channel.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="ntf-empty">Loading…</div>
          ) : errors.history ? (
            <div className="ntf-alert" role="alert">{errors.history}</div>
          ) : filtered.length === 0 ? (
            <div className="ntf-empty">
              {search || channelFilter !== "all"
                ? "No notifications match your filters."
                : "No notifications yet. Click “New notification” to send one."}
            </div>
          ) : (
            <div className="ntf-list">
              {filtered.map((item) => {
                const meta = channelMeta(item.channel);
                const Icon = meta.icon;

                return (
                  <div className="ntf-card" key={item.key}>
                    <div
                      className="ntf-card-icon"
                      style={{ background: meta.color }}
                    >
                      <Icon size={18} color="#fff" />
                    </div>

                    <div className="ntf-card-body">
                      <div className="ntf-card-top">
                        <span className="ntf-card-title">{item.title}</span>
                        <span
                          className="ntf-badge"
                          style={{
                            color: meta.color,
                            borderColor: meta.color
                          }}
                        >
                          {meta.label}
                        </span>
                      </div>

                      <p
                        className="ntf-card-message"
                        style={{
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere"
                        }}
                      >
                        {item.message}
                      </p>

                      <div className="ntf-card-meta">
                        <span>
                          <User size={13} />
                          From: {personText(item.sender, "Sender not recorded")}
                        </span>
                      </div>

                      <div className="ntf-card-meta">
                        <span>
                          <Users size={13} />
                          To: {item.audienceLabel || "Audience not recorded"}
                        </span>
                      </div>

                      {(item.receivers || []).length > 0 && (
                        <details style={{ margin: "8px 0" }}>
                          <summary
                            className="ntf-card-meta"
                            style={{ cursor: "pointer" }}
                          >
                            View receiver details ({item.recipientCount})
                          </summary>

                          <div style={{ maxHeight: 220, overflowY: "auto" }}>
                            {item.receivers.map((receiver) => (
                              <div
                                key={receiver.notificationId}
                                className="ntf-card-meta"
                                style={{ padding: "6px 0" }}
                              >
                                <span>
                                  {personText(receiver, "Receiver unavailable")}
                                </span>
                                <span>
                                  {receiver.isRead ? "Read" : "Unread"}
                                  {receiver.hiddenAt && " · Removed from inbox"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}

                      <div className="ntf-card-meta">
                        <span>
                          <Users size={13} />
                          {item.recipientCount} recipient
                          {item.recipientCount === 1 ? "" : "s"}
                        </span>
                        <span>
                          <CheckCheck size={13} /> {item.readCount} read
                        </span>
                        <span>
                          <CalendarDays size={13} />
                          {fmtDateTime(item.sentAt)}
                        </span>
                      </div>
                    </div>

                    <button
                      className="ntf-icon-btn danger"
                      title="Delete for all recipients"
                      disabled={isBusy}
                      onClick={() => runAction(
                        item.key,
                        () => api.delete("/notifications/admin/batch", {
                          data: { ids: item.ids }
                        }),
                        `Delete this notification for all ${item.recipientCount} recipient(s)?`
                      )}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {view === "received" && (
        <>
          <div className="ntf-toolbar">
            <div className="ntf-search">
              <Search size={18} />
              <input
                placeholder="Search your inbox…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="ntf-segment">
              <button
                className={inboxFilter === "all" ? "active" : ""}
                onClick={() => setInboxFilter("all")}
              >
                All ({inbox.length})
              </button>
              <button
                className={inboxFilter === "unread" ? "active" : ""}
                onClick={() => setInboxFilter("unread")}
              >
                Unread ({inboxUnread})
              </button>
            </div>

            {inboxUnread > 0 && (
              <button
                className="ntf-btn ntf-btn-ghost"
                disabled={isBusy || loading}
                onClick={() => runAction(
                  "read-all",
                  () => api.put("/notifications/read-all")
                )}
              >
                <CheckCheck size={16} />
                {busy === "read-all" ? "Marking…" : "Mark all read"}
              </button>
            )}
          </div>

          {loading ? (
            <div className="ntf-empty">Loading…</div>
          ) : errors.inbox ? (
            <div className="ntf-alert" role="alert">{errors.inbox}</div>
          ) : filteredInbox.length === 0 ? (
            <div className="ntf-empty">
              {search
                ? "No notifications match your search."
                : inboxFilter === "unread"
                  ? "You're all caught up — no unread notifications."
                  : "Your inbox is empty. Updates sent to you will show up here."}
            </div>
          ) : (
            <div className="ntf-list">
              {filteredInbox.map((notification) => {
                const meta = receivedMeta(notification.type);
                const Icon = meta.icon;

                return (
                  <div
                    className={`ntf-card ${notification.isRead ? "" : "unread"}`}
                    key={notification.id}
                  >
                    <div
                      className="ntf-card-icon"
                      style={{ background: meta.color }}
                    >
                      <Icon size={18} color="#fff" />
                    </div>

                    <div className="ntf-card-body">
                      <div className="ntf-card-top">
                        <span className="ntf-card-title">
                          {notification.title}
                        </span>
                        {!notification.isRead && (
                          <span className="ntf-unread-dot" title="Unread" />
                        )}
                      </div>

                      <p
                        className="ntf-card-message"
                        style={{
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere"
                        }}
                      >
                        {notification.message}
                      </p>

                      <div className="ntf-card-meta">
                        <span>
                          <User size={13} />
                          From: {personText(
                            notification.sender,
                            "Sender not recorded"
                          )}
                        </span>
                      </div>

                      <div className="ntf-card-meta">
                        <span>
                          <Users size={13} />
                          To: {personText(notification.receiver, "You")}
                        </span>
                      </div>

                      <div className="ntf-card-meta">
                        <span>
                          <CalendarDays size={13} />
                          {fmtDateTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="ntf-card-actions">
                      {!notification.isRead && (
                        <button
                          className="ntf-btn ntf-btn-ghost ntf-read-btn"
                          disabled={isBusy}
                          title="Mark as read"
                          onClick={() => runAction(
                            notification.id,
                            () => api.put(
                              `/notifications/${notification.id}/read`
                            )
                          )}
                        >
                          <CheckCheck size={15} /> Read
                        </button>
                      )}

                      <button
                        className="ntf-icon-btn danger"
                        title="Delete from inbox"
                        disabled={isBusy}
                        onClick={() => runAction(
                          notification.id,
                          () => api.delete(
                            `/notifications/${notification.id}`
                          ),
                          "Delete this notification from your inbox?"
                        )}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {showCompose && createPortal(
        <div className="ntf-modal-overlay" onClick={closeCompose}>
          <div
            className="ntf-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-compose-heading"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ntf-modal-header">
              <h3 id="notification-compose-heading">New Notification</h3>
              <button
                className="ntf-icon-btn"
                onClick={closeCompose}
                disabled={isBusy}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="ntf-modal-body">
              {formError && (
                <div className="ntf-form-error" role="alert">{formError}</div>
              )}

              <div className="ntf-field">
                <label className="ntf-label">Channel</label>
                <div className="ntf-channel-grid">
                  {CHANNELS.map((channel) => {
                    const Icon = channel.icon;
                    const active = form.channel === channel.value;

                    return (
                      <button
                        key={channel.value}
                        type="button"
                        disabled={isBusy}
                        className={`ntf-channel-chip ${active ? "active" : ""}`}
                        style={active ? {
                          borderColor: channel.color,
                          color: channel.color,
                          background: `${channel.color}14`
                        } : {}}
                        onClick={() => changeForm("channel", channel.value)}
                      >
                        <Icon size={15} /> {channel.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="ntf-field">
                <label className="ntf-label">Send to</label>
                <div className="ntf-audience-grid">
                  {AUDIENCES.map((audience) => {
                    const Icon = audience.icon;
                    const active = form.audience === audience.value;

                    return (
                      <button
                        key={audience.value}
                        type="button"
                        disabled={isBusy}
                        className={`ntf-audience-chip ${active ? "active" : ""}`}
                        onClick={() => changeForm("audience", audience.value)}
                      >
                        <Icon size={16} /> {audience.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.audience === "COURSE" && (
                <div className="ntf-field">
                  <label className="ntf-label" htmlFor="ntf-course">Course</label>
                  <select
                    id="ntf-course"
                    className="ntf-input"
                    value={form.courseId}
                    disabled={isBusy || !!errors.courses}
                    onChange={(event) => changeForm("courseId", event.target.value)}
                  >
                    <option value="">Select a course…</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                  {errors.courses && (
                    <div className="ntf-form-error">{errors.courses}</div>
                  )}
                </div>
              )}

              {form.audience === "ROLE" && (
                <div className="ntf-field">
                  <label className="ntf-label" htmlFor="ntf-role">Role</label>
                  <select
                    id="ntf-role"
                    className="ntf-input"
                    value={form.role}
                    disabled={isBusy}
                    onChange={(event) => changeForm("role", event.target.value)}
                  >
                    <option value="STUDENT">Students</option>
                    <option value="MENTOR">Mentors</option>
                    <option value="ADMIN">Admins</option>
                  </select>
                </div>
              )}

              {form.audience === "USER" && (
                <div className="ntf-field">
                  <label className="ntf-label" htmlFor="ntf-user">User</label>
                  <select
                    id="ntf-user"
                    className="ntf-input"
                    value={form.userId}
                    disabled={isBusy || !!errors.users}
                    onChange={(event) => changeForm("userId", event.target.value)}
                  >
                    <option value="">Select a user…</option>
                    {selectableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>

                  {errors.users ? (
                    <div className="ntf-form-error">{errors.users}</div>
                  ) : !selectableUsers.length ? (
                    <div className="ntf-form-error">
                      No other users are available.
                    </div>
                  ) : null}
                </div>
              )}

              <div className="ntf-field">
                <label className="ntf-label" htmlFor="ntf-title">Title</label>
                <input
                  id="ntf-title"
                  className="ntf-input"
                  placeholder="e.g. New course launched!"
                  value={form.title}
                  maxLength={200}
                  disabled={isBusy}
                  onChange={(event) => changeForm("title", event.target.value)}
                />
              </div>

              <div className="ntf-field">
                <label className="ntf-label" htmlFor="ntf-message">Message</label>
                <textarea
                  id="ntf-message"
                  className="ntf-input ntf-textarea"
                  rows={4}
                  placeholder="Write your message…"
                  value={form.message}
                  maxLength={5000}
                  disabled={isBusy}
                  onChange={(event) => changeForm("message", event.target.value)}
                />
              </div>
            </div>

            <div className="ntf-modal-footer">
              <button
                className="ntf-btn ntf-btn-ghost"
                onClick={closeCompose}
                disabled={isBusy}
              >
                Cancel
              </button>

              <button
                className="ntf-btn ntf-btn-primary"
                onClick={submit}
                disabled={
                  isBusy ||
                  receiverListUnavailable ||
                  courseListUnavailable
                }
              >
                {sending ? "Sending…" : <><Send size={16} /> Send</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}