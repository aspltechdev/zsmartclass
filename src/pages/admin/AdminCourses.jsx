// src/pages/admin/AdminCourses.jsx
import { useEffect, useState, useRef } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  IndianRupee,
  Users,
  Star,
  Upload,
  X,
  RefreshCw,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  Calendar,
  Tag,
  Layers,
  DollarSign,
  TrendingUp,
  Award,
  PlayCircle,
  FileCheck,
  Link2,
  Copy,
  Save,
  ArrowLeft,
} from "lucide-react";
import api from "../../services/api";
import "./AdminCourses.css";

// ✅ FIX: Local fallback image (no external dependencies)
const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23667eea'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='20' font-family='sans-serif'%3ECourse%3C/text%3E%3C/svg%3E";

function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewingCourse, setViewingCourse] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const fileInputRef = useRef(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    slug: "",
    subtitle: "",
    description: "",
    price: "",
    discountPrice: "",
    categoryId: "",
    level: "BEGINNER",
    language: "English",
    thumbnail: null,
    requirements: "",
    outcomes: "",
    audience: "",
    status: "DRAFT",
    isFeatured: false,
    isFree: false,
    duration: "",
    videoUrl: "",
    isPublished: false,
  });

  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
    featured: 0,
    totalEnrollments: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/courses");
      const data = res.data.data || res.data;
      setCourses(data);
      calculateStats(data);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setCourses([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const total = data.length;
    const published = data.filter(c => c.status === "PUBLISHED").length;
    const draft = data.filter(c => c.status === "DRAFT").length;
    const archived = data.filter(c => c.status === "ARCHIVED").length;
    const featured = data.filter(c => c.isFeatured).length;
    const totalEnrollments = data.reduce((sum, c) => sum + (c._count?.enrollments || 0), 0);
    const totalRevenue = data.reduce((sum, c) => sum + ((c.price || 0) * (c._count?.enrollments || 0)), 0);

    setStats({ total, published, draft, archived, featured, totalEnrollments, totalRevenue });
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data.data || res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories([]);
    }
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === "file") {
      const file = files[0];
      if (file) {
        setForm({ ...form, thumbnail: file });
        const reader = new FileReader();
        reader.onloadend = () => {
          setThumbnailPreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else if (type === "checkbox") {
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
      if (name === "title" && !editing) {
        setForm(prev => ({
          ...prev,
          slug: generateSlug(value)
        }));
      }
    }
    
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

  const handleSaveCourse = async () => {
    try {
      const errors = {};
      if (!form.title || form.title.trim() === "") {
        errors.title = "Course title is required";
      }
      if (!form.categoryId) {
        errors.categoryId = "Category is required";
      }
      if (!form.price && form.price !== 0) {
        errors.price = "Price is required";
      }
      if (form.price < 0) {
        errors.price = "Price cannot be negative";
      }
      
      if (form.discountPrice && form.discountPrice < 0) {
        errors.discountPrice = "Discount price cannot be negative";
      }
      if (form.discountPrice && form.discountPrice > form.price) {
        errors.discountPrice = "Discount price cannot be greater than original price";
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      setIsSubmitting(true);

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const createdById = user.id || 1;

      const data = {
        title: form.title.trim(),
        slug: form.slug || generateSlug(form.title),
        subtitle: form.subtitle || "",
        description: form.description || "",
        language: form.language || "English",
        level: form.level || "BEGINNER",
        duration: parseInt(form.duration) || 0,
        price: parseFloat(form.price) || 0,
        requirements: form.requirements || "null",
        outcomes: form.outcomes || "null",
        audience: form.audience || "null",
        categoryId: parseInt(form.categoryId),
        createdById: createdById,
        trailer: form.videoUrl || "null",
        isPublished: form.isPublished,
        isFeatured: form.isFeatured,
        isFree: form.isFree,
        status: form.isPublished ? "PUBLISHED" : "DRAFT",
      };

      if (form.slug) {
        data.slug = form.slug;
      } else {
        data.slug = generateSlug(form.title);
      }

      if (form.discountPrice !== undefined && 
          form.discountPrice !== null && 
          form.discountPrice !== "" && 
          form.discountPrice !== "0") {
        const discountValue = parseFloat(form.discountPrice);
        if (!isNaN(discountValue) && discountValue > 0) {
          data.discountPrice = discountValue;
        }
      }

      Object.keys(data).forEach(key => {
        if (data[key] === undefined) {
          delete data[key];
        }
      });

      console.log("📤 Sending data:", JSON.stringify(data, null, 2));

      let response;
      if (editing) {
        response = await api.put(`/courses/${editing.id}`, data);
      } else {
        response = await api.post("/courses", data);
      }

      console.log("✅ Response:", response.data);

      setShowModal(false);
      setEditing(null);
      resetForm();
      await fetchCourses();
      setIsSubmitting(false);
      setIsEditMode(false);
      setShowViewModal(false);
      
      alert(editing ? "Course updated successfully!" : "Course created successfully!");
    } catch (err) {
      setIsSubmitting(false);
      console.error("❌ Error:", err);
      console.error("❌ Response:", err.response);
      console.error("❌ Error data:", err.response?.data);
      
      let errorMessage = "Failed to save course";
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

  const handleDeleteCourse = async (id) => {
    try {
      await api.delete(`/courses/${id}`);
      await fetchCourses();
      setShowDeleteConfirm(null);
      setShowViewModal(false);
      setIsEditMode(false);
      alert("Course deleted successfully!");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete course";
      if (message.includes("foreign key") || message.includes("constraint")) {
        alert("Cannot delete this course because it has related data. Please delete all related data first.");
      } else {
        alert(message);
      }
    }
  };

  const handleTogglePublish = async (course) => {
    const newStatus = course.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      await api.put(`/courses/${course.id}`, { 
        status: newStatus, 
        isPublished: newStatus === "PUBLISHED" 
      });
      await fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update course status");
    }
  };

  const handleToggleFeatured = async (course) => {
    try {
      await api.put(`/courses/${course.id}`, { isFeatured: !course.isFeatured });
      await fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update featured status");
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      slug: "",
      subtitle: "",
      description: "",
      price: "",
      discountPrice: "",
      categoryId: "",
      level: "BEGINNER",
      language: "English",
      thumbnail: null,
      requirements: "",
      outcomes: "",
      audience: "",
      status: "DRAFT",
      isFeatured: false,
      isFree: false,
      duration: "",
      videoUrl: "",
      welcomeMessage: "",
      completionMessage: "",
      isPublished: false,
    });
    setThumbnailPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setFormErrors({});
  };

  const openCreateModal = () => {
    setEditing(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (course) => {
    setEditing(course);
    setForm({
      title: course.title || "",
      slug: course.slug || "",
      subtitle: course.subtitle || "",
      description: course.description || "",
      price: course.price || "",
      discountPrice: course.discountPrice || "",
      categoryId: course.categoryId || "",
      level: course.level || "BEGINNER",
      language: course.language || "English",
      thumbnail: null,
      requirements: course.requirements || "",
      outcomes: course.outcomes || "",
      audience: course.audience || "",
      status: course.status || "DRAFT",
      isFeatured: course.isFeatured || false,
      isFree: course.isFree || false,
      duration: course.duration || "",
      videoUrl: course.trailer || "",
      isPublished: course.isPublished || course.status === "PUBLISHED" || false,
    });
    setThumbnailPreview(course.thumbnail || null);
    setIsEditMode(true);
    setShowViewModal(true);
    setFormErrors({});
  };

  const openViewModal = (course) => {
    setViewingCourse(course);
    setIsEditMode(false);
    setShowViewModal(true);
  };

  const handleEditClick = () => {
    if (viewingCourse) {
      openEditModal(viewingCourse);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    if (viewingCourse) {
      setForm({
        title: viewingCourse.title || "",
        slug: viewingCourse.slug || "",
        subtitle: viewingCourse.subtitle || "",
        description: viewingCourse.description || "",
        price: viewingCourse.price || "",
        discountPrice: viewingCourse.discountPrice || "",
        categoryId: viewingCourse.categoryId || "",
        level: viewingCourse.level || "BEGINNER",
        language: viewingCourse.language || "English",
        thumbnail: null,
        requirements: viewingCourse.requirements || "",
        outcomes: viewingCourse.outcomes || "",
        audience: viewingCourse.audience || "",
        status: viewingCourse.status || "DRAFT",
        isFeatured: viewingCourse.isFeatured || false,
        isFree: viewingCourse.isFree || false,
        duration: viewingCourse.duration || "",
        videoUrl: viewingCourse.trailer || "",
        welcomeMessage: viewingCourse.welcomeMessage || "",
        completionMessage: viewingCourse.completionMessage || "",
        isPublished: viewingCourse.isPublished || false,
      });
      setThumbnailPreview(viewingCourse.thumbnail || null);
    }
    setFormErrors({});
  };

  const handleDuplicateCourse = async (course) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const { id, ...courseData } = course;
      const newCourse = {
        ...courseData,
        title: `${course.title} (Copy)`,
        slug: `${course.slug}-copy`,
        status: "DRAFT",
        isPublished: false,
        isFeatured: false,
        createdById: user.id || 1,
        _count: { enrollments: 0 },
      };
      await api.post("/courses", newCourse);
      await fetchCourses();
      alert("Course duplicated successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to duplicate course");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
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
    const colors = {
      BEGINNER: "#10b981",
      INTERMEDIATE: "#f59e0b",
      ADVANCED: "#ef4444",
    };
    return colors[level] || "#64748b";
  };

  const getStatusBadge = (status) => {
    const classes = {
      PUBLISHED: "status-published",
      DRAFT: "status-draft",
      ARCHIVED: "status-archived",
    };
    return classes[status] || "status-draft";
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title?.toLowerCase().includes(search.toLowerCase()) ||
                         course.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || course.status === statusFilter;
    const matchesCategory = !categoryFilter || course.categoryId === Number(categoryFilter);
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
  const languages = ["English", "Hindi", "Tamil", "Telugu", "Malayalam", "Kannada", "Spanish", "French", "German", "Chinese"];

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
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Course Management</h1>
          <p className="subtitle">Manage your courses and their content</p>
        </div>
        <div className="header-actions">
          <button className="add-btn" onClick={openCreateModal}>
            <Plus size={18} />
            New Course
          </button>
        </div>
      </div>

      {/* Stats Cards */}
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
          <h2>{stats.totalEnrollments}</h2>
          <p>Enrollments</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <button className="refresh-btn" onClick={fetchCourses}>
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Courses Table */}
      <div className="table-wrapper">
        <table className="course-table">
          <thead>
            <tr>
              <th style={{ width: "30%" }}>Course</th>
              <th>Category</th>
              <th>Level</th>
              <th>Price</th>
              <th>Status</th>
              <th>Students</th>
              <th style={{ width: "180px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "40px" }}>
                  <div className="empty-state">
                    <BookOpen size={48} />
                    <h3>No courses found</h3>
                    <p>Create your first course to get started</p>
                    <button className="add-btn" onClick={openCreateModal}>
                      <Plus size={18} />
                      Create Course
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCourses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <div className="course-title">
                      {/* ✅ FIXED: Use FALLBACK_IMAGE instead of via.placeholder.com */}
                      <img
                        src={course.thumbnail || FALLBACK_IMAGE}
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
                          {course._count?.modules || 0} Modules • Created: {formatDate(course.createdAt)}
                        </small>
                        {course.isFeatured && (
                          <span className="featured-badge">★ Featured</span>
                        )}
                        {course.isFree && (
                          <span className="free-badge">Free</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="category-badge">
                      {course.category?.name || "N/A"}
                    </span>
                  </td>
                  <td>
                    <span
                      className="level-badge"
                      style={{
                        position: "static",
                        backgroundColor: getLevelColor(course.level) + '20',
                        color: getLevelColor(course.level)
                      }}
                    >
                      {course.level || "Not set"}
                    </span>
                  </td>
                  <td>
                    {course.isFree ? (
                      <span className="price-badge free">Free</span>
                    ) : (
                      <>
                        <span className="price-badge">
                          {formatCurrency(course.price)}
                        </span>
                        {course.discountPrice > 0 && course.discountPrice < course.price && (
                          <small className="discount-text">
                            {formatCurrency(course.discountPrice)}
                          </small>
                        )}
                      </>
                    )}
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
                      <button 
                        title="View Course" 
                        className="view-btn"
                        onClick={() => openViewModal(course)}
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        title={course.isFeatured ? "Remove Featured" : "Make Featured"}
                        className={`feature-btn ${course.isFeatured ? 'active' : ''}`}
                        onClick={() => handleToggleFeatured(course)}
                      >
                        <Star size={18} />
                      </button>
                      <button 
                        title={course.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                        className="publish-btn"
                        onClick={() => handleTogglePublish(course)}
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
              <p>Are you sure you want to delete this course?</p>
              <p className="confirm-sub">This action cannot be undone. All associated data will be permanently removed.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={() => handleDeleteCourse(showDeleteConfirm)}>
                <Trash2 size={18} />
                Delete Course
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
              <h2>Create New Course</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-section">
                <h3>Basic Information</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Course Title *</label>
                    <input
                      type="text"
                      name="title"
                      placeholder="Enter course title"
                      value={form.title}
                      onChange={handleInputChange}
                      className={formErrors.title ? "error" : ""}
                    />
                    {formErrors.title && <span className="error-text">{formErrors.title}</span>}
                  </div>

                  <div className="form-group">
                    <label>Slug</label>
                    <input
                      type="text"
                      name="slug"
                      placeholder="course-url-slug"
                      value={form.slug}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Subtitle</label>
                  <input
                    type="text"
                    name="subtitle"
                    placeholder="Short subtitle for the course"
                    value={form.subtitle}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    placeholder="Describe your course..."
                    rows={4}
                    value={form.description}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      name="categoryId"
                      value={form.categoryId}
                      onChange={handleInputChange}
                      className={formErrors.categoryId ? "error" : ""}
                    >
                      <option value="">Choose Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.categoryId && <span className="error-text">{formErrors.categoryId}</span>}
                  </div>

                  <div className="form-group">
                    <label>Level</label>
                    <select
                      name="level"
                      value={form.level}
                      onChange={handleInputChange}
                    >
                      {levels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Language</label>
                    <select
                      name="language"
                      value={form.language}
                      onChange={handleInputChange}
                    >
                      {languages.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Duration (minutes)</label>
                    <input
                      type="number"
                      name="duration"
                      placeholder="120"
                      value={form.duration}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Pricing</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price (₹) *</label>
                    <input
                      type="number"
                      name="price"
                      placeholder="0"
                      value={form.price}
                      onChange={handleInputChange}
                      className={formErrors.price ? "error" : ""}
                    />
                    {formErrors.price && <span className="error-text">{formErrors.price}</span>}
                  </div>

                  <div className="form-group">
                    <label>Discount Price (₹)</label>
                    <input
                      type="number"
                      name="discountPrice"
                      placeholder="0"
                      value={form.discountPrice}
                      onChange={handleInputChange}
                      className={formErrors.discountPrice ? "error" : ""}
                    />
                    {formErrors.discountPrice && <span className="error-text">{formErrors.discountPrice}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      name="isFree"
                      checked={form.isFree}
                      onChange={handleInputChange}
                    />
                    <span>Free Course</span>
                  </label>
                </div>
              </div>

              <div className="form-section">
                <h3>Course Content</h3>
                
                <div className="form-group">
                  <label>Requirements</label>
                  <textarea
                    name="requirements"
                    placeholder="What students need to know before taking this course?"
                    rows={3}
                    value={form.requirements}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Learning Outcomes</label>
                  <textarea
                    name="outcomes"
                    placeholder="What will students learn from this course?"
                    rows={3}
                    value={form.outcomes}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Target Audience</label>
                  <textarea
                    name="audience"
                    placeholder="Who is this course for?"
                    rows={3}
                    value={form.audience}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Media & Additional</h3>
                
                <div className="form-group">
                  <label>Thumbnail</label>
                  <div className="file-upload">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleInputChange}
                      ref={fileInputRef}
                      id="thumbnail-upload"
                      name="thumbnail"
                    />
                    <label htmlFor="thumbnail-upload" className="file-upload-label">
                      <Upload size={18} />
                      {form.thumbnail ? form.thumbnail.name : "Upload Thumbnail"}
                    </label>
                    {thumbnailPreview && (
                      <div className="thumbnail-preview">
                        <img src={thumbnailPreview} alt="Thumbnail preview" />
                        <button 
                          type="button"
                          onClick={() => {
                            setThumbnailPreview(null);
                            setForm({ ...form, thumbnail: null });
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
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
                  <input
                    type="url"
                    name="videoUrl"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={form.videoUrl}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Settings</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        name="isPublished"
                        checked={form.isPublished}
                        onChange={handleInputChange}
                      />
                      <span>Publish Course</span>
                    </label>
                  </div>

                  <div className="form-group">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        name="isFeatured"
                        checked={form.isFeatured}
                        onChange={handleInputChange}
                      />
                      <span>Featured Course</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-save" onClick={handleSaveCourse} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="spinner-small"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Create Course
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View/Edit Modal - Inline Edit */}
      {showViewModal && viewingCourse && (
        <div className="modal view-modal" onClick={() => {
          if (!isEditMode) {
            setShowViewModal(false);
          }
        }}>
          <div className="modal-content view-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditMode ? "Edit Course" : "Course Details"}</h2>
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
              {/* Thumbnail */}
              <div className="view-thumbnail">
                {isEditMode ? (
                  <div className="file-upload">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleInputChange}
                      ref={fileInputRef}
                      id="edit-thumbnail-upload"
                      name="thumbnail"
                    />
                    <label htmlFor="edit-thumbnail-upload" className="file-upload-label">
                      <Upload size={18} />
                      {form.thumbnail ? form.thumbnail.name : "Change Thumbnail"}
                    </label>
                    {thumbnailPreview ? (
                      <div className="thumbnail-preview">
                        <img src={thumbnailPreview} alt="Thumbnail preview" />
                        <button 
                          type="button"
                          onClick={() => {
                            setThumbnailPreview(null);
                            setForm({ ...form, thumbnail: null });
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : viewingCourse.thumbnail && (
                      <div className="thumbnail-preview">
                        <img 
                          src={viewingCourse.thumbnail} 
                          alt="Current thumbnail"
                          onError={(e) => {
                            e.target.src = FALLBACK_IMAGE;
                          }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <img
                    src={viewingCourse.thumbnail || FALLBACK_IMAGE}
                    alt={viewingCourse.title}
                    onError={(e) => {
                      e.target.src = FALLBACK_IMAGE;
                    }}
                  />
                )}
              </div>

              {/* Course Info / Edit Form */}
              <div className="view-info">
                {isEditMode ? (
                  // Edit Mode - Form fields inline
                  <div className="edit-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Course Title *</label>
                        <input
                          type="text"
                          name="title"
                          placeholder="Enter course title"
                          value={form.title}
                          onChange={handleInputChange}
                          className={formErrors.title ? "error" : ""}
                        />
                        {formErrors.title && <span className="error-text">{formErrors.title}</span>}
                      </div>
                      <div className="form-group">
                        <label>Slug</label>
                        <input
                          type="text"
                          name="slug"
                          placeholder="course-url-slug"
                          value={form.slug}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Subtitle</label>
                      <input
                        type="text"
                        name="subtitle"
                        placeholder="Short subtitle for the course"
                        value={form.subtitle}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        name="description"
                        placeholder="Describe your course..."
                        rows={3}
                        value={form.description}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Category *</label>
                        <select
                          name="categoryId"
                          value={form.categoryId}
                          onChange={handleInputChange}
                          className={formErrors.categoryId ? "error" : ""}
                        >
                          <option value="">Choose Category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        {formErrors.categoryId && <span className="error-text">{formErrors.categoryId}</span>}
                      </div>
                      <div className="form-group">
                        <label>Level</label>
                        <select
                          name="level"
                          value={form.level}
                          onChange={handleInputChange}
                        >
                          {levels.map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Language</label>
                        <select
                          name="language"
                          value={form.language}
                          onChange={handleInputChange}
                        >
                          {languages.map((lang) => (
                            <option key={lang} value={lang}>
                              {lang}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Duration (minutes)</label>
                        <input
                          type="number"
                          name="duration"
                          placeholder="120"
                          value={form.duration}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Price (₹) *</label>
                        <input
                          type="number"
                          name="price"
                          placeholder="0"
                          value={form.price}
                          onChange={handleInputChange}
                          className={formErrors.price ? "error" : ""}
                        />
                        {formErrors.price && <span className="error-text">{formErrors.price}</span>}
                      </div>
                      <div className="form-group">
                        <label>Discount Price (₹)</label>
                        <input
                          type="number"
                          name="discountPrice"
                          placeholder="0"
                          value={form.discountPrice}
                          onChange={handleInputChange}
                          className={formErrors.discountPrice ? "error" : ""}
                        />
                        {formErrors.discountPrice && <span className="error-text">{formErrors.discountPrice}</span>}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="toggle-label">
                        <input
                          type="checkbox"
                          name="isFree"
                          checked={form.isFree}
                          onChange={handleInputChange}
                        />
                        <span>Free Course</span>
                      </label>
                    </div>

                    <div className="form-group">
                      <label>Requirements</label>
                      <textarea
                        name="requirements"
                        placeholder="What students need to know before taking this course?"
                        rows={2}
                        value={form.requirements}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Learning Outcomes</label>
                      <textarea
                        name="outcomes"
                        placeholder="What will students learn from this course?"
                        rows={2}
                        value={form.outcomes}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Target Audience</label>
                      <textarea
                        name="audience"
                        placeholder="Who is this course for?"
                        rows={2}
                        value={form.audience}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Promo Video URL</label>
                      <input
                        type="url"
                        name="videoUrl"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={form.videoUrl}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Welcome Message</label>
                      <input
                        type="text"
                        name="welcomeMessage"
                        placeholder="Welcome to the course!"
                        value={form.welcomeMessage}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Completion Message</label>
                      <input
                        type="text"
                        name="completionMessage"
                        placeholder="Congratulations on completing the course!"
                        value={form.completionMessage}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="toggle-label">
                          <input
                            type="checkbox"
                            name="isPublished"
                            checked={form.isPublished}
                            onChange={handleInputChange}
                          />
                          <span>Publish Course</span>
                        </label>
                      </div>
                      <div className="form-group">
                        <label className="toggle-label">
                          <input
                            type="checkbox"
                            name="isFeatured"
                            checked={form.isFeatured}
                            onChange={handleInputChange}
                          />
                          <span>Featured Course</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  // View Mode - Display all details
                  <>
                    <h3>{viewingCourse.title}</h3>
                    {viewingCourse.subtitle && (
                      <p className="view-subtitle">{viewingCourse.subtitle}</p>
                    )}

                    <div className="view-stats">
                      <div className="view-stat">
                        <BookOpen size={18} />
                        <span>{viewingCourse._count?.modules || 0} Modules</span>
                      </div>
                      <div className="view-stat">
                        <Users size={18} />
                        <span>{viewingCourse._count?.enrollments || 0} Students</span>
                      </div>
                      <div className="view-stat">
                        <Clock size={18} />
                        <span>{viewingCourse.duration || 0} min</span>
                      </div>
                      <div className="view-stat">
                        <IndianRupee size={18} />
                        <span>
                          {viewingCourse.isFree ? "Free" : formatCurrency(viewingCourse.price)}
                        </span>
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
                      {viewingCourse.discountPrice && viewingCourse.discountPrice < viewingCourse.price && (
                        <div className="view-detail-item">
                          <label>Discount</label>
                          <span className="discount-text">
                            {formatCurrency(viewingCourse.discountPrice)}
                          </span>
                        </div>
                      )}
                    </div>

                    {viewingCourse.description && (
                      <div className="view-section">
                        <h4>Description</h4>
                        <p>{viewingCourse.description}</p>
                      </div>
                    )}

                    {viewingCourse.requirements && (
                      <div className="view-section">
                        <h4>Requirements</h4>
                        <p>{viewingCourse.requirements}</p>
                      </div>
                    )}

                    {viewingCourse.outcomes && (
                      <div className="view-section">
                        <h4>What You'll Learn</h4>
                        <p>{viewingCourse.outcomes}</p>
                      </div>
                    )}

                    {viewingCourse.audience && (
                      <div className="view-section">
                        <h4>Target Audience</h4>
                        <p>{viewingCourse.audience}</p>
                      </div>
                    )}

                    {viewingCourse.modules && viewingCourse.modules.length > 0 && (
                      <div className="view-section">
                        <h4>Course Content</h4>
                        <div className="view-modules">
                          {viewingCourse.modules.map((module, index) => (
                            <div key={module.id} className="view-module">
                              <div className="view-module-header">
                                <span className="module-number">{index + 1}.</span>
                                <span className="module-title">{module.title}</span>
                                <span className="module-lessons">
                                  {module.lessons?.length || 0} lessons
                                </span>
                              </div>
                              {module.lessons && module.lessons.length > 0 && (
                                <div className="view-lessons">
                                  {module.lessons.map((lesson, lessonIndex) => (
                                    <div key={lesson.id} className="view-lesson">
                                      <span className="lesson-number">{lessonIndex + 1}.</span>
                                      <span className="lesson-title">{lesson.title}</span>
                                      {lesson.duration && (
                                        <span className="lesson-duration">
                                          <Clock size={14} />
                                          {lesson.duration} min
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="view-meta">
                      <span>Created: {formatDate(viewingCourse.createdAt)}</span>
                      {viewingCourse.updatedAt && (
                        <span>Updated: {formatDate(viewingCourse.updatedAt)}</span>
                      )}
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
                  <button className="btn-save" onClick={handleSaveCourse} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="spinner-small"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Update Course
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-edit" onClick={handleEditClick}>
                    <Edit size={18} />
                    Edit
                  </button>
                  <button className="btn-danger" onClick={() => {
                    setShowViewModal(false);
                    setShowDeleteConfirm(viewingCourse.id);
                  }}>
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

export default AdminCourses;