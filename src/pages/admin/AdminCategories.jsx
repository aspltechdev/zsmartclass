// src/pages/admin/AdminCategories.jsx

import { useEffect, useState, useRef } from "react";
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
  Save,
  Calendar,
  Upload,
  FolderTree,
} from "lucide-react";
import api from "../../services/api";
import { createPortal } from "react-dom";
import "./AdminCategories.css";
import "./AdminShared.css";

// Render overlays into <body> so `position: fixed` escapes any transformed/
// filtered ancestor in AdminLayout (which otherwise mis-centers & clips them).
function Portal({ children }) {
  return createPortal(children, document.body);
}

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const [editing, setEditing] = useState(null);
  const [viewingCategory, setViewingCategory] = useState(null);

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);

  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
  });

  const [stats, setStats] = useState({
    total: 0,
  });

  // =========================================================
  // FETCH CATEGORIES
  // =========================================================

  useEffect(() => {
    fetchCategories();
  }, []);

  // =========================================================
  // LOCK BODY SCROLL WHEN OVERLAY IS OPEN
  // =========================================================

  useEffect(() => {
    const overlayOpen =
      showModal || showViewModal || showDeleteConfirm !== null;

    if (overlayOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal, showViewModal, showDeleteConfirm]);

  // =========================================================
  // FETCH
  // =========================================================

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const res = await api.get("/categories");

      const data = res.data.data || res.data;

      setCategories(Array.isArray(data) ? data : []);

      calculateStats(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching categories:", err);

      setCategories([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // STATS
  // =========================================================

  const calculateStats = (data) => {
    setStats({
      total: data.length,
    });
  };

  // =========================================================
  // SLUG
  // =========================================================

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // =========================================================
  // IMAGE UPLOAD
  // =========================================================

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB.");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      const base64String = reader.result;

      setImagePreview(base64String);
      setImageBase64(base64String);

      setForm((prev) => ({
        ...prev,
        image: base64String,
      }));

      setFormErrors((prev) => ({
        ...prev,
        image: "",
      }));
    };

    reader.readAsDataURL(file);
  };

  // =========================================================
  // REMOVE IMAGE
  // =========================================================

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageBase64(null);

    setForm((prev) => ({
      ...prev,
      image: "",
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =========================================================
  // SAVE CATEGORY
  // =========================================================

  const handleSaveCategory = async () => {
    try {
      const errors = {};

      if (!form.name || form.name.trim() === "") {
        errors.name = "Category name is required";
      }

      if (!form.slug || form.slug.trim() === "") {
        errors.slug = "Slug is required";
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      setIsSubmitting(true);

      const data = {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase().replace(/ /g, "-"),
        description: form.description || "",
        image: form.image || null,
      };

      if (editing) {
        await api.put(`/categories/${editing.id}`, data);
      } else {
        await api.post("/categories", data);
      }

      await fetchCategories();

      const updatedCategory = {
        ...editing,
        ...data,
      };

      setShowModal(false);

      if (editing) {
        setViewingCategory(updatedCategory);
      }

      setEditing(null);
      setIsSubmitting(false);
      setIsEditMode(false);

      resetForm();

      alert(
        editing
          ? "Category updated successfully!"
          : "Category created successfully!"
      );
    } catch (err) {
      setIsSubmitting(false);

      const message =
        err.response?.data?.message || "Failed to save category";

      alert("Error: " + message);

      console.error("Save error:", err);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDeleteCategory = async (id) => {
    try {
      await api.delete(`/categories/${id}`);

      await fetchCategories();

      setShowDeleteConfirm(null);
      setShowViewModal(false);
      setViewingCategory(null);
      setIsEditMode(false);

      alert("Category deleted successfully!");
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to delete category";

      if (
        message.toLowerCase().includes("foreign key") ||
        message.toLowerCase().includes("constraint")
      ) {
        alert(
          "Cannot delete this category because it has courses assigned to it. Please remove all courses from this category first."
        );
      } else {
        alert(message);
      }
    }
  };

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setForm({
      name: "",
      slug: "",
      description: "",
      image: "",
    });

    setImagePreview(null);
    setImageBase64(null);
    setFormErrors({});

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =========================================================
  // CREATE
  // =========================================================

  const openCreateModal = () => {
    setEditing(null);
    resetForm();
    setShowModal(true);
  };

  // =========================================================
  // VIEW
  // =========================================================

  const openViewModal = (category) => {
    setViewingCategory(category);
    setIsEditMode(false);
    setShowViewModal(true);
  };

  // =========================================================
  // EDIT FROM VIEW
  // =========================================================

  const openEditFromView = () => {
    if (!viewingCategory) return;

    setEditing(viewingCategory);

    setForm({
      name: viewingCategory.name || "",
      slug: viewingCategory.slug || "",
      description: viewingCategory.description || "",
      image: viewingCategory.image || "",
    });

    setImagePreview(viewingCategory.image || null);
    setImageBase64(viewingCategory.image || null);

    setIsEditMode(true);
    setFormErrors({});
  };

  // =========================================================
  // CANCEL EDIT
  // =========================================================

  const handleCancelEdit = () => {
    setIsEditMode(false);

    if (viewingCategory) {
      setForm({
        name: viewingCategory.name || "",
        slug: viewingCategory.slug || "",
        description: viewingCategory.description || "",
        image: viewingCategory.image || "",
      });

      setImagePreview(viewingCategory.image || null);
      setImageBase64(viewingCategory.image || null);
    }

    setFormErrors({});
  };

  // =========================================================
  // DELETE FROM VIEW
  // =========================================================

  const handleDeleteFromView = () => {
    if (!viewingCategory) return;

    setShowViewModal(false);
    setShowDeleteConfirm(viewingCategory.id);
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

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

  // =========================================================
  // FILTER
  // =========================================================

  const filteredCategories = categories.filter((category) => {
    const searchText = search.toLowerCase();

    return (
      category.name?.toLowerCase().includes(searchText) ||
      category.slug?.toLowerCase().includes(searchText) ||
      category.description?.toLowerCase().includes(searchText)
    );
  });

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="categories-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading categories...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // JSX
  // =========================================================

  return (
    <div className="categories-page">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="page-header">
        <div>
          <h1>
          <FolderTree size={25}/>  Category Management</h1>
          <p className="subtitle">
            Organize your courses into categories
          </p>
        </div>

        <button
          className="add-btn"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          New Category
        </button>
      </div>

      {/* =====================================================
          STATS
      ====================================================== */}

      <div className="category-stats">
        <div className="stat-card sc-purple">
          <Layers size={24} />

          <div>
            <h3>{stats.total}</h3>
            <p>Total Categories</p>
          </div>
        </div>
      </div>

      {/* =====================================================
          TOOLBAR
      ====================================================== */}

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />

          <input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          className="refresh-btn"
          onClick={fetchCategories}
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* =====================================================
          CATEGORY TABLE
      ====================================================== */}

      <div className="table-wrapper">
        <table className="category-table">

          <thead>
            <tr>
              <th style={{ width: "60px" }}>#</th>

              <th style={{ width: "100px" }}>
                Image
              </th>

              <th>
                Name
              </th>

              <th>
                Slug
              </th>

              <th>
                Description
              </th>

              <th>
                Created
              </th>

              <th style={{ width: "100px" }}>
                Action
              </th>
            </tr>
          </thead>

          <tbody>

            {filteredCategories.length === 0 ? (

              <tr>
                <td
                  colSpan="7"
                  style={{
                    textAlign: "center",
                    padding: "40px",
                  }}
                >
                  <div className="empty-state">
                    <Layers size={48} />

                    <h3>
                      No categories found
                    </h3>

                    <p>
                      Create your first category to get started
                    </p>

                    <button
                      className="add-btn"
                      onClick={openCreateModal}
                    >
                      <Plus size={18} />
                      Create Category
                    </button>
                  </div>
                </td>
              </tr>

            ) : (

              filteredCategories.map(
                (category, index) => (

                  <tr key={category.id}>

                    {/* NUMBER */}

                    <td>
                      {index + 1}
                    </td>

                    {/* IMAGE */}

                    <td>
                      <div className="table-category-image">

                        {category.image ? (

                          <img
                            src={category.image}
                            alt={category.name}
                            onError={(e) => {
                              e.currentTarget.style.display =
                                "none";
                            }}
                          />

                        ) : (

                          <div className="table-no-image">
                            <Layers size={22} />
                          </div>

                        )}

                      </div>
                    </td>

                    {/* NAME */}

                    <td>
                      <div className="category-name">
                        <span className="name">
                          {category.name}
                        </span>
                      </div>
                    </td>

                    {/* SLUG */}

                    <td>
                      <span className="category-slug">
                        {category.slug || "—"}
                      </span>
                    </td>

                    {/* DESCRIPTION */}

                    <td>
                      <span className="category-description">
                        {category.description || "—"}
                      </span>
                    </td>

                    {/* CREATED */}

                    <td>
                      <span className="created-date">
                        <Calendar size={14} />

                        {formatDate(
                          category.createdAt
                        )}
                      </span>
                    </td>

                    {/* ACTION */}

                    <td>

                      <div className="action-buttons">

                        <button
                          title="View Category"
                          className="view-btn"
                          onClick={() =>
                            openViewModal(category)
                          }
                        >
                          <Eye size={18} />
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

      {/* =====================================================
          DELETE CONFIRMATION OVERLAY
      ====================================================== */}

      {showDeleteConfirm !== null && (

        <Portal>
        <div
          className="modal confirm-modal"
          onClick={() =>
            setShowDeleteConfirm(null)
          }
        >

          <div
            className="modal-content confirm-content"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <h2>
                Confirm Delete
              </h2>

              <button
                className="modal-close"
                onClick={() =>
                  setShowDeleteConfirm(null)
                }
              >
                <X size={20} />
              </button>

            </div>

            <div className="confirm-body">

              <AlertCircle
                size={48}
                className="confirm-icon"
              />

              <p>
                Are you sure you want to
                delete this category?
              </p>

              <p className="confirm-sub">
                This action cannot be undone.
              </p>

            </div>

            <div className="modal-footer">

              <button
                className="btn-cancel"
                onClick={() =>
                  setShowDeleteConfirm(null)
                }
              >
                Cancel
              </button>

              <button
                className="btn-danger"
                onClick={() =>
                  handleDeleteCategory(
                    showDeleteConfirm
                  )
                }
              >
                <Trash2 size={18} />
                Delete Category
              </button>

            </div>

          </div>

        </div>
        </Portal>

      )}

      {/* =====================================================
          CREATE CATEGORY OVERLAY
      ====================================================== */}

      {showModal && !editing && (

        <Portal>
        <div
          className="modal category-overlay"
          onClick={() => setShowModal(false)}
        >

          <div
            className="modal-content"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <h2>
                Create New Category
              </h2>

              <button
                className="modal-close"
                onClick={() =>
                  setShowModal(false)
                }
              >
                <X size={20} />
              </button>

            </div>

            <div className="modal-body">

              {/* NAME */}

              <div className="form-group">

                <label>
                  Category Name *
                </label>

                <input
                  type="text"
                  placeholder="Enter category name"
                  value={form.name}
                  onChange={(e) => {

                    const name =
                      e.target.value;

                    setForm({
                      ...form,
                      name,
                      slug:
                        generateSlug(name),
                    });

                    setFormErrors({
                      ...formErrors,
                      name: "",
                    });

                  }}
                  className={
                    formErrors.name
                      ? "error"
                      : ""
                  }
                />

                {formErrors.name && (
                  <span className="error-text">
                    {formErrors.name}
                  </span>
                )}

              </div>

              {/* SLUG */}

              <div className="form-group">

                <label>
                  Slug *
                </label>

                <input
                  type="text"
                  placeholder="category-url-slug"
                  value={form.slug}
                  onChange={(e) => {

                    setForm({
                      ...form,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/ /g, "-"),
                    });

                    setFormErrors({
                      ...formErrors,
                      slug: "",
                    });

                  }}
                  className={
                    formErrors.slug
                      ? "error"
                      : ""
                  }
                />

                {formErrors.slug && (
                  <span className="error-text">
                    {formErrors.slug}
                  </span>
                )}

              </div>

              {/* DESCRIPTION */}

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  placeholder="Describe this category..."
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description:
                        e.target.value,
                    })
                  }
                />

              </div>

              {/* IMAGE */}

              <div className="form-group">

                <label>
                  Category Image
                </label>

                <div className="file-upload-wrapper">

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={
                      handleImageUpload
                    }
                    id="category-image-upload"
                    style={{
                      display: "none",
                    }}
                  />

                  <label
                    htmlFor="category-image-upload"
                    className="file-upload-label"
                  >
                    <Upload size={18} />

                    {imagePreview
                      ? "Change Image"
                      : "Upload Image"}
                  </label>

                  {imagePreview && (

                    <div className="image-preview-container">

                      <img
                        src={imagePreview}
                        alt="Category preview"
                        className="image-preview"
                      />

                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={
                          handleRemoveImage
                        }
                      >
                        <X size={16} />
                      </button>

                    </div>

                  )}

                  <p className="field-hint">
                    Supported formats:
                    JPEG, PNG, GIF, WebP
                    (Max 5MB)
                  </p>

                </div>

              </div>

            </div>

            <div className="modal-footer">

              <button
                className="btn-cancel"
                onClick={() =>
                  setShowModal(false)
                }
              >
                Cancel
              </button>

              <button
                className="btn-save"
                onClick={
                  handleSaveCategory
                }
                disabled={isSubmitting}
              >

                {isSubmitting ? (
                  <>
                    <div className="spinner-small"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Create Category
                  </>
                )}

              </button>

            </div>

          </div>

        </div>
        </Portal>

      )}

      {/* =====================================================
          EXPANDED CATEGORY VIEW OVERLAY
      ====================================================== */}

      {showViewModal && viewingCategory && (

        <Portal>
        <div
          className="modal view-modal"
          onClick={() => {

            if (!isEditMode) {
              setShowViewModal(false);
              setViewingCategory(null);
            }

          }}
        >

          <div
            className="modal-content view-content"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="modal-header">

              <div>

                <h2>
                  {isEditMode
                    ? "Edit Category"
                    : "Category Details"}
                </h2>

                {!isEditMode && (
                  <p className="modal-subtitle">
                    Complete category information
                  </p>
                )}

              </div>

              <button
                className="modal-close"
                onClick={() => {

                  if (isEditMode) {
                    handleCancelEdit();
                  } else {
                    setShowViewModal(false);
                    setViewingCategory(null);
                  }

                }}
              >
                <X size={20} />
              </button>

            </div>

            {/* VIEW BODY */}

            <div className="view-body">

              {/* LARGE IMAGE */}

              <div className="category-detail-hero">

                <div className="category-detail-image">

                  {viewingCategory.image ? (

                    <img
                      src={
                        isEditMode
                          ? imagePreview ||
                            viewingCategory.image
                          : viewingCategory.image
                      }
                      alt={
                        viewingCategory.name
                      }
                      onError={(e) => {
                        e.currentTarget.style.display =
                          "none";
                      }}
                    />

                  ) : (

                    <div className="category-detail-no-image">
                      <Layers size={50} />
                      <span>
                        No Image
                      </span>
                    </div>

                  )}

                </div>

                <div className="category-detail-title">

                  <span className="detail-label">
                    CATEGORY
                  </span>

                  <h3>
                    {isEditMode
                      ? form.name ||
                        viewingCategory.name
                      : viewingCategory.name}
                  </h3>

                  <span className="category-slug">
                    {isEditMode
                      ? form.slug
                      : viewingCategory.slug}
                  </span>

                </div>

              </div>

              {/* DETAILS */}

              <div className="view-details-grid">

                {/* NAME */}

                <div className="view-detail-item">

                  <label>
                    Category Name
                  </label>

                  {isEditMode ? (

                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => {

                        const name =
                          e.target.value;

                        setForm({
                          ...form,
                          name,
                          slug:
                            generateSlug(name),
                        });

                        setFormErrors({
                          ...formErrors,
                          name: "",
                        });

                      }}
                      className={
                        formErrors.name
                          ? "error"
                          : ""
                      }
                    />

                  ) : (

                    <span>
                      {viewingCategory.name}
                    </span>

                  )}

                  {isEditMode &&
                    formErrors.name && (
                      <span className="error-text">
                        {formErrors.name}
                      </span>
                    )}

                </div>

                {/* SLUG */}

                <div className="view-detail-item">

                  <label>
                    Slug
                  </label>

                  {isEditMode ? (

                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          slug: e.target.value
                            .toLowerCase()
                            .replace(
                              / /g,
                              "-"
                            ),
                        })
                      }
                      className={
                        formErrors.slug
                          ? "error"
                          : ""
                      }
                    />

                  ) : (

                    <span className="category-slug">
                      {viewingCategory.slug ||
                        "—"}
                    </span>

                  )}

                </div>

                {/* DESCRIPTION */}

                <div className="view-detail-item full-width">

                  <label>
                    Description
                  </label>

                  {isEditMode ? (

                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          description:
                            e.target.value,
                        })
                      }
                    />

                  ) : (

                    <span className="description-full">
                      {viewingCategory.description ||
                        "No description available"}
                    </span>

                  )}

                </div>

                {/* IMAGE EDIT */}

                {isEditMode && (

                  <div className="view-detail-item full-width">

                    <label>
                      Category Image
                    </label>

                    <div className="file-upload-wrapper">

                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={
                          handleImageUpload
                        }
                        id="edit-category-image-upload"
                        style={{
                          display: "none",
                        }}
                      />

                      <label
                        htmlFor="edit-category-image-upload"
                        className="file-upload-label"
                      >
                        <Upload size={18} />

                        {imagePreview
                          ? "Change Image"
                          : "Upload Image"}
                      </label>

                      {imagePreview && (

                        <div className="image-preview-container">

                          <img
                            src={
                              imagePreview
                            }
                            alt="Preview"
                            className="image-preview"
                          />

                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={
                              handleRemoveImage
                            }
                          >
                            <X size={16} />
                          </button>

                        </div>

                      )}

                    </div>

                  </div>

                )}

                {/* CREATED */}

                <div className="view-detail-item">

                  <label>
                    Created At
                  </label>

                  <span>
                    <Calendar
                      size={15}
                    />

                    {formatDate(
                      viewingCategory.createdAt
                    )}
                  </span>

                </div>

                {/* UPDATED */}

                <div className="view-detail-item">

                  <label>
                    Last Updated
                  </label>

                  <span>
                    <Calendar
                      size={15}
                    />

                    {formatDate(
                      viewingCategory.updatedAt
                    )}
                  </span>

                </div>

                {/* ID */}

                <div className="view-detail-item">

                  <label>
                    Category ID
                  </label>

                  <span>
                    {viewingCategory.id ||
                      "—"}
                  </span>

                </div>

              </div>

            </div>

            {/* FOOTER */}

            <div className="modal-footer">

              {isEditMode ? (

                <>

                  <button
                    className="btn-cancel"
                    onClick={
                      handleCancelEdit
                    }
                  >
                    Cancel
                  </button>

                  <button
                    className="btn-save"
                    onClick={
                      handleSaveCategory
                    }
                    disabled={
                      isSubmitting
                    }
                  >

                    {isSubmitting ? (
                      <>
                        <div className="spinner-small"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Update Category
                      </>
                    )}

                  </button>

                </>

              ) : (

                <>

                  <button
                    className="btn-edit"
                    onClick={
                      openEditFromView
                    }
                  >
                    <Edit size={18} />
                    Edit
                  </button>

                  <button
                    className="btn-danger"
                    onClick={
                      handleDeleteFromView
                    }
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>

                </>

              )}

            </div>

          </div>

        </div>
        </Portal>

      )}

    </div>
  );
}

export default AdminCategories;