// src/pages/admin/AdminCourses.jsx
import { useEffect, useState } from "react";
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
} from "lucide-react";
import api from "../../services/api";
import "./AdminCourses.css";

function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    title: "",
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
  });

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/courses");
      setCourses(res.data.data || res.data);
    } catch (err) {
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data.data || res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const handleSaveCourse = async () => {
    try {
      if (!form.title || !form.categoryId || !form.price) {
        alert("Title, Category, and Price are required");
        return;
      }

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description || "");
      formData.append("price", form.price);
      formData.append("discountPrice", form.discountPrice || 0);
      formData.append("categoryId", form.categoryId);
      formData.append("level", form.level);
      formData.append("language", form.language);
      formData.append("requirements", form.requirements || "");
      formData.append("outcomes", form.outcomes || "");
      formData.append("audience", form.audience || "");
      formData.append("status", form.status);
      formData.append("isFeatured", form.isFeatured);

      if (form.thumbnail) {
        formData.append("thumbnail", form.thumbnail);
      }

      if (editing) {
        await api.put(`/courses/${editing.id}`, formData);
      } else {
        await api.post("/courses", formData);
      }

      setShowModal(false);
      setEditing(null);
      resetForm();
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save course");
      console.error("Save error:", err);
    }
  };

  const deleteCourse = async (id) => {
    if (!window.confirm("Delete this course? This action cannot be undone.")) return;

    try {
      await api.delete(`/courses/${id}`);
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete course");
      console.error("Delete error:", err);
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
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
    });
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
    });
    setShowModal(true);
  };

  const filtered = courses.filter((course) => {
    const matchesSearch = course.title
      ?.toLowerCase()
      .includes(search.toLowerCase()) || false;
    const matchesStatus =
      statusFilter === "all" || course.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
  const languages = ["English", "Hindi", "Tamil", "Telugu", "Malayalam", "Kannada", "Spanish", "French"];
  const statuses = ["DRAFT", "PUBLISHED", "ARCHIVED"];

  if (loading) {
    return <div className="loading">Loading courses...</div>;
  }

  return (
    <div className="courses-page">
      <div className="page-header">
        <h1>Course Management</h1>
        <button className="add-btn" onClick={openCreateModal}>
          <Plus size={18} />
          New Course
        </button>
      </div>

      <div className="course-cards">
        <div className="card">
          <BookOpen size={28} />
          <h2>{courses.length}</h2>
          <p>Total Courses</p>
        </div>
        <div className="card">
          <Users size={28} />
          <h2>{courses.reduce((sum, c) => sum + (c._count?.enrollments || 0), 0)}</h2>
          <p>Enrollments</p>
        </div>
        <div className="card">
          <IndianRupee size={28} />
          <h2>
            ₹{courses.reduce((sum, c) => sum + (c.price * (c._count?.enrollments || 0)), 0)}
          </h2>
          <p>Revenue</p>
        </div>
        <div className="card">
          <Star size={28} />
          <h2>{courses.filter((c) => c.isFeatured).length}</h2>
          <p>Featured</p>
        </div>
      </div>

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
      </div>

      <div className="table-wrapper">
        <table className="course-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Category</th>
              <th>Level</th>
              <th>Price</th>
              <th>Status</th>
              <th>Students</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>
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
              filtered.map((course) => (
                <tr key={course.id}>
                  <td>
                    <div className="course-title">
                      <img
                        src={course.thumbnail || "/placeholder-course.png"}
                        alt={course.title}
                        className="course-thumbnail"
                      />
                      <div>
                        <strong>{course.title}</strong>
                        <br />
                        <small className="text-muted">
                          {course._count?.modules || 0} Modules
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="category-badge">
                      {course.category?.name || "N/A"}
                    </span>
                  </td>
                  <td>
                    <span className="level-badge">{course.level}</span>
                  </td>
                  <td>
                    {course.price === 0 ? (
                      <span className="price-badge free">Free</span>
                    ) : (
                      <span className="price-badge">₹{course.price}</span>
                    )}
                    {course.discountPrice > 0 && (
                      <small className="discount-text">
                        ₹{course.discountPrice}
                      </small>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${course.status?.toLowerCase()}`}>
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
                      <button title="View Course">
                        <Eye size={18} />
                      </button>
                      <button title="Edit" onClick={() => openEditModal(course)}>
                        <Edit size={18} />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => deleteCourse(course.id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{editing ? "Edit Course" : "Create New Course"}</h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-section">
                <h3>Basic Information</h3>
                
                <div className="form-group">
                  <label>Course Title *</label>
                  <input
                    type="text"
                    placeholder="Enter course title"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      value={form.categoryId}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          categoryId: Number(e.target.value),
                        })
                      }
                    >
                      <option value="">Choose Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Level</label>
                    <select
                      value={form.level}
                      onChange={(e) =>
                        setForm({ ...form, level: e.target.value })
                      }
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
                      value={form.language}
                      onChange={(e) =>
                        setForm({ ...form, language: e.target.value })
                      }
                    >
                      {languages.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
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
                      placeholder="0"
                      value={form.price}
                      onChange={(e) =>
                        setForm({ ...form, price: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Discount Price (₹)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={form.discountPrice}
                      onChange={(e) =>
                        setForm({ ...form, discountPrice: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Description</h3>
                <div className="form-group">
                  <label>Course Description</label>
                  <textarea
                    placeholder="Describe your course..."
                    rows={4}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Requirements & Outcomes</h3>
                <div className="form-group">
                  <label>Requirements</label>
                  <textarea
                    placeholder="What students need to know before taking this course?"
                    rows={3}
                    value={form.requirements}
                    onChange={(e) =>
                      setForm({ ...form, requirements: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Learning Outcomes</label>
                  <textarea
                    placeholder="What will students learn from this course?"
                    rows={3}
                    value={form.outcomes}
                    onChange={(e) =>
                      setForm({ ...form, outcomes: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Target Audience</label>
                  <textarea
                    placeholder="Who is this course for?"
                    rows={3}
                    value={form.audience}
                    onChange={(e) =>
                      setForm({ ...form, audience: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Thumbnail</h3>
                <div className="form-group">
                  <label>Course Thumbnail</label>
                  <div className="file-upload">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setForm({ ...form, thumbnail: e.target.files[0] })
                      }
                      id="thumbnail-upload"
                    />
                    <label htmlFor="thumbnail-upload" className="file-upload-label">
                      <Upload size={18} />
                      {form.thumbnail
                        ? form.thumbnail.name
                        : "Upload Thumbnail"}
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Settings</h3>
                <div className="toggle-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          isFeatured: e.target.checked,
                        })
                      }
                    />
                    <span>Featured Course</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button className="btn-save" onClick={handleSaveCourse}>
                {editing ? "Update Course" : "Create Course"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCourses;