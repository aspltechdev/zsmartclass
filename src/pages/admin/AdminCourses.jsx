import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  GraduationCap,
  Layers,
} from "lucide-react";

import api from "../../services/api";
import "./AdminCourses.css";
import "./AdminShared.css";

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect width='600' height='400' fill='%23667eea'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='32' font-family='Arial,sans-serif'%3ECourse%3C/text%3E%3C/svg%3E";

const EMPTY_FORM = {
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
};

const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const LANGUAGES = ["English", "Tamil"];

const getImageUrl = (path) => {
  if (!path) return FALLBACK_IMAGE;

  if (
    path.startsWith("data:image") ||
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }

  const baseUrl = (
    api.defaults?.baseURL || "http://localhost:5000/api"
  )
    .replace(/\/$/, "")
    .replace(/\/api$/, "");

  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

const handleImageError = (e) => {
  if (e.currentTarget.src !== FALLBACK_IMAGE) {
    e.currentTarget.src = FALLBACK_IMAGE;
  }
};

const generateSlug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const lessonCount = (module) =>
  module?._count?.lessons ?? module?.lessons?.length ?? 0;

const getLevelClass = (level) => {
  switch (level) {
    case "BEGINNER":
      return "level-beginner";
    case "INTERMEDIATE":
      return "level-intermediate";
    case "ADVANCED":
      return "level-advanced";
    default:
      return "level-default";
  }
};

const getStatusClass = (status) => {
  switch (status) {
    case "PUBLISHED":
      return "status-published";
    case "ARCHIVED":
      return "status-archived";
    default:
      return "status-draft";
  }
};

// Resize large source images before sending them to the backend.
const prepareThumbnail = async (file) => {
  const imageUrl = URL.createObjectURL(file);

  try {
    const img = new Image();

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => {
        reject(
          new Error("Cannot open this image. Try JPEG, PNG or WebP.")
        );
      };
      img.src = imageUrl;
    });

    if (!img.naturalWidth || !img.naturalHeight) {
      throw new Error("This image has invalid dimensions.");
    }

    const scale = Math.min(
      1,
      1600 / Math.max(img.naturalWidth, img.naturalHeight)
    );

    let width = Math.max(1, Math.round(img.naturalWidth * scale));
    let height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement("canvas");

    while (true) {
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Image processing is unavailable.");
      }

      context.drawImage(img, 0, 0, width, height);

      const imageData = canvas.toDataURL("image/webp", 0.85);

      if (imageData === "data:,") {
        throw new Error("Unable to process this image.");
      }

      // Keep the encoded image below 2 MiB.
      if (imageData.length <= 2 * 1024 * 1024) {
        return imageData;
      }

      if (width === 1 && height === 1) {
        throw new Error("Unable to compress this image.");
      }

      width = Math.max(1, Math.round(width * 0.75));
      height = Math.max(1, Math.round(height * 0.75));
    }
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
};

function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editingCourse, setEditingCourse] = useState(null);
  const [viewingCourse, setViewingCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const [courseModules, setCourseModules] = useState([]);
  const [availableModules, setAvailableModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [moduleActionId, setModuleActionId] = useState(null);
  const [selectedModuleToAdd, setSelectedModuleToAdd] = useState("");

  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [formErrors, setFormErrors] = useState({});
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const fileInputRef = useRef(null);
  const imageRequestRef = useRef(0);
  const imageBusyRef = useRef(false);

  const busy = isSubmitting || isProcessingImage;

  useEffect(() => {
    fetchAllData();

    return () => {
      imageRequestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const modalOpen =
      showCreateModal || showViewModal || showDeleteModal;

    if (!modalOpen) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    document.body.classList.add("courses-modal-open");

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove("courses-modal-open");
    };
  }, [showCreateModal, showViewModal, showDeleteModal]);

  const fetchAllData = async () => {
    setLoading(true);

    try {
      const [coursesRes, categoriesRes] = await Promise.all([
        api.get("/courses"),
        api.get("/categories"),
      ]);

      const coursesData =
        coursesRes.data?.data || coursesRes.data || [];

      const categoriesData =
        categoriesRes.data?.data || categoriesRes.data || [];

      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: courses.length,
    published: courses.filter(
      (course) => course.status === "PUBLISHED"
    ).length,
    draft: courses.filter(
      (course) => course.status === "DRAFT"
    ).length,
    featured: courses.filter(
      (course) => course.isFeatured
    ).length,
    enrollments: courses.reduce(
      (sum, course) => sum + Number(course._count?.enrollments || 0),
      0
    ),
  };

  const resetForm = () => {
    imageRequestRef.current += 1;
    imageBusyRef.current = false;
    setIsProcessingImage(false);

    setFormData({ ...EMPTY_FORM });
    setThumbnailPreview(null);
    setFormErrors({});

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFormChange = async (e) => {
    const input = e.target;
    const { name, value, type, checked, files } = input;

    if (type === "file") {
      const file = files?.[0];

      if (!file || isSubmitting || imageBusyRef.current) return;

      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image.");
        input.value = "";
        return;
      }

      const requestId = ++imageRequestRef.current;

      imageBusyRef.current = true;
      setIsProcessingImage(true);

      try {
        const imageData = await prepareThumbnail(file);

        if (requestId !== imageRequestRef.current) return;

        setFormData((prev) => ({
          ...prev,
          thumbnail: imageData,
        }));

        setThumbnailPreview(imageData);

        setFormErrors((prev) => ({
          ...prev,
          thumbnail: "",
        }));
      } catch (error) {
        if (requestId === imageRequestRef.current) {
          alert(error.message || "Unable to process this image.");
        }
      } finally {
        if (requestId === imageRequestRef.current) {
          imageBusyRef.current = false;
          setIsProcessingImage(false);
          input.value = "";
        }
      }

      return;
    }

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "title" && !editingCourse
        ? { slug: generateSlug(value) }
        : {}),
    }));

    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleRemoveThumbnail = () => {
    if (busy || imageBusyRef.current) return;

    setThumbnailPreview(null);

    // An empty string explicitly removes an existing thumbnail.
    setFormData((prev) => ({
      ...prev,
      thumbnail: "",
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openCreateModal = () => {
    setEditingCourse(null);
    setViewingCourse(null);
    setIsEditMode(false);
    resetForm();
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    if (busy || imageBusyRef.current) return;
    setShowCreateModal(false);
    resetForm();
  };

  const openViewModal = async (course) => {
    setViewingCourse(course);
    setEditingCourse(null);
    setIsEditMode(false);
    setSelectedModuleToAdd("");
    setCourseModules([]);
    setAvailableModules([]);
    setShowViewModal(true);

    await loadCourseModules(course.id);
  };

  const openEditModal = (course) => {
    resetForm();
    setEditingCourse(course);
    setViewingCourse(course);

    setFormData({
      title: course.title || "",
      slug: course.slug || "",
      subtitle: course.subtitle || "",
      description: course.description || "",
      categoryId: course.categoryId ? String(course.categoryId) : "",
      level: course.level || "BEGINNER",
      language: course.language || "English",
      thumbnail: null,
      requirements: course.requirements || "",
      outcomes: course.outcomes || "",
      audience: course.audience || "",
      videoUrl: course.trailer || "",
      isPublished: Boolean(
        course.isPublished || course.status === "PUBLISHED"
      ),
      isFeatured: Boolean(course.isFeatured),
    });

    setThumbnailPreview(
      course.thumbnail ? getImageUrl(course.thumbnail) : null
    );

    setFormErrors({});
    setIsEditMode(true);
    setShowViewModal(true);
  };

  const cancelEdit = () => {
    if (busy || imageBusyRef.current) return;
    setIsEditMode(false);
    setEditingCourse(null);
    resetForm();
  };

  const closeViewModal = () => {
    if (busy || imageBusyRef.current) return;

    setShowViewModal(false);
    setIsEditMode(false);
    setViewingCourse(null);
    setEditingCourse(null);
    resetForm();
  };

  const loadCourseModules = async (courseId) => {
    setModulesLoading(true);

    try {
      const [courseRes, availableRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/courses/${courseId}/available-modules`),
      ]);

      setCourseModules(courseRes.data?.data?.modules || []);
      setAvailableModules(availableRes.data?.data || []);
    } catch (error) {
      console.error("Error loading modules:", error);
      setCourseModules([]);
      setAvailableModules([]);
    } finally {
      setModulesLoading(false);
    }
  };

  const loadAvailableModules = async (courseId) => {
    try {
      const response = await api.get(
        `/courses/${courseId}/available-modules`
      );
      setAvailableModules(response.data?.data || []);
    } catch (error) {
      console.error(error);
      setAvailableModules([]);
    }
  };

  const handleAttachModule = async () => {
    if (!selectedModuleToAdd || !viewingCourse || moduleActionId !== null) {
      return;
    }

    setModuleActionId("attach");

    try {
      const response = await api.post(
        `/courses/${viewingCourse.id}/modules`,
        { moduleId: Number(selectedModuleToAdd) }
      );

      if (response.data?.data) {
        setCourseModules(response.data.data);
      }

      setSelectedModuleToAdd("");
      await loadAvailableModules(viewingCourse.id);
    } catch (error) {
      alert(
        error.response?.data?.message || "Failed to attach module"
      );
    } finally {
      setModuleActionId(null);
    }
  };

  const handleDetachModule = async (moduleId) => {
    if (!viewingCourse || moduleActionId !== null) return;

    setModuleActionId(moduleId);

    try {
      const response = await api.delete(
        `/courses/${viewingCourse.id}/modules/${moduleId}`
      );

      if (response.data?.data) {
        setCourseModules(response.data.data);
      }

      await loadAvailableModules(viewingCourse.id);
    } catch (error) {
      alert(
        error.response?.data?.message || "Failed to detach module"
      );
    } finally {
      setModuleActionId(null);
    }
  };

  const handleSaveCourse = async () => {
    if (busy || imageBusyRef.current) return;

    const errors = {};

    if (!formData.title.trim()) {
      errors.title = "Course title is required";
    }

    if (!formData.categoryId) {
      errors.categoryId = "Category is required";
    }

    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    const wasEditing = Boolean(editingCourse);
    setIsSubmitting(true);

    try {
      const user = JSON.parse(
        sessionStorage.getItem("user") ||
          localStorage.getItem("user") ||
          "{}"
      );

      let thumbnail = null;

      if (typeof formData.thumbnail === "string") {
        thumbnail = formData.thumbnail || null;
      } else if (formData.thumbnail instanceof File) {
        thumbnail = await prepareThumbnail(formData.thumbnail);
      } else if (editingCourse?.thumbnail) {
        thumbnail = editingCourse.thumbnail;
      }

      const payload = {
        title: formData.title.trim(),
        slug: formData.slug?.trim() || generateSlug(formData.title),
        subtitle: formData.subtitle?.trim() || "",
        description: formData.description?.trim() || "",
        language: formData.language || "English",
        level: formData.level || "BEGINNER",
        requirements: formData.requirements?.trim() || null,
        outcomes: formData.outcomes?.trim() || null,
        audience: formData.audience?.trim() || null,
        categoryId: Number(formData.categoryId),
        createdById: Number(user.id) || 1,
        trailer: formData.videoUrl?.trim() || null,
        isPublished: Boolean(formData.isPublished),
        isFeatured: Boolean(formData.isFeatured),
        status: formData.isPublished ? "PUBLISHED" : "DRAFT",
        thumbnail,
      };

      if (editingCourse) {
        await api.put(`/courses/${editingCourse.id}`, payload);
      } else {
        await api.post("/courses", payload);
      }

      setShowCreateModal(false);
      setShowViewModal(false);
      setIsEditMode(false);
      setEditingCourse(null);
      setViewingCourse(null);
      resetForm();

      await fetchAllData();

      alert(
        wasEditing
          ? "Course updated successfully!"
          : "Course created successfully!"
      );
    } catch (error) {
      console.error("SAVE COURSE ERROR:", error);

      alert(
        error.response?.data?.message || "Failed to save course"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (course) => {
    setCourseToDelete(course.id);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (isSubmitting) return;

    setShowDeleteModal(false);
    setCourseToDelete(null);
    setDeleteError(null);
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete || isSubmitting) return;

    setIsSubmitting(true);
    setDeleteError(null);

    try {
      await api.delete(`/courses/${courseToDelete}`);

      setShowDeleteModal(false);
      setShowViewModal(false);
      setCourseToDelete(null);
      setViewingCourse(null);

      await fetchAllData();
      alert("Course deleted successfully!");
    } catch (error) {
      setDeleteError(
        error.response?.data?.message || "Failed to delete course"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePublish = async (course) => {
    const newStatus =
      course.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

    try {
      await api.put(`/courses/${course.id}`, {
        status: newStatus,
        isPublished: newStatus === "PUBLISHED",
      });

      await fetchAllData();
    } catch (error) {
      console.error(error);
      alert("Failed to update status");
    }
  };

  const toggleFeatured = async (course) => {
    try {
      await api.put(`/courses/${course.id}`, {
        isFeatured: !course.isFeatured,
      });

      await fetchAllData();
    } catch (error) {
      console.error(error);
      alert("Failed to update featured status");
    }
  };

  const filteredCourses = courses.filter((course) => {
    const search = searchTerm.toLowerCase();

    const matchSearch =
      course.title?.toLowerCase().includes(search) ||
      course.description?.toLowerCase().includes(search);

    const matchStatus =
      statusFilter === "all" || course.status === statusFilter;

    const matchCategory =
      !categoryFilter ||
      Number(course.categoryId) === Number(categoryFilter);

    return matchSearch && matchStatus && matchCategory;
  });

  const formProps = {
    formData,
    formErrors,
    levels: LEVELS,
    languages: LANGUAGES,
    categories,
    handleFormChange,
    thumbnailPreview,
    fileInputRef,
    handleRemoveThumbnail,
    isProcessingImage,
    disabled: busy,
  };

  if (loading) {
    return (
      <div className="courses-page">
        <div className="courses-loading">
          <div className="courses-spinner" />
          <span>Loading courses...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-page">
      <div className="courses-header">
        <div className="courses-heading-row">
          <div>
            <h1>
              <GraduationCap size={29} /> Course Management
            </h1>
            <p>
              Create, manage and organize your learning courses.
            </p>
          </div>
        </div>

        <button
          className="courses-primary-btn"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          New Course
        </button>
      </div>

      <div className="course-stats">
        <StatCard
          className="stat-blue"
          icon={<BookOpen size={21} />}
          title="Total Courses"
          value={stats.total}
        />
        <StatCard
          className="stat-green"
          icon={<CheckCircle size={21} />}
          title="Published"
          value={stats.published}
        />
        <StatCard
          className="stat-orange"
          icon={<Clock size={21} />}
          title="Drafts"
          value={stats.draft}
        />
        <StatCard
          className="stat-purple"
          icon={<Star size={21} />}
          title="Featured"
          value={stats.featured}
        />
        <StatCard
          className="stat-cyan"
          icon={<Users size={21} />}
          title="Enrollments"
          value={stats.enrollments}
        />
      </div>

      <div className="courses-toolbar">
        <div className="courses-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>

        <select
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

        <button
          className="courses-refresh-btn"
          onClick={fetchAllData}
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="courses-table-card">
        <div className="courses-table-header">
          <div>
            <h2>Courses</h2>
            <span>
              {filteredCourses.length} course
              {filteredCourses.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="courses-table-container">
          <table className="courses-table">
            <thead>
              <tr>
                <th>COURSE</th>
                <th>CATEGORY</th>
                <th>LEVEL</th>
                <th>STATUS</th>
                <th>STUDENTS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="courses-empty-cell">
                    <div className="courses-empty">
                      <div className="empty-icon">
                        <BookOpen size={28} />
                      </div>
                      <h3>No courses found</h3>
                      <p>
                        Try changing your filters or create a new course.
                      </p>
                      <button
                        className="courses-primary-btn"
                        onClick={openCreateModal}
                      >
                        <Plus size={17} />
                        Create Course
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <div className="course-info">
                        <img
                          className="course-thumbnail"
                          src={getImageUrl(course.thumbnail)}
                          alt={course.title || "Course"}
                          loading="lazy"
                          onError={handleImageError}
                        />

                        <div className="course-info-text">
                          <strong>{course.title}</strong>
                          {course.subtitle && (
                            <span>{course.subtitle}</span>
                          )}
                          <small>
                            Created {formatDate(course.createdAt)}
                          </small>
                        </div>

                        {course.isFeatured && (
                          <span className="featured-label">
                            <Star size={12} fill="currentColor" />
                            Featured
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className="category-label">
                        {course.category?.name || "N/A"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`level-label ${getLevelClass(
                          course.level
                        )}`}
                      >
                        {course.level || "N/A"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status-label ${getStatusClass(
                          course.status
                        )}`}
                      >
                        <i />
                        {course.status || "DRAFT"}
                      </span>
                    </td>

                    <td>
                      <span className="student-label">
                        <Users size={15} />
                        {course._count?.enrollments || 0}
                      </span>
                    </td>

                    <td>
                      <div className="course-actions">
                        <button
                          className="action-view"
                          onClick={() => openViewModal(course)}
                          title="View"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          className={`action-star ${
                            course.isFeatured ? "active" : ""
                          }`}
                          onClick={() => toggleFeatured(course)}
                          title={
                            course.isFeatured
                              ? "Remove Featured"
                              : "Make Featured"
                          }
                        >
                          <Star
                            size={16}
                            fill={
                              course.isFeatured ? "currentColor" : "none"
                            }
                          />
                        </button>

                        <button
                          className="action-status"
                          onClick={() => togglePublish(course)}
                          title={
                            course.status === "PUBLISHED"
                              ? "Unpublish"
                              : "Publish"
                          }
                        >
                          {course.status === "PUBLISHED" ? (
                            <XCircle size={16} />
                          ) : (
                            <CheckCircle size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal &&
        createPortal(
          <div
            className="courses-modal-overlay"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeCreateModal();
            }}
          >
            <div className="courses-modal">
              <div className="courses-modal-header">
                <div>
                  <h2>Create New Course</h2>
                  <p>Add a new course to your learning platform.</p>
                </div>

                <button
                  className="modal-x"
                  onClick={closeCreateModal}
                  disabled={busy}
                >
                  <X size={19} />
                </button>
              </div>

              <div className="courses-modal-body">
                <CourseForm {...formProps} />
              </div>

              <div className="courses-modal-footer">
                <button
                  className="modal-cancel"
                  onClick={closeCreateModal}
                  disabled={busy}
                >
                  Cancel
                </button>

                <button
                  className="modal-save"
                  onClick={handleSaveCourse}
                  disabled={busy}
                >
                  {busy ? (
                    <>
                      <span className="small-spinner" />
                      {isProcessingImage ? "Processing image..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Create Course
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {showViewModal &&
        viewingCourse &&
        createPortal(
          <div
            className="courses-modal-overlay"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeViewModal();
            }}
          >
            <div className="courses-modal course-view-modal">
              <div className="courses-modal-header">
                <div>
                  <h2>
                    {isEditMode ? "Edit Course" : "Course Details"}
                  </h2>
                  <p>
                    {isEditMode
                      ? "Update course information."
                      : "View course information and modules."}
                  </p>
                </div>

                <button
                  className="modal-x"
                  disabled={busy}
                  onClick={isEditMode ? cancelEdit : closeViewModal}
                >
                  <X size={19} />
                </button>
              </div>

              <div className="courses-modal-body">
                {isEditMode ? (
                  <CourseForm {...formProps} />
                ) : (
                  <>
                    <div className="course-detail-top">
                      <img
                        className="course-detail-image"
                        src={getImageUrl(viewingCourse.thumbnail)}
                        alt={viewingCourse.title || "Course"}
                        onError={handleImageError}
                      />

                      <div className="course-detail-content">
                        <div className="detail-title-row">
                          <h3>{viewingCourse.title}</h3>

                          {viewingCourse.isFeatured && (
                            <span className="detail-featured">
                              <Star size={13} fill="currentColor" />
                              Featured
                            </span>
                          )}
                        </div>

                        {viewingCourse.subtitle && (
                          <p>{viewingCourse.subtitle}</p>
                        )}

                        <div className="detail-student">
                          <Users size={16} />
                          {viewingCourse._count?.enrollments || 0} students
                        </div>
                      </div>
                    </div>

                    <div className="detail-grid">
                      <div>
                        <label>Category</label>
                        <strong>
                          {viewingCourse.category?.name || "N/A"}
                        </strong>
                      </div>
                      <div>
                        <label>Level</label>
                        <strong>{viewingCourse.level || "N/A"}</strong>
                      </div>
                      <div>
                        <label>Language</label>
                        <strong>{viewingCourse.language || "N/A"}</strong>
                      </div>
                      <div>
                        <label>Status</label>
                        <span
                          className={`status-label ${getStatusClass(
                            viewingCourse.status
                          )}`}
                        >
                          <i />
                          {viewingCourse.status || "DRAFT"}
                        </span>
                      </div>
                    </div>

                    {viewingCourse.description && (
                      <div className="detail-section">
                        <h4>Description</h4>
                        <p>{viewingCourse.description}</p>
                      </div>
                    )}

                    <div className="detail-meta">
                      <span>
                        Created: {formatDate(viewingCourse.createdAt)}
                      </span>
                      {viewingCourse.updatedAt && (
                        <span>
                          Updated: {formatDate(viewingCourse.updatedAt)}
                        </span>
                      )}
                    </div>

                    <div className="modules-section">
                      <div className="modules-heading">
                        <div>
                          <h4>
                            <Layers size={18} />
                            Modules
                          </h4>
                          <span>{courseModules.length} attached</span>
                        </div>
                      </div>

                      <div className="module-add-row">
                        <select
                          value={selectedModuleToAdd}
                          onChange={(e) =>
                            setSelectedModuleToAdd(e.target.value)
                          }
                          disabled={
                            modulesLoading || moduleActionId !== null
                          }
                        >
                          <option value="">
                            {availableModules.length
                              ? "Select module to add"
                              : "No modules available"}
                          </option>

                          {availableModules.map((module) => (
                            <option key={module.id} value={module.id}>
                              {module.title} ({lessonCount(module)} lessons)
                            </option>
                          ))}
                        </select>

                        <button
                          className="module-add-btn"
                          onClick={handleAttachModule}
                          disabled={
                            !selectedModuleToAdd ||
                            modulesLoading ||
                            moduleActionId !== null
                          }
                        >
                          {moduleActionId === "attach" ? (
                            <span className="small-spinner" />
                          ) : (
                            <Plus size={16} />
                          )}
                          Add
                        </button>
                      </div>

                      {modulesLoading ? (
                        <div className="modules-loading">
                          <span className="small-spinner" />
                          Loading modules...
                        </div>
                      ) : courseModules.length === 0 ? (
                        <div className="no-modules">
                          <Layers size={25} />
                          <span>No modules attached yet.</span>
                        </div>
                      ) : (
                        <div className="modules-list">
                          {courseModules.map((module, index) => (
                            <div className="module-item" key={module.id}>
                              <div className="module-number">{index + 1}</div>

                              <div className="module-info">
                                <strong>{module.title}</strong>
                                <span>
                                  {lessonCount(module)} lesson
                                  {lessonCount(module) !== 1 ? "s" : ""}
                                </span>
                              </div>

                              <button
                                className="module-remove"
                                onClick={() =>
                                  handleDetachModule(module.id)
                                }
                                disabled={moduleActionId !== null}
                              >
                                {moduleActionId === module.id ? (
                                  <span className="small-spinner" />
                                ) : (
                                  <X size={14} />
                                )}
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="courses-modal-footer">
                {isEditMode ? (
                  <>
                    <button
                      className="modal-cancel"
                      onClick={cancelEdit}
                      disabled={busy}
                    >
                      Cancel
                    </button>

                    <button
                      className="modal-save"
                      onClick={handleSaveCourse}
                      disabled={busy}
                    >
                      {busy ? (
                        <>
                          <span className="small-spinner" />
                          {isProcessingImage
                            ? "Processing image..."
                            : "Saving..."}
                        </>
                      ) : (
                        <>
                          <Save size={17} />
                          Update Course
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="modal-delete"
                      onClick={() => {
                        setShowViewModal(false);
                        openDeleteModal(viewingCourse);
                      }}
                    >
                      <Trash2 size={17} />
                      Delete
                    </button>

                    <button
                      className="modal-edit"
                      onClick={() => openEditModal(viewingCourse)}
                    >
                      <Edit size={17} />
                      Edit Course
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {showDeleteModal &&
        createPortal(
          <div
            className="courses-modal-overlay"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeDeleteModal();
            }}
          >
            <div className="delete-modal">
              <div className="delete-icon">
                <AlertCircle size={28} />
              </div>

              <h2>Delete Course?</h2>
              <p>
                Are you sure you want to permanently delete this course?
              </p>
              <span className="delete-note">
                This action cannot be undone.
              </span>

              {viewingCourse?._count?.enrollments > 0 && (
                <div className="delete-warning">
                  <AlertCircle size={16} />
                  <span>
                    This course has {viewingCourse._count.enrollments}{" "}
                    enrollment(s).
                  </span>
                </div>
              )}

              {deleteError && (
                <div className="delete-error">
                  <AlertCircle size={16} />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="delete-actions">
                <button
                  className="modal-cancel"
                  onClick={closeDeleteModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  className="delete-confirm"
                  onClick={handleDeleteCourse}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="small-spinner" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={17} />
                      Delete Course
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

function StatCard({ className, icon, title, value }) {
  return (
    <div className={`course-stat-card ${className}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function CourseForm({
  formData,
  formErrors,
  levels,
  languages,
  categories,
  handleFormChange,
  thumbnailPreview,
  fileInputRef,
  handleRemoveThumbnail,
  isProcessingImage,
  disabled,
}) {
  return (
    <div className="course-form">
      <div className="form-section-title">
        <span>01</span>
        <div>
          <h3>Basic Information</h3>
          <p>Enter the main information about your course.</p>
        </div>
      </div>

      <div className="form-grid-2">
        <div className="form-field">
          <label>
            Course Title <b>*</b>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleFormChange}
            placeholder="e.g. Complete JavaScript Course"
            className={formErrors.title ? "input-error" : ""}
            disabled={disabled}
          />
          {formErrors.title && <small>{formErrors.title}</small>}
        </div>

        <div className="form-field">
          <label>Slug</label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleFormChange}
            placeholder="course-slug"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="form-field">
        <label>Subtitle</label>
        <input
          type="text"
          name="subtitle"
          value={formData.subtitle}
          onChange={handleFormChange}
          placeholder="Short description of the course"
          disabled={disabled}
        />
      </div>

      <div className="form-field">
        <label>Description</label>
        <textarea
          name="description"
          rows="4"
          value={formData.description}
          onChange={handleFormChange}
          placeholder="Describe what students will learn..."
          disabled={disabled}
        />
      </div>

      <div className="form-grid-3">
        <div className="form-field">
          <label>
            Category <b>*</b>
          </label>
          <select
            name="categoryId"
            value={formData.categoryId}
            onChange={handleFormChange}
            className={formErrors.categoryId ? "input-error" : ""}
            disabled={disabled}
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {formErrors.categoryId && (
            <small>{formErrors.categoryId}</small>
          )}
        </div>

        <div className="form-field">
          <label>Level</label>
          <select
            name="level"
            value={formData.level}
            onChange={handleFormChange}
            disabled={disabled}
          >
            {levels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>Language</label>
          <select
            name="language"
            value={formData.language}
            onChange={handleFormChange}
            disabled={disabled}
          >
            {languages.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-section-title form-content-title">
        <span>02</span>
        <div>
          <h3>Course Content</h3>
          <p>
            Help students understand what they will get from this course.
          </p>
        </div>
      </div>

      <div className="form-field">
        <label>Requirements</label>
        <textarea
          name="requirements"
          rows="3"
          value={formData.requirements}
          onChange={handleFormChange}
          placeholder="What should students know before starting?"
          disabled={disabled}
        />
      </div>

      <div className="form-field">
        <label>Learning Outcomes</label>
        <textarea
          name="outcomes"
          rows="3"
          value={formData.outcomes}
          onChange={handleFormChange}
          placeholder="What will students learn?"
          disabled={disabled}
        />
      </div>

      <div className="form-field">
        <label>Target Audience</label>
        <textarea
          name="audience"
          rows="3"
          value={formData.audience}
          onChange={handleFormChange}
          placeholder="Who is this course for?"
          disabled={disabled}
        />
      </div>

      <div className="form-section-title form-content-title">
        <span>03</span>
        <div>
          <h3>Media</h3>
          <p>Add a thumbnail and promotional video.</p>
        </div>
      </div>

      <div className="form-field">
        <label>Course Thumbnail</label>

        <div className="upload-area">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            ref={fileInputRef}
            onChange={handleFormChange}
            name="thumbnail"
            id="course-thumbnail"
            disabled={disabled}
          />

          <label
            htmlFor="course-thumbnail"
            className="upload-label"
          >
            <Upload size={20} />
            <div>
              <strong>
                {isProcessingImage
                  ? "Processing image..."
                  : "Click to upload thumbnail"}
              </strong>
              <span>PNG, JPG or WEBP · Automatically resized</span>
            </div>
          </label>

          {thumbnailPreview && (
            <div className="upload-preview">
              <img
                src={thumbnailPreview}
                alt="Course thumbnail preview"
                onError={handleImageError}
              />

              <button
                type="button"
                className="remove-preview-btn"
                onClick={handleRemoveThumbnail}
                disabled={disabled}
                title="Remove thumbnail"
              >
                <X size={15} />
              </button>
            </div>
          )}
        </div>

        {formErrors.thumbnail && (
          <small>{formErrors.thumbnail}</small>
        )}
      </div>

      <div className="form-field">
        <label>Promo Video URL</label>
        <input
          type="url"
          name="videoUrl"
          value={formData.videoUrl}
          onChange={handleFormChange}
          placeholder="https://youtube.com/..."
          disabled={disabled}
        />
      </div>

      <div className="form-section-title form-content-title">
        <span>04</span>
        <div>
          <h3>Settings</h3>
          <p>Configure visibility and featured status.</p>
        </div>
      </div>

      <div className="settings-grid">
        <label className="setting-box">
          <input
            type="checkbox"
            name="isPublished"
            checked={formData.isPublished}
            onChange={handleFormChange}
            disabled={disabled}
          />
          <span className="custom-checkbox">
            <CheckCircle size={15} />
          </span>
          <div>
            <strong>Publish Course</strong>
            <small>Make this course visible to students.</small>
          </div>
        </label>

        <label className="setting-box">
          <input
            type="checkbox"
            name="isFeatured"
            checked={formData.isFeatured}
            onChange={handleFormChange}
            disabled={disabled}
          />
          <span className="custom-checkbox">
            <Star size={15} />
          </span>
          <div>
            <strong>Featured Course</strong>
            <small>Highlight this course on the platform.</small>
          </div>
        </label>
      </div>
    </div>
  );
}

export default AdminCourses;