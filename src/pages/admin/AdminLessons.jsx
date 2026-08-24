// src/pages/admin/AdminLessons.jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  FileText, Plus, Edit, Trash2, X, Save, ArrowLeft, Play,
  Video, File, Link as LinkIcon, RefreshCw, Upload,
} from "lucide-react";
import api from "../../services/api";
import "./AdminLessons.css";
import "./AdminShared.css";

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
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  useEffect(() => { fetchModules(); }, []);
  useEffect(() => { if (moduleId) loadModule(moduleId); else setLoading(false); }, [moduleId]);

  // Navigating in from Modules keeps the previous scroll position, which left
  // the header (and "Add Lesson") hidden above the fold. Reset it on entry and
  // whenever the selected module changes.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.querySelector(".admin-content")?.scrollTo({ top: 0, behavior: "auto" });
  }, [moduleId]);

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

  // Upload a video file to our own server and store the returned URL.
  // Self-hosted files play in the native <video> element — no YouTube branding.
  const handleVideoUpload = async (file) => {
    if (!file) return;
    const data = new FormData();
    data.append("video", file);
    try {
      setUploading(true);
      setUploadPct(0);
      const res = await api.post("/lessons/upload-video", data, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) setUploadPct(Math.round((e.loaded * 100) / e.total));
        },
      });
      const url = res.data?.data?.url;
      if (url) {
        // absolute URL so the <video> tag resolves it from the API server
        const base = (api.defaults?.baseURL || "").replace(/\/$/, "").replace(/\/api$/, "");
        setForm((prev) => ({ ...prev, videoUrl: `${base}${url}`, videoType: "VIDEO" }));
      }
    } catch (err) {
      setFormErrors({ submit: err.response?.data?.message || "Video upload failed." });
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
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

  // A direct video file (self-hosted / CDN / S3) can play in a native <video>
  // element — no third-party branding at all, and the browser's own menu gives
  // playback speed, quality (for adaptive sources), PiP and fullscreen.
  const isDirectVideo = (url) =>
    !!url && /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(url.trim());

  const getEmbedUrl = (url) => {
    if (!url) return null;

    // YouTube — strip as much branding/related content as the embed API allows,
    // while keeping the controls bar so the quality (gear) menu stays available.
    //   rel=0            related videos limited to this channel
    //   modestbranding=1 minimise the YouTube logo
    //   iv_load_policy=3 hide annotations / cards
    //   controls=1       keep the control bar (needed for the quality setting)
    //   fs=1             allow fullscreen
    //   playsinline=1    don't force native fullscreen on mobile
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
    if (yt) {
      const params = new URLSearchParams({
        rel: "0",
        modestbranding: "1",
        iv_load_policy: "3",
        controls: "1",
        fs: "1",
        playsinline: "1",
        disablekb: "0",
      });
      return `https://www.youtube-nocookie.com/embed/${yt[1]}?${params.toString()}`;
    }

    // Vimeo — hide title, byline and portrait (channel/owner chrome)
    const vm = url.match(/(?:vimeo\.com\/)(\d+)/);
    if (vm) {
      return `https://player.vimeo.com/video/${vm[1]}?title=0&byline=0&portrait=0&dnt=1`;
    }

    return url;
  };

  // No module chosen yet — let the mentor pick one.
  if (!moduleId) {
    return (
      <div className="lessons-page">
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
      <div className="lessons-page">
        <div className="loading-state"><div className="spinner"></div><p>Loading lessons...</p></div>
      </div>
    );
  }

  return (
    <div className="lessons-page">
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

      <div className="lessons-container">
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
              <div className="form-group full-width">
                <label>Upload Video <span className="label-tag">recommended</span></label>
                <label className="video-upload-box">
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime"
                    onChange={(e) => handleVideoUpload(e.target.files?.[0])}
                    disabled={uploading}
                  />
                  {uploading ? (
                    <span className="upload-progress">
                      Uploading… {uploadPct}%
                      <span className="upload-bar">
                        <span className="upload-bar-fill" style={{ width: `${uploadPct}%` }} />
                      </span>
                    </span>
                  ) : (
                    <span className="upload-cta">
                      <Upload size={18} />
                      Choose a video file (MP4 / WebM)
                    </span>
                  )}
                </label>
                <span className="field-hint">
                  Uploaded videos play in a clean player with no channel name, logo or
                  “Watch on YouTube”. Max 500MB.
                </span>
              </div>

              <div className="form-group">
                <label>Content URL</label>
                <input value={form.videoUrl} placeholder="YouTube / Vimeo / direct link"
                       onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
                <span className="field-hint">Direct video files (.mp4 / .webm) play in a clean, branding-free player. YouTube &amp; Vimeo links embed, but YouTube always shows its own channel name and logo.</span>
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
                  {isDirectVideo(preview.videoUrl) ? (
                    /* Self-hosted file: clean native player, zero branding */
                    <video
                      className="preview-iframe"
                      src={preview.videoUrl}
                      controls
                      controlsList="nodownload"
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <iframe className="preview-iframe" src={getEmbedUrl(preview.videoUrl)}
                            title={preview.title}
                            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen />
                  )}
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