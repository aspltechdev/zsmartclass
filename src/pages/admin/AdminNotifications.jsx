// src/pages/admin/AdminNotifications.jsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  Send,
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
  const [history, setHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");

  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);

  const [deletingKey, setDeletingKey] = useState(null);

  useEffect(() => {
    fetchAll();
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
        setApiError("Could not load notification history. Check the backend.");
        setHistory([]);
      }
    } catch {
      setApiError("Something went wrong while loading the page.");
    } finally {
      setLoading(false);
    }
  };

  const students = useMemo(
    () => users.filter((u) => (u.role || "").toUpperCase() === "STUDENT"),
    [users]
  );

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
    if (!form.title.trim()) return setFormError("Title is required.");
    if (!form.message.trim()) return setFormError("Message is required.");
    if (form.audience === "COURSE" && !form.courseId)
      return setFormError("Please select a course.");
    if (form.audience === "USER" && !form.userId)
      return setFormError("Please select a user.");

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
      setFormError(err.response?.data?.message || "Failed to send. Try again.");
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
      alert(err.response?.data?.message || "Failed to delete.");
    } finally {
      setDeletingKey(null);
    }
  };

  return (
    <div className="ntf-page">
      <div className="ntf-header">
        <div>
          <h1 className="ntf-title">
            <Bell size={26} /> Notifications
          </h1>
          <p className="ntf-subtitle">
            Send announcements, course updates, and progress nudges.
          </p>
        </div>
        <div className="ntf-actions">
          <button className="ntf-btn ntf-btn-ghost" onClick={fetchAll}>
            <RefreshCw size={18} />
          </button>
          <button className="ntf-btn ntf-btn-primary" onClick={openCompose}>
            <Plus size={18} /> New notification
          </button>
        </div>
      </div>

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
            placeholder="Search notifications…"
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
        <div className="ntf-empty">No notifications yet. Click “New notification” to send one.</div>
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