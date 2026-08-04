// src/pages/admin/AdminLessons.jsx
import { useEffect, useState } from "react";
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Video,
  File,
  Link as LinkIcon,
  Clock,
  BookOpen,
  X,
  Save,
  RefreshCw,
  AlertCircle,
  Layers,
  Calendar,
  PlayCircle,
  FileCheck,
  Copy,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import api from "../../services/api";
import "./AdminLessons.css";

function AdminLessons() {
  const [lessons, setLessons] = useState([]);
  const [modules, setModules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [videoTypeFilter, setVideoTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewingLesson, setViewingLesson] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form state - Matches your schema
  const [form, setForm] = useState({
    title: "",
    description: "",
    videoType: "VIDEO",
    videoUrl: "",
    attachment: "",
    duration: "",
    position: 0,
    isPreview: false,
    moduleId: "",
  });

  const [stats, setStats] = useState({
    total: 0,
    video: 0,
    document: 0,
    link: 0,
  });

  const videoTypes = [
    { value: "VIDEO", label: "Video", icon: Video },
    { value: "DOCUMENT", label: "Document", icon: File },
    { value: "LINK", label: "Link", icon: LinkIcon },
    { value: "FILE", label: "File", icon: FileText },
  ];

  useEffect(() => {
    fetchLessons();
    fetchModules();
    fetchCourses();
  }, []);

  // Fetch lessons
  const fetchLessons = async () => {
    try {
      setLoading(true);
      const res = await api.get("/lessons");
      const data = res.data.data || res.data || [];
      setLessons(data);
      calculateStats(data);
    } catch (err) {
      console.error("Error fetching lessons:", err);
      setLessons([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch modules
  const fetchModules = async () => {
    try {
      const res = await api.get("/modules");
      const data = res.data.data || res.data || [];
      setModules(data);
    } catch (err) {
      console.error("Error fetching modules:", err);
      setModules([]);
    }
  };

  // Fetch courses
  const fetchCourses = async () => {
    try {
      const res = await api.get("/courses");
      const data = res.data.data || res.data || [];
      setCourses(data);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setCourses([]);
    }
  };

  // Calculate stats
  const calculateStats = (data) => {
    const total = data.length;
    const video = data.filter(l => l.videoType === "VIDEO").length;
    const document = data.filter(l => l.videoType === "DOCUMENT").length;
    const link = data.filter(l => l.videoType === "LINK").length;

    setStats({ total, video, document, link });
  };

  // Save lesson
  const handleSaveLesson = async () => {
    try {
      const errors = {};
      if (!form.title || form.title.trim() === "") {
        errors.title = "Lesson title is required";
      }
      if (!form.moduleId) {
        errors.moduleId = "Module is required";
      }
      if (!form.videoType) {
        errors.videoType = "Video type is required";
      }
      if (!form.duration || form.duration <= 0) {
        errors.duration = "Valid duration is required";
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      setIsSubmitting(true);

      const data = {
        title: form.title.trim(),
        description: form.description || "",
        videoType: form.videoType,
        videoUrl: form.videoUrl || "",
        attachment: form.attachment || "",
        duration: parseInt(form.duration) || 0,
        position: parseInt(form.position) || 0,
        isPreview: form.isPreview || false,
        moduleId: parseInt(form.moduleId),
      };

      let response;
      if (editing) {
        response = await api.put(`/lessons/${editing.id}`, data);
      } else {
        response = await api.post("/lessons", data);
      }

      console.log("✅ Lesson saved:", response.data);

      setShowModal(false);
      setEditing(null);
      resetForm();
      await fetchLessons();
      setIsSubmitting(false);
      setIsEditMode(false);
      setShowViewModal(false);
      alert(editing ? "Lesson updated successfully!" : "Lesson created successfully!");
    } catch (err) {
      setIsSubmitting(false);
      console.error("❌ Save error:", err);
      console.error("❌ Response:", err.response);
      
      let errorMessage = "Failed to save lesson";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.errors) {
        const validationErrors = Object.values(err.response.data.errors).flat().join(", ");
        errorMessage = `Validation error: ${validationErrors}`;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert("Error: " + errorMessage);
    }
  };

  // Delete lesson
  const handleDeleteLesson = async (id) => {
    try {
      await api.delete(`/lessons/${id}`);
      await fetchLessons();
      setShowDeleteConfirm(null);
      setShowViewModal(false);
      setIsEditMode(false);
      alert("Lesson deleted successfully!");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete lesson";
      alert(message);
      console.error("Delete error:", err);
    }
  };

  // Reset form
  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      videoType: "VIDEO",
      videoUrl: "",
      attachment: "",
      duration: "",
      position: 0,
      isPreview: false,
      moduleId: "",
    });
    setFormErrors({});
  };

  // Open create modal
  const openCreateModal = () => {
    setEditing(null);
    resetForm();
    // Calculate next position for the selected module
    let maxPosition = 0;
    if (form.moduleId) {
      const moduleLessons = lessons.filter(l => l.moduleId === parseInt(form.moduleId));
      maxPosition = moduleLessons.length;
    } else {
      maxPosition = lessons.length;
    }
    setForm(prev => ({ ...prev, position: maxPosition + 1 }));
    setShowModal(true);
  };

  // Open edit from view modal (inline edit)
  const openEditFromView = () => {
    if (viewingLesson) {
      setEditing(viewingLesson);
      setForm({
        title: viewingLesson.title || "",
        description: viewingLesson.description || "",
        videoType: viewingLesson.videoType || "VIDEO",
        videoUrl: viewingLesson.videoUrl || "",
        attachment: viewingLesson.attachment || "",
        duration: viewingLesson.duration || "",
        position: viewingLesson.position || 0,
        isPreview: viewingLesson.isPreview || false,
        moduleId: viewingLesson.moduleId || "",
      });
      setIsEditMode(true);
      setFormErrors({});
    }
  };

  // Cancel edit mode (switch back to view mode)
  const handleCancelEdit = () => {
    setIsEditMode(false);
    if (viewingLesson) {
      setForm({
        title: viewingLesson.title || "",
        description: viewingLesson.description || "",
        videoType: viewingLesson.videoType || "VIDEO",
        videoUrl: viewingLesson.videoUrl || "",
        attachment: viewingLesson.attachment || "",
        duration: viewingLesson.duration || "",
        position: viewingLesson.position || 0,
        isPreview: viewingLesson.isPreview || false,
        moduleId: viewingLesson.moduleId || "",
      });
    }
    setFormErrors({});
  };

  // Open view modal
  const openViewModal = (lesson) => {
    setViewingLesson(lesson);
    setIsEditMode(false);
    setShowViewModal(true);
  };

  // Handle delete from view modal
  const handleDeleteFromView = () => {
    if (viewingLesson) {
      setShowViewModal(false);
      setShowDeleteConfirm(viewingLesson.id);
    }
  };

  // Get module title by ID
  const getModuleTitle = (moduleId) => {
    const module = modules.find(m => m.id === moduleId);
    return module ? module.title : "Unknown Module";
  };

  // Get course title by module ID
  const getCourseTitleByModule = (moduleId) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return "Unknown Course";
    const course = courses.find(c => c.id === module.courseId);
    return course ? course.title : "Unknown Course";
  };

  // Get video type icon
  const getVideoTypeIcon = (type) => {
    const found = videoTypes.find(vt => vt.value === type);
    return found ? found.icon : Video;
  };

  // Get video type color
  const getVideoTypeColor = (type) => {
    const colors = {
      VIDEO: "#3b82f6",
      DOCUMENT: "#10b981",
      LINK: "#f59e0b",
      FILE: "#8b5cf6",
    };
    return colors[type] || "#64748b";
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format duration
  const formatDuration = (minutes) => {
    if (!minutes) return "—";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Filter lessons
  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch = lesson.title?.toLowerCase().includes(search.toLowerCase()) ||
                         lesson.description?.toLowerCase().includes(search.toLowerCase());
    const matchesModule = !moduleFilter || lesson.moduleId === Number(moduleFilter);
    const matchesVideoType = videoTypeFilter === "all" || lesson.videoType === videoTypeFilter;
    
    let matchesCourse = true;
    if (courseFilter) {
      const module = modules.find(m => m.id === lesson.moduleId);
      matchesCourse = module && module.courseId === Number(courseFilter);
    }
    
    return matchesSearch && matchesModule && matchesVideoType && matchesCourse;
  });

  // Group lessons by module
  const groupedLessons = filteredLessons.reduce((acc, lesson) => {
    const key = lesson.moduleId;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(lesson);
    return acc;
  }, {});

  // Sort lessons by position within each group
  Object.keys(groupedLessons).forEach(key => {
    groupedLessons[key].sort((a, b) => (a.position || 0) - (b.position || 0));
  });

  // Get filtered modules based on course filter
  const getFilteredModules = () => {
    if (!courseFilter) return modules;
    return modules.filter(m => m.courseId === Number(courseFilter));
  };

  const filteredModules = getFilteredModules();

  // Handle course filter change - reset module filter
  const handleCourseFilterChange = (e) => {
    setCourseFilter(e.target.value);
    setModuleFilter(""); // Reset module filter when course changes
  };

  if (loading) {
    return (
      <div className="lessons-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading lessons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lessons-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Lesson Management</h1>
          <p className="subtitle">Manage all lessons across modules and courses</p>
        </div>
        <button className="add-btn" onClick={openCreateModal}>
          <Plus size={18} />
          New Lesson
        </button>
      </div>

      {/* Stats Cards */}
      <div className="lesson-stats">
        <div className="stat-card">
          <FileText size={24} />
          <div>
            <h3>{stats.total}</h3>
            <p>Total Lessons</p>
          </div>
        </div>
        <div className="stat-card">
          <Video size={24} />
          <div>
            <h3>{stats.video}</h3>
            <p>Videos</p>
          </div>
        </div>
        <div className="stat-card">
          <File size={24} />
          <div>
            <h3>{stats.document}</h3>
            <p>Documents</p>
          </div>
        </div>
        <div className="stat-card">
          <LinkIcon size={24} />
          <div>
            <h3>{stats.link}</h3>
            <p>Links</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Search lessons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={courseFilter}
          onChange={handleCourseFilterChange}
        >
          <option value="">All Courses</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
        >
          <option value="">All Modules</option>
          {filteredModules.map((module) => (
            <option key={module.id} value={module.id}>
              {module.title}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={videoTypeFilter}
          onChange={(e) => setVideoTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          {videoTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <button className="refresh-btn" onClick={fetchLessons}>
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Lessons List */}
      <div className="lessons-container">
        {Object.keys(groupedLessons).length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} />
            <h3>No lessons found</h3>
            <p>Create your first lesson to start building course content</p>
            <button className="add-btn" onClick={openCreateModal}>
              <Plus size={18} />
              Create Lesson
            </button>
          </div>
        ) : (
          Object.keys(groupedLessons).map((moduleId) => {
            const moduleLessons = groupedLessons[moduleId];
            const module = modules.find(m => m.id === Number(moduleId));

            return (
              <div key={moduleId} className="module-group">
                <div className="module-header">
                  <div className="module-info">
                    <h3>{module?.title || "Unknown Module"}</h3>
                    <div className="module-meta">
                      <span className="course-badge">
                        {getCourseTitleByModule(Number(moduleId))}
                      </span>
                      <span className="lesson-count">
                        {moduleLessons.length} lessons
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lessons-grid">
                  {moduleLessons.map((lesson) => {
                    const Icon = getVideoTypeIcon(lesson.videoType);
                    const color = getVideoTypeColor(lesson.videoType);

                    return (
                      <div key={lesson.id} className="lesson-card">
                        <div className="lesson-card-header">
                          <div className="lesson-type" style={{ backgroundColor: color + '20', color: color }}>
                            <Icon size={14} />
                            <span>{lesson.videoType}</span>
                          </div>
                          {lesson.isPreview && (
                            <span className="preview-badge">Preview</span>
                          )}
                        </div>

                        <div className="lesson-card-body">
                          <h4>{lesson.title}</h4>
                          {lesson.description && (
                            <p>{lesson.description}</p>
                          )}
                          <div className="lesson-meta">
                            {lesson.duration && (
                              <span className="duration">
                                <Clock size={14} />
                                {formatDuration(lesson.duration)}
                              </span>
                            )}
                            <span className="position">Position: {lesson.position || 0}</span>
                          </div>
                        </div>

                        <div className="lesson-card-actions">
                          <button
                            className="view-btn"
                            onClick={() => openViewModal(lesson)}
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
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
              <p>Are you sure you want to delete this lesson?</p>
              <p className="confirm-sub">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={() => handleDeleteLesson(showDeleteConfirm)}>
                <Trash2 size={18} />
                Delete Lesson
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && !editing && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Lesson</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
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
                  placeholder="Describe this lesson..."
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Module *</label>
                  <select
                    name="moduleId"
                    value={form.moduleId}
                    onChange={(e) => {
                      setForm({ ...form, moduleId: e.target.value });
                      setFormErrors({ ...formErrors, moduleId: "" });
                    }}
                    className={formErrors.moduleId ? "error" : ""}
                  >
                    <option value="">Select Module</option>
                    {modules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.title} ({getCourseTitleByModule(module.id)})
                      </option>
                    ))}
                  </select>
                  {formErrors.moduleId && <span className="error-text">{formErrors.moduleId}</span>}
                </div>

                <div className="form-group">
                  <label>Video Type *</label>
                  <select
                    name="videoType"
                    value={form.videoType}
                    onChange={(e) => {
                      setForm({ ...form, videoType: e.target.value });
                      setFormErrors({ ...formErrors, videoType: "" });
                    }}
                    className={formErrors.videoType ? "error" : ""}
                  >
                    {videoTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.videoType && <span className="error-text">{formErrors.videoType}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Video URL / Content Link</label>
                <input
                  type="text"
                  name="videoUrl"
                  placeholder="Enter video URL or content link"
                  value={form.videoUrl}
                  onChange={(e) =>
                    setForm({ ...form, videoUrl: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Attachment URL</label>
                <input
                  type="text"
                  name="attachment"
                  placeholder="Enter attachment URL"
                  value={form.attachment}
                  onChange={(e) =>
                    setForm({ ...form, attachment: e.target.value })
                  }
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Duration (minutes) *</label>
                  <input
                    type="number"
                    name="duration"
                    placeholder="0"
                    min="0"
                    value={form.duration}
                    onChange={(e) => {
                      setForm({ ...form, duration: e.target.value });
                      setFormErrors({ ...formErrors, duration: "" });
                    }}
                    className={formErrors.duration ? "error" : ""}
                  />
                  {formErrors.duration && <span className="error-text">{formErrors.duration}</span>}
                </div>

                <div className="form-group">
                  <label>Position</label>
                  <input
                    type="number"
                    name="position"
                    placeholder="0"
                    min="0"
                    value={form.position}
                    onChange={(e) =>
                      setForm({ ...form, position: parseInt(e.target.value) || 0 })
                    }
                  />
                  <span className="field-hint">Lower numbers appear first in the module</span>
                </div>
              </div>

              <div className="form-group">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    name="isPreview"
                    checked={form.isPreview}
                    onChange={(e) =>
                      setForm({ ...form, isPreview: e.target.checked })
                    }
                  />
                  <span>Preview Lesson (free for all users)</span>
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
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
                    Create Lesson
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View/Edit Modal - Inline Edit with Fixed Layout */}
      {showViewModal && viewingLesson && (
        <div className="modal view-modal" onClick={() => {
          if (!isEditMode) {
            setShowViewModal(false);
          }
        }}>
          <div className="modal-content view-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditMode ? "Edit Lesson" : "Lesson Details"}</h2>
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
                  // Edit Mode - Form fields inline with same grid layout
                  <div className="edit-form">
                    <div className="view-header">
                      <h3>Edit Lesson</h3>
                      <span 
                        className="type-badge" 
                        style={{ 
                          backgroundColor: getVideoTypeColor(form.videoType) + '20',
                          color: getVideoTypeColor(form.videoType)
                        }}
                      >
                        {form.videoType}
                      </span>
                      {form.isPreview && (
                        <span className="preview-badge">Preview</span>
                      )}
                    </div>

                    <div className="view-details-grid">
                      <div className="view-detail-item">
                        <label>Title *</label>
                        <input
                          type="text"
                          name="title"
                          placeholder="Enter lesson title"
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
                          placeholder="Describe this lesson..."
                          rows={2}
                          value={form.description}
                          onChange={(e) =>
                            setForm({ ...form, description: e.target.value })
                          }
                        />
                      </div>

                      <div className="view-detail-item">
                        <label>Module *</label>
                        <select
                          name="moduleId"
                          value={form.moduleId}
                          onChange={(e) => {
                            setForm({ ...form, moduleId: e.target.value });
                            setFormErrors({ ...formErrors, moduleId: "" });
                          }}
                          className={formErrors.moduleId ? "error" : ""}
                        >
                          <option value="">Select Module</option>
                          {modules.map((module) => (
                            <option key={module.id} value={module.id}>
                              {module.title}
                            </option>
                          ))}
                        </select>
                        {formErrors.moduleId && <span className="error-text">{formErrors.moduleId}</span>}
                      </div>

                      <div className="view-detail-item">
                        <label>Video Type *</label>
                        <select
                          name="videoType"
                          value={form.videoType}
                          onChange={(e) => {
                            setForm({ ...form, videoType: e.target.value });
                            setFormErrors({ ...formErrors, videoType: "" });
                          }}
                          className={formErrors.videoType ? "error" : ""}
                        >
                          {videoTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                        {formErrors.videoType && <span className="error-text">{formErrors.videoType}</span>}
                      </div>

                      <div className="view-detail-item">
                        <label>Video URL</label>
                        <input
                          type="text"
                          name="videoUrl"
                          placeholder="Enter video URL"
                          value={form.videoUrl}
                          onChange={(e) =>
                            setForm({ ...form, videoUrl: e.target.value })
                          }
                        />
                      </div>

                      <div className="view-detail-item">
                        <label>Attachment</label>
                        <input
                          type="text"
                          name="attachment"
                          placeholder="Enter attachment URL"
                          value={form.attachment}
                          onChange={(e) =>
                            setForm({ ...form, attachment: e.target.value })
                          }
                        />
                      </div>

                      <div className="view-detail-item">
                        <label>Duration (min) *</label>
                        <input
                          type="number"
                          name="duration"
                          placeholder="0"
                          min="0"
                          value={form.duration}
                          onChange={(e) => {
                            setForm({ ...form, duration: e.target.value });
                            setFormErrors({ ...formErrors, duration: "" });
                          }}
                          className={formErrors.duration ? "error" : ""}
                        />
                        {formErrors.duration && <span className="error-text">{formErrors.duration}</span>}
                      </div>

                      <div className="view-detail-item">
                        <label>Position</label>
                        <input
                          type="number"
                          name="position"
                          placeholder="0"
                          min="0"
                          value={form.position}
                          onChange={(e) =>
                            setForm({ ...form, position: parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>

                      <div className="view-detail-item">
                        <label className="toggle-label">
                          <input
                            type="checkbox"
                            name="isPreview"
                            checked={form.isPreview}
                            onChange={(e) =>
                              setForm({ ...form, isPreview: e.target.checked })
                            }
                          />
                          <span>Preview</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  // View Mode - Display all details
                  <>
                    <div className="view-header">
                      <h3>{viewingLesson.title}</h3>
                      <span 
                        className="type-badge" 
                        style={{ 
                          backgroundColor: getVideoTypeColor(viewingLesson.videoType) + '20',
                          color: getVideoTypeColor(viewingLesson.videoType)
                        }}
                      >
                        {viewingLesson.videoType}
                      </span>
                      {viewingLesson.isPreview && (
                        <span className="preview-badge">Preview</span>
                      )}
                    </div>

                    {viewingLesson.description && (
                      <div className="view-section">
                        <h4>Description</h4>
                        <p>{viewingLesson.description}</p>
                      </div>
                    )}

                    <div className="view-details-grid">
                      <div className="view-detail-item">
                        <label>Module</label>
                        <span>{getModuleTitle(viewingLesson.moduleId)}</span>
                      </div>
                      <div className="view-detail-item">
                        <label>Course</label>
                        <span>{getCourseTitleByModule(viewingLesson.moduleId)}</span>
                      </div>
                      <div className="view-detail-item">
                        <label>Video Type</label>
                        <span>{viewingLesson.videoType}</span>
                      </div>
                      <div className="view-detail-item">
                        <label>Duration</label>
                        <span>{formatDuration(viewingLesson.duration)}</span>
                      </div>
                      <div className="view-detail-item">
                        <label>Position</label>
                        <span>{viewingLesson.position || 0}</span>
                      </div>
                      <div className="view-detail-item">
                        <label>Preview</label>
                        <span>{viewingLesson.isPreview ? "Yes" : "No"}</span>
                      </div>
                      {viewingLesson.videoUrl && (
                        <div className="view-detail-item full-width">
                          <label>Video URL</label>
                          <span className="url-text">{viewingLesson.videoUrl}</span>
                        </div>
                      )}
                      {viewingLesson.attachment && (
                        <div className="view-detail-item full-width">
                          <label>Attachment</label>
                          <span className="url-text">{viewingLesson.attachment}</span>
                        </div>
                      )}
                      <div className="view-detail-item">
                        <label>Created</label>
                        <span>{formatDate(viewingLesson.createdAt)}</span>
                      </div>
                      <div className="view-detail-item">
                        <label>Updated</label>
                        <span>{formatDate(viewingLesson.updatedAt)}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer - Different based on mode */}
            <div className="modal-footer">
              {isEditMode ? (
                <>
                  <button className="btn-cancel" onClick={handleCancelEdit}>
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
                        Update Lesson
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-edit" onClick={openEditFromView}>
                    <Edit size={18} />
                    Edit
                  </button>
                  <button className="btn-danger" onClick={handleDeleteFromView}>
                    <Trash2 size={18} />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLessons;