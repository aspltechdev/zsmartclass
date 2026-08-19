// src/pages/mentor/Students.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Search,
  RefreshCw,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Clock,
  PlayCircle,
  Calendar,
  GraduationCap,
  TrendingUp,
} from "lucide-react";
import api from "../../services/api";
import "./Students.css";

function Students() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [collapsed, setCollapsed] = useState({});

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/enrollments/admin/all");
      setEnrollments(res.data?.data || res.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Couldn't load students. Please refresh or check the server."
      );
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  // Derive a status from progress/completion flags.
  const statusOf = (e) => {
    if (e.completed || Number(e.progress) >= 100) return "COMPLETED";
    if (Number(e.progress) > 0) return "IN_PROGRESS";
    return "NOT_STARTED";
  };

  const statusMeta = {
    COMPLETED: { label: "Completed", icon: CheckCircle, cls: "completed" },
    IN_PROGRESS: { label: "In Progress", icon: PlayCircle, cls: "in-progress" },
    NOT_STARTED: { label: "Not Started", icon: Clock, cls: "not-started" },
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enrollments.filter((e) => {
      const matchesSearch =
        !q ||
        e.user?.name?.toLowerCase().includes(q) ||
        e.user?.email?.toLowerCase().includes(q) ||
        e.course?.title?.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" || statusOf(e) === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [enrollments, search, statusFilter]);

  // Group enrollments under their course.
  const grouped = useMemo(() => {
    const map = new Map();
    for (const e of filtered) {
      const id = e.course?.id ?? e.courseId ?? "unknown";
      if (!map.has(id)) {
        map.set(id, {
          courseId: id,
          title: e.course?.title || "Unassigned course",
          students: [],
        });
      }
      map.get(id).students.push(e);
    }
    // Most students first, and newest enrolment first within a course.
    const list = Array.from(map.values());
    list.forEach((g) =>
      g.students.sort(
        (a, b) => new Date(b.enrolledAt || 0) - new Date(a.enrolledAt || 0)
      )
    );
    return list.sort((a, b) => b.students.length - a.students.length);
  }, [filtered]);

  const stats = useMemo(() => {
    const uniqueStudents = new Set(
      enrollments.map((e) => e.user?.id ?? e.userId)
    ).size;
    const completed = enrollments.filter(
      (e) => e.completed || Number(e.progress) >= 100
    ).length;
    const inProgress = enrollments.filter(
      (e) => Number(e.progress) > 0 && !e.completed && Number(e.progress) < 100
    ).length;
    return {
      students: uniqueStudents,
      enrollments: enrollments.length,
      completed,
      inProgress,
    };
  }, [enrollments]);

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const initials = (name) =>
    (name || "?")
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const toggle = (id) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  if (loading) {
    return (
      <div className="students-page">
        <div className="std-loading">
          <div className="std-spinner" />
          <p>Loading students…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="students-page">
      {/* Header */}
      <div className="std-header">
        <div>
          <h1 className="std-title">
            <Users size={24} /> Students
          </h1>
          <p className="std-subtitle">
            Enrolled students grouped by course, with progress and completion.
          </p>
        </div>
        <button className="std-refresh" onClick={fetchEnrollments}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="std-stats">
        <div className="std-stat">
          <div className="std-stat-icon indigo"><Users size={20} /></div>
          <div>
            <div className="std-stat-value">{stats.students}</div>
            <div className="std-stat-label">Students</div>
          </div>
        </div>
        <div className="std-stat">
          <div className="std-stat-icon blue"><GraduationCap size={20} /></div>
          <div>
            <div className="std-stat-value">{stats.enrollments}</div>
            <div className="std-stat-label">Enrollments</div>
          </div>
        </div>
        <div className="std-stat">
          <div className="std-stat-icon amber"><TrendingUp size={20} /></div>
          <div>
            <div className="std-stat-value">{stats.inProgress}</div>
            <div className="std-stat-label">In Progress</div>
          </div>
        </div>
        <div className="std-stat">
          <div className="std-stat-icon green"><CheckCircle size={20} /></div>
          <div>
            <div className="std-stat-value">{stats.completed}</div>
            <div className="std-stat-label">Completed</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="std-toolbar">
        <div className="std-search">
          <Search size={18} />
          <input
            placeholder="Search by student, email, or course…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="std-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="NOT_STARTED">Not Started</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {error && <div className="std-alert">{error}</div>}

      {/* Grouped list */}
      {grouped.length === 0 ? (
        <div className="std-empty">
          <Users size={44} />
          <h3>No students found</h3>
          <p>Once students are given course access they'll appear here.</p>
        </div>
      ) : (
        grouped.map((group) => {
          const isOpen = !collapsed[group.courseId];
          const done = group.students.filter(
            (s) => statusOf(s) === "COMPLETED"
          ).length;

          return (
            <div className="std-course-block" key={group.courseId}>
              <button
                className="std-course-head"
                onClick={() => toggle(group.courseId)}
              >
                <span className="std-course-chevron">
                  {isOpen ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </span>
                <span className="std-course-icon">
                  <BookOpen size={18} />
                </span>
                <span className="std-course-title">{group.title}</span>
                <span className="std-course-count">
                  {group.students.length} student
                  {group.students.length === 1 ? "" : "s"} · {done} completed
                </span>
              </button>

              {isOpen && (
                <div className="std-table-wrap">
                  <table className="std-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Enrolled On</th>
                        <th>Progress</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.students.map((e) => {
                        const st = statusMeta[statusOf(e)];
                        const StatusIcon = st.icon;
                        const pct = Math.round(Number(e.progress) || 0);

                        return (
                          <tr key={e.id}>
                            <td>
                              <div className="std-student">
                                <span className="std-avatar">
                                  {initials(e.user?.name)}
                                </span>
                                <div>
                                  <div className="std-name">
                                    {e.user?.name || "—"}
                                  </div>
                                  <div className="std-email">
                                    {e.user?.email || ""}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="std-date">
                                <Calendar size={13} /> {fmtDate(e.enrolledAt)}
                              </span>
                            </td>
                            <td>
                              <div className="std-progress">
                                <div className="std-progress-track">
                                  <div
                                    className={`std-progress-bar ${st.cls}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="std-progress-pct">{pct}%</span>
                              </div>
                            </td>
                            <td>
                              <span className={`std-badge ${st.cls}`}>
                                <StatusIcon size={13} /> {st.label}
                              </span>
                              {e.isExpired && (
                                <span className="std-badge expired">
                                  Expired
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default Students;