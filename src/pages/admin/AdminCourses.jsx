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

/* =========================================================
   FALLBACK IMAGE
========================================================= */

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect width='600' height='400' fill='%23667eea'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='32' font-family='Arial,sans-serif'%3ECourse%3C/text%3E%3C/svg%3E";

/* =========================================================
   IMAGE URL HELPER
========================================================= */

const getImageUrl = (path) => {
  if (!path) {
    return FALLBACK_IMAGE;
  }

  // Base64 / data URL
  if (path.startsWith("data:image")) {
    return path;
  }

  // Full URL
  if (
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }

  // `api.defaults.baseURL` ends with `/api`, but uploaded files are served
  // from the server root (e.g. http://localhost:5000/uploads/x.jpg).
  // Leaving `/api` on produces a 404 and falls back to the placeholder.
  const baseUrl = (
    api.defaults?.baseURL || "http://localhost:5000/api"
  )
    .replace(/\/$/, "")
    .replace(/\/api$/, "");

  const cleanPath = path.startsWith("/")
    ? path
    : `/${path}`;

  return `${baseUrl}${cleanPath}`;
};

/* =========================================================
   ADMIN COURSES
========================================================= */

function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [editingCourse, setEditingCourse] =
    useState(null);

  const [viewingCourse, setViewingCourse] =
    useState(null);

  const [courseToDelete, setCourseToDelete] =
    useState(null);

  const [isEditMode, setIsEditMode] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [deleteError, setDeleteError] =
    useState(null);

  /* =====================================================
     MODULE STATES
  ===================================================== */

  const [courseModules, setCourseModules] =
    useState([]);

  const [availableModules, setAvailableModules] =
    useState([]);

  const [modulesLoading, setModulesLoading] =
    useState(false);

  const [moduleActionId, setModuleActionId] =
    useState(null);

  const [selectedModuleToAdd, setSelectedModuleToAdd] =
    useState("");

  /* =====================================================
     FORM
  ===================================================== */

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

  const [formErrors, setFormErrors] =
    useState({});

  const [thumbnailPreview, setThumbnailPreview] =
    useState(null);

  const fileInputRef = useRef(null);

  /* =====================================================
     STATS
  ===================================================== */

  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    featured: 0,
    enrollments: 0,
  });

  const levels = [
    "BEGINNER",
    "INTERMEDIATE",
    "ADVANCED",
  ];

  const languages = [
    "English",
    "Hindi",
    "Tamil",
    "Telugu",
    "Malayalam",
    "Kannada",
    "Spanish",
    "French",
    "German",
    "Chinese",
  ];

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    fetchAllData();
  }, []);

  /* =========================================================
     BODY SCROLL
  ========================================================= */

  useEffect(() => {
    const modalOpen =
      showCreateModal ||
      showViewModal ||
      showDeleteModal;

    if (modalOpen) {
      document.body.classList.add(
        "courses-modal-open"
      );
    } else {
      document.body.classList.remove(
        "courses-modal-open"
      );
    }

    return () => {
      document.body.classList.remove(
        "courses-modal-open"
      );
    };
  }, [
    showCreateModal,
    showViewModal,
    showDeleteModal,
  ]);

  /* =========================================================
     API
  ========================================================= */

  const fetchAllData = async () => {
    setLoading(true);

    try {
      const [coursesRes, categoriesRes] =
        await Promise.all([
          api.get("/courses"),
          api.get("/categories"),
        ]);

      const coursesData =
        coursesRes.data?.data ||
        coursesRes.data ||
        [];

      const categoriesData =
        categoriesRes.data?.data ||
        categoriesRes.data ||
        [];

      setCourses(
        Array.isArray(coursesData)
          ? coursesData
          : []
      );

      setCategories(
        Array.isArray(categoriesData)
          ? categoriesData
          : []
      );

      calculateStats(
        Array.isArray(coursesData)
          ? coursesData
          : []
      );
    } catch (error) {
      console.error(
        "Error fetching courses:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const total = data.length;

    const published = data.filter(
      (course) =>
        course.status === "PUBLISHED"
    ).length;

    const draft = data.filter(
      (course) =>
        course.status === "DRAFT"
    ).length;

    const featured = data.filter(
      (course) =>
        course.isFeatured
    ).length;

    const enrollments = data.reduce(
      (sum, course) =>
        sum +
        Number(
          course._count?.enrollments || 0
        ),
      0
    );

    setStats({
      total,
      published,
      draft,
      featured,
      enrollments,
    });
  };

  /* =========================================================
     HELPERS
  ========================================================= */

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  const lessonCount = (module) =>
    module?._count?.lessons ??
    module?.lessons?.length ??
    0;

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

      case "DRAFT":
        return "status-draft";

      case "ARCHIVED":
        return "status-archived";

      default:
        return "status-draft";
    }
  };

  /* =========================================================
     FILE -> DATA URL
  ========================================================= */

  const fileToDataUrl = (file) => {
    return new Promise(
      (resolve, reject) => {
        if (!file) {
          resolve(null);
          return;
        }

        const reader =
          new FileReader();

        reader.onload = () => {
          resolve(reader.result);
        };

        reader.onerror = () => {
          reject(
            new Error(
              "Failed to read image"
            )
          );
        };

        reader.readAsDataURL(file);
      }
    );
  };

  /* =========================================================
     RESET FORM
  ========================================================= */

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

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  const handleFormChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
      files,
    } = e.target;

    /* IMAGE */

    if (type === "file") {
      const file = files?.[0];

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert(
          "Please select a valid image."
        );

        e.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert(
          "Image size must be less than 5 MB."
        );

        e.target.value = "";
        return;
      }

      setFormData((prev) => ({
        ...prev,
        thumbnail: file,
      }));

      const reader =
        new FileReader();

      reader.onload = (event) => {
        setThumbnailPreview(
          event.target.result
        );
      };

      reader.readAsDataURL(file);

      return;
    }

    /* CHECKBOX */

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));

      return;
    }

    /* NORMAL INPUT */

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    /* AUTO SLUG */

    if (
      name === "title" &&
      !editingCourse
    ) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(value),
      }));
    }

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  /* =========================================================
     CREATE
  ========================================================= */

  const openCreateModal = () => {
    setEditingCourse(null);
    setViewingCourse(null);
    setIsEditMode(false);

    resetForm();

    setShowCreateModal(true);
  };

  /* =========================================================
     VIEW
  ========================================================= */

  const openViewModal = async (course) => {
    setViewingCourse(course);
    setEditingCourse(null);
    setIsEditMode(false);

    setSelectedModuleToAdd("");
    setCourseModules([]);
    setAvailableModules([]);

    setShowViewModal(true);

    await loadCourseModules(
      course.id
    );
  };

  /* =========================================================
     EDIT
  ========================================================= */

  const openEditModal = (course) => {
    setEditingCourse(course);
    setViewingCourse(course);

    setFormData({
      title: course.title || "",
      slug: course.slug || "",
      subtitle: course.subtitle || "",
      description:
        course.description || "",

      categoryId:
        course.categoryId
          ? String(course.categoryId)
          : "",

      level:
        course.level || "BEGINNER",

      language:
        course.language || "English",

      /*
       * Important:
       * Keep this null unless a new
       * file is selected.
       */
      thumbnail: null,

      requirements:
        course.requirements || "",

      outcomes:
        course.outcomes || "",

      audience:
        course.audience || "",

      videoUrl:
        course.trailer || "",

      isPublished: Boolean(
        course.isPublished ||
          course.status === "PUBLISHED"
      ),

      isFeatured: Boolean(
        course.isFeatured
      ),
    });

    setThumbnailPreview(
      course.thumbnail
        ? getImageUrl(
            course.thumbnail
          )
        : null
    );

    setFormErrors({});
    setIsEditMode(true);
    setShowViewModal(true);
  };

  /* =========================================================
     CLOSE VIEW
  ========================================================= */

  const closeViewModal = () => {
    if (isSubmitting) return;

    setShowViewModal(false);
    setIsEditMode(false);
    setViewingCourse(null);
    setEditingCourse(null);
  };

  /* =========================================================
     MODULES
  ========================================================= */

  const loadCourseModules = async (
    courseId
  ) => {
    setModulesLoading(true);

    try {
      const [
        courseRes,
        availableRes,
      ] = await Promise.all([
        api.get(
          `/courses/${courseId}`
        ),
        api.get(
          `/courses/${courseId}/available-modules`
        ),
      ]);

      setCourseModules(
        courseRes.data?.data
          ?.modules || []
      );

      setAvailableModules(
        availableRes.data?.data || []
      );
    } catch (error) {
      console.error(
        "Error loading modules:",
        error
      );

      setCourseModules([]);
      setAvailableModules([]);
    } finally {
      setModulesLoading(false);
    }
  };

  const loadAvailableModules = async (
    courseId
  ) => {
    try {
      const response =
        await api.get(
          `/courses/${courseId}/available-modules`
        );

      setAvailableModules(
        response.data?.data || []
      );
    } catch (error) {
      console.error(error);
      setAvailableModules([]);
    }
  };

  const handleAttachModule = async () => {
    if (
      !selectedModuleToAdd ||
      !viewingCourse
    ) {
      return;
    }

    setModuleActionId("attach");

    try {
      const response =
        await api.post(
          `/courses/${viewingCourse.id}/modules`,
          {
            moduleId: Number(
              selectedModuleToAdd
            ),
          }
        );

      if (response.data?.data) {
        setCourseModules(
          response.data.data
        );
      }

      setSelectedModuleToAdd("");

      await loadAvailableModules(
        viewingCourse.id
      );
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to attach module"
      );
    } finally {
      setModuleActionId(null);
    }
  };

  const handleDetachModule = async (
    moduleId
  ) => {
    if (!viewingCourse) return;

    setModuleActionId(moduleId);

    try {
      const response =
        await api.delete(
          `/courses/${viewingCourse.id}/modules/${moduleId}`
        );

      if (response.data?.data) {
        setCourseModules(
          response.data.data
        );
      }

      await loadAvailableModules(
        viewingCourse.id
      );
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to detach module"
      );
    } finally {
      setModuleActionId(null);
    }
  };

  /* =========================================================
     SAVE COURSE
  ========================================================= */

  const handleSaveCourse = async () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title =
        "Course title is required";
    }

    if (!formData.categoryId) {
      errors.categoryId =
        "Category is required";
    }

    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const user = JSON.parse(
        localStorage.getItem("user") ||
          "{}"
      );

      /* ===============================================
         THUMBNAIL
      =============================================== */

      let thumbnail = null;

      if (
        formData.thumbnail instanceof
        File
      ) {
        thumbnail =
          await fileToDataUrl(
            formData.thumbnail
          );
      } else if (
        typeof formData.thumbnail ===
        "string"
      ) {
        thumbnail =
          formData.thumbnail;
      } else if (
        editingCourse?.thumbnail
      ) {
        /*
         * Editing without selecting
         * another image.
         */
        thumbnail =
          editingCourse.thumbnail;
      }

      /* ===============================================
         PAYLOAD
      =============================================== */

      const payload = {
        title: formData.title.trim(),

        slug:
          formData.slug?.trim() ||
          generateSlug(
            formData.title
          ),

        subtitle:
          formData.subtitle?.trim() ||
          "",

        description:
          formData.description?.trim() ||
          "",

        language:
          formData.language ||
          "English",

        level:
          formData.level ||
          "BEGINNER",

        requirements:
          formData.requirements?.trim() ||
          null,

        outcomes:
          formData.outcomes?.trim() ||
          null,

        audience:
          formData.audience?.trim() ||
          null,

        categoryId: Number(
          formData.categoryId
        ),

        createdById:
          Number(user.id) || 1,

        trailer:
          formData.videoUrl?.trim() ||
          null,

        isPublished:
          Boolean(
            formData.isPublished
          ),

        isFeatured:
          Boolean(
            formData.isFeatured
          ),

        status:
          formData.isPublished
            ? "PUBLISHED"
            : "DRAFT",

        /* =========================================
           THIS FIXES THE THUMBNAIL
        ========================================= */

        thumbnail: thumbnail,
      };

      console.log(
        "COURSE PAYLOAD:",
        payload
      );

      /* ===============================================
         API
      =============================================== */

      if (editingCourse) {
        await api.put(
          `/courses/${editingCourse.id}`,
          payload
        );
      } else {
        await api.post(
          "/courses",
          payload
        );
      }

      setShowCreateModal(false);
      setShowViewModal(false);
      setIsEditMode(false);

      setEditingCourse(null);
      setViewingCourse(null);

      resetForm();

      await fetchAllData();

      alert(
        editingCourse
          ? "Course updated successfully!"
          : "Course created successfully!"
      );
    } catch (error) {
      console.error(
        "SAVE COURSE ERROR:",
        error
      );

      console.error(
        "SERVER RESPONSE:",
        error.response?.data
      );

      alert(
        error.response?.data?.message ||
          "Failed to save course"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

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
    if (!courseToDelete) return;

    setIsSubmitting(true);
    setDeleteError(null);

    try {
      await api.delete(
        `/courses/${courseToDelete}`
      );

      setShowDeleteModal(false);
      setShowViewModal(false);

      setCourseToDelete(null);
      setViewingCourse(null);

      await fetchAllData();

      alert(
        "Course deleted successfully!"
      );
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to delete course";

      setDeleteError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =========================================================
     PUBLISH
  ========================================================= */

  const togglePublish = async (
    course
  ) => {
    const newStatus =
      course.status === "PUBLISHED"
        ? "DRAFT"
        : "PUBLISHED";

    try {
      await api.put(
        `/courses/${course.id}`,
        {
          status: newStatus,
          isPublished:
            newStatus === "PUBLISHED",
        }
      );

      await fetchAllData();
    } catch (error) {
      console.error(error);
      alert(
        "Failed to update status"
      );
    }
  };

  /* =========================================================
     FEATURED
  ========================================================= */

  const toggleFeatured = async (
    course
  ) => {
    try {
      await api.put(
        `/courses/${course.id}`,
        {
          isFeatured:
            !course.isFeatured,
        }
      );

      await fetchAllData();
    } catch (error) {
      console.error(error);

      alert(
        "Failed to update featured status"
      );
    }
  };

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredCourses =
    courses.filter((course) => {
      const search =
        searchTerm.toLowerCase();

      const matchSearch =
        course.title
          ?.toLowerCase()
          .includes(search) ||
        course.description
          ?.toLowerCase()
          .includes(search);

      const matchStatus =
        statusFilter === "all" ||
        course.status ===
          statusFilter;

      const matchCategory =
        !categoryFilter ||
        Number(course.categoryId) ===
          Number(categoryFilter);

      return (
        matchSearch &&
        matchStatus &&
        matchCategory
      );
    });

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="courses-page">
        <div className="courses-loading">
          <div className="courses-spinner" />
          <span>
            Loading courses...
          </span>
        </div>
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="courses-page">

      {/* HEADER */}

      <div className="courses-header">
        <div className="courses-heading-row">
          <div>
            <h1>
              <GraduationCap size={29} />  Course Management
            </h1>

            <p>
              Create, manage and organize
              your learning courses.
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

      {/* STATS */}

      <div className="course-stats">

        <StatCard
          className="stat-blue"
          icon={<BookOpen size={21} />}
          title="Total Courses"
          value={stats.total}
        />

        <StatCard
          className="stat-green"
          icon={
            <CheckCircle size={21} />
          }
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

      {/* TOOLBAR */}

      <div className="courses-toolbar">

        <div className="courses-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value
            )
          }
        >
          <option value="all">
            All Status
          </option>

          <option value="PUBLISHED">
            Published
          </option>

          <option value="DRAFT">
            Draft
          </option>

          <option value="ARCHIVED">
            Archived
          </option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(
              e.target.value
            )
          }
        >
          <option value="">
            All Categories
          </option>

          {categories.map(
            (category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            )
          )}
        </select>

        <button
          className="courses-refresh-btn"
          onClick={fetchAllData}
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>

      </div>

      {/* TABLE */}

      <div className="courses-table-card">

        <div className="courses-table-header">
          <div>
            <h2>Courses</h2>

            <span>
              {filteredCourses.length}{" "}
              course
              {filteredCourses.length !==
              1
                ? "s"
                : ""}
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

              {filteredCourses.length ===
              0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="courses-empty-cell"
                  >
                    <div className="courses-empty">

                      <div className="empty-icon">
                        <BookOpen
                          size={28}
                        />
                      </div>

                      <h3>
                        No courses found
                      </h3>

                      <p>
                        Try changing your
                        filters or create a
                        new course.
                      </p>

                      <button
                        className="courses-primary-btn"
                        onClick={
                          openCreateModal
                        }
                      >
                        <Plus size={17} />
                        Create Course
                      </button>

                    </div>
                  </td>
                </tr>
              ) : (
                filteredCourses.map(
                  (course) => (
                    <tr
                      key={course.id}
                    >

                      {/* COURSE */}

                      <td>
                        <div className="course-info">

                          <img
                            className="course-thumbnail"
                            src={getImageUrl(
                              course.thumbnail
                            )}
                            alt={
                              course.title ||
                              "Course"
                            }
                            loading="lazy"
                            onError={(e) => {
                              if (
                                e.currentTarget
                                  .src !==
                                FALLBACK_IMAGE
                              ) {
                                e.currentTarget.src =
                                  FALLBACK_IMAGE;
                              }
                            }}
                          />

                          <div className="course-info-text">

                            <strong>
                              {
                                course.title
                              }
                            </strong>

                            {course.subtitle && (
                              <span>
                                {
                                  course.subtitle
                                }
                              </span>
                            )}

                            <small>
                              Created{" "}
                              {formatDate(
                                course.createdAt
                              )}
                            </small>

                          </div>

                          {course.isFeatured && (
                            <span className="featured-label">

                              <Star
                                size={12}
                                fill="currentColor"
                              />

                              Featured

                            </span>
                          )}

                        </div>
                      </td>

                      {/* CATEGORY */}

                      <td>
                        <span className="category-label">
                          {course.category
                            ?.name ||
                            "N/A"}
                        </span>
                      </td>

                      {/* LEVEL */}

                      <td>
                        <span
                          className={`level-label ${getLevelClass(
                            course.level
                          )}`}
                        >
                          {course.level ||
                            "N/A"}
                        </span>
                      </td>

                      {/* STATUS */}

                      <td>
                        <span
                          className={`status-label ${getStatusClass(
                            course.status
                          )}`}
                        >
                          <i />
                          {course.status ||
                            "DRAFT"}
                        </span>
                      </td>

                      {/* STUDENTS */}

                      <td>
                        <span className="student-label">

                          <Users size={15} />

                          {course._count
                            ?.enrollments ||
                            0}

                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td>
                        <div className="course-actions">

                          <button
                            className="action-view"
                            onClick={() =>
                              openViewModal(
                                course
                              )
                            }
                            title="View"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            className={`action-star ${
                              course.isFeatured
                                ? "active"
                                : ""
                            }`}
                            onClick={() =>
                              toggleFeatured(
                                course
                              )
                            }
                            title={
                              course.isFeatured
                                ? "Remove Featured"
                                : "Make Featured"
                            }
                          >
                            <Star
                              size={16}
                              fill={
                                course.isFeatured
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          </button>

                          <button
                            className="action-status"
                            onClick={() =>
                              togglePublish(
                                course
                              )
                            }
                            title={
                              course.status ===
                              "PUBLISHED"
                                ? "Unpublish"
                                : "Publish"
                            }
                          >
                            {course.status ===
                            "PUBLISHED" ? (
                              <XCircle
                                size={16}
                              />
                            ) : (
                              <CheckCircle
                                size={16}
                              />
                            )}
                          </button>

                        </div>
                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>

          </table>

        </div>
      </div>

      {/* =====================================================
          CREATE MODAL
      ===================================================== */}

      {showCreateModal &&
        createPortal(
          <div
            className="courses-modal-overlay"
            onMouseDown={(e) => {
              if (
                e.target ===
                  e.currentTarget &&
                !isSubmitting
              ) {
                setShowCreateModal(
                  false
                );
              }
            }}
          >

            <div className="courses-modal">

              <div className="courses-modal-header">

                <div>
                  <h2>
                    Create New Course
                  </h2>

                  <p>
                    Add a new course to your
                    learning platform.
                  </p>
                </div>

                <button
                  className="modal-x"
                  onClick={() =>
                    setShowCreateModal(
                      false
                    )
                  }
                >
                  <X size={19} />
                </button>

              </div>

              <div className="courses-modal-body">

                <CourseForm
                  formData={formData}
                  formErrors={formErrors}
                  levels={levels}
                  languages={languages}
                  categories={categories}
                  handleFormChange={
                    handleFormChange
                  }
                  thumbnailPreview={
                    thumbnailPreview
                  }
                  fileInputRef={
                    fileInputRef
                  }
                  setThumbnailPreview={
                    setThumbnailPreview
                  }
                  setFormData={
                    setFormData
                  }
                />

              </div>

              <div className="courses-modal-footer">

                <button
                  className="modal-cancel"
                  onClick={() =>
                    setShowCreateModal(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  className="modal-save"
                  onClick={
                    handleSaveCourse
                  }
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="small-spinner" />
                      Saving...
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

      {/* =====================================================
          VIEW / EDIT MODAL
      ===================================================== */}

      {showViewModal &&
        viewingCourse &&
        createPortal(
          <div
            className="courses-modal-overlay"
            onMouseDown={(e) => {
              if (
                e.target ===
                  e.currentTarget &&
                !isSubmitting
              ) {
                closeViewModal();
              }
            }}
          >

            <div className="courses-modal course-view-modal">

              <div className="courses-modal-header">

                <div>
                  <h2>
                    {isEditMode
                      ? "Edit Course"
                      : "Course Details"}
                  </h2>

                  <p>
                    {isEditMode
                      ? "Update course information."
                      : "View course information and modules."}
                  </p>
                </div>

                <button
                  className="modal-x"
                  onClick={() => {
                    if (isEditMode) {
                      setIsEditMode(
                        false
                      );
                    } else {
                      closeViewModal();
                    }
                  }}
                >
                  <X size={19} />
                </button>

              </div>

              <div className="courses-modal-body">

                {isEditMode ? (
                  <CourseForm
                    formData={formData}
                    formErrors={formErrors}
                    levels={levels}
                    languages={languages}
                    categories={categories}
                    handleFormChange={
                      handleFormChange
                    }
                    thumbnailPreview={
                      thumbnailPreview
                    }
                    fileInputRef={
                      fileInputRef
                    }
                    setThumbnailPreview={
                      setThumbnailPreview
                    }
                    setFormData={
                      setFormData
                    }
                    editMode
                  />
                ) : (
                  <>
                    {/* COURSE TOP */}

                    <div className="course-detail-top">

                      <img
                        className="course-detail-image"
                        src={getImageUrl(
                          viewingCourse.thumbnail
                        )}
                        alt={
                          viewingCourse.title ||
                          "Course"
                        }
                        onError={(e) => {
                          if (
                            e.currentTarget
                              .src !==
                            FALLBACK_IMAGE
                          ) {
                            e.currentTarget.src =
                              FALLBACK_IMAGE;
                          }
                        }}
                      />

                      <div className="course-detail-content">

                        <div className="detail-title-row">

                          <h3>
                            {
                              viewingCourse.title
                            }
                          </h3>

                          {viewingCourse.isFeatured && (
                            <span className="detail-featured">

                              <Star
                                size={13}
                                fill="currentColor"
                              />

                              Featured

                            </span>
                          )}

                        </div>

                        {viewingCourse.subtitle && (
                          <p>
                            {
                              viewingCourse.subtitle
                            }
                          </p>
                        )}

                        <div className="detail-student">

                          <Users
                            size={16}
                          />

                          {viewingCourse
                            ._count
                            ?.enrollments ||
                            0}{" "}
                          students

                        </div>

                      </div>

                    </div>

                    {/* DETAIL GRID */}

                    <div className="detail-grid">

                      <div>
                        <label>
                          Category
                        </label>

                        <strong>
                          {viewingCourse
                            .category
                            ?.name ||
                            "N/A"}
                        </strong>
                      </div>

                      <div>
                        <label>
                          Level
                        </label>

                        <strong>
                          {viewingCourse.level ||
                            "N/A"}
                        </strong>
                      </div>

                      <div>
                        <label>
                          Language
                        </label>

                        <strong>
                          {viewingCourse.language ||
                            "N/A"}
                        </strong>
                      </div>

                      <div>
                        <label>
                          Status
                        </label>

                        <span
                          className={`status-label ${getStatusClass(
                            viewingCourse.status
                          )}`}
                        >
                          <i />
                          {viewingCourse.status ||
                            "DRAFT"}
                        </span>
                      </div>

                    </div>

                    {/* DESCRIPTION */}

                    {viewingCourse.description && (
                      <div className="detail-section">

                        <h4>
                          Description
                        </h4>

                        <p>
                          {
                            viewingCourse.description
                          }
                        </p>

                      </div>
                    )}

                    {/* META */}

                    <div className="detail-meta">

                      <span>
                        Created:{" "}
                        {formatDate(
                          viewingCourse.createdAt
                        )}
                      </span>

                      {viewingCourse.updatedAt && (
                        <span>
                          Updated:{" "}
                          {formatDate(
                            viewingCourse.updatedAt
                          )}
                        </span>
                      )}

                    </div>

                    {/* MODULES */}

                    <div className="modules-section">

                      <div className="modules-heading">

                        <div>
                          <h4>
                            <Layers
                              size={18}
                            />
                            Modules
                          </h4>

                          <span>
                            {
                              courseModules.length
                            }{" "}
                            attached
                          </span>
                        </div>

                      </div>

                      <div className="module-add-row">

                        <select
                          value={
                            selectedModuleToAdd
                          }
                          onChange={(e) =>
                            setSelectedModuleToAdd(
                              e.target.value
                            )
                          }
                          disabled={
                            modulesLoading ||
                            moduleActionId ===
                              "attach"
                          }
                        >

                          <option value="">
                            {availableModules.length
                              ? "Select module to add"
                              : "No modules available"}
                          </option>

                          {availableModules.map(
                            (module) => (
                              <option
                                key={
                                  module.id
                                }
                                value={
                                  module.id
                                }
                              >
                                {
                                  module.title
                                }{" "}
                                (
                                {
                                  lessonCount(
                                    module
                                  )
                                }{" "}
                                lessons)
                              </option>
                            )
                          )}

                        </select>

                        <button
                          className="module-add-btn"
                          onClick={
                            handleAttachModule
                          }
                          disabled={
                            !selectedModuleToAdd ||
                            moduleActionId ===
                              "attach"
                          }
                        >
                          {moduleActionId ===
                          "attach" ? (
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
                      ) : courseModules.length ===
                        0 ? (
                        <div className="no-modules">

                          <Layers
                            size={25}
                          />

                          <span>
                            No modules attached
                            yet.
                          </span>

                        </div>
                      ) : (
                        <div className="modules-list">

                          {courseModules.map(
                            (
                              module,
                              index
                            ) => (
                              <div
                                className="module-item"
                                key={
                                  module.id
                                }
                              >

                                <div className="module-number">
                                  {index + 1}
                                </div>

                                <div className="module-info">

                                  <strong>
                                    {
                                      module.title
                                    }
                                  </strong>

                                  <span>
                                    {
                                      lessonCount(
                                        module
                                      )
                                    }{" "}
                                    lesson
                                    {lessonCount(
                                      module
                                    ) !== 1
                                      ? "s"
                                      : ""}
                                  </span>

                                </div>

                                <button
                                  className="module-remove"
                                  onClick={() =>
                                    handleDetachModule(
                                      module.id
                                    )
                                  }
                                  disabled={
                                    moduleActionId ===
                                    module.id
                                  }
                                >
                                  {moduleActionId ===
                                  module.id ? (
                                    <span className="small-spinner" />
                                  ) : (
                                    <X size={14} />
                                  )}

                                  Remove
                                </button>

                              </div>
                            )
                          )}

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
                      onClick={() =>
                        setIsEditMode(
                          false
                        )
                      }
                    >
                      Cancel
                    </button>

                    <button
                      className="modal-save"
                      onClick={
                        handleSaveCourse
                      }
                      disabled={
                        isSubmitting
                      }
                    >
                      {isSubmitting ? (
                        <>
                          <span className="small-spinner" />
                          Saving...
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
                        setShowViewModal(
                          false
                        );

                        openDeleteModal(
                          viewingCourse
                        );
                      }}
                    >
                      <Trash2 size={17} />
                      Delete
                    </button>

                    <button
                      className="modal-edit"
                      onClick={() =>
                        openEditModal(
                          viewingCourse
                        )
                      }
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

      {/* =====================================================
          DELETE MODAL
      ===================================================== */}

      {showDeleteModal &&
        createPortal(
          <div
            className="courses-modal-overlay"
            onMouseDown={(e) => {
              if (
                e.target ===
                  e.currentTarget &&
                !isSubmitting
              ) {
                closeDeleteModal();
              }
            }}
          >

            <div className="delete-modal">

              <div className="delete-icon">
                <AlertCircle
                  size={28}
                />
              </div>

              <h2>
                Delete Course?
              </h2>

              <p>
                Are you sure you want to
                permanently delete this
                course?
              </p>

              <span className="delete-note">
                This action cannot be undone.
              </span>

              {viewingCourse &&
                viewingCourse._count
                  ?.enrollments > 0 && (
                  <div className="delete-warning">

                    <AlertCircle
                      size={16}
                    />

                    <span>
                      This course has{" "}
                      {
                        viewingCourse
                          ._count
                          .enrollments
                      }{" "}
                      enrollment(s).
                    </span>

                  </div>
                )}

              {deleteError && (
                <div className="delete-error">

                  <AlertCircle
                    size={16}
                  />

                  <span>
                    {deleteError}
                  </span>

                </div>
              )}

              <div className="delete-actions">

                <button
                  className="modal-cancel"
                  onClick={
                    closeDeleteModal
                  }
                  disabled={
                    isSubmitting
                  }
                >
                  Cancel
                </button>

                <button
                  className="delete-confirm"
                  onClick={
                    handleDeleteCourse
                  }
                  disabled={
                    isSubmitting
                  }
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

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  className,
  icon,
  title,
  value,
}) {
  return (
    <div
      className={`course-stat-card ${className}`}
    >
      <div className="stat-icon">
        {icon}
      </div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

/* =========================================================
   COURSE FORM
========================================================= */

function CourseForm({
  formData,
  formErrors,
  levels,
  languages,
  categories,
  handleFormChange,
  thumbnailPreview,
  fileInputRef,
  setThumbnailPreview,
  setFormData,
}) {
  return (
    <div className="course-form">

      {/* BASIC */}

      <div className="form-section-title">

        <span>01</span>

        <div>
          <h3>
            Basic Information
          </h3>

          <p>
            Enter the main information
            about your course.
          </p>
        </div>

      </div>

      <div className="form-grid-2">

        <div className="form-field">

          <label>
            Course Title{" "}
            <b>*</b>
          </label>

          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={
              handleFormChange
            }
            placeholder="e.g. Complete JavaScript Course"
            className={
              formErrors.title
                ? "input-error"
                : ""
            }
          />

          {formErrors.title && (
            <small>
              {formErrors.title}
            </small>
          )}

        </div>

        <div className="form-field">

          <label>
            Slug
          </label>

          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={
              handleFormChange
            }
            placeholder="course-slug"
          />

        </div>

      </div>

      <div className="form-field">

        <label>
          Subtitle
        </label>

        <input
          type="text"
          name="subtitle"
          value={formData.subtitle}
          onChange={
            handleFormChange
          }
          placeholder="Short description of the course"
        />

      </div>

      <div className="form-field">

        <label>
          Description
        </label>

        <textarea
          name="description"
          rows="4"
          value={formData.description}
          onChange={
            handleFormChange
          }
          placeholder="Describe what students will learn..."
        />

      </div>

      <div className="form-grid-3">

        <div className="form-field">

          <label>
            Category{" "}
            <b>*</b>
          </label>

          <select
            name="categoryId"
            value={
              formData.categoryId
            }
            onChange={
              handleFormChange
            }
            className={
              formErrors.categoryId
                ? "input-error"
                : ""
            }
          >

            <option value="">
              Select Category
            </option>

            {categories.map(
              (category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              )
            )}

          </select>

          {formErrors.categoryId && (
            <small>
              {
                formErrors
                  .categoryId
              }
            </small>
          )}

        </div>

        <div className="form-field">

          <label>
            Level
          </label>

          <select
            name="level"
            value={formData.level}
            onChange={
              handleFormChange
            }
          >
            {levels.map(
              (level) => (
                <option
                  key={level}
                  value={level}
                >
                  {level}
                </option>
              )
            )}
          </select>

        </div>

        <div className="form-field">

          <label>
            Language
          </label>

          <select
            name="language"
            value={
              formData.language
            }
            onChange={
              handleFormChange
            }
          >
            {languages.map(
              (language) => (
                <option
                  key={language}
                  value={language}
                >
                  {language}
                </option>
              )
            )}
          </select>

        </div>

      </div>

      {/* CONTENT */}

      <div className="form-section-title form-content-title">

        <span>02</span>

        <div>
          <h3>
            Course Content
          </h3>

          <p>
            Help students understand what
            they will get from this course.
          </p>
        </div>

      </div>

      <div className="form-field">

        <label>
          Requirements
        </label>

        <textarea
          name="requirements"
          rows="3"
          value={
            formData.requirements
          }
          onChange={
            handleFormChange
          }
          placeholder="What should students know before starting?"
        />

      </div>

      <div className="form-field">

        <label>
          Learning Outcomes
        </label>

        <textarea
          name="outcomes"
          rows="3"
          value={
            formData.outcomes
          }
          onChange={
            handleFormChange
          }
          placeholder="What will students learn?"
        />

      </div>

      <div className="form-field">

        <label>
          Target Audience
        </label>

        <textarea
          name="audience"
          rows="3"
          value={
            formData.audience
          }
          onChange={
            handleFormChange
          }
          placeholder="Who is this course for?"
        />

      </div>

      {/* MEDIA */}

      <div className="form-section-title form-content-title">

        <span>03</span>

        <div>
          <h3>
            Media
          </h3>

          <p>
            Add a thumbnail and promotional
            video.
          </p>
        </div>

      </div>

      <div className="form-field">

        <label>
          Course Thumbnail
        </label>

        <div className="upload-area">

          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            ref={fileInputRef}
            onChange={
              handleFormChange
            }
            name="thumbnail"
            id="course-thumbnail"
          />

          <label
            htmlFor="course-thumbnail"
            className="upload-label"
          >

            <Upload size={20} />

            <div>
              <strong>
                Click to upload
                thumbnail
              </strong>

              <span>
                PNG, JPG or WEBP · Max
                5MB
              </span>
            </div>

          </label>

          {thumbnailPreview && (
            <div className="upload-preview">

              <img
                src={
                  thumbnailPreview
                }
                alt="Course thumbnail preview"
                onError={(e) => {
                  e.currentTarget.src =
                    FALLBACK_IMAGE;
                }}
              />

              <button
                type="button"
                className="remove-preview-btn"
                onClick={() => {
                  setThumbnailPreview(
                    null
                  );

                  setFormData(
                    (prev) => ({
                      ...prev,
                      thumbnail:
                        null,
                    })
                  );

                  if (
                    fileInputRef.current
                  ) {
                    fileInputRef.current.value =
                      "";
                  }
                }}
              >
                <X size={15} />
              </button>

            </div>
          )}

        </div>

      </div>

      <div className="form-field">

        <label>
          Promo Video URL
        </label>

        <input
          type="url"
          name="videoUrl"
          value={
            formData.videoUrl
          }
          onChange={
            handleFormChange
          }
          placeholder="https://youtube.com/..."
        />

      </div>

      {/* SETTINGS */}

      <div className="form-section-title form-content-title">

        <span>04</span>

        <div>
          <h3>
            Settings
          </h3>

          <p>
            Configure visibility and
            featured status.
          </p>
        </div>

      </div>

      <div className="settings-grid">

        <label className="setting-box">

          <input
            type="checkbox"
            name="isPublished"
            checked={
              formData.isPublished
            }
            onChange={
              handleFormChange
            }
          />

          <span className="custom-checkbox">
            <CheckCircle size={15} />
          </span>

          <div>
            <strong>
              Publish Course
            </strong>

            <small>
              Make this course visible
              to students.
            </small>
          </div>

        </label>

        <label className="setting-box">

          <input
            type="checkbox"
            name="isFeatured"
            checked={
              formData.isFeatured
            }
            onChange={
              handleFormChange
            }
          />

          <span className="custom-checkbox">
            <Star size={15} />
          </span>

          <div>
            <strong>
              Featured Course
            </strong>

            <small>
              Highlight this course
              on the platform.
            </small>
          </div>

        </label>

      </div>

    </div>
  );
}

export default AdminCourses;