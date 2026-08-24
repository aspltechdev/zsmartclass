// src/pages/mentor/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  BookOpen,
  Layers,
  Video,
  Users,
  FileText,
  CheckCircle,
  GraduationCap,
  Award,
  PlusCircle,
} from "lucide-react";
import "./Dashboard.css";
import "./MentorShared.css";

const EMPTY_STATS = {
  courses: 0,
  publishedCourses: 0,
  draftCourses: 0,
  categories: 0,
  modules: 0,
  lessons: 0,
  students: 0,
  enrollments: 0,
  completedEnrollments: 0,
  completionRate: 0,
};

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState(EMPTY_STATS);
  const [recentCourses, setRecentCourses] = useState([]);
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const res = await api.get("/dashboard/mentor");
        const d = res.data?.data || res.data || {};
        // Mentors have platform-wide visibility; stats arrive under `cards`.
        // Falls back to the older flat shape if the backend isn't updated yet.
        const c = d.cards || d;

        if (cancelled) return;

        setStats({
          courses: c.courses ?? c.myCourses ?? 0,
          publishedCourses: c.publishedCourses ?? 0,
          draftCourses: c.draftCourses ?? 0,
          categories: c.categories ?? 0,
          modules: c.modules ?? 0,
          lessons: c.lessons ?? 0,
          students: c.students ?? 0,
          enrollments: c.enrollments ?? 0,
          completedEnrollments: c.completedEnrollments ?? 0,
          completionRate: c.completionRate ?? 0,
        });
        setRecentCourses(d.recentCourses || []);
        setRecentEnrollments(d.recentEnrollments || []);
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          err.response?.data?.message ||
            "Couldn't load dashboard data. Please refresh or check the server."
        );
        // Show real zeros rather than invented numbers.
        setStats(EMPTY_STATS);
        setRecentCourses([]);
        setRecentEnrollments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  // Mentors manage content — course & category creation belongs to admins.
  const quickActions = [
    { label: "Add Module", icon: Layers, path: "/mentor/modules" },
    { label: "Add Lesson", icon: Video, path: "/mentor/lessons" },
    { label: "Course Content", icon: BookOpen, path: "/mentor/courses" },
    { label: "View Students", icon: Users, path: "/mentor/students" },
  ];

  const statCards = [
    { value: stats.courses, label: "Total Courses", icon: BookOpen, color: "#7c3aed" },
    { value: stats.modules, label: "Modules", icon: Layers, color: "#2563eb" },
    { value: stats.lessons, label: "Lessons", icon: Video, color: "#059669" },
    { value: stats.students, label: "Students", icon: Users, color: "#d97706" },
    { value: stats.enrollments, label: "Enrollments", icon: GraduationCap, color: "#0ea5e9" },
    { value: `${stats.completionRate}%`, label: "Completion Rate", icon: CheckCircle, color: "#16a34a" },
  ];

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Welcome */}
      <div className="welcome-section">
        <div className="welcome-content">
          <div>
            <h1>Welcome back, {user?.name || "Mentor"} 👋</h1>
            <p>Manage course content — modules, lessons, and quizzes.</p>
          </div>
        </div>
      </div>

      {loadError && (
        <div
          className="dashboard-error"
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            borderRadius: 10,
            padding: "12px 14px",
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          {loadError}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              className="stat-card"
              key={card.label}
              style={{ borderTop: `3px solid ${card.color}` }}
            >
              <div
                className="stat-icon"
                style={{ background: card.color, color: "white" }}
              >
                <Icon />
              </div>
              <div className="stat-content">
                <h3>{card.value}</h3>
                <p>{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>


      {/* Quick actions */}
      <div className="quick-actions-section full-width">
        <div className="section-header">
          <h3>⚡ Quick Actions</h3>
        </div>
        <div className="quick-actions-grid">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                className="quick-action-btn add-btn"
                onClick={() => navigate(a.path)}
              >
                <Icon size={20} />
                <span>{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent activity */}
      <div className="status-grid">
        <div className="quick-actions-section">
          <div className="section-header">
            <h3>🆕 Recent Courses</h3>
          </div>
          {recentCourses.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 14, padding: "8px 0" }}>
              No courses yet.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {recentCourses.map((c) => (
                <li
                  key={c.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: "1px solid #f1f5f9",
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#111827" }}>
                    {c.title}
                  </span>
                  <span style={{ color: "#94a3b8", fontSize: 12.5 }}>
                    {c.category?.name || "Uncategorized"} ·{" "}
                    {formatDate(c.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="quick-actions-section">
          <div className="section-header">
            <h3>👨‍🎓 Recent Enrollments</h3>
          </div>
          {recentEnrollments.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 14, padding: "8px 0" }}>
              No enrollments yet.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {recentEnrollments.map((e) => (
                <li
                  key={e.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: "1px solid #f1f5f9",
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#111827" }}>
                    {e.user?.name || "—"}
                  </span>
                  <span style={{ color: "#94a3b8", fontSize: 12.5 }}>
                    {e.course?.title || "—"} · {formatDate(e.enrolledAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;