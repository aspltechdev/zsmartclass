// src/pages/mentor/Modules.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";

import {
  Layers,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  RefreshCw,
  FileText,
  Save,
  ClipboardList,
  ChevronRight,
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

import "./Modules.css";

const EMPTY_FORM = {
  title: "",
  description: "",
};

function Modules() {
  const navigate = useNavigate();
  const { user } = useAuth();

  /* =========================================================
     STATE
     ========================================================= */

  const [modules, setModules] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [formErrors, setFormErrors] = useState({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  /* =========================================================
     FETCH MODULES + QUIZZES FOR EACH MODULE
     
     IMPORTANT:
     
     Backend does NOT have:
     
     GET /api/quizzes
     
     Backend DOES have:
     
     GET /api/quizzes/module/:moduleId
     
     So we first get modules, then get quizzes for each
     individual module.
     ========================================================= */

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      setError("");

      /* -------------------------------------------------------
         STEP 1:
         Get all modules
         ------------------------------------------------------- */

      const modulesRes = await api.get("/modules");

      console.log(
        "MODULES API RESPONSE:",
        modulesRes.data
      );

      const moduleData =
        modulesRes.data?.data ??
        modulesRes.data ??
        [];

      if (!Array.isArray(moduleData)) {
        setModules([]);
        setError("Invalid modules response from server.");
        return;
      }

      /* -------------------------------------------------------
         STEP 2:
         Get quizzes for every module
         
         Example:
         
         /api/quizzes/module/36
         /api/quizzes/module/37
         /api/quizzes/module/38
         ------------------------------------------------------- */

      const modulesWithQuizzes = await Promise.all(
        moduleData.map(async (module) => {
          try {
            const quizRes = await api.get(
              `/quizzes/module/${module.id}`
            );

            console.log(
              `QUIZZES FOR MODULE ${module.id}:`,
              quizRes.data
            );

            const quizData =
              quizRes.data?.data ??
              quizRes.data ??
              [];

            return {
              ...module,

              quizzes: Array.isArray(quizData)
                ? quizData
                : [],
            };
          } catch (quizError) {
            console.error(
              `Failed to load quizzes for module ${module.id}:`,
              quizError
            );

            /*
             * If one module's quiz request fails,
             * don't destroy the entire module page.
             */

            return {
              ...module,
              quizzes: [],
            };
          }
        })
      );

      console.log(
        "MODULES WITH QUIZZES:",
        modulesWithQuizzes
      );

      setModules(modulesWithQuizzes);
    } catch (err) {
      console.error(
        "Failed to load modules:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Couldn't load modules."
      );

      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     TOTAL LESSONS
     ========================================================= */

  const totalLessons = modules.reduce(
    (total, module) => {
      const lessons = Array.isArray(
        module.lessons
      )
        ? module.lessons
        : [];

      return total + lessons.length;
    },
    0
  );

  /* =========================================================
     TOTAL QUIZZES
     
     Since every module now contains:
     
     module.quizzes
     
     we can calculate the total easily.
     ========================================================= */

  const totalQuizzes = modules.reduce(
    (total, module) => {
      const quizzes = Array.isArray(
        module.quizzes
      )
        ? module.quizzes
        : [];

      return total + quizzes.length;
    },
    0
  );

  /* =========================================================
     SEARCH
     ========================================================= */

  const filteredModules = modules.filter(
    (module) => {
      const searchText = search
        .trim()
        .toLowerCase();

      if (!searchText) {
        return true;
      }

      const title =
        module.title?.toLowerCase() || "";

      const description =
        module.description?.toLowerCase() || "";

      return (
        title.includes(searchText) ||
        description.includes(searchText)
      );
    }
  );

  /* =========================================================
     CREATE MODULE
     ========================================================= */

  const openCreate = () => {
    setEditing(null);

    setForm(EMPTY_FORM);

    setFormErrors({});

    setShowModal(true);
  };

  /* =========================================================
     EDIT MODULE
     ========================================================= */

  const openEdit = (module) => {
    setEditing(module);

    setForm({
      title: module.title || "",
      description: module.description || "",
    });

    setFormErrors({});

    setShowModal(true);
  };

  /* =========================================================
     SAVE MODULE
     ========================================================= */

  const saveModule = async () => {
    if (!form.title.trim()) {
      setFormErrors({
        title: "Module title is required.",
      });

      return;
    }

    try {
      setIsSubmitting(true);

      setFormErrors({});

      const payload = {
        title: form.title.trim(),
        description: form.description || "",
        createdBy: user?.id,
      };

      if (editing) {
        await api.put(
          `/modules/${editing.id}`,
          payload
        );
      } else {
        await api.post(
          "/modules",
          payload
        );
      }

      setShowModal(false);

      setEditing(null);

      setForm(EMPTY_FORM);

      await fetchModules();
    } catch (err) {
      console.error(
        "Failed to save module:",
        err
      );

      setFormErrors({
        submit:
          err.response?.data?.message ||
          "Failed to save module.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =========================================================
     DELETE MODULE
     ========================================================= */

  const deleteModule = async (id) => {
    try {
      await api.delete(
        `/modules/${id}`
      );

      setDeleteTarget(null);

      await fetchModules();
    } catch (err) {
      console.error(
        "Failed to delete module:",
        err
      );

      alert(
        err.response?.data?.message ||
        "Failed to delete module."
      );

      setDeleteTarget(null);
    }
  };

  /* =========================================================
     FORMAT DATE
     ========================================================= */

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  /* =========================================================
     NAVIGATION
     ========================================================= */

  const goToLessons = (moduleId) => {
    navigate(
      `/mentor/lessons?moduleId=${moduleId}`
    );
  };

  const goToQuizzes = (moduleId) => {
    navigate(
      `/mentor/quiz?moduleId=${moduleId}`
    );
  };

  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <div className="modules-page">

        <div className="loading-state">

          <div className="spinner"></div>

          <p>
            Loading modules...
          </p>

        </div>

      </div>
    );
  }

  /* =========================================================
     MAIN UI
     ========================================================= */

  return (
    <div className="modules-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="page-header">

        <div>

          <h1>
            Module Management
          </h1>

          <p className="subtitle">
            Create modules, then add lessons and quizzes inside them
          </p>

        </div>

        <button
          type="button"
          className="add-btn"
          onClick={openCreate}
        >

          <Plus size={18} />

          <span>
            New Module
          </span>

        </button>

      </div>

      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (
        <div className="error-text">
          {error}
        </div>
      )}

      {/* =====================================================
          STATISTICS
          ===================================================== */}

      <div className="module-stats">

        {/* TOTAL MODULES */}

        <div className="stat-card">

          <div className="stat-icon modules-icon">
            <Layers size={23} />
          </div>

          <div className="stat-content">

            <h3>
              {modules.length}
            </h3>

            <p>
              Total Modules
            </p>

          </div>

        </div>

        {/* TOTAL LESSONS */}

        <div className="stat-card">

          <div className="stat-icon lessons-icon">
            <FileText size={23} />
          </div>

          <div className="stat-content">

            <h3>
              {totalLessons}
            </h3>

            <p>
              Total Lessons
            </p>

          </div>

        </div>

        {/* TOTAL QUIZZES */}

        <div className="stat-card">

          <div className="stat-icon quizzes-icon">
            <ClipboardList size={23} />
          </div>

          <div className="stat-content">

            <h3>
              {totalQuizzes}
            </h3>

            <p>
              Total Quizzes
            </p>

          </div>

        </div>

      </div>

      {/* =====================================================
          SEARCH
          ===================================================== */}

      <div className="toolbar">

        <div className="search-box">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search modules..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        <button
          type="button"
          className="refresh-btn"
          onClick={fetchModules}
          title="Refresh"
        >

          <RefreshCw size={18} />

        </button>

      </div>

      {/* =====================================================
          MODULES
          ===================================================== */}

      <div className="modules-container">

        {filteredModules.length === 0 ? (

          <div className="empty-state">

            <Layers size={48} />

            <h3>
              No modules found
            </h3>

            <p>
              Create your first module to get started
            </p>

            <button
              type="button"
              className="add-btn"
              onClick={openCreate}
            >

              <Plus size={18} />

              <span>
                Create Module
              </span>

            </button>

          </div>

        ) : (

          <div className="module-grid">

            {filteredModules.map(
              (module) => {

                /* -----------------------------------------
                   LESSONS
                   ----------------------------------------- */

                const lessons =
                  Array.isArray(
                    module.lessons
                  )
                    ? module.lessons
                    : [];

                /* -----------------------------------------
                   QUIZZES
                   
                   These quizzes came from:
                   
                   GET /api/quizzes/module/:moduleId
                   ----------------------------------------- */

                const moduleQuizzes =
                  Array.isArray(
                    module.quizzes
                  )
                    ? module.quizzes
                    : [];

                return (

                  <div
                    className="module-card"
                    key={module.id}
                  >

                    {/* =================================================
                        CARD HEADER
                        ================================================= */}

                    <div className="module-card-header">

                      <div className="module-card-icon">

                        <Layers size={20} />

                      </div>

                      <div className="module-card-info">

                        <div className="module-card-title-row">

                          <h4>
                            {module.title}
                          </h4>

                        </div>

                        {/* =================================================
                            LESSON + QUIZ COUNT
                            ================================================= */}

                        <div className="module-card-meta">

                          <span className="lesson-count">

                            {lessons.length}

                            {" "}

                            {lessons.length === 1
                              ? "lesson"
                              : "lessons"}

                          </span>

                          <span className="quiz-count">

                            {moduleQuizzes.length}

                            {" "}

                            {moduleQuizzes.length === 1
                              ? "quiz"
                              : "quizzes"}

                          </span>

                          <span className="date-badge">

                            {formatDate(
                              module.createdAt
                            )}

                          </span>

                        </div>

                      </div>

                    </div>

                    {/* =================================================
                        DESCRIPTION
                        ================================================= */}

                    {module.description && (

                      <p className="module-card-description">

                        {module.description}

                      </p>

                    )}

                    {/* =================================================
                        LESSON / QUIZ BUTTONS
                        ================================================= */}

                    <div className="module-nav-actions">

                      <button
                        type="button"
                        className="module-nav-btn"
                        onClick={() =>
                          goToLessons(
                            module.id
                          )
                        }
                      >

                        <FileText size={15} />

                        <span>
                          Lessons
                        </span>

                        <ChevronRight size={14} />

                      </button>

                      <button
                        type="button"
                        className="module-nav-btn"
                        onClick={() =>
                          goToQuizzes(
                            module.id
                          )
                        }
                      >

                        <ClipboardList
                          size={15}
                        />

                        <span>
                          Quizzes
                        </span>

                        <ChevronRight
                          size={14}
                        />

                      </button>

                    </div>

                    {/* =================================================
                        EDIT / DELETE
                        ================================================= */}

                    <div className="module-card-actions">

                      <button
                        type="button"
                        title="Edit module"
                        className="edit-btn"
                        onClick={() =>
                          openEdit(module)
                        }
                      >

                        <Edit size={16} />

                      </button>

                      <button
                        type="button"
                        title="Delete module"
                        className="delete-btn"
                        onClick={() =>
                          setDeleteTarget(
                            module.id
                          )
                        }
                      >

                        <Trash2 size={16} />

                      </button>

                    </div>

                  </div>

                );
              }
            )}

          </div>

        )}

      </div>

      {/* =====================================================
          CREATE / EDIT MODAL
          ===================================================== */}

      {showModal &&
        createPortal(

          <div
            className="modal"
            onClick={() =>
              setShowModal(false)
            }
          >

            <div
              className="modal-content"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="modal-header">

                <h2>
                  {editing
                    ? "Edit Module"
                    : "New Module"}
                </h2>

                <button
                  type="button"
                  className="modal-close"
                  onClick={() =>
                    setShowModal(false)
                  }
                >

                  <X size={20} />

                </button>

              </div>

              <div className="modal-body">

                {formErrors.submit && (

                  <p className="error-text">
                    {formErrors.submit}
                  </p>

                )}

                <div className="form-group">

                  <label>
                    Module Title *
                  </label>

                  <input
                    type="text"
                    value={form.title}
                    placeholder="e.g. HTML Basics"
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

                <div className="form-group full-width">

                  <label>
                    Description
                  </label>

                  <textarea
                    rows={4}
                    value={form.description}
                    placeholder="What does this module cover?"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description:
                          e.target.value,
                      })
                    }
                  />

                </div>

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() =>
                    setShowModal(false)
                  }
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn-save"
                  onClick={saveModule}
                  disabled={isSubmitting}
                >

                  <Save size={16} />

                  <span>
                    {isSubmitting
                      ? "Saving..."
                      : "Save Module"}
                  </span>

                </button>

              </div>

            </div>

          </div>,

          document.body
        )}

      {/* =====================================================
          DELETE CONFIRMATION
          ===================================================== */}

      {deleteTarget &&
        createPortal(

          <div
            className="modal"
            onClick={() =>
              setDeleteTarget(null)
            }
          >

            <div
              className="modal-content confirm-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="confirm-content">

                <div className="confirm-icon">

                  <Trash2 size={24} />

                </div>

                <div className="confirm-body">

                  <h3>
                    Delete this module?
                  </h3>

                  <p className="confirm-sub">
                    Its lessons, quizzes and student
                    progress will also be removed.
                  </p>

                </div>

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() =>
                    setDeleteTarget(null)
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn-danger"
                  onClick={() =>
                    deleteModule(
                      deleteTarget
                    )
                  }
                >
                  Delete Module
                </button>

              </div>

            </div>

          </div>,

          document.body
        )}

    </div>
  );
}

export default Modules;