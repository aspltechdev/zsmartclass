// src/pages/admin/AdminModules.jsx
import { useEffect, useState } from "react";
import {
  Layers,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  X,
  RefreshCw,
  AlertCircle,
  FileText,
  Save,
  Video,
  File,
  Link as LinkIcon,
  ChevronDown,
  ChevronRight,
  Minus,
  Play,
} from "lucide-react";
import api from "../../services/api";
import "./AdminModules.css";

function AdminModules() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewingModule, setViewingModule] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [previewingLesson, setPreviewingLesson] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showDeleteLessonConfirm, setShowDeleteLessonConfirm] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});

  // Form state for Module
  const [form, setForm] = useState({
    title: "",
    description: "",
  });

  // Form state for Lesson
  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    videoType: "VIDEO",
    attachment: "",
    isPreview: false,
    position: 1,
  });

  const [stats, setStats] = useState({
    total: 0,
    totalLessons: 0,
  });

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const res = await api.get("/modules");
      const data = res.data.data || res.data || [];
      setModules(data);
      calculateStats(data);
    } catch (err) {
      console.error("Error fetching modules:", err);
      setModules([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const total = data.length;
    let totalLessons = 0;
    data.forEach(m => totalLessons += (m.lessons?.length || 0));
    setStats({ total, totalLessons });
  };

  // ==========================================
  // MODULE CRUD
  // ==========================================
  const handleSaveModule = async () => {
    try {
      const errors = {};
      if (!form.title || form.title.trim() === "") {
        errors.title = "Module title is required";
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      setIsSubmitting(true);

      // ─── FIX: Get user from localStorage ──────────────────────────
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const data = {
        title: form.title.trim(),
        description: form.description || "",
        createdBy: user.id || 1,
      };

      let response;
      if (editing) {
        response = await api.put(`/modules/${editing.id}`, data);
      } else {
        response = await api.post("/modules", data);
      }

      setShowModal(false);
      setEditing(null);
      resetForm();
      await fetchModules();
      setIsSubmitting(false);
      setIsEditMode(false);
      setShowViewModal(false);
      
      alert(editing ? "Module updated successfully!" : "Module created successfully!");
    } catch (err) {
      setIsSubmitting(false);
      alert(err.response?.data?.message || "Failed to save module");
    }
  };

  const handleDeleteModule = async (id) => {
    try {
      await api.delete(`/modules/${id}`);
      await fetchModules();
      setShowDeleteConfirm(null);
      setShowViewModal(false);
      setIsEditMode(false);
      alert("Module deleted successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete module");
    }
  };

  // ==========================================
  // LESSON CRUD
  // ==========================================
  const handleSaveLesson = async () => {
    try {
      const errors = {};
      if (!lessonForm.title || lessonForm.title.trim() === "") {
        errors.title = "Lesson title is required";
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      setIsSubmitting(true);

      const data = {
        title: lessonForm.title.trim(),
        description: lessonForm.description || "",
        videoUrl: lessonForm.videoUrl || "",
        videoType: lessonForm.videoType || "VIDEO",
        attachment: lessonForm.attachment || "",
        isPreview: lessonForm.isPreview || false,
        position: parseInt(lessonForm.position) || 1,
        moduleId: viewingModule.id,
      };

      let response;
      if (editingLesson) {
        response = await api.put(`/lessons/${editingLesson.id}`, data);
      } else {
        response = await api.post("/lessons", data);
      }

      setShowLessonModal(false);
      setEditingLesson(null);
      resetLessonForm();
      await fetchModules();
      setIsSubmitting(false);
      
      // Refresh the viewing module data
      if (viewingModule) {
        const res = await api.get(`/modules/${viewingModule.id}`);
        setViewingModule(res.data.data || res.data);
      }
      
      alert(editingLesson ? "Lesson updated successfully!" : "Lesson created successfully!");
    } catch (err) {
      setIsSubmitting(false);
      alert(err.response?.data?.message || "Failed to save lesson");
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    try {
      await api.delete(`/lessons/${lessonId}`);
      await fetchModules();
      setShowDeleteLessonConfirm(null);
      
      // Refresh the viewing module data
      if (viewingModule) {
        const res = await api.get(`/modules/${viewingModule.id}`);
        setViewingModule(res.data.data || res.data);
      }
      
      alert("Lesson deleted successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete lesson");
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
    });
    setFormErrors({});
  };

  const resetLessonForm = () => {
    setLessonForm({
      title: "",
      description: "",
      videoUrl: "",
      videoType: "VIDEO",
      attachment: "",
      isPreview: false,
      position: 1,
    });
    setFormErrors({});
  };

  const openCreateModal = () => {
    setEditing(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (module) => {
    setEditing(module);
    setForm({
      title: module.title || "",
      description: module.description || "",
    });
    setIsEditMode(true);
    setShowViewModal(true);
    setFormErrors({});
  };

  const openViewModal = (module) => {
    setViewingModule(module);
    setIsEditMode(false);
    setShowViewModal(true);
  };

  const openLessonModal = (lesson = null) => {
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({
        title: lesson.title || "",
        description: lesson.description || "",
        videoUrl: lesson.videoUrl || "",
        videoType: lesson.videoType || "VIDEO",
        attachment: lesson.attachment || "",
        isPreview: lesson.isPreview || false,
        position: lesson.position || 1,
      });
    } else {
      setEditingLesson(null);
      resetLessonForm();
      const lessons = viewingModule?.lessons || [];
      setLessonForm(prev => ({
        ...prev,
        position: lessons.length + 1,
      }));
    }
    setShowLessonModal(true);
    setFormErrors({});
  };

  // ==========================================
  // LESSON PREVIEW
  // ==========================================
  const openPreviewModal = (lesson) => {
    setPreviewingLesson(lesson);
    setShowPreviewModal(true);
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    // If it's already an embed URL or direct video URL, return as is
    if (url.includes('embed') || url.match(/\.(mp4|webm|ogg)$/)) {
      return url;
    }
    
    return url;
  };

  const handleEditFromView = () => {
    if (viewingModule) {
      openEditModal(viewingModule);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    if (viewingModule) {
      setForm({
        title: viewingModule.title || "",
        description: viewingModule.description || "",
      });
    }
    setFormErrors({});
  };

  const handleDeleteFromView = () => {
    if (viewingModule) {
      setShowViewModal(false);
      setShowDeleteConfirm(viewingModule.id);
    }
  };

  const toggleExpand = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getVideoTypeIcon = (type) => {
    const icons = {
      VIDEO: <Video size={14} />,
      DOCUMENT: <FileText size={14} />,
      LINK: <LinkIcon size={14} />,
      FILE: <File size={14} />,
    };
    return icons[type] || <Video size={14} />;
  };

  const getVideoTypeColor = (type) => {
    const colors = {
      VIDEO: "#3b82f6",
      DOCUMENT: "#10b981",
      LINK: "#f59e0b",
      FILE: "#8b5cf6",
    };
    return colors[type] || "#64748b";
  };

  // Filter modules
  const filteredModules = modules.filter((module) => {
    const matchesSearch = module.title?.toLowerCase().includes(search.toLowerCase()) ||
                         module.description?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const videoTypes = ["VIDEO", "DOCUMENT", "LINK", "FILE"];

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
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Module Management</h1>
          <p className="subtitle">Create modules and manage lessons inside them</p>
        </div>
        <button className="add-btn" onClick={openCreateModal}>
          <Plus size={18} />
          New Module
        </button>
      </div>

      {/* Stats Cards */}
      <div className="module-stats">
        <div className="stat-card">
          <Layers size={24} />
          <div>
            <h3>{stats.total}</h3>
            <p>Total Modules</p>
          </div>
        </div>
        <div className="stat-card">
          <FileText size={24} />
          <div>
            <h3>{stats.totalLessons}</h3>
            <p>Total Lessons</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="refresh-btn" onClick={fetchModules}>
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Modules List */}
      <div className="modules-container">
        {filteredModules.length === 0 ? (
          <div className="empty-state">
            <Layers size={48} />
            <h3>No modules found</h3>
            <p>Create your first module to get started</p>
            <button className="add-btn" onClick={openCreateModal}>
              <Plus size={18} />
              Create Module
            </button>
          </div>
        ) : (
          <div className="module-grid">
            {filteredModules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                onView={openViewModal}
                onEdit={openEditModal}
                onDelete={() => setShowDeleteConfirm(module.id)}
                formatDate={formatDate}
                isExpanded={expandedModules[module.id] || false}
                onToggleExpand={toggleExpand}
              />
            ))}
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================== */}
      {showDeleteConfirm && (
        <div className="modal confirm-modal" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal-content confirm-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="confirm-body">
              <AlertCircle size={48} className="confirm-icon" />
              <p>Are you sure you want to delete this module?</p>
              <p className="confirm-sub">This action cannot be undone. All lessons inside will be deleted.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={() => handleDeleteModule(showDeleteConfirm)}>
                <Trash2 size={18} />
                Delete Module
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* CREATE/EDIT MODULE MODAL */}
      {/* ========================================== */}
      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? "Edit Module" : "Create Module"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Module Title *</label>
                <input
                  type="text"
                  name="title"
                  placeholder="Enter module title"
                  value={form.title}
                  onChange={(e) => {
                    setForm({ ...form, title: e.target.value });
                    setFormErrors({ ...formErrors, title: "" });
                  }}
                  className={formErrors.title ? "error" : ""}
                />
                {formErrors.title && <span className="error-text">{formErrors.title}</span>}
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  placeholder="Describe this module..."
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleSaveModule} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="spinner-small"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {editing ? "Update Module" : "Create Module"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* VIEW MODULE MODAL */}
      {/* ========================================== */}
      {showViewModal && viewingModule && (
        <div className="modal view-modal" onClick={() => {
          if (!isEditMode) setShowViewModal(false);
        }}>
          <div className="modal-content view-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditMode ? "Edit Module" : "Module Details"}</h2>
              <button className="modal-close" onClick={() => {
                if (isEditMode) {
                  handleCancelEdit();
                } else {
                  setShowViewModal(false);
                }
              }}>
                <X size={20} />
              </button>
            </div>

            <div className="view-body">
              <div className="view-info">
                {isEditMode ? (
                  // Edit Mode
                  <div className="edit-form">
                    <div className="view-header">
                      <h3>Edit Module</h3>
                    </div>

                    <div className="view-details-grid">
                      <div className="view-detail-item">
                        <label>Title *</label>
                        <input
                          type="text"
                          name="title"
                          placeholder="Enter module title"
                          value={form.title}
                          onChange={(e) => {
                            setForm({ ...form, title: e.target.value });
                            setFormErrors({ ...formErrors, title: "" });
                          }}
                          className={formErrors.title ? "error" : ""}
                        />
                        {formErrors.title && <span className="error-text">{formErrors.title}</span>}
                      </div>

                      <div className="view-detail-item full-width">
                        <label>Description</label>
                        <textarea
                          name="description"
                          placeholder="Describe this module..."
                          rows={2}
                          value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="view-header">
                      <h3>{viewingModule.title}</h3>
                    </div>

                    <div className="view-details-grid">
                      <div className="view-detail-item full-width">
                        <label>Description</label>
                        <span>{viewingModule.description || "No description"}</span>
                      </div>
                      <div className="view-detail-item">
                        <label>Total Lessons</label>
                        <span>{viewingModule.lessons?.length || 0}</span>
                      </div>
                      <div className="view-detail-item">
                        <label>Created</label>
                        <span>{formatDate(viewingModule.createdAt)}</span>
                      </div>
                      <div className="view-detail-item">
                        <label>Last Updated</label>
                        <span>{formatDate(viewingModule.updatedAt)}</span>
                      </div>
                    </div>

                    {/* ========================================== */}
                    {/* LESSONS SECTION INSIDE MODULE VIEW */}
                    {/* ========================================== */}
                    <div className="view-section lessons-section">
                      <div className="section-header-with-actions">
                        <h4>
                          <FileText size={16} />
                          Lessons
                        </h4>
                        <button 
                          className="btn-add-lesson"
                          onClick={() => openLessonModal()}
                        >
                          <Plus size={16} />
                          Add Lesson
                        </button>
                      </div>

                      {viewingModule.lessons && viewingModule.lessons.length > 0 ? (
                        <div className="lesson-list">
                          {viewingModule.lessons
                            .sort((a, b) => (a.position || 0) - (b.position || 0))
                            .map((lesson, index) => {
                              const Icon = getVideoTypeIcon(lesson.videoType);
                              const color = getVideoTypeColor(lesson.videoType);
                              const hasContent = lesson.videoUrl || lesson.attachment;
                              return (
                                <div key={lesson.id} className="lesson-item">
                                  <span className="lesson-number">{index + 1}.</span>
                                  <span 
                                    className="lesson-type-icon"
                                    style={{ color }}
                                  >
                                    {Icon}
                                  </span>
                                  <span className="lesson-title">{lesson.title}</span>
                                  <span 
                                    className="lesson-type-badge"
                                    style={{
                                      backgroundColor: color + '20',
                                      color: color,
                                    }}
                                  >
                                    {lesson.videoType}
                                  </span>
                                  {lesson.isPreview && (
                                    <span className="preview-badge">Preview</span>
                                  )}
                                  {hasContent && (
                                    <button
                                      className="preview-lesson-btn"
                                      onClick={() => openPreviewModal(lesson)}
                                      title="Preview Lesson"
                                    >
                                      <Play size={14} />
                                      Preview
                                    </button>
                                  )}
                                  <div className="lesson-actions">
                                    <button
                                      className="edit-lesson-btn"
                                      onClick={() => openLessonModal(lesson)}
                                      title="Edit Lesson"
                                    >
                                      <Edit size={14} />
                                    </button>
                                    <button
                                      className="delete-lesson-btn"
                                      onClick={() => setShowDeleteLessonConfirm(lesson.id)}
                                      title="Delete Lesson"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <div className="no-lessons">
                          <FileText size={32} />
                          <p>No lessons in this module yet.</p>
                          <button 
                            className="btn-add-lesson-secondary"
                            onClick={() => openLessonModal()}
                          >
                            <Plus size={16} />
                            Add First Lesson
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              {isEditMode ? (
                <>
                  <button className="btn-cancel" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                  <button className="btn-save" onClick={handleSaveModule} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="spinner-small"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Update Module
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-edit" onClick={handleEditFromView}>
                    <Edit size={18} />
                    Edit Module
                  </button>
                  <button className="btn-danger" onClick={handleDeleteFromView}>
                    <Trash2 size={18} />
                    Delete Module
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* LESSON CREATE/EDIT MODAL */}
      {/* ========================================== */}
      {showLessonModal && (
        <div className="modal" onClick={() => setShowLessonModal(false)}>
          <div className="modal-content lesson-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingLesson ? "Edit Lesson" : "Add New Lesson"}</h2>
              <button className="modal-close" onClick={() => setShowLessonModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Lesson Title *</label>
                <input
                  type="text"
                  name="title"
                  placeholder="Enter lesson title"
                  value={lessonForm.title}
                  onChange={(e) => {
                    setLessonForm({ ...lessonForm, title: e.target.value });
                    setFormErrors({ ...formErrors, title: "" });
                  }}
                  className={formErrors.title ? "error" : ""}
                />
                {formErrors.title && <span className="error-text">{formErrors.title}</span>}
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  placeholder="Describe this lesson..."
                  rows={2}
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Video Type</label>
                <select
                  name="videoType"
                  value={lessonForm.videoType}
                  onChange={(e) => setLessonForm({ ...lessonForm, videoType: e.target.value })}
                >
                  {videoTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Video URL</label>
                <input
                  type="text"
                  name="videoUrl"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={lessonForm.videoUrl}
                  onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Attachment URL</label>
                <input
                  type="text"
                  name="attachment"
                  placeholder="https://example.com/document.pdf"
                  value={lessonForm.attachment}
                  onChange={(e) => setLessonForm({ ...lessonForm, attachment: e.target.value })}
                />
              </div>

              {/* Position with Plus/Minus buttons */}
              <div className="form-group">
                <label>Position</label>
                <div className="position-control">
                  <button
                    type="button"
                    className="position-btn"
                    onClick={() => {
                      const currentPos = parseInt(lessonForm.position) || 1;
                      if (currentPos > 1) {
                        setLessonForm({ ...lessonForm, position: currentPos - 1 });
                      }
                    }}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="position-value">{lessonForm.position || 1}</span>
                  <button
                    type="button"
                    className="position-btn"
                    onClick={() => {
                      const currentPos = parseInt(lessonForm.position) || 1;
                      setLessonForm({ ...lessonForm, position: currentPos + 1 });
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <span className="field-hint">Lower numbers appear first in the module</span>
              </div>

              <div className="form-group">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    name="isPreview"
                    checked={lessonForm.isPreview}
                    onChange={(e) => setLessonForm({ ...lessonForm, isPreview: e.target.checked })}
                  />
                  <span>Preview Lesson (free for all users)</span>
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowLessonModal(false)}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleSaveLesson} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="spinner-small"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {editingLesson ? "Update Lesson" : "Add Lesson"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* LESSON PREVIEW MODAL */}
      {/* ========================================== */}
      {showPreviewModal && previewingLesson && (
        <div className="modal preview-modal" onClick={() => setShowPreviewModal(false)}>
          <div className="modal-content preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Play size={18} />
                Preview: {previewingLesson.title}
              </h2>
              <button className="modal-close" onClick={() => setShowPreviewModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="preview-body">
              {previewingLesson.videoUrl || previewingLesson.attachment ? (
                <div className="preview-container">
                  {previewingLesson.videoType === "VIDEO" && previewingLesson.videoUrl && (
                    <iframe
                      src={getEmbedUrl(previewingLesson.videoUrl)}
                      title={previewingLesson.title}
                      className="preview-iframe"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  )}

                  {previewingLesson.videoType === "LINK" && previewingLesson.videoUrl && (
                    <div className="preview-link">
                      <LinkIcon size={32} />
                      <a href={previewingLesson.videoUrl} target="_blank" rel="noopener noreferrer">
                        {previewingLesson.videoUrl}
                      </a>
                    </div>
                  )}

                  {previewingLesson.videoType === "DOCUMENT" && previewingLesson.attachment && (
                    <iframe
                      src={previewingLesson.attachment}
                      title={previewingLesson.title}
                      className="preview-iframe"
                    />
                  )}

                  {previewingLesson.videoType === "FILE" && previewingLesson.attachment && (
                    <div className="preview-file">
                      <File size={48} />
                      <a href={previewingLesson.attachment} target="_blank" rel="noopener noreferrer">
                        View File
                      </a>
                    </div>
                  )}

                  {previewingLesson.description && (
                    <div className="preview-description">
                      <h4>Description</h4>
                      <p>{previewingLesson.description}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="preview-empty">
                  <FileText size={48} />
                  <p>No content available for preview</p>
                  <small>Add a video URL or attachment to preview this lesson</small>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowPreviewModal(false)}>
                Close
              </button>
              <button className="btn-edit" onClick={() => {
                setShowPreviewModal(false);
                openLessonModal(previewingLesson);
              }}>
                <Edit size={18} />
                Edit Lesson
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* DELETE LESSON CONFIRMATION */}
      {/* ========================================== */}
      {showDeleteLessonConfirm && (
        <div className="modal confirm-modal" onClick={() => setShowDeleteLessonConfirm(null)}>
          <div className="modal-content confirm-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button className="modal-close" onClick={() => setShowDeleteLessonConfirm(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="confirm-body">
              <AlertCircle size={48} className="confirm-icon" />
              <p>Are you sure you want to delete this lesson?</p>
              <p className="confirm-sub">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowDeleteLessonConfirm(null)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={() => handleDeleteLesson(showDeleteLessonConfirm)}>
                <Trash2 size={18} />
                Delete Lesson
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// MODULE CARD COMPONENT
// ==========================================
function ModuleCard({ 
  module, 
  onView, 
  onEdit, 
  onDelete, 
  formatDate,
  isExpanded = false,
  onToggleExpand,
}) {
  const lessons = module.lessons || [];

  return (
    <div className="module-card">
      <div className="module-card-header">
        <div className="module-card-icon">
          <Layers size={20} />
        </div>
        <div className="module-card-info">
          <div className="module-card-title-row">
            <h4>{module.title}</h4>
            <button
              className="expand-btn"
              onClick={() => onToggleExpand(module.id)}
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
          <div className="module-card-meta">
            <span className="lesson-count">{lessons.length} lessons</span>
            <span className="date-badge">{formatDate(module.createdAt)}</span>
          </div>
        </div>
      </div>

      {module.description && (
        <p className="module-card-description">{module.description}</p>
      )}

      {/* Expanded Lessons Preview */}
      {isExpanded && lessons.length > 0 && (
        <div className="module-card-lessons-preview">
          <div className="preview-header">
            <FileText size={14} />
            <span>Lessons ({lessons.length})</span>
          </div>
          {lessons.slice(0, 5).map((lesson, idx) => (
            <div key={lesson.id} className="preview-lesson">
              <span className="preview-number">{idx + 1}.</span>
              <span className="preview-title">{lesson.title}</span>
            </div>
          ))}
          {lessons.length > 5 && (
            <div className="preview-more">+{lessons.length - 5} more lessons</div>
          )}
        </div>
      )}

      <div className="module-card-actions">
        <button
          title="View Details"
          className="view-btn"
          onClick={() => onView(module)}
        >
          <Eye size={16} />
        </button>
        <button
          title="Edit Module"
          className="edit-btn"
          onClick={() => onEdit(module)}
        >
          <Edit size={16} />
        </button>
        <button
          title="Delete Module"
          className="delete-btn"
          onClick={onDelete}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default AdminModules;