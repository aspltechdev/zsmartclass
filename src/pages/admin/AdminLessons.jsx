// src/pages/admin/AdminLessons.jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  FileText, Plus, Edit, Trash2, X, Save, ArrowLeft, Play,
  Video, File, Link as LinkIcon, RefreshCw,
} from "lucide-react";
import api from "../../services/api";
import "./AdminLessons.css";

const VIDEO_TYPES = ["VIDEO", "DOCUMENT", "LINK", "FILE"];

const EMPTY_LESSON = {
  title: "", description: "", videoUrl: "", videoType: "VIDEO",
  attachment: "", isPreview: false, position: 1,
};

function AdminLessons() {
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

  useEffect(() => { fetchModules(); }, []);
  useEffect(() => { if (moduleId) loadModule(moduleId); else setLoading(false); }, [moduleId]);

  const fetchModules = async () => {
    try {
      const res = await api.get("/modules");
      setModules(res.data?.data || res.data || []);
    } catch { setModules([]); }
  };

  const loadModule = async (id) => {
    try {
      setLoading(true); setError("");
      const res = await api.get(`/modules/${id}`);
      setModule(res.data?.data || res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't load this module.");
      setModule(null);
    } finally { setLoading(false); }
  };

  const lessons = module?.lessons || [];

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_LESSON, position: lessons.length + 1 });
    setFormErrors({}); setShowModal(true);
  };

  const openEdit = (lesson) => {
    setEditing(lesson);
    setForm({
      title: lesson.title || "", description: lesson.description || "",
      videoUrl: lesson.videoUrl || "", videoType: lesson.videoType || "VIDEO",
      attachment: lesson.attachment || "", isPreview: lesson.isPreview || false,
      position: lesson.position || 1,
    });
    setFormErrors({}); setShowModal(true);
  };

  const saveLesson = async () => {
    if (!form.title.trim()) { setFormErrors({ title: "Lesson title is required" }); return; }
    try {
      setIsSubmitting(true);
      const payload = {
        title: form.title.trim(), description: form.description || "",
        videoUrl: form.videoUrl || "", videoType: form.videoType || "VIDEO",
        attachment: form.attachment || "", isPreview: form.isPreview || false,
        position: parseInt(form.position) || 1, moduleId: Number(moduleId),
      };
      if (editing) await api.put(`/lessons/${editing.id}`, payload);
      else await api.post("/lessons", payload);
      setShowModal(false); setEditing(null); setForm(EMPTY_LESSON);
      await loadModule(moduleId);
    } catch (err) {
      setFormErrors({ submit: err.response?.data?.message || "Failed to save lesson." });
    } finally { setIsSubmitting(false); }
  };

  const deleteLesson = async (id) => {
    try {
      await api.delete(`/lessons/${id}`);
      setDeleteTarget(null);
      await loadModule(moduleId);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete lesson.");
      setDeleteTarget(null);
    }
  };

  const typeIcon = (t) => ({ VIDEO: <Video size={14} />, DOCUMENT: <FileText size={14} />,
    LINK: <LinkIcon size={14} />, FILE: <File size={14} /> }[t] || <Video size={14} />);
  const typeColor = (t) => ({ VIDEO: "#3b82f6", DOCUMENT: "#10b981",
    LINK: "#f59e0b", FILE: "#8b5cf6" }[t] || "#64748b");

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
    const vm = url.match(/(?:vimeo\.com\/)(\d+)/);
    if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
    return url;
  };

  // No module chosen yet — let the mentor pick one.
  if (!moduleId) {
    return (
      <div className="modules-page">
        <div className="page-header">
          <div><h1>Lessons</h1><p className="subtitle">Pick a module to manage its lessons</p></div>
          <button className="refresh-btn" onClick={() => navigate("/admin/modules")}>
            <ArrowLeft size={18} />
          </button>
        </div>
        <div className="empty-state">
          <FileText size={48} />
          <h3>Select a module</h3>
          <p>Choose which module's lessons you want to manage.</p>
          <select className="module-picker"
                  onChange={(e) => e.target.value && setParams({ moduleId: e.target.value })}
                  defaultValue="">
            <option value="">Select a module…</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} ({m.lessons?.length || 0} lessons)
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
        <div className="loading-state"><div className="spinner"></div><p>Loading lessons...</p></div>
      </div>
    );
  }

  return (
    <div className="modules-page">
      <div className="page-header">
        <div>
          <button className="back-link" onClick={() => navigate("/admin/modules")}>
            <ArrowLeft size={15} /> Back to Modules
          </button>
          <h1>{module?.title || "Lessons"}</h1>
          <p className="subtitle">{lessons.length} lesson{lessons.length === 1 ? "" : "s"} in this module</p>
        </div>
        <button className="add-btn" onClick={openCreate}><Plus size={18} /> Add Lesson</button>
      </div>

      {error && <div className="error-text">{error}</div>}

      <div className="modules-container">
        {lessons.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <h3>No lessons yet</h3>
            <p>Add the first lesson to this module</p>
            <button className="add-btn" onClick={openCreate}><Plus size={18} /> Add Lesson</button>
          </div>
        ) : (
          <div className="lesson-list">
            {lessons.map((lesson, idx) => (
              <div className="lesson-item" key={lesson.id}>
                <span className="lesson-number">{idx + 1}</span>
                <div className="lesson-title">
                  <strong>{lesson.title}</strong>
                  <span className="lesson-type-badge"
                        style={{ background: `${typeColor(lesson.videoType)}18`,
                                 color: typeColor(lesson.videoType) }}>
                    <span className="lesson-type-icon">{typeIcon(lesson.videoType)}</span>
                    {lesson.videoType || "VIDEO"}
                  </span>
                  {lesson.isPreview && <span className="preview-badge">Free preview</span>}
                </div>
                <div className="lesson-actions">
                  {lesson.videoUrl && (
                    <button className="preview-lesson-btn" title="Preview"
                            onClick={() => setPreview(lesson)}><Play size={14} /></button>
                  )}
                  <button className="edit-lesson-btn" title="Edit"
                          onClick={() => openEdit(lesson)}><Edit size={14} /></button>
                  <button className="delete-lesson-btn" title="Delete"
                          onClick={() => setDeleteTarget(lesson.id)}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lesson form */}
      {showModal && createPortal(
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content lesson-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? "Edit Lesson" : "Add Lesson"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {formErrors.submit && <p className="error-text">{formErrors.submit}</p>}
              <div className="form-group">
                <label>Lesson Title *</label>
                <input value={form.title} placeholder="e.g. Introduction to Tags"
                       onChange={(e) => setForm({ ...form, title: e.target.value })} />
                {formErrors.title && <p className="error-text">{formErrors.title}</p>}
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea rows={3} value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Content Type</label>
                <select value={form.videoType}
                        onChange={(e) => setForm({ ...form, videoType: e.target.value })}>
                  {VIDEO_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Content URL</label>
                <input value={form.videoUrl} placeholder="YouTube / Vimeo / direct link"
                       onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
                <span className="field-hint">YouTube and Vimeo links embed automatically.</span>
              </div>
              <div className="form-group">
                <label>Attachment URL</label>
                <input value={form.attachment} placeholder="Optional resource link"
                       onChange={(e) => setForm({ ...form, attachment: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Position</label>
                <input type="number" min="1" value={form.position}
                       onChange={(e) => setForm({ ...form, position: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="toggle-label">
                  <input type="checkbox" checked={form.isPreview}
                         onChange={(e) => setForm({ ...form, isPreview: e.target.checked })} />
                  Free preview lesson
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)} disabled={isSubmitting}>Cancel</button>
              <button className="btn-save" onClick={saveLesson} disabled={isSubmitting}>
                <Save size={16} /> {isSubmitting ? "Saving…" : "Save Lesson"}
              </button>
            </div>
          </div>
        </div>, document.body)}

      {/* Preview */}
      {preview && createPortal(
        <div className="modal" onClick={() => setPreview(null)}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{preview.title}</h2>
              <button className="modal-close" onClick={() => setPreview(null)}><X size={20} /></button>
            </div>
            <div className="modal-body preview-body">
              {preview.videoUrl ? (
                <div className="preview-container">
                  <iframe className="preview-iframe" src={getEmbedUrl(preview.videoUrl)}
                          title={preview.title} allowFullScreen />
                </div>
              ) : (
                <div className="preview-empty"><p>No content URL for this lesson.</p></div>
              )}
              {preview.description && <p className="preview-description">{preview.description}</p>}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setPreview(null)}>Close</button>
            </div>
          </div>
        </div>, document.body)}

      {/* Delete confirm */}
      {deleteTarget && createPortal(
        <div className="modal" onClick={() => setDeleteTarget(null)}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-content">
              <div className="confirm-icon"><Trash2 size={24} /></div>
              <div className="confirm-body">
                <h3>Delete this lesson?</h3>
                <p className="confirm-sub">This can't be undone.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => deleteLesson(deleteTarget)}>Delete Lesson</button>
            </div>
          </div>
        </div>, document.body)}
    </div>
  );
}

export default AdminLessons;