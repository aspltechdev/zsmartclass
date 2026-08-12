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
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import api from "../../services/api";
import "./AdminCategories.css";

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewingCategory, setViewingCategory] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const fileInputRef = useRef(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    image: "", // Will store Base64 string
  });

  const [stats, setStats] = useState({
    total: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get("/categories");
      const data = res.data.data || res.data;
      setCategories(data);
      calculateStats(data);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const calculateStats = (data) => {
    const total = data.length;
    setStats({ total });
  };

  // Generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Handle image upload - convert to Base64
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPEG, PNG, GIF, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    // Convert to Base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setImagePreview(base64String);
      setImageBase64(base64String);
      setForm({ ...form, image: base64String });
      setFormErrors({ ...formErrors, image: "" });
    };
    reader.readAsDataURL(file);

    // Clear any existing errors
    setFormErrors({ ...formErrors, image: "" });
  };

  // Remove image
  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    setForm({ ...form, image: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Save category (with Base64 image)
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
        slug: form.slug.trim().toLowerCase().replace(/ /g, '-'),
        description: form.description || "",
        image: form.image || null, // Send Base64 directly
      };

      if (editing) {
        await api.put(`/categories/${editing.id}`, data);
      } else {
        await api.post("/categories", data);
      }

      setShowModal(false);
      setEditing(null);
      resetForm();
      fetchCategories();
      setIsSubmitting(false);
      setIsEditMode(false);
      setShowViewModal(false);
      alert(editing ? "Category updated successfully!" : "Category created successfully!");
    } catch (err) {
      setIsSubmitting(false);
      const message = err.response?.data?.message || "Failed to save category";
      alert("Error: " + message);
      console.error("Save error:", err);
    }
  };

  // Delete category
  const handleDeleteCategory = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
      setShowDeleteConfirm(null);
      setShowViewModal(false);
      setIsEditMode(false);
      alert("Category deleted successfully!");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete category";
      if (message.includes("foreign key") || message.includes("constraint")) {
        alert("Cannot delete this category because it has courses assigned to it. Please remove all courses from this category first.");
      } else {
        alert(message);
      }
    }
  };

  // Reset form
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

  // Open create modal
  const openCreateModal = () => {
    setEditing(null);
    resetForm();
    setShowModal(true);
  };

  // Open edit from view modal
  const openEditFromView = () => {
    if (viewingCategory) {
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
    }
  };

  // Cancel edit mode
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

  // Open view modal
  const openViewModal = (category) => {
    setViewingCategory(category);
    setIsEditMode(false);
    setShowViewModal(true);
  };

  // Handle delete from view modal
  const handleDeleteFromView = () => {
    if (viewingCategory) {
      setShowViewModal(false);
      setShowDeleteConfirm(viewingCategory.id);
    }
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

  // Filter categories
  const filteredCategories = categories.filter((category) => {
    return category.name?.toLowerCase().includes(search.toLowerCase()) ||
           category.description?.toLowerCase().includes(search.toLowerCase());
  });

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

  return (
    <div className="categories-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Category Management</h1>
          <p className="subtitle">Organize your courses into categories</p>
        </div>
        <button className="add-btn" onClick={openCreateModal}>
          <Plus size={18} />
          New Category
        </button>
      </div>

      {/* Stats Cards */}
      <div className="category-stats">
        <div className="stat-card">
          <Layers size={24} />
          <div>
            <h3>{stats.total}</h3>
            <p>Total Categories</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="refresh-btn" onClick={fetchCategories}>
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Categories Table */}
      <div className="table-wrapper">
        <table className="category-table">
          <thead>
            <tr>
              <th style={{ width: "5%" }}>#</th>
              <th style={{ width: "20%" }}>Name</th>
              <th style={{ width: "15%" }}>Slug</th>
              <th style={{ width: "35%" }}>Description</th>
              <th style={{ width: "15%" }}>Created</th>
              <th style={{ width: "80px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "40px" }}>
                  <div className="empty-state">
                    <Layers size={48} />
                    <h3>No categories found</h3>
                    <p>Create your first category to get started</p>
                    <button className="add-btn" onClick={openCreateModal}>
                      <Plus size={18} />
                      Create Category
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCategories.map((category, index) => (
                <tr key={category.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="category-name">
                      <span className="name">{category.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="category-slug">{category.slug}</span>
                  </td>
                  <td>
                    <span className="category-description">
                      {category.description || "—"}
                    </span>
                  </td>
                  <td>
                    <span className="created-date">
                      <Calendar size={14} />
                      {formatDate(category.createdAt)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        title="View Category" 
                        className="view-btn"
                        onClick={() => openViewModal(category)}
                      >
                        <Eye size={18} />
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
              <p>Are you sure you want to delete this category?</p>
              <p className="confirm-sub">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={() => handleDeleteCategory(showDeleteConfirm)}>
                <Trash2 size={18} />
                Delete Category
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
              <h2>Create New Category</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter category name"
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm({ 
                      ...form, 
                      name: name,
                      slug: generateSlug(name)
                    });
                    setFormErrors({ ...formErrors, name: "" });
                  }}
                  className={formErrors.name ? "error" : ""}
                />
                {formErrors.name && <span className="error-text">{formErrors.name}</span>}
              </div>

              <div className="form-group">
                <label>Slug *</label>
                <input
                  type="text"
                  name="slug"
                  placeholder="category-url-slug"
                  value={form.slug}
                  onChange={(e) => {
                    setForm({ ...form, slug: e.target.value.toLowerCase().replace(/ /g, '-') });
                    setFormErrors({ ...formErrors, slug: "" });
                  }}
                  className={formErrors.slug ? "error" : ""}
                />
                {formErrors.slug && <span className="error-text">{formErrors.slug}</span>}
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  placeholder="Describe this category..."
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Category Image</label>
                <div className="file-upload-wrapper">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    id="category-image-upload"
                    style={{ display: "none" }}
                  />
                  <label htmlFor="category-image-upload" className="file-upload-label">
                    <Upload size={18} />
                    {imagePreview ? "Change Image" : "Upload Image"}
                  </label>
                  
                  {imagePreview && (
                    <div className="image-preview-container">
                      <img src={imagePreview} alt="Category preview" className="image-preview" />
                      <button 
                        type="button" 
                        className="remove-image-btn"
                        onClick={handleRemoveImage}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  
                  <p className="field-hint">Supported formats: JPEG, PNG, GIF, WebP (Max 5MB)</p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-save" onClick={handleSaveCategory} disabled={isSubmitting}>
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
      )}

      {/* View/Edit Modal - SAME LAYOUT for both View and Edit */}
      {showViewModal && viewingCategory && (
        <div className="modal view-modal" onClick={() => {
          if (!isEditMode) {
            setShowViewModal(false);
          }
        }}>
          <div className="modal-content view-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditMode ? "Edit Category" : "Category Details"}</h2>
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
                {/* View Header - Always visible */}
                <div className="view-header">
                  <h3>{isEditMode ? form.name || viewingCategory.name : viewingCategory.name}</h3>
                </div>

                {/* SAME GRID LAYOUT for both View and Edit */}
                <div className="view-details-grid">
                  {/* Name - Editable in edit mode */}
                  <div className="view-detail-item">
                    <label>Name</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        name="name"
                        placeholder="Enter category name"
                        value={form.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          setForm({ 
                            ...form, 
                            name: name,
                            slug: generateSlug(name)
                          });
                          setFormErrors({ ...formErrors, name: "" });
                        }}
                        className={formErrors.name ? "error" : ""}
                      />
                    ) : (
                      <span>{viewingCategory.name}</span>
                    )}
                    {isEditMode && formErrors.name && <span className="error-text">{formErrors.name}</span>}
                  </div>

                  {/* Slug - Editable in edit mode */}
                  <div className="view-detail-item">
                    <label>Slug</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        name="slug"
                        placeholder="category-url-slug"
                        value={form.slug}
                        onChange={(e) => {
                          setForm({ ...form, slug: e.target.value.toLowerCase().replace(/ /g, '-') });
                          setFormErrors({ ...formErrors, slug: "" });
                        }}
                        className={formErrors.slug ? "error" : ""}
                      />
                    ) : (
                      <span>{viewingCategory.slug}</span>
                    )}
                    {isEditMode && formErrors.slug && <span className="error-text">{formErrors.slug}</span>}
                  </div>

                  {/* Description - Editable in edit mode */}
                  <div className="view-detail-item full-width">
                    <label>Description</label>
                    {isEditMode ? (
                      <textarea
                        name="description"
                        placeholder="Describe this category..."
                        rows={2}
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                      />
                    ) : (
                      <span>{viewingCategory.description || "No description"}</span>
                    )}
                  </div>

                  {/* Image - Editable in edit mode */}
                  <div className="view-detail-item full-width">
                    <label>Image</label>
                    {isEditMode ? (
                      <div className="file-upload-wrapper">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleImageUpload}
                          id="edit-category-image-upload"
                          style={{ display: "none" }}
                        />
                        <label htmlFor="edit-category-image-upload" className="file-upload-label">
                          <Upload size={18} />
                          {imagePreview ? "Change Image" : "Upload Image"}
                        </label>
                        
                        {imagePreview && (
                          <div className="image-preview-container">
                            <img src={imagePreview} alt="Category preview" className="image-preview" />
                            <button 
                              type="button" 
                              className="remove-image-btn"
                              onClick={handleRemoveImage}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="view-image-container">
                        {viewingCategory.image ? (
                          <img 
                            src={viewingCategory.image} 
                            alt={viewingCategory.name} 
                            className="view-image"
                            onError={(e) => {
                              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='120' viewBox='0 0 200 120'%3E%3Crect width='200' height='120' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%2394a3b8' font-size='14' font-family='sans-serif'%3ENo Image%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        ) : (
                          <span className="no-image-text">No image uploaded</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Created At - Read-only */}
                  <div className="view-detail-item">
                    <label>Created</label>
                    <span>{formatDate(viewingCategory.createdAt)}</span>
                  </div>

                  {/* Updated At - Read-only */}
                  <div className="view-detail-item">
                    <label>Last Updated</label>
                    <span>{formatDate(viewingCategory.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Different based on mode */}
            <div className="modal-footer">
              {isEditMode ? (
                <>
                  <button className="btn-cancel" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                  <button className="btn-save" onClick={handleSaveCategory} disabled={isSubmitting}>
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

export default AdminCategories;