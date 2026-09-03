// src/pages/mentor/Lessons.jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  ArrowLeft,
  Play,
  Video,
  File,
  Link as LinkIcon,
  RefreshCw,
} from "lucide-react";
import api from "../../services/api";
import "./Lessons.css";
import "./MentorShared.css";

const VIDEO_TYPES = ["VIDEO", "DOCUMENT", "LINK", "FILE"];

const EMPTY_LESSON = {
  title: "",
  description: "",
  videoUrl: "",
  videoType: "VIDEO",
  attachment: "",
  isPreview: false,
  position: 1,
};

function Lessons() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const moduleId = params.get("moduleId") || "";

  const [modules, setModules] = useState([]);
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_LESSON);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchModules();
  }, []);

  useEffect(() => {
    if (moduleId) {
      loadModule(moduleId);
    } else {
      setLoading(false);
    }
  }, [moduleId]);

  // Arriving from Modules keeps the old scroll position, which hides the
  // header and "Add Lesson" above the fold. Reset it on entry.
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    document.querySelector(".mentor-content")?.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }, [moduleId]);

  const fetchModules = async () => {
    try {
      const res = await api.get("/modules");
      setModules(res.data?.data || res.data || []);
    } catch {
      setModules([]);
    }
  };

  const loadModule = async (id) => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get(`/modules/${id}`);

      setModule(res.data?.data || res.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Couldn't load this module."
      );

      setModule(null);
    } finally {
      setLoading(false);
    }
  };

  const lessons = module?.lessons || [];

  const openCreate = () => {
    setEditing(null);

    setForm({
      ...EMPTY_LESSON,
      position: lessons.length + 1,
    });

    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (lesson) => {
    setEditing(lesson);

    setForm({
      title: lesson.title || "",
      description: lesson.description || "",
      videoUrl: lesson.videoUrl || "",
      videoType: lesson.videoType || "VIDEO",
      attachment: lesson.attachment || "",
      isPreview: lesson.isPreview || false,
      position: lesson.position || 1,
    });

    setFormErrors({});
    setShowModal(true);
  };

  /* =========================================================
     URL VALIDATION
     ========================================================= */

  const isValidHttpUrl = (url) => {
    try {
      const parsed = new URL(url.trim());

      return (
        parsed.protocol === "http:" ||
        parsed.protocol === "https:"
      );
    } catch {
      return false;
    }
  };

  const isYouTubeUrl = (url) => {
    if (!url) return false;

    const value = url.trim();

    return (
      /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[^&\s]+/i.test(
        value
      ) ||
      /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[^/?\s]+/i.test(
        value
      ) ||
      /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[^/?\s]+/i.test(
        value
      ) ||
      /^(https?:\/\/)?youtu\.be\/[^/?\s]+/i.test(
        value
      )
    );
  };

  const isGoogleDriveUrl = (url) => {
    if (!url) return false;

    const value = url.trim();

    return (
      /^https?:\/\/(www\.)?drive\.google\.com\/file\/d\/[^/]+/i.test(
        value
      ) ||
      /^https?:\/\/(www\.)?drive\.google\.com\/open\?id=[^&\s]+/i.test(
        value
      ) ||
      /^https?:\/\/(www\.)?drive\.google\.com\/uc\?.*id=[^&\s]+/i.test(
        value
      )
    );
  };

  const validateContentUrl = (type, url) => {
    if (!url.trim()) {
      return "Content URL is required.";
    }

    switch (type) {
      case "VIDEO":
        if (
          !isYouTubeUrl(url) &&
          !isGoogleDriveUrl(url)
        ) {
          return "VIDEO must use a YouTube or Google Drive URL.";
        }
        break;

      case "DOCUMENT":
        if (!isGoogleDriveUrl(url)) {
          return "DOCUMENT must use a Google Drive URL.";
        }
        break;

      case "LINK":
        if (!isValidHttpUrl(url)) {
          return "LINK must be a valid HTTP or HTTPS URL.";
        }
        break;

      case "FILE":
        if (!isValidHttpUrl(url)) {
          return "FILE must have a valid HTTP or HTTPS URL.";
        }
        break;

      default:
        return "Please select a valid content type.";
    }

    return "";
  };

  /* =========================================================
     SAVE LESSON
     ========================================================= */

  const saveLesson = async () => {
    const errors = {};

    if (!form.title.trim()) {
      errors.title = "Lesson title is required";
    }

    const urlError = validateContentUrl(
      form.videoType,
      form.videoUrl
    );

    if (urlError) {
      errors.videoUrl = urlError;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        title: form.title.trim(),
        description: form.description || "",
        videoUrl: form.videoUrl.trim(),
        videoType: form.videoType || "VIDEO",
        attachment: form.attachment || "",
        isPreview: form.isPreview || false,
        position: parseInt(form.position) || 1,
        moduleId: Number(moduleId),
      };

      if (editing) {
        await api.put(
          `/lessons/${editing.id}`,
          payload
        );
      } else {
        await api.post("/lessons", payload);
      }

      setShowModal(false);
      setEditing(null);
      setForm(EMPTY_LESSON);
      setFormErrors({});

      await loadModule(moduleId);
    } catch (err) {
      setFormErrors({
        submit:
          err.response?.data?.message ||
          "Failed to save lesson.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteLesson = async (id) => {
    try {
      await api.delete(`/lessons/${id}`);

      setDeleteTarget(null);

      await loadModule(moduleId);
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Failed to delete lesson."
      );

      setDeleteTarget(null);
    }
  };

  const typeIcon = (t) =>
    ({
      VIDEO: <Video size={14} />,
      DOCUMENT: <FileText size={14} />,
      LINK: <LinkIcon size={14} />,
      FILE: <File size={14} />,
    }[t] || <Video size={14} />);

  const typeColor = (t) =>
    ({
      VIDEO: "#3b82f6",
      DOCUMENT: "#10b981",
      LINK: "#f59e0b",
      FILE: "#8b5cf6",
    }[t] || "#64748b");

  /* =========================================================
     PREVIEW URL

     VIDEO:
       YouTube -> YouTube embed
       Google Drive -> Google Drive preview

     DOCUMENT:
       Google Drive -> Google Drive preview

     LINK / FILE:
       Uses the supplied URL in an iframe.

     Vimeo and direct video playback are not supported.
     ========================================================= */

  const getEmbedUrl = (url) => {
    if (!url) return null;

    const value = url.trim();

    /* ---------- YouTube ---------- */

    const yt = value.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&?/]+)/
    );

    if (yt) {
      const params = new URLSearchParams({
        rel: "0",
        modestbranding: "1",
        iv_load_policy: "3",
        controls: "1",
        fs: "1",
        playsinline: "1",
      });

      return `https://www.youtube-nocookie.com/embed/${yt[1]}?${params.toString()}`;
    }

    /* ---------- Google Drive ---------- */

    const driveFile = value.match(
      /drive\.google\.com\/file\/d\/([^/]+)/
    );

    if (driveFile) {
      return `https://drive.google.com/file/d/${driveFile[1]}/preview`;
    }

    const driveOpen = value.match(
      /drive\.google\.com\/open\?id=([^&]+)/
    );

    if (driveOpen) {
      return `https://drive.google.com/file/d/${driveOpen[1]}/preview`;
    }

    const driveUc = value.match(
      /drive\.google\.com\/uc\?.*id=([^&]+)/
    );

    if (driveUc) {
      return `https://drive.google.com/file/d/${driveUc[1]}/preview`;
    }

    /* ---------- LINK / FILE ---------- */

    if (isValidHttpUrl(value)) {
      return value;
    }

    return null;
  };

  // No module chosen yet — let the mentor pick one.
  if (!moduleId) {
    return (
      <div className="modules-page">
        <div className="page-header">
          <div>
            <h1>Lessons</h1>

            <p className="subtitle">
              Pick a module to manage its lessons
            </p>
          </div>

          <button
            className="refresh-btn"
            onClick={() =>
              navigate("/mentor/modules")
            }
          >
            <ArrowLeft size={18} />
          </button>
        </div>

        <div className="empty-state">
          <FileText size={48} />

          <h3>Select a module</h3>

          <p>
            Choose which module's lessons you want
            to manage.
          </p>

          <select
            className="module-picker"
            onChange={(e) =>
              e.target.value &&
              setParams({
                moduleId: e.target.value,
              })
            }
            defaultValue=""
          >
            <option value="">
              Select a module…
            </option>

            {modules.map((m) => (
              <option
                key={m.id}
                value={m.id}
              >
                {m.title} (
                {m.lessons?.length || 0} lessons)
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="modules-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading lessons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modules-page">
      <div className="page-header">
        <div>
          <button
            className="back-link"
            onClick={() =>
              navigate("/mentor/modules")
            }
          >
            <ArrowLeft size={15} />
            Back to Modules
          </button>

          <h1>
            {module?.title || "Lessons"}
          </h1>

          <p className="subtitle">
            {lessons.length} lesson
            {lessons.length === 1 ? "" : "s"} in this
            module
          </p>
        </div>

        <button
          className="add-btn"
          onClick={openCreate}
        >
          <Plus size={18} />
          Add Lesson
        </button>
      </div>

      {error && (
        <div className="error-text">
          {error}
        </div>
      )}

      <div className="modules-container">
        {lessons.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />

            <h3>No lessons yet</h3>

            <p>
              Add the first lesson to this module
            </p>

            <button
              className="add-btn"
              onClick={openCreate}
            >
              <Plus size={18} />
              Add Lesson
            </button>
          </div>
        ) : (
          <div className="lesson-list">
            {lessons.map((lesson, idx) => (
              <div
                className="lesson-item"
                key={lesson.id}
              >
                <span className="lesson-number">
                  {idx + 1}
                </span>

                <div className="lesson-title">
                  <strong>
                    {lesson.title}
                  </strong>

                  <span
                    className="lesson-type-badge"
                    style={{
                      background: `${typeColor(
                        lesson.videoType
                      )}18`,
                      color: typeColor(
                        lesson.videoType
                      ),
                    }}
                  >
                    <span className="lesson-type-icon">
                      {typeIcon(
                        lesson.videoType
                      )}
                    </span>

                    {lesson.videoType || "VIDEO"}
                  </span>
                </div>

                <div className="lesson-actions">
                  {lesson.videoUrl && (
                    <button
                      className="preview-lesson-btn"
                      title="Preview"
                      onClick={() =>
                        setPreview(lesson)
                      }
                    >
                      <Play size={14} />
                    </button>
                  )}

                  <button
                    className="edit-lesson-btn"
                    title="Edit"
                    onClick={() =>
                      openEdit(lesson)
                    }
                  >
                    <Edit size={14} />
                  </button>

                  <button
                    className="delete-lesson-btn"
                    title="Delete"
                    onClick={() =>
                      setDeleteTarget(
                        lesson.id
                      )
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =====================================================
          LESSON FORM
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
              className="modal-content lesson-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="modal-header">
                <h2>
                  {editing
                    ? "Edit Lesson"
                    : "Add Lesson"}
                </h2>

                <button
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
                    Lesson Title *
                  </label>

                  <input
                    value={form.title}
                    placeholder="e.g. Introduction to Tags"
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

                <div className="form-group full-width">
                  <label>
                    Description
                  </label>

                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>
                    Content Type
                  </label>

                  <select
                    value={form.videoType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        videoType:
                          e.target.value,
                        videoUrl: "",
                      })
                    }
                  >
                    {VIDEO_TYPES.map((t) => (
                      <option
                        key={t}
                        value={t}
                      >
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Content URL *
                  </label>

                  <input
                    value={form.videoUrl}
                    placeholder={
                      form.videoType ===
                      "VIDEO"
                        ? "Paste YouTube or Google Drive video URL"
                        : form.videoType ===
                          "DOCUMENT"
                        ? "Paste Google Drive document URL"
                        : form.videoType ===
                          "LINK"
                        ? "Paste website URL"
                        : "Paste file URL"
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        videoUrl:
                          e.target.value,
                      })
                    }
                  />

                  {formErrors.videoUrl && (
                    <p className="error-text">
                      {formErrors.videoUrl}
                    </p>
                  )}

                  <span className="field-hint">
                    {form.videoType ===
                      "VIDEO" &&
                      "YouTube or Google Drive video only."}

                    {form.videoType ===
                      "DOCUMENT" &&
                      "Google Drive document only."}

                    {form.videoType ===
                      "LINK" &&
                      "Any valid HTTP or HTTPS website URL."}

                    {form.videoType ===
                      "FILE" &&
                      "Enter a valid HTTP or HTTPS file URL."}
                  </span>
                </div>

                <div className="form-group">
                  <label>
                    Attachment URL
                  </label>

                  <input
                    value={form.attachment}
                    placeholder="Optional resource link"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        attachment:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>
                    Position
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={form.position}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        position:
                          e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-cancel"
                  onClick={() =>
                    setShowModal(false)
                  }
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  className="btn-save"
                  onClick={saveLesson}
                  disabled={isSubmitting}
                >
                  <Save size={16} />

                  {isSubmitting
                    ? "Saving…"
                    : "Save Lesson"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* =====================================================
          PREVIEW
          ===================================================== */}

      {preview &&
        createPortal(
          <div
            className="modal"
            onClick={() =>
              setPreview(null)
            }
          >
            <div
              className="modal-content preview-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="modal-header">
                <h2>
                  {preview.title}
                </h2>

                <button
                  className="modal-close"
                  onClick={() =>
                    setPreview(null)
                  }
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body preview-body">
                {preview.videoUrl &&
                getEmbedUrl(
                  preview.videoUrl
                ) ? (
                  <div className="preview-container">
                    <iframe
                      className="preview-iframe"
                      src={getEmbedUrl(
                        preview.videoUrl
                      )}
                      title={preview.title}
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="preview-empty">
                    <p>
                      This lesson does not have
                      a valid preview URL.
                    </p>
                  </div>
                )}

                {preview.description && (
                  <p className="preview-description">
                    {preview.description}
                  </p>
                )}
              </div>

              <div className="modal-footer">
                <button
                  className="btn-cancel"
                  onClick={() =>
                    setPreview(null)
                  }
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* =====================================================
          DELETE CONFIRM
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
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="confirm-content">
                <div className="confirm-icon">
                  <Trash2 size={24} />
                </div>

                <div className="confirm-body">
                  <h3>
                    Delete this lesson?
                  </h3>

                  <p className="confirm-sub">
                    This can't be undone.
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-cancel"
                  onClick={() =>
                    setDeleteTarget(null)
                  }
                >
                  Cancel
                </button>

                <button
                  className="btn-danger"
                  onClick={() =>
                    deleteLesson(
                      deleteTarget
                    )
                  }
                >
                  Delete Lesson
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default Lessons;