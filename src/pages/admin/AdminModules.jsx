// src/pages/admin/AdminModules.jsx
import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  GripVertical,
  ChevronDown,
  ChevronRight,
  X,
  Save,
  RefreshCw,
  AlertCircle,
  Clock,
  FileText,
  Layers,
  ArrowUp,
  ArrowDown,
  Copy,
} from "lucide-react";
import api from "../../services/api";
import "./AdminModules.css";

function AdminModules() {
  const [modules, setModules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewingModule, setViewingModule] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form state - Matches your table schema
  const [form, setForm] = useState({
    title: "",
    description: "",
    position: 0,
    courseId: "",
  });

  const [stats, setStats] = useState({
    total: 0,
    totalCourses: 0,
  });

  useEffect(() => {
    fetchModules();
    fetchCourses();
  }, []);

  // Fetch modules
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
    const uniqueCourses = new Set(data.map(m => m.courseId)).size;
    setStats({ total, totalCourses: uniqueCourses });
  };

  // Save module
  const handleSaveModule = async () => {
    try {
      const errors = {};
      if (!form.title || form.title.trim() === "") {
        errors.title = "Module title is required";
      }
      if (!form.courseId) {
        errors.courseId = "Course is required";
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      setIsSubmitting(true);

      const data = {
        title: form.title.trim(),
        description: form.description || "",
        position: parseInt(form.position) || 0,
        courseId: parseInt(form.courseId),
      };

      let response;
      if (editing) {
        response = await api.put(`/modules/${editing.id}`, data);
      } else {
        response = await api.post("/modules", data);
      }

      console.log("✅ Module saved:", response.data);

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
      console.error("❌ Save error:", err);
      console.error("❌ Response:", err.response);
      
      let errorMessage = "Failed to save module";
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

  // Delete module
  const handleDeleteModule = async (id) => {
    try {
      await api.delete(`/modules/${id}`);
      await fetchModules();
      setShowDeleteConfirm(null);
      setShowViewModal(false);
      setIsEditMode(false);
      alert("Module deleted successfully!");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete module";
      if (message.includes("foreign key") || message.includes("constraint")) {
        alert("Cannot delete this module because it has lessons. Please delete all lessons first.");
      } else {
        alert(message);
      }
    }
  };

  // Reorder module
  const handleReorder = async (id, direction) => {
    const currentModule = modules.find(m => m.id === id);
    if (!currentModule) return;

    const sortedModules = modules
      .filter(m => m.courseId === currentModule.courseId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    const currentIndex = sortedModules.findIndex(m => m.id === id);
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= sortedModules.length) return;

    const swapModule = sortedModules[newIndex];

    try {
      await api.put(`/modules/${id}`, { position: swapModule.position });
      await api.put(`/modules/${swapModule.id}`, { position: currentModule.position });
      await fetchModules();
    } catch (err) {
      alert("Failed to reorder modules");
      console.error("Reorder error:", err);
    }
  };

  // Reset form
  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      position: 0,
      courseId: "",
    });
    setFormErrors({});
  };

  // Open create modal
  const openCreateModal = () => {
    setEditing(null);
    resetForm();
    // Calculate next position for selected course or global
    let maxPosition = 0;
    if (form.courseId) {
      const courseModules = modules.filter(m => m.courseId === parseInt(form.courseId));
      maxPosition = courseModules.length;
    } else {
      maxPosition = modules.length;
    }
    setForm(prev => ({ ...prev, position: maxPosition + 1 }));
    setShowModal(true);
  };

  // Open edit modal directly
  const openEditModal = (module) => {
    setEditing(module);
    setForm({
      title: module.title || "",
      description: module.description || "",
      position: module.position || 0,
      courseId: module.courseId || "",
    });
    setIsEditMode(true);
    setShowViewModal(true);
    setFormErrors({});
  };

  // Open view modal
  const openViewModal = (module) => {
    setViewingModule(module);
    setIsEditMode(false);
    setShowViewModal(true);
  };

  // Handle edit from view
  const handleEditFromView = () => {
    if (viewingModule) {
      openEditModal(viewingModule);
    }
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setIsEditMode(false);
    if (viewingModule) {
      setForm({
        title: viewingModule.title || "",
        description: viewingModule.description || "",
        position: viewingModule.position || 0,
        courseId: viewingModule.courseId || "",
      });
    }
    setFormErrors({});
  };

  // Handle delete from view
  const handleDeleteFromView = () => {
    if (viewingModule) {
      setShowViewModal(false);
      setShowDeleteConfirm(viewingModule.id);
    }
  };

  // Get course title by ID
  const getCourseTitle = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.title : "Unknown Course";
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

  // Filter modules
  const filteredModules = modules.filter((module) => {
    const matchesSearch = module.title?.toLowerCase().includes(search.toLowerCase()) ||
                         module.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCourse = !courseFilter || module.courseId === Number(courseFilter);
    return matchesSearch && matchesCourse;
  });

  // Group modules by course
  const groupedModules = filteredModules.reduce((acc, module) => {
    const key = module.courseId;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(module);
    return acc;
  }, {});

  // Sort modules by position within each group
  Object.keys(groupedModules).forEach(key => {
    groupedModules[key].sort((a, b) => (a.position || 0) - (b.position || 0));
  });

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
          <p className="subtitle">Organize your course content into modules</p>
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
          <BookOpen size={24} />
          <div>
            <h3>{stats.totalCourses}</h3>
            <p>Courses with Modules</p>
          </div>
        </div>
        <div className="stat-card">
          <FileText size={24} />
          <div>
            <h3>{courses.length}</h3>
            <p>Available Courses</p>
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

        <select
          className="filter-select"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
        >
          <option value="">All Courses</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>

        <button className="refresh-btn" onClick={fetchModules}>
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Modules List */}
      <div className="modules-container">
        {Object.keys(groupedModules).length === 0 ? (
          <div className="empty-state">
            <Layers size={48} />
            <h3>No modules found</h3>
            <p>Create your first module to organize course content</p>
            <button className="add-btn" onClick={openCreateModal}>
              <Plus size={18} />
              Create Module
            </button>
          </div>
        ) : (
          Object.keys(groupedModules).map((courseId) => {
            const courseModules = groupedModules[courseId];
            const course = courses.find(c => c.id === Number(courseId));

            return (
              <div key={courseId} className="course-group">
                <div className="course-group-header">
                  <h3>
                    <BookOpen size={18} />
                    {course ? course.title : "Unknown Course"}
                  </h3>
                  <span className="module-count">{courseModules.length} modules</span>
                </div>

                <div className="modules-list">
                  {courseModules.map((module, index) => (
                    <div key={module.id} className="module-item">
                      <div className="module-item-header">
                        <div className="module-info">
                          <div className="module-position">{index + 1}</div>
                          <div>
                            <h4>{module.title}</h4>
                            {module.description && (
                              <p className="module-description">{module.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="module-actions">
                          <button
                            title="Move Up"
                            className="move-btn"
                            onClick={() => handleReorder(module.id, "up")}
                            disabled={index === 0}
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            title="Move Down"
                            className="move-btn"
                            onClick={() => handleReorder(module.id, "down")}
                            disabled={index === courseModules.length - 1}
                          >
                            <ArrowDown size={16} />
                          </button>
                          <button
                            title="View Details"
                            className="view-btn"
                            onClick={() => openViewModal(module)}
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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
              <p>Are you sure you want to delete this module?</p>
              <p className="confirm-sub">This action cannot be undone. All associated lessons will be permanently removed.</p>
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

      {/* Create Modal */}
      {showModal && !editing && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Module</h2>
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
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Course *</label>
                  <select
                    name="courseId"
                    value={form.courseId}
                    onChange={(e) => {
                      setForm({ ...form, courseId: e.target.value });
                      setFormErrors({ ...formErrors, courseId: "" });
                    }}
                    className={formErrors.courseId ? "error" : ""}
                  >
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                  {formErrors.courseId && <span className="error-text">{formErrors.courseId}</span>}
                </div>

                <div className="form-group">
                  <label>Position (Order)</label>
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
                  <span className="field-hint">Modules with lower numbers appear first</span>
                </div>
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
                    Create Module
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View/Edit Modal - Inline Edit with Fixed Layout */}
      {showViewModal && viewingModule && (
        <div className="modal view-modal" onClick={() => {
          if (!isEditMode) {
            setShowViewModal(false);
          }
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
                  // Edit Mode - Form fields inline with same grid layout
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

                      <div className="view-detail-item">
                        <label>Course *</label>
                        <select
                          name="courseId"
                          value={form.courseId}
                          onChange={(e) => {
                            setForm({ ...form, courseId: e.target.value });
                            setFormErrors({ ...formErrors, courseId: "" });
                          }}
                          className={formErrors.courseId ? "error" : ""}
                        >
                          <option value="">Select Course</option>
                          {courses.map((course) => (
                            <option key={course.id} value={course.id}>
                              {course.title}
                            </option>
                          ))}
                        </select>
                        {formErrors.courseId && <span className="error-text">{formErrors.courseId}</span>}
                      </div>

                      <div className="view-detail-item full-width">
                        <label>Description</label>
                        <textarea
                          name="description"
                          placeholder="Describe this module..."
                          rows={2}
                          value={form.description}
                          onChange={(e) =>
                            setForm({ ...form, description: e.target.value })
                          }
                        />
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
                    </div>
                  </div>
                ) : (
                  // View Mode - Display all details
                  <>
                    <div className="view-header">
                      <h3>{viewingModule.title}</h3>
                    </div>

                    <div className="view-details-grid">
                      <div className="view-detail-item">
                        <label>Course</label>
                        <span>{getCourseTitle(viewingModule.courseId)}</span>
                      </div>
                      <div className="view-detail-item">
                        <label>Position</label>
                        <span>{viewingModule.position || 0}</span>
                      </div>
                      <div className="view-detail-item full-width">
                        <label>Description</label>
                        <span>{viewingModule.description || "No description"}</span>
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

export default AdminModules;