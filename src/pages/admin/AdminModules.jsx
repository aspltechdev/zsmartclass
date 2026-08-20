import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  RefreshCw,
  FileText,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import api from "../../services/api";
import "./AdminModules.css";

const EMPTY_FORM = {
  title: "",
  description: "",
};

function AdminModules() {
  const navigate = useNavigate();

  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* ---------------- FETCH MODULES ---------------- */

  const fetchModules = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const res = await api.get("/modules");

      const data = res.data?.data || res.data || [];

      setModules(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Couldn't load modules. Please try again."
      );
      setModules([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  /* ---------------- SEARCH ---------------- */

  const filteredModules = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return modules;

    return modules.filter((module) => {
      const title = String(module.title || "").toLowerCase();
      const description = String(module.description || "").toLowerCase();

      return title.includes(query) || description.includes(query);
    });
  }, [modules, search]);

  /* ---------------- STATS ---------------- */

  const totalModules = modules.length;

  const totalLessons = useMemo(() => {
    return modules.reduce((total, module) => {
      return total + (module.lessons?.length || module.lessonCount || 0);
    }, 0);
  }, [modules]);

  /* ---------------- CREATE ---------------- */

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowModal(true);
  };

  /* ---------------- EDIT ---------------- */

  const openEdit = (module) => {
    setEditing(module);

    setForm({
      title: module.title || "",
      description: module.description || "",
    });

    setFormErrors({});
    setShowModal(true);
  };

  /* ---------------- CLOSE MODAL ---------------- */

  const closeModal = () => {
    if (isSubmitting) return;

    setShowModal(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  /* ---------------- SAVE MODULE ---------------- */

  const saveModule = async () => {
    const title = form.title.trim();

    if (!title) {
      setFormErrors({
        title: "Module title is required.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        title,
        description: form.description.trim(),
      };

      if (editing) {
        await api.put(`/modules/${editing.id}`, payload);
      } else {
        await api.post("/modules", payload);
      }

      setShowModal(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      setFormErrors({});

      await fetchModules();
    } catch (err) {
      setFormErrors({
        submit:
          err.response?.data?.message ||
          "Failed to save module. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------- DELETE ---------------- */

  const deleteModule = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);

      await api.delete(`/modules/${deleteTarget.id}`);

      setDeleteTarget(null);

      await fetchModules();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Failed to delete module. Please try again."
      );

      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  /* ---------------- LESSON COUNT ---------------- */

  const getLessonCount = (module) => {
    return module.lessons?.length || module.lessonCount || 0;
  };

  /* ---------------- DATE ---------------- */

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  /* ---------------- LOADING ---------------- */

  if (loading) {
    return (
      <div className="modules-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading modules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modules-page">

      {/* PAGE HEADER */}

      <div className="page-header">
        <div className="page-heading">
          <h1>Module Management</h1>
          <p className="subtitle">
            Create and manage modules that contain your lessons.
          </p>
        </div>

        <button className="add-btn" onClick={openCreate}>
          <Plus size={18} />
          New Module
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="page-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* STAT CARDS */}

      <div className="module-stats">

        <div className="stat-card stat-card-purple">
          <div className="stat-icon stat-icon-purple">
            <Layers size={22} />
          </div>

          <div className="stat-content">
            <span className="stat-label">Total Modules</span>
            <strong className="stat-value">{totalModules}</strong>
          </div>
        </div>

        <div className="stat-card stat-card-blue">
          <div className="stat-icon stat-icon-blue">
            <BookOpen size={22} />
          </div>

          <div className="stat-content">
            <span className="stat-label">Total Lessons</span>
            <strong className="stat-value">{totalLessons}</strong>
          </div>
        </div>

      </div>

      {/* TOOLBAR */}

      <div className="modules-toolbar">

        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <button
              className="clear-search"
              onClick={() => setSearch("")}
              type="button"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          className="refresh-btn"
          onClick={() => fetchModules(true)}
          disabled={refreshing}
          title="Refresh"
        >
          <RefreshCw
            size={18}
            className={refreshing ? "refresh-spin" : ""}
          />
        </button>

      </div>

      {/* MODULES */}

      <div className="modules-container">

        {filteredModules.length === 0 ? (
          <div className="empty-state">

            <div className="empty-icon">
              <Layers size={38} />
            </div>

            {search ? (
              <>
                <h3>No modules found</h3>
                <p>
                  No modules match your search. Try a different keyword.
                </p>

                <button
                  className="secondary-btn"
                  onClick={() => setSearch("")}
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <h3>No modules yet</h3>
                <p>
                  Create your first module to start organizing lessons.
                </p>

                <button className="add-btn" onClick={openCreate}>
                  <Plus size={18} />
                  New Module
                </button>
              </>
            )}

          </div>
        ) : (
          <div className="module-grid">

            {filteredModules.map((module) => {
              const lessonCount = getLessonCount(module);

              return (
                <div className="module-card" key={module.id}>

                  {/* CARD HEADER */}

                  <div className="module-card-header">

                    <div className="module-icon">
                      <Layers size={22} />
                    </div>

                    <div className="module-card-title">
                      <h3 title={module.title}>
                        {module.title || "Untitled Module"}
                      </h3>
                    </div>

                  </div>

                  {/* META */}

                  <div className="module-meta">

                    <span className="meta-item">
                      <FileText size={15} />
                      {lessonCount}{" "}
                      {lessonCount === 1 ? "Lesson" : "Lessons"}
                    </span>

                    <span className="meta-dot">•</span>

                    <span className="meta-item">
                      {formatDate(module.createdAt)}
                    </span>

                  </div>

                  {/* DESCRIPTION */}

                  {module.description && (
                    <p className="module-description">
                      {module.description}
                    </p>
                  )}

                  {/* LESSON BUTTON */}

                  <button
                    className="lessons-btn"
                    onClick={() =>
                      navigate(`/admin/lessons?moduleId=${module.id}`)
                    }
                  >
                    <span className="lessons-btn-left">
                      <FileText size={16} />
                      Manage Lessons
                    </span>

                    <span className="lessons-btn-right">
                      <span>{lessonCount}</span>
                      <ChevronRight size={17} />
                    </span>
                  </button>

                  {/* CARD FOOTER */}

                  <div className="module-card-footer">

                    <button
                      className="card-edit-btn"
                      onClick={() => openEdit(module)}
                    >
                      <Edit size={15} />
                      Edit
                    </button>

                    <button
                      className="card-delete-btn"
                      onClick={() => setDeleteTarget(module)}
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>

      {/* CREATE / EDIT MODAL */}

      {showModal &&
        createPortal(
          <div className="modal" onClick={closeModal}>

            <div
              className="modal-content module-modal"
              onClick={(e) => e.stopPropagation()}
            >

              <div className="modal-header">

                <div>
                  <h2>
                    {editing ? "Edit Module" : "New Module"}
                  </h2>

                  <p className="modal-subtitle">
                    {editing
                      ? "Update the module details."
                      : "Create a new module for your course."}
                  </p>
                </div>

                <button
                  className="modal-close"
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  <X size={20} />
                </button>

              </div>

              <div className="modal-body">

                {formErrors.submit && (
                  <div className="modal-error">
                    <AlertCircle size={16} />
                    {formErrors.submit}
                  </div>
                )}

                <div className="form-group">

                  <label>
                    Module Title <span>*</span>
                  </label>

                  <input
                    type="text"
                    value={form.title}
                    placeholder="e.g. Introduction to HTML"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        title: e.target.value,
                      })
                    }
                  />

                  {formErrors.title && (
                    <p className="error-text">
                      {formErrors.title}
                    </p>
                  )}

                </div>

                <div className="form-group">

                  <label>Description</label>

                  <textarea
                    rows={5}
                    value={form.description}
                    placeholder="Describe what this module contains..."
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description: e.target.value,
                      })
                    }
                  />

                </div>

              </div>

              <div className="modal-footer">

                <button
                  className="btn-cancel"
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  className="btn-save"
                  onClick={saveModule}
                  disabled={isSubmitting}
                >
                  <Save size={16} />

                  {isSubmitting
                    ? "Saving..."
                    : editing
                    ? "Update Module"
                    : "Save Module"}
                </button>

              </div>

            </div>

          </div>,
          document.body
        )}

      {/* DELETE MODAL */}

      {deleteTarget &&
        createPortal(
          <div
            className="modal"
            onClick={() => {
              if (!isDeleting) {
                setDeleteTarget(null);
              }
            }}
          >

            <div
              className="modal-content confirm-modal"
              onClick={(e) => e.stopPropagation()}
            >

              <div className="confirm-content">

                <div className="confirm-icon">
                  <Trash2 size={24} />
                </div>

                <div className="confirm-body">

                  <h3>Delete this module?</h3>

                  <p className="confirm-sub">
                    Are you sure you want to delete{" "}
                    <strong>
                      {deleteTarget.title}
                    </strong>
                    ?
                  </p>

                  <p className="confirm-warning">
                    This will also remove the lessons and associated
                    student progress. This action cannot be undone.
                  </p>

                </div>

              </div>

              <div className="modal-footer">

                <button
                  className="btn-cancel"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>

                <button
                  className="btn-danger"
                  onClick={deleteModule}
                  disabled={isDeleting}
                >
                  <Trash2 size={16} />

                  {isDeleting
                    ? "Deleting..."
                    : "Delete Module"}
                </button>

              </div>

            </div>

          </div>,
          document.body
        )}

    </div>
  );
}

export default AdminModules;