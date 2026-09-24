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
import "./MentorShared.css";

const EMPTY_FORM = {
  title: "",
  description: "",
  courseId: "",
};

function Modules() {
  const navigate = useNavigate();
  const { user } = useAuth();

  /* =========================================================
     STATE
     ========================================================= */

  const [modules, setModules] = useState([]);
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);

  const [error, setError] = useState("");
  const [courseError, setCourseError] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  /* =========================================================
     INITIAL LOAD
     ========================================================= */

  useEffect(() => {
    fetchCourses();
    fetchModules();
  }, []);

  /* =========================================================
     FETCH COURSES
     ========================================================= */

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      setCourseError("");

      const response = await api.get("/courses");

      console.log("COURSES API RESPONSE:", response.data);

      const courseData =
        response.data?.data ??
        response.data?.courses ??
        response.data ??
        [];

      if (!Array.isArray(courseData)) {
        console.error("Invalid courses response:", courseData);

        setCourses([]);
        setCourseError("Invalid courses response from server.");
        return;
      }

      setCourses(courseData);
    } catch (err) {
      console.error("Failed to load courses:", err);

      setCourses([]);

      setCourseError(
        err.response?.data?.message ||
          "Failed to load courses."
      );
    } finally {
      setCoursesLoading(false);
    }
  };

  /* =========================================================
     FETCH MODULES + QUIZZES FOR EACH MODULE
     ========================================================= */

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
        setError(
          "Invalid modules response from server."
        );
        return;
      }

      /* -------------------------------------------------------
         STEP 2:
         Get quizzes for every module
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

      const courseTitle =
        module.course?.title?.toLowerCase() ||
        "";

      return (
        title.includes(searchText) ||
        description.includes(searchText) ||
        courseTitle.includes(searchText)
      );
    }
  );

  /* =========================================================
     CREATE MODULE
     ========================================================= */

  const openCreate = () => {
    setEditing(null);

    setForm({
      ...EMPTY_FORM,
    });

    setFormErrors({});

    setCourseError("");

    /*
     * Refresh courses whenever modal opens.
     * This ensures newly-created courses appear.
     */
    fetchCourses();

    setShowModal(true);
  };

  /* =========================================================
     EDIT MODULE
     ========================================================= */

  const openEdit = (module) => {
    setEditing(module);

    const moduleCourseId =
      module.courseId ||
      module.course?.id ||
      "";

    setForm({
      title: module.title || "",
      description: module.description || "",
      courseId: moduleCourseId
        ? String(moduleCourseId)
        : "",
    });

    setFormErrors({});

    setCourseError("");

    fetchCourses();

    setShowModal(true);
  };

  /* =========================================================
     CLOSE MODAL
     ========================================================= */

  const closeModal = () => {
    if (isSubmitting) {
      return;
    }

    setShowModal(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  /* =========================================================
     SAVE MODULE
     ========================================================= */

  const saveModule = async () => {
    const errors = {};

    if (!form.title.trim()) {
      errors.title = "Module title is required.";
    }

    const selectedCourseId = Number(
      form.courseId ||
        editing?.courseId ||
        editing?.course?.id
    );

    if (
      !selectedCourseId ||
      !Number.isInteger(selectedCourseId)
    ) {
      errors.courseId =
        "Please select a course.";
    }

    if (!user?.id) {
      errors.submit =
        "User session not found. Please login again.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      setFormErrors({});

      const payload = {
        title: form.title.trim(),
        description:
          form.description?.trim() || "",
        createdBy: Number(user.id),
        courseId: selectedCourseId,
      };

      console.log(
        "📤 MODULE PAYLOAD:",
        payload
      );

      /* -------------------------------------------------------
         UPDATE
         ------------------------------------------------------- */

      if (editing) {
        const response = await api.put(
          `/modules/${editing.id}`,
          payload
        );

        console.log(
          "MODULE UPDATE RESPONSE:",
          response.data
        );
      }

      /* -------------------------------------------------------
         CREATE
         ------------------------------------------------------- */

      else {
        const response = await api.post(
          "/modules",
          payload
        );

        console.log(
          "MODULE CREATE RESPONSE:",
          response.data
        );
      }

      /* -------------------------------------------------------
         SUCCESS
         ------------------------------------------------------- */

      setShowModal(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      setFormErrors({});

      await fetchModules();
    } catch (err) {
      console.error(
        "❌ Failed to save module:",
        err
      );

      console.error(
        "API ERROR:",
        err.response?.data
      );

      setFormErrors({
        submit:
          err.response?.data?.message ||
          err.response?.data?.error ||
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
     GET COURSE NAME
     ========================================================= */

  const getCourseName = (module) => {
    if (module.course?.title) {
      return module.course.title;
    }

    const courseId =
      module.courseId;

    if (!courseId) {
      return "No course";
    }

    const course = courses.find(
      (item) =>
        Number(item.id) ===
        Number(courseId)
    );

    return (
      course?.title ||
      `Course #${courseId}`
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

        <div className="quiz-marks-header">

          <div>

            <div className="quizmarks-title">

              <Layers
                className="quizmarks-title-icon"
              />

              <h1>
                Modules
              </h1>

            </div>

            <p>
              View students' quiz
              performance module by
              module.
            </p>

          </div>

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

        <div className="modules-search">

          <Search size={19} />

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
              Create your first module
              to get started
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

                        {/* COURSE */}

                        <div
                          className="module-course-name"
                          style={{
                            marginTop: "5px",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#6366f1",
                          }}
                        >
                          {getCourseName(module)}
                        </div>

                        {/* LESSON + QUIZ COUNT */}

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
            onClick={closeModal}
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
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  <X size={20} />
                </button>

              </div>

              <div className="modal-body">

                {/* SUBMIT ERROR */}

                {formErrors.submit && (

                  <p className="error-text">
                    {formErrors.submit}
                  </p>

                )}

                {/* COURSE ERROR */}

                {courseError && (

                  <p className="error-text">
                    {courseError}
                  </p>

                )}

                {/* =================================================
                    COURSE
                    ================================================= */}

                <div className="form-group full-width">

                  <label htmlFor="module-course">

                    Course *

                  </label>

                  <select
                    id="module-course"
                    value={form.courseId}
                    disabled={
                      coursesLoading ||
                      isSubmitting
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        courseId:
                          e.target.value,
                      })
                    }
                    className={
                      formErrors.courseId
                        ? "input-error"
                        : ""
                    }
                  >

                    <option value="">
                      {coursesLoading
                        ? "Loading courses..."
                        : "Select Course"}
                    </option>

                    {courses.map(
                      (course) => (

                        <option
                          key={course.id}
                          value={course.id}
                        >
                          {course.title}
                        </option>

                      )
                    )}

                  </select>

                  {formErrors.courseId && (

                    <p className="error-text">
                      {formErrors.courseId}
                    </p>

                  )}

                  {!coursesLoading &&
                    courses.length === 0 &&
                    !courseError && (

                      <p
                        style={{
                          marginTop: "6px",
                          fontSize: "12px",
                          color: "#dc2626",
                        }}
                      >
                        No courses available.
                        Create a course first.
                      </p>

                    )}

                </div>

                {/* =================================================
                    MODULE TITLE
                    ================================================= */}

                <div className="form-group">

                  <label htmlFor="module-title">

                    Module Title *

                  </label>

                  <input
                    id="module-title"
                    type="text"
                    value={form.title}
                    placeholder="e.g. HTML Basics"
                    disabled={isSubmitting}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        title:
                          e.target.value,
                      })
                    }
                  />

                  {formErrors.title && (

                    <p className="error-text">
                      {formErrors.title}
                    </p>

                  )}

                </div>

                {/* =================================================
                    DESCRIPTION
                    ================================================= */}

                <div className="form-group full-width">

                  <label htmlFor="module-description">

                    Description

                  </label>

                  <textarea
                    id="module-description"
                    rows={4}
                    value={form.description}
                    placeholder="What does this module cover?"
                    disabled={isSubmitting}
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

              {/* =================================================
                  FOOTER
                  ================================================= */}

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn-cancel"
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn-save"
                  onClick={saveModule}
                  disabled={
                    isSubmitting ||
                    coursesLoading ||
                    courses.length === 0
                  }
                >

                  <Save size={16} />

                  <span>
                    {isSubmitting
                      ? "Saving..."
                      : editing
                      ? "Update Module"
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
                    Its lessons, quizzes and
                    student progress will also
                    be removed.
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