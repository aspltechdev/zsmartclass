// src/pages/admin/AdminCourses.jsx
import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  Users,
  Star,
  Upload,
  X,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  Calendar,
  Layers,
} from "lucide-react";
import api from "../../services/api";
import "./AdminCourses.css";

const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23667eea'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='20' font-family='sans-serif'%3ECourse%3C/text%3E%3C/svg%3E";

const getImageUrl = (path) => {
  if (!path) return FALLBACK_IMAGE;
  if (path.startsWith('http')) return path;
  const baseUrl = api.defaults?.baseURL || 'http://localhost:5000';
  return `${baseUrl}${path}`;
};

function AdminCourses() {
  // ─── STATE ──────────────────────────────────────────────────────────
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");

  // ─── MODAL STATES ──────────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ─── EDITING STATES ────────────────────────────────────────────────
  const [editingCourse, setEditingCourse] = useState(null);
  const [viewingCourse, setViewingCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // ─── MODULE ATTACHMENT STATE (course view) ─────────────────────────
  const [courseModules, setCourseModules] = useState([]);
  const [availableModules, setAvailableModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [moduleActionId, setModuleActionId] = useState(null); // module id or "attach"
  const [selectedModuleToAdd, setSelectedModuleToAdd] = useState("");

  // ─── FORM STATE ────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    subtitle: "",
    description: "",
    categoryId: "",
    level: "BEGINNER",
    language: "English",
    thumbnail: null,
    requirements: "",
    outcomes: "",
    audience: "",
    videoUrl: "",
    isPublished: false,
    isFeatured: false,
  });

  const [formErrors, setFormErrors] = useState({});
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const fileInputRef = useRef(null);

  // ─── STATS ──────────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
    featured: 0,
    enrollments: 0,
  });

  // ─── LEVELS & LANGUAGES ────────────────────────────────────────────
  const levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
  const languages = ["English", "Hindi", "Tamil", "Telugu", "Malayalam", "Kannada", "Spanish", "French", "German", "Chinese"];

  // ─── EFFECTS ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAllData();
  }, []);

  // ─── API CALLS ─────────────────────────────────────────────────────
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [coursesRes, categoriesRes] = await Promise.all([
        api.get("/courses"),
        api.get("/categories"),
      ]);

      const coursesData = coursesRes.data?.data || coursesRes.data || [];
      const categoriesData = categoriesRes.data?.data || categoriesRes.data || [];

      setCourses(coursesData);
      setCategories(categoriesData);
      calculateStats(coursesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ─── STATS CALCULATION ─────────────────────────────────────────────
  const calculateStats = (data) => {
    const total = data.length;
    const published = data.filter((c) => c.status === "PUBLISHED").length;
    const draft = data.filter((c) => c.status === "DRAFT").length;
    const archived = data.filter((c) => c.status === "ARCHIVED").length;
    const featured = data.filter((c) => c.isFeatured).length;
    const enrollments = data.reduce((sum, c) => sum + (c._count?.enrollments || 0), 0);

    setStats({ total, published, draft, archived, featured, enrollments });
  };

  // ─── HELPERS ────────────────────────────────────────────────────────
  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getLevelColor = (level) => {
    const colors = { BEGINNER: "#10b981", INTERMEDIATE: "#f59e0b", ADVANCED: "#ef4444" };
    return colors[level] || "#64748b";
  };

  const getStatusBadge = (status) => {
    const classes = { PUBLISHED: "status-published", DRAFT: "status-draft", ARCHIVED: "status-archived" };
    return classes[status] || "status-draft";
  };

  // ─── FORM HANDLERS ──────────────────────────────────────────────────
  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      subtitle: "",
      description: "",
      categoryId: "",
      level: "BEGINNER",
      language: "English",
      thumbnail: null,
      requirements: "",
      outcomes: "",
      audience: "",
      videoUrl: "",
      isPublished: false,
      isFeatured: false,
    });
    setThumbnailPreview(null);
    setFormErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      const file = files[0];
      if (file) {
        setFormData({ ...formData, thumbnail: file });
        const reader = new FileReader();
        reader.onloadend = () => setThumbnailPreview(reader.result);
        reader.readAsDataURL(file);
      }
    } else if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
      if (name === "title" && !editingCourse) {
        setFormData((prev) => ({ ...prev, slug: generateSlug(value) }));
      }
    }

    if (formErrors[name]) setFormErrors({ ...formErrors, [name]: "" });
  };

  // ─── COURSE CRUD ────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingCourse(null);
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title || "",
      slug: course.slug || "",
      subtitle: course.subtitle || "",
      description: course.description || "",
      categoryId: course.categoryId || "",
      level: course.level || "BEGINNER",
      language: course.language || "English",
      thumbnail: null,
      requirements: course.requirements || "",
      outcomes: course.outcomes || "",
      audience: course.audience || "",
      videoUrl: course.trailer || "",
      isPublished: course.isPublished || course.status === "PUBLISHED",
      isFeatured: course.isFeatured || false,
    });
    setThumbnailPreview(course.thumbnail || null);
    setIsEditMode(true);
    setShowViewModal(true);
  };

  const openViewModal = (course) => {
    setViewingCourse(course);
    setIsEditMode(false);
    setShowViewModal(true);
    setSelectedModuleToAdd("");
    setCourseModules([]);
    setAvailableModules([]);
    loadCourseModules(course.id);
  };

  // ─── MODULE ATTACH / DETACH ────────────────────────────────────────
  const loadCourseModules = async (courseId) => {
    setModulesLoading(true);
    try {
      const [courseRes, availRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/courses/${courseId}/available-modules`),
      ]);
      setCourseModules(courseRes.data?.data?.modules || []);
      setAvailableModules(availRes.data?.data || []);
    } catch (error) {
      console.error("Error loading course modules:", error);
      setCourseModules([]);
      setAvailableModules([]);
    } finally {
      setModulesLoading(false);
    }
  };

  const loadAvailableModules = async (courseId) => {
    try {
      const availRes = await api.get(`/courses/${courseId}/available-modules`);
      setAvailableModules(availRes.data?.data || []);
    } catch (error) {
      console.error("Error loading available modules:", error);
      setAvailableModules([]);
    }
  };

  const handleAttachModule = async () => {
    if (!selectedModuleToAdd || !viewingCourse) return;
    setModuleActionId("attach");
    try {
      const res = await api.post(`/courses/${viewingCourse.id}/modules`, {
        moduleId: parseInt(selectedModuleToAdd),
      });
      // Attach/detach responses return modules WITH _count.lessons, so the
      // count shown right after an action is always authoritative.
      if (res.data?.data) setCourseModules(res.data.data);
      setSelectedModuleToAdd("");
      await loadAvailableModules(viewingCourse.id);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to attach module");
    } finally {
      setModuleActionId(null);
    }
  };

  const handleDetachModule = async (moduleId) => {
    if (!viewingCourse) return;
    setModuleActionId(moduleId);
    try {
      const res = await api.delete(`/courses/${viewingCourse.id}/modules/${moduleId}`);
      if (res.data?.data) setCourseModules(res.data.data);
      await loadAvailableModules(viewingCourse.id);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to detach module");
    } finally {
      setModuleActionId(null);
    }
  };

  // Lesson count that works whether the API sends _count.lessons (preferred)
  // or the raw lessons array — so it's correct regardless of response shape.
  const lessonCount = (m) => m?._count?.lessons ?? m?.lessons?.length ?? 0;

  const handleSaveCourse = async () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = "Title is required";
    if (!formData.categoryId) errors.categoryId = "Category is required";
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const payload = {
        title: formData.title.trim(),
        slug: formData.slug || generateSlug(formData.title),
        subtitle: formData.subtitle || "",
        description: formData.description || "",
        language: formData.language,
        level: formData.level,
        requirements: formData.requirements || null,
        outcomes: formData.outcomes || null,
        audience: formData.audience || null,
        categoryId: parseInt(formData.categoryId),
        createdById: user.id || 1,
        trailer: formData.videoUrl || null,
        isPublished: formData.isPublished,
        isFeatured: formData.isFeatured,
        status: formData.isPublished ? "PUBLISHED" : "DRAFT",
      };

      if (editingCourse) {
        await api.put(`/courses/${editingCourse.id}`, payload);
      } else {
        await api.post("/courses", payload);
      }

      setShowCreateModal(false);
      setShowViewModal(false);
      setIsEditMode(false);
      resetForm();
      await fetchAllData();
      alert(editingCourse ? "✅ Course updated successfully!" : "✅ Course created successfully!");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save course");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── DELETE COURSE ──────────────────────────────────────────────────
  const openDeleteModal = (course) => {
    setCourseToDelete(course.id);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    setIsSubmitting(true);
    setDeleteError(null);

    try {
      await api.delete(`/courses/${courseToDelete}`);
      setShowDeleteModal(false);
      setCourseToDelete(null);
      setShowViewModal(false);
      await fetchAllData();
      alert("✅ Course deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      const errorMessage = error.response?.data?.message || "Failed to delete course";
      setDeleteError(errorMessage);
      
      if (errorMessage.includes("related records") || errorMessage.includes("foreign key")) {
        // Keep modal open with error
      } else {
        alert(`❌ Error: ${errorMessage}`);
        setShowDeleteModal(false);
        setCourseToDelete(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePublish = async (course) => {
    const newStatus = course.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      await api.put(`/courses/${course.id}`, {
        status: newStatus,
        isPublished: newStatus === "PUBLISHED",
      });
      await fetchAllData();
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const toggleFeatured = async (course) => {
    try {
      await api.put(`/courses/${course.id}`, { isFeatured: !course.isFeatured });
      await fetchAllData();
    } catch (error) {
      alert("Failed to update featured status");
    }
  };

  // ─── FILTERING ──────────────────────────────────────────────────────
  const filteredCourses = courses.filter((course) => {
    const matchSearch = course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || course.status === statusFilter;
    const matchCategory = !categoryFilter || course.categoryId === Number(categoryFilter);
    return matchSearch && matchStatus && matchCategory;
  });

  // ─── RENDER ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="courses-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-page">
      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1>Course Management</h1>
          <p className="subtitle">Manage your courses</p>
        </div>
        <button className="add-btn" onClick={openCreateModal}>
          <Plus size={18} /> New Course
        </button>
      </div>

      {/* ─── STATS ───────────────────────────────────────────────────── */}
      <div className="course-cards">
        <div className="card">
          <BookOpen size={28} />
          <h2>{stats.total}</h2>
          <p>Total Courses</p>
        </div>
        <div className="card">
          <CheckCircle size={28} />
          <h2>{stats.published}</h2>
          <p>Published</p>
        </div>
        <div className="card">
          <Clock size={28} />
          <h2>{stats.draft}</h2>
          <p>Drafts</p>
        </div>
        <div className="card">
          <Star size={28} />
          <h2>{stats.featured}</h2>
          <p>Featured</p>
        </div>
        <div className="card">
          <Users size={28} />
          <h2>{stats.enrollments}</h2>
          <p>Enrollments</p>
        </div>
      </div>

      {/* ─── TOOLBAR ─────────────────────────────────────────────────── */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>

        <select
          className="filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <button className="refresh-btn" onClick={fetchAllData}>
          <RefreshCw size={18} />
        </button>
      </div>

      {/* ─── TABLE ───────────────────────────────────────────────────── */}
      <div className="table-wrapper">
        <table className="course-table">
          <thead>
            <tr>
              <th style={{ width: "40%" }}>Course</th>
              <th>Category</th>
              <th>Level</th>
              <th>Status</th>
              <th>Students</th>
              <th style={{ width: "140px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.length === 0 ? (
              <tr>
                <td colSpan="6">
                  <div className="empty-state">
                    <BookOpen size={48} />
                    <h3>No courses found</h3>
                    <p>Create your first course to get started</p>
                    <button className="add-btn" onClick={openCreateModal}>
                      <Plus size={18} /> Create Course
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCourses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <div className="course-title">
                      <img
                        src={course.thumbnail ? getImageUrl(course.thumbnail) : FALLBACK_IMAGE}
                        alt={course.title}
                        className="course-thumbnail"
                        onError={(e) => {
                          e.target.src = FALLBACK_IMAGE;
                        }}
                      />
                      <div>
                        <strong>{course.title}</strong>
                        <br />
                        <small className="text-muted">
                          Created: {formatDate(course.createdAt)}
                        </small>
                        {course.isFeatured && <span className="featured-badge">★ Featured</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="category-badge">{course.category?.name || "N/A"}</span>
                  </td>
                  <td>
                    <span
                      className="level-badge"
                      style={{
                        backgroundColor: getLevelColor(course.level) + "20",
                        color: getLevelColor(course.level),
                      }}
                    >
                      {course.level || "N/A"}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadge(course.status)}`}>
                      <span className="dot" />
                      {course.status}
                    </span>
                  </td>
                  <td>
                    <span className="students-count">
                      <Users size={14} />
                      {course._count?.enrollments || 0}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="view-btn" onClick={() => openViewModal(course)} title="View">
                        <Eye size={18} />
                      </button>
                      <button
                        className={`feature-btn ${course.isFeatured ? "active" : ""}`}
                        onClick={() => toggleFeatured(course)}
                        title={course.isFeatured ? "Remove Featured" : "Make Featured"}
                      >
                        <Star size={18} />
                      </button>
                      <button
                        className="publish-btn"
                        onClick={() => togglePublish(course)}
                        title={course.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                      >
                        {course.status === "PUBLISHED" ? <XCircle size={18} /> : <CheckCircle size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── CREATE MODAL ───────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="modal" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Course</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Basic Information */}
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleFormChange}
                      className={formErrors.title ? "error" : ""}
                    />
                    {formErrors.title && <span className="error-text">{formErrors.title}</span>}
                  </div>
                  <div className="form-group">
                    <label>Slug</label>
                    <input type="text" name="slug" value={formData.slug} onChange={handleFormChange} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Subtitle</label>
                  <input type="text" name="subtitle" value={formData.subtitle} onChange={handleFormChange} />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea name="description" rows={4} value={formData.description} onChange={handleFormChange} />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleFormChange}
                      className={formErrors.categoryId ? "error" : ""}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.categoryId && <span className="error-text">{formErrors.categoryId}</span>}
                  </div>
                  <div className="form-group">
                    <label>Level</label>
                    <select name="level" value={formData.level} onChange={handleFormChange}>
                      {levels.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Language</label>
                  <select name="language" value={formData.language} onChange={handleFormChange}>
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Course Content */}
              <div className="form-section">
                <h3>Course Content</h3>
                <div className="form-group">
                  <label>Requirements</label>
                  <textarea name="requirements" rows={3} value={formData.requirements} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>Learning Outcomes</label>
                  <textarea name="outcomes" rows={3} value={formData.outcomes} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>Target Audience</label>
                  <textarea name="audience" rows={3} value={formData.audience} onChange={handleFormChange} />
                </div>
              </div>

              {/* Media */}
              <div className="form-section">
                <h3>Media</h3>
                <div className="form-group">
                  <label>Thumbnail</label>
                  <div className="file-upload">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFormChange}
                      name="thumbnail"
                      id="thumbnail-upload"
                    />
                    <label htmlFor="thumbnail-upload" className="file-upload-label">
                      <Upload size={18} />
                      {formData.thumbnail ? formData.thumbnail.name : "Upload Thumbnail"}
                    </label>
                    {thumbnailPreview && (
                      <div className="thumbnail-preview">
                        <img src={thumbnailPreview} alt="Preview" />
                        <button
                          onClick={() => {
                            setThumbnailPreview(null);
                            setFormData({ ...formData, thumbnail: null });
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Promo Video URL</label>
                  <input type="url" name="videoUrl" value={formData.videoUrl} onChange={handleFormChange} />
                </div>
              </div>

              {/* Settings */}
              <div className="form-section">
                <h3>Settings</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="toggle-label">
                      <input type="checkbox" name="isPublished" checked={formData.isPublished} onChange={handleFormChange} />
                      <span>Publish Course</span>
                    </label>
                  </div>
                  <div className="form-group">
                    <label className="toggle-label">
                      <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleFormChange} />
                      <span>Featured Course</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleSaveCourse} disabled={isSubmitting}>
                {isSubmitting ? <><span className="spinner-small" /> Saving...</> : <><Save size={18} /> Create</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── VIEW/EDIT MODAL ────────────────────────────────────────── */}
      {showViewModal && viewingCourse && (
        <div className="modal view-modal" onClick={() => !isEditMode && setShowViewModal(false)}>
          <div className="modal-content view-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditMode ? "Edit Course" : "Course Details"}</h2>
              <button
                className="modal-close"
                onClick={() => {
                  if (isEditMode) {
                    setIsEditMode(false);
                    setFormData({
                      title: viewingCourse.title || "",
                      slug: viewingCourse.slug || "",
                      subtitle: viewingCourse.subtitle || "",
                      description: viewingCourse.description || "",
                      categoryId: viewingCourse.categoryId || "",
                      level: viewingCourse.level || "BEGINNER",
                      language: viewingCourse.language || "English",
                      thumbnail: null,
                      requirements: viewingCourse.requirements || "",
                      outcomes: viewingCourse.outcomes || "",
                      audience: viewingCourse.audience || "",
                      videoUrl: viewingCourse.trailer || "",
                      isPublished: viewingCourse.isPublished || false,
                      isFeatured: viewingCourse.isFeatured || false,
                    });
                    setThumbnailPreview(viewingCourse.thumbnail || null);
                    setFormErrors({});
                  } else {
                    setShowViewModal(false);
                  }
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="view-body">
              {/* Thumbnail */}
              <div className="view-thumbnail">
                {isEditMode ? (
                  <div className="file-upload">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFormChange}
                      name="thumbnail"
                      id="edit-thumbnail-upload"
                    />
                    <label htmlFor="edit-thumbnail-upload" className="file-upload-label">
                      <Upload size={18} />
                      {formData.thumbnail ? formData.thumbnail.name : "Change Thumbnail"}
                    </label>
                    {thumbnailPreview ? (
                      <div className="thumbnail-preview">
                        <img src={thumbnailPreview} alt="Preview" />
                        <button
                          onClick={() => {
                            setThumbnailPreview(null);
                            setFormData({ ...formData, thumbnail: null });
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : viewingCourse.thumbnail && (
                      <div className="thumbnail-preview">
                        <img src={getImageUrl(viewingCourse.thumbnail)} alt="Current" onError={(e) => (e.target.src = FALLBACK_IMAGE)} />
                      </div>
                    )}
                  </div>
                ) : (
                  <img src={viewingCourse.thumbnail ? getImageUrl(viewingCourse.thumbnail) : FALLBACK_IMAGE} alt={viewingCourse.title} onError={(e) => (e.target.src = FALLBACK_IMAGE)} />
                )}
              </div>

              <div className="view-info">
                {isEditMode ? (
                  // ─── EDIT MODE ────────────────────────────────────
                  <div className="edit-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Title *</label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleFormChange}
                          className={formErrors.title ? "error" : ""}
                        />
                        {formErrors.title && <span className="error-text">{formErrors.title}</span>}
                      </div>
                      <div className="form-group">
                        <label>Slug</label>
                        <input type="text" name="slug" value={formData.slug} onChange={handleFormChange} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Subtitle</label>
                      <input type="text" name="subtitle" value={formData.subtitle} onChange={handleFormChange} />
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <textarea name="description" rows={3} value={formData.description} onChange={handleFormChange} />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Category *</label>
                        <select
                          name="categoryId"
                          value={formData.categoryId}
                          onChange={handleFormChange}
                          className={formErrors.categoryId ? "error" : ""}
                        >
                          <option value="">Select Category</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        {formErrors.categoryId && <span className="error-text">{formErrors.categoryId}</span>}
                      </div>
                      <div className="form-group">
                        <label>Level</label>
                        <select name="level" value={formData.level} onChange={handleFormChange}>
                          {levels.map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Language</label>
                      <select name="language" value={formData.language} onChange={handleFormChange}>
                        {languages.map((lang) => (
                          <option key={lang} value={lang}>
                            {lang}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Requirements</label>
                      <textarea name="requirements" rows={2} value={formData.requirements} onChange={handleFormChange} />
                    </div>

                    <div className="form-group">
                      <label>Learning Outcomes</label>
                      <textarea name="outcomes" rows={2} value={formData.outcomes} onChange={handleFormChange} />
                    </div>

                    <div className="form-group">
                      <label>Target Audience</label>
                      <textarea name="audience" rows={2} value={formData.audience} onChange={handleFormChange} />
                    </div>

                    <div className="form-group">
                      <label>Promo Video URL</label>
                      <input type="url" name="videoUrl" value={formData.videoUrl} onChange={handleFormChange} />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="toggle-label">
                          <input
                            type="checkbox"
                            name="isPublished"
                            checked={formData.isPublished}
                            onChange={handleFormChange}
                          />
                          <span>Publish</span>
                        </label>
                      </div>
                      <div className="form-group">
                        <label className="toggle-label">
                          <input
                            type="checkbox"
                            name="isFeatured"
                            checked={formData.isFeatured}
                            onChange={handleFormChange}
                          />
                          <span>Featured</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  // ─── VIEW MODE ────────────────────────────────────
                  <>
                    <h3>{viewingCourse.title}</h3>
                    {viewingCourse.subtitle && <p className="view-subtitle">{viewingCourse.subtitle}</p>}

                    <div className="view-stats">
                      <div className="view-stat">
                        <Users size={18} />
                        <span>{viewingCourse._count?.enrollments || 0} Students</span>
                      </div>
                    </div>

                    <div className="view-details-grid">
                      <div className="view-detail-item">
                        <label>Category</label>
                        <span>{viewingCourse.category?.name || "N/A"}</span>
                      </div>
                      <div className="view-detail-item">
                        <label>Level</label>
                        <span>{viewingCourse.level || "N/A"}</span>
                      </div>
                      <div className="view-detail-item">
                        <label>Language</label>
                        <span>{viewingCourse.language || "N/A"}</span>
                      </div>
                      <div className="view-detail-item">
                        <label>Status</label>
                        <span className={`status-badge ${viewingCourse.status?.toLowerCase()}`}>
                          {viewingCourse.status || "DRAFT"}
                        </span>
                      </div>
                      {viewingCourse.isFeatured && (
                        <div className="view-detail-item">
                          <label>Featured</label>
                          <span className="featured-text">⭐ Featured</span>
                        </div>
                      )}
                    </div>

                    {viewingCourse.description && (
                      <div className="view-section">
                        <h4>Description</h4>
                        <p>{viewingCourse.description}</p>
                      </div>
                    )}

                    <div className="view-meta">
                      <span>Created: {formatDate(viewingCourse.createdAt)}</span>
                      {viewingCourse.updatedAt && <span>Updated: {formatDate(viewingCourse.updatedAt)}</span>}
                    </div>

                    {/* ─── MODULES: attach existing modules to this course ─── */}
                    <div className="view-section">
                      <h4 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Layers size={18} /> Modules ({courseModules.length})
                      </h4>

                      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                        <select
                          value={selectedModuleToAdd}
                          onChange={(e) => setSelectedModuleToAdd(e.target.value)}
                          disabled={modulesLoading || moduleActionId === "attach" || availableModules.length === 0}
                          style={{ flex: 1, minWidth: 200, padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db" }}
                        >
                          <option value="">
                            {availableModules.length ? "Select a module to add…" : "No unattached modules available"}
                          </option>
                          {availableModules.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.title} ({lessonCount(m)} lessons)
                            </option>
                          ))}
                        </select>
                        <button
                          className="btn-save"
                          onClick={handleAttachModule}
                          disabled={!selectedModuleToAdd || moduleActionId === "attach"}
                          style={{ whiteSpace: "nowrap" }}
                        >
                          {moduleActionId === "attach" ? <span className="spinner-small" /> : <Plus size={16} />} Add
                        </button>
                      </div>

                      {modulesLoading ? (
                        <p style={{ color: "#6b7280" }}>Loading modules…</p>
                      ) : courseModules.length === 0 ? (
                        <p style={{ color: "#6b7280" }}>No modules attached yet. Add one above.</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {courseModules.map((m, index) => (
                            <div
                              key={m.id}
                              style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                gap: 12, padding: "10px 12px", border: "1px solid #e5e7eb",
                                borderRadius: 8, background: "#f9fafb",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                <span style={{
                                  flexShrink: 0, width: 24, height: 24, borderRadius: "50%",
                                  background: "#667eea", color: "#fff", fontSize: 12,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                }}>{index + 1}</span>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {m.title}
                                  </div>
                                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                                    {lessonCount(m)} lesson{lessonCount(m) === 1 ? "" : "s"}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDetachModule(m.id)}
                                disabled={moduleActionId === m.id}
                                title="Remove from course"
                                style={{
                                  flexShrink: 0, display: "flex", alignItems: "center", gap: 4,
                                  padding: "6px 10px", borderRadius: 8, border: "1px solid #fecaca",
                                  background: "#fef2f2", color: "#dc2626", cursor: "pointer",
                                }}
                              >
                                {moduleActionId === m.id ? <span className="spinner-small" /> : <X size={14} />} Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="modal-footer">
              {isEditMode ? (
                <>
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      setIsEditMode(false);
                      setFormData({
                        title: viewingCourse.title || "",
                        slug: viewingCourse.slug || "",
                        subtitle: viewingCourse.subtitle || "",
                        description: viewingCourse.description || "",
                        categoryId: viewingCourse.categoryId || "",
                        level: viewingCourse.level || "BEGINNER",
                        language: viewingCourse.language || "English",
                        thumbnail: null,
                        requirements: viewingCourse.requirements || "",
                        outcomes: viewingCourse.outcomes || "",
                        audience: viewingCourse.audience || "",
                        videoUrl: viewingCourse.trailer || "",
                        isPublished: viewingCourse.isPublished || false,
                        isFeatured: viewingCourse.isFeatured || false,
                      });
                      setThumbnailPreview(viewingCourse.thumbnail || null);
                      setFormErrors({});
                    }}
                  >
                    Cancel
                  </button>
                  <button className="btn-save" onClick={handleSaveCourse} disabled={isSubmitting}>
                    {isSubmitting ? <><span className="spinner-small" /> Saving...</> : <><Save size={18} /> Update</>}
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-edit" onClick={() => openEditModal(viewingCourse)}>
                    <Edit size={18} /> Edit
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => {
                      setShowViewModal(false);
                      openDeleteModal(viewingCourse);
                    }}
                  >
                    <Trash2 size={18} /> Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ─────────────────────────────── */}
      {showDeleteModal && (
        <div className="modal confirm-modal" onClick={() => {
          if (!isSubmitting) {
            setShowDeleteModal(false);
            setDeleteError(null);
            setCourseToDelete(null);
          }
        }}>
          <div className="modal-content confirm-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button 
                className="modal-close" 
                onClick={() => {
                  if (!isSubmitting) {
                    setShowDeleteModal(false);
                    setDeleteError(null);
                    setCourseToDelete(null);
                  }
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="confirm-body">
              <AlertCircle size={48} className="confirm-icon" />
              <p>Are you sure you want to delete this course?</p>
              <p className="confirm-sub">
                This will permanently remove the course and all its related data.
              </p>

              {viewingCourse && viewingCourse._count?.enrollments > 0 && (
                <div className="confirm-warning">
                  <AlertCircle size={16} />
                  <span>This course has {viewingCourse._count.enrollments} enrollment(s).</span>
                </div>
              )}

              {deleteError && (
                <div className="confirm-error">
                  <AlertCircle size={16} />
                  <span>{deleteError}</span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-cancel" 
                onClick={() => {
                  if (!isSubmitting) {
                    setShowDeleteModal(false);
                    setDeleteError(null);
                    setCourseToDelete(null);
                  }
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                className="btn-danger" 
                onClick={handleDeleteCourse} 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-small" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} /> Delete Course
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCourses;