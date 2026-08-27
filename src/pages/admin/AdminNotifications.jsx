// src/pages/admin/AdminNotifications.jsx
import { useEffect, useMemo, useState } from "react";
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
  Info,
} from "lucide-react";
import api from "../../services/api";
import "./AdminNotifications.css";
import "./AdminShared.css";

// Channels (stored in the notification `type` field)
const CHANNELS = [
  { value: "ANNOUNCEMENT", label: "Announcement", icon: Megaphone, color: "#6366f1" },
  { value: "NEW_ARRIVAL", label: "New Arrival", icon: Sparkles, color: "#10b981" },
  { value: "PROGRESS", label: "Progress", icon: TrendingUp, color: "#f59e0b" },
  { value: "EVENT", label: "Event", icon: CalendarDays, color: "#ec4899" },
  { value: "GENERAL", label: "General", icon: Bell, color: "#64748b" },
];

const channelMeta = (value) =>
  CHANNELS.find((c) => c.value === value) || CHANNELS[CHANNELS.length - 1];

// Icon + accent for a received notification, keyed off its `type`.
const RECEIVED_META = {
  SUCCESS: { icon: CheckCircle, color: "#10b981" },
  WARNING: { icon: AlertTriangle, color: "#f59e0b" },
  ERROR: { icon: XCircle, color: "#ef4444" },
  ANNOUNCEMENT: { icon: Megaphone, color: "#6366f1" },
  NEW_ARRIVAL: { icon: Sparkles, color: "#10b981" },
  PROGRESS: { icon: TrendingUp, color: "#f59e0b" },
  EVENT: { icon: CalendarDays, color: "#ec4899" },
  PAYMENT: { icon: CheckCircle, color: "#10b981" },
  GENERAL: { icon: Info, color: "#64748b" },
};

const receivedMeta = (type) =>
  RECEIVED_META[(type || "").toUpperCase()] || RECEIVED_META.GENERAL;

const AUDIENCES = [
  { value: "ALL", label: "All users", icon: Users },
  { value: "COURSE", label: "Course students", icon: BookOpen },
  { value: "ROLE", label: "By role", icon: UserCheck },
  { value: "USER", label: "Single user", icon: User },
];

const emptyForm = {
  title: "",
  message: "",
  channel: "ANNOUNCEMENT",
  audience: "ALL",
  courseId: "",
  role: "STUDENT",
  userId: "",
};

function AdminNotifications() {
  // Which side of the mailbox we're looking at.
  const [view, setView] = useState("sent"); // "sent" | "received"

  // Sent (broadcast history)
  const [history, setHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  // Received (this admin's own inbox)
  const [inbox, setInbox] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [inboxFilter, setInboxFilter] = useState("all"); // "all" | "unread"
  const [busyId, setBusyId] = useState(null);

  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");

  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);

  const [deletingKey, setDeletingKey] = useState(null);

  useEffect(() => {
    fetchAll();
    fetchInbox();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setApiError("");

      const [usersRes, coursesRes] = await Promise.all([
        api.get("/users").catch(() => ({ data: { data: [] } })),
        api.get("/courses").catch(() => ({ data: { data: [] } })),
      ]);
      setUsers(usersRes.data?.data || usersRes.data || []);
      setCourses(coursesRes.data?.data || coursesRes.data || []);

      try {
        const res = await api.get("/notifications/admin");
        setHistory(res.data?.data || res.data || []);
      } catch {
        setApiError("Couldn't load your sent notifications. Please check the server and try again.");
        setHistory([]);
      }
    } catch {
      setApiError("Something went wrong while loading this page. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const fetchInbox = async () => {
    try {
      setInboxLoading(true);
      const res = await api.get("/notifications");
      const data = res.data?.data ?? res.data ?? [];
      setInbox(Array.isArray(data) ? data : []);
    } catch {
      setInbox([]);
    } finally {
      setInboxLoading(false);
    }
  };

  const refresh = () => {
    fetchAll();
    fetchInbox();
  };

  // ---- Received actions ----
  const markAsRead = async (id) => {
    try {
      setBusyId(id);
      await api.put(`/notifications/${id}/read`);
      setInbox((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
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
      setInbox((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't mark all as read.");
    } finally {
      setBusyId(null);
    }
  };

  const removeInboxItem = async (id) => {
    if (!window.confirm("Delete this notification from your inbox?")) return;
    try {
      setBusyId(id);
      await api.delete(`/notifications/${id}`);
      setInbox((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't delete this notification.");
    } finally {
      setBusyId(null);
    }
  };

  // ---- Derived data ----
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return history.filter((h) => {
      const matchesSearch =
        !q ||
        h.title?.toLowerCase().includes(q) ||
        h.message?.toLowerCase().includes(q);
      const matchesChannel =
        channelFilter === "all" || h.channel === channelFilter;
      return matchesSearch && matchesChannel;
    });
  }, [history, search, channelFilter]);

  const inboxUnread = useMemo(
    () => inbox.filter((n) => !n.isRead).length,
    [inbox]
  );

  const filteredInbox = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inbox.filter((n) => {
      const matchesSearch =
        !q ||
        n.title?.toLowerCase().includes(q) ||
        n.message?.toLowerCase().includes(q);
      const matchesFilter = inboxFilter === "all" || !n.isRead;
      return matchesSearch && matchesFilter;
    });
  }, [inbox, search, inboxFilter]);

  const stats = useMemo(() => {
    const totalSent = history.reduce((s, h) => s + (h.recipientCount || 0), 0);
    const totalRead = history.reduce((s, h) => s + (h.readCount || 0), 0);
    return {
      broadcasts: history.length,
      totalSent,
      readRate: totalSent ? Math.round((totalRead / totalSent) * 100) : 0,
    };
  }, [history]);

  const fmtDateTime = (d) =>
    d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

  // ---- Compose ----
  const openCompose = () => {
    setForm(emptyForm);
    setFormError("");
    setShowCompose(true);
  };

  const submit = async () => {
    setFormError("");
    if (!form.title.trim()) return setFormError("Please add a title.");
    if (!form.message.trim()) return setFormError("Please write a message.");
    if (form.audience === "COURSE" && !form.courseId)
      return setFormError("Please choose a course.");
    if (form.audience === "USER" && !form.userId)
      return setFormError("Please choose a user.");

    const payload = {
      title: form.title.trim(),
      message: form.message.trim(),
      channel: form.channel,
      audience: form.audience,
    };
    if (form.audience === "COURSE") payload.courseId = parseInt(form.courseId);
    if (form.audience === "ROLE") payload.role = form.role;
    if (form.audience === "USER") payload.userId = parseInt(form.userId);

    try {
      setSending(true);
      const res = await api.post("/notifications/admin/send", payload);
      setShowCompose(false);
      setForm(emptyForm);
      await fetchAll();
      alert(res.data?.message || "Notification sent.");
    } catch (err) {
      setFormError(err.response?.data?.message || "Couldn't send the notification. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const deleteBroadcast = async (item) => {
    if (!window.confirm(`Delete this notification for all ${item.recipientCount} recipient(s)?`)) return;
    try {
      setDeletingKey(item.key);
      await api.delete("/notifications/admin/batch", { data: { ids: item.ids } });
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't delete the notification.");
    } finally {
      setDeletingKey(null);
    }
  };

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
              Send announcements and updates to your users, and review the ones you've received.
            </p>
          </div>
        </div>
        <div className="ntf-actions">
          <button className="ntf-btn ntf-btn-ghost" onClick={refresh} title="Refresh">
            <RefreshCw size={18} />
          </button>
          <button className="ntf-btn ntf-btn-primary" onClick={openCompose}>
            <Plus size={18} /> New notification
          </button>
        </div>
      </div>

      {/* Sent / Received toggle */}
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
          {inboxUnread > 0 && <span className="ntf-tab-count unread">{inboxUnread}</span>}
        </button>
      </div>

      {/* ===================== SENT ===================== */}
      {view === "sent" && (
        <>
          {/* Stats */}
          <div className="ntf-stats">
            <div className="ntf-stat">
              <div className="ntf-stat-icon indigo"><Send size={20} /></div>
              <div>
                <div className="ntf-stat-value">{stats.broadcasts}</div>
                <div className="ntf-stat-label">Notifications Sent</div>
              </div>
            </div>
            <div className="ntf-stat">
              <div className="ntf-stat-icon green"><Users size={20} /></div>
              <div>
                <div className="ntf-stat-value">{stats.totalSent}</div>
                <div className="ntf-stat-label">Total Recipients</div>
              </div>
            </div>
            <div className="ntf-stat">
              <div className="ntf-stat-icon amber"><CheckCheck size={20} /></div>
              <div>
                <div className="ntf-stat-value">{stats.readRate}%</div>
                <div className="ntf-stat-label">Read Rate</div>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="ntf-toolbar">
            <div className="ntf-search">
              <Search size={18} />
              <input
                placeholder="Search sent notifications…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="ntf-select"
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
            >
              <option value="all">All channels</option>
              {CHANNELS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {apiError && <div className="ntf-alert">{apiError}</div>}

          {/* History */}
          {loading ? (
            <div className="ntf-empty">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="ntf-empty">
              You haven't sent any notifications yet. Click “New notification” to send your first.
            </div>
          ) : (
            <div className="ntf-list">
              {filtered.map((item) => {
                const meta = channelMeta(item.channel);
                const Icon = meta.icon;
                return (
                  <div className="ntf-card" key={item.key}>
                    <div className="ntf-card-icon" style={{ background: meta.color }}>
                      <Icon size={18} color="#fff" />
                    </div>
                    <div className="ntf-card-body">
                      <div className="ntf-card-top">
                        <span className="ntf-card-title">{item.title}</span>
                        <span className="ntf-badge" style={{ color: meta.color, borderColor: meta.color }}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="ntf-card-message">{item.message}</p>
                      <div className="ntf-card-meta">
                        <span><Users size={13} /> {item.recipientCount} recipient{item.recipientCount === 1 ? "" : "s"}</span>
                        <span><CheckCheck size={13} /> {item.readCount} read</span>
                        <span><CalendarDays size={13} /> {fmtDateTime(item.sentAt)}</span>
                      </div>
                    </div>
                    <button
                      className="ntf-icon-btn danger"
                      title="Delete for all recipients"
                      onClick={() => deleteBroadcast(item)}
                      disabled={deletingKey === item.key}
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

      {/* ===================== RECEIVED ===================== */}
      {view === "received" && (
        <>
          <div className="ntf-toolbar">
            <div className="ntf-search">
              <Search size={18} />
              <input
                placeholder="Search your inbox…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                onClick={markAllRead}
                disabled={busyId === "all"}
              >
                <CheckCheck size={16} /> {busyId === "all" ? "Marking…" : "Mark all read"}
              </button>
            )}
          </div>

          {inboxLoading ? (
            <div className="ntf-empty">Loading…</div>
          ) : filteredInbox.length === 0 ? (
            <div className="ntf-empty">
              {inboxFilter === "unread"
                ? "You're all caught up — no unread notifications."
                : "Your inbox is empty. Updates sent to you will show up here."}
            </div>
          ) : (
            <div className="ntf-list">
              {filteredInbox.map((n) => {
                const meta = receivedMeta(n.type);
                const Icon = meta.icon;
                return (
                  <div
                    className={`ntf-card ${n.isRead ? "" : "unread"}`}
                    key={n.id}
                  >
                    <div className="ntf-card-icon" style={{ background: meta.color }}>
                      <Icon size={18} color="#fff" />
                    </div>
                    <div className="ntf-card-body">
                      <div className="ntf-card-top">
                        <span className="ntf-card-title">{n.title}</span>
                        {!n.isRead && <span className="ntf-unread-dot" title="Unread" />}
                      </div>
                      <p className="ntf-card-message">{n.message}</p>
                      <div className="ntf-card-meta">
                        <span><CalendarDays size={13} /> {fmtDateTime(n.createdAt)}</span>
                      </div>
                    </div>
                    <div className="ntf-card-actions">
                      {!n.isRead && (
                        <button
                          className="ntf-btn ntf-btn-ghost ntf-read-btn"
                          onClick={() => markAsRead(n.id)}
                          disabled={busyId === n.id}
                          title="Mark as read"
                        >
                          <CheckCheck size={15} /> Read
                        </button>
                      )}
                      <button
                        className="ntf-icon-btn danger"
                        title="Delete"
                        onClick={() => removeInboxItem(n.id)}
                        disabled={busyId === n.id}
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

      {/* Compose Modal */}
      {showCompose &&
        createPortal(
          <div className="ntf-modal-overlay" onClick={() => setShowCompose(false)}>
            <div className="ntf-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ntf-modal-header">
                <h3>New Notification</h3>
                <button className="ntf-icon-btn" onClick={() => setShowCompose(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="ntf-modal-body">
                {formError && <div className="ntf-form-error">{formError}</div>}

                {/* Channel */}
                <div className="ntf-field">
                  <label className="ntf-label">Channel</label>
                  <div className="ntf-channel-grid">
                    {CHANNELS.map((c) => {
                      const Icon = c.icon;
                      const active = form.channel === c.value;
                      return (
                        <button
                          key={c.value}
                          type="button"
                          className={`ntf-channel-chip ${active ? "active" : ""}`}
                          style={active ? { borderColor: c.color, color: c.color, background: `${c.color}14` } : {}}
                          onClick={() => setForm({ ...form, channel: c.value })}
                        >
                          <Icon size={15} /> {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Audience */}
                <div className="ntf-field">
                  <label className="ntf-label">Send to</label>
                  <div className="ntf-audience-grid">
                    {AUDIENCES.map((a) => {
                      const Icon = a.icon;
                      const active = form.audience === a.value;
                      return (
                        <button
                          key={a.value}
                          type="button"
                          className={`ntf-audience-chip ${active ? "active" : ""}`}
                          onClick={() => setForm({ ...form, audience: a.value })}
                        >
                          <Icon size={16} /> {a.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {form.audience === "COURSE" && (
                  <div className="ntf-field">
                    <label className="ntf-label">Course</label>
                    <select
                      className="ntf-input"
                      value={form.courseId}
                      onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                    >
                      <option value="">Select a course…</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                {form.audience === "ROLE" && (
                  <div className="ntf-field">
                    <label className="ntf-label">Role</label>
                    <select
                      className="ntf-input"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                      <option value="STUDENT">Students</option>
                      <option value="MENTOR">Mentors</option>
                      <option value="ADMIN">Admins</option>
                    </select>
                  </div>
                )}

                {form.audience === "USER" && (
                  <div className="ntf-field">
                    <label className="ntf-label">User</label>
                    <select
                      className="ntf-input"
                      value={form.userId}
                      onChange={(e) => setForm({ ...form, userId: e.target.value })}
                    >
                      <option value="">Select a user…</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="ntf-field">
                  <label className="ntf-label">Title</label>
                  <input
                    className="ntf-input"
                    placeholder="e.g. New course launched!"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="ntf-field">
                  <label className="ntf-label">Message</label>
                  <textarea
                    className="ntf-input ntf-textarea"
                    rows={4}
                    placeholder="Write your message…"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>
              </div>

              <div className="ntf-modal-footer">
                <button className="ntf-btn ntf-btn-ghost" onClick={() => setShowCompose(false)} disabled={sending}>
                  Cancel
                </button>
                <button className="ntf-btn ntf-btn-primary" onClick={submit} disabled={sending}>
                  {sending ? "Sending…" : (<><Send size={16} /> Send</>)}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default AdminNotifications;
