// src/pages/mentor/Courses.jsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  Search,
  RefreshCw,
  Layers,
  Plus,
  X,
  Trash2,
  FileText,
  Info,
} from "lucide-react";
import api from "../../services/api";
import "./Courses.css";
import "./MentorShared.css";

function Courses() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Module management for the selected course
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseModules, setCourseModules] = useState([]);
  const [availableModules, setAvailableModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [moduleActionId, setModuleActionId] = useState(null);
  const [selectedModuleToAdd, setSelectedModuleToAdd] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [coursesRes, catRes] = await Promise.all([
        api.get("/courses"),
        api.get("/categories").catch(() => ({ data: { data: [] } })),
      ]);
      setCourses(coursesRes.data?.data || coursesRes.data || []);
      setCategories(catRes.data?.data || catRes.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Couldn't load courses. Please refresh or check the server."
      );
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      const matchesSearch =
        !q ||
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q);
      const matchesCategory =
        categoryFilter === "all" || String(c.categoryId) === String(categoryFilter);
      const matchesStatus =
        statusFilter === "all" ||
        (c.status || "").toUpperCase() === statusFilter.toUpperCase();
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [courses, search, categoryFilter, statusFilter]);

  // ---- Module management ----
  const openCourse = async (course) => {
    setSelectedCourse(course);
    setSelectedModuleToAdd("");
    setCourseModules([]);
    setAvailableModules([]);
    await loadModules(course.id);
  };

  const loadModules = async (courseId) => {
    setModulesLoading(true);
    try {
      const [courseRes, availRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/courses/${courseId}/available-modules`),
      ]);
      setCourseModules(courseRes.data?.data?.modules || []);
      setAvailableModules(availRes.data?.data || []);
    } catch (err) {
      setCourseModules([]);
      setAvailableModules([]);
    } finally {
      setModulesLoading(false);
    }
  };

  const loadAvailable = async (courseId) => {
    try {
      const res = await api.get(`/courses/${courseId}/available-modules`);
      setAvailableModules(res.data?.data || []);
    } catch {
      setAvailableModules([]);
    }
  };

  const attachModule = async () => {
    if (!selectedModuleToAdd || !selectedCourse) return;
    setModuleActionId("attach");
    try {
      const res = await api.post(`/courses/${selectedCourse.id}/modules`, {
        moduleId: parseInt(selectedModuleToAdd),
      });
      if (res.data?.data) setCourseModules(res.data.data);
      setSelectedModuleToAdd("");
      await loadAvailable(selectedCourse.id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add module.");
    } finally {
      setModuleActionId(null);
    }
  };

  const detachModule = async (moduleId) => {
    if (!selectedCourse) return;
    setModuleActionId(moduleId);
    try {
      const res = await api.delete(
        `/courses/${selectedCourse.id}/modules/${moduleId}`
      );
      if (res.data?.data) setCourseModules(res.data.data);
      await loadAvailable(selectedCourse.id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove module.");
    } finally {
      setModuleActionId(null);
    }
  };

  const lessonCount = (m) => m?._count?.lessons ?? m?.lessons?.length ?? 0;

  return (
    <div className="mentor-courses">
      <div className="courses-container">
        {/* Header */}
        <div className="courses-header">
          <div>
            <h1 className="course-title">
              <BookOpen size={24} /> Courses
            </h1>
            <p className="course-subtitle">
              Browse all courses and manage their modules.
            </p>
          </div>
          <div className="header-buttons">
            <button className="view-btn-header" onClick={fetchData}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        {/* Mentors can't create courses — make that explicit rather than
            showing a button that would fail. */}
        <div
          className="description-box"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <Info size={16} />
          <span>
            Courses and categories are created by admins. You can add and
            remove modules on any course.
          </span>
        </div>

        {/* Filters */}
        <div
          className="course-meta"
          style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "16px 0" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flex: "1 1 240px",
              minWidth: 0,
              overflow: "hidden",
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: "0 12px",
              color: "#9ca3af",
            }}
          >
            <Search size={18} />
            <input
              placeholder="Search courses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                boxShadow: "none",
                padding: "10px 0",
                // flex + min-width:0 instead of width:100% — with the icon
                // beside it, 100% overflowed the rounded wrapper
                flex: 1,
                minWidth: 0,
                minHeight: "auto",
                fontSize: 14,
                background: "transparent",
              }}
            />
          </div>

          <select
            className="category-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="category-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {error && (
          <div
            className="description-box"
            style={{ borderLeft: "4px solid #ef4444", color: "#b91c1c" }}
          >
            {error}
          </div>
        )}

        {/* Course grid */}
        {loading ? (
          <div className="no-courses">Loading courses…</div>
        ) : filtered.length === 0 ? (
          <div className="no-courses">No courses found.</div>
        ) : (
          <div className="view-grid">
            {filtered.map((course) => (
              <div className="course-card" key={course.id}>
                <div className="course-card-header">
                  <h3>{course.title}</h3>
                  <span
                    className={`status-badge ${(course.status || "").toLowerCase()}`}
                  >
                    {course.status}
                  </span>
                </div>

                <div className="course-info">
                  <p className="course-category">
                    {course.category?.name || "Uncategorized"}
                    {course.level ? ` · ${course.level}` : ""}
                  </p>
                  {course.description && (
                    <p className="course-subtitle">
                      {course.description.length > 110
                        ? `${course.description.slice(0, 110)}…`
                        : course.description}
                    </p>
                  )}
                </div>

                <div className="course-stats">
                  <span className="module-count">
                    <Layers size={14} /> {course._count?.enrollments ?? 0} students
                  </span>
                </div>

                <button
                  className="module-view-btn"
                  onClick={() => openCourse(course)}
                >
                  <Layers size={16} /> Manage Modules
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Module management modal */}
      {selectedCourse &&
        createPortal(
          <div className="popup-overlay" onClick={() => setSelectedCourse(null)}>
            <div
              className="popup popup-large"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modules-header">
                <h2 className="section-title">
                  <Layers size={20} /> {selectedCourse.title}
                </h2>
                <button
                  className="view-btn-header"
                  onClick={() => setSelectedCourse(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modules-section">
                {/* Add module */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 16,
                  }}
                >
                  <select
                    className="form-select"
                    style={{ flex: 1, minWidth: 220 }}
                    value={selectedModuleToAdd}
                    onChange={(e) => setSelectedModuleToAdd(e.target.value)}
                    disabled={modulesLoading || availableModules.length === 0}
                  >
                    <option value="">
                      {availableModules.length
                        ? "Select a module to add…"
                        : "No modules available to add"}
                    </option>
                    {availableModules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({lessonCount(m)} lessons)
                      </option>
                    ))}
                  </select>
                  <button
                    className="add-module-btn"
                    onClick={attachModule}
                    disabled={!selectedModuleToAdd || moduleActionId === "attach"}
                  >
                    <Plus size={16} />
                    {moduleActionId === "attach" ? "Adding…" : "Add Module"}
                  </button>
                </div>

                <p className="position-hint">
                  Modules are shared — adding one here doesn't remove it from
                  other courses.
                </p>

                {/* Attached modules */}
                {modulesLoading ? (
                  <div className="no-modules">Loading modules…</div>
                ) : courseModules.length === 0 ? (
                  <div className="no-modules">
                    No modules attached yet. Add one above.
                  </div>
                ) : (
                  <div className="modules-list">
                    {courseModules.map((m, index) => (
                      <div className="module-item" key={m.id}>
                        <div className="module-item-header">
                          <div className="module-info">
                            <h4>
                              {index + 1}. {m.title}
                            </h4>
                            <span className="lesson-count">
                              <FileText size={13} /> {lessonCount(m)} lesson
                              {lessonCount(m) === 1 ? "" : "s"}
                            </span>
                          </div>
                          <button
                            className="view-btn-header"
                            title="Remove from this course"
                            onClick={() => detachModule(m.id)}
                            disabled={moduleActionId === m.id}
                            style={{ color: "#dc2626" }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="popup-buttons">
                <button
                  className="view-btn-header"
                  onClick={() => setSelectedCourse(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default Courses;