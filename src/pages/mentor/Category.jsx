// src/pages/admin/AdminCategories.jsx
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
  Save,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";
import api from "../../services/api";
import "./Category.css";

function Categories() {
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

  // Form state - Matches your table schema
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
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

  // Save category
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
        image: form.image || null,
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

  // Reset form
  const resetForm = () => {
    setForm({
      name: "",
      slug: "",
      description: "",
      image: "",
    });
    setFormErrors({});
  };

  // Open create modal
  const openCreateModal = () => {
    setEditing(null);
    resetForm();
    setShowModal(true);
  };

  // Open edit from view modal (inline edit - layout stays the same)
  const openEditFromView = () => {
    if (viewingCategory) {
      setEditing(viewingCategory);
      setForm({
        name: viewingCategory.name || "",
        slug: viewingCategory.slug || "",
        description: viewingCategory.description || "",
        image: viewingCategory.image || "",
      });
      setIsEditMode(true);
      setFormErrors({});
    }
  };

  // Cancel edit mode (switch back to view mode)
  const handleCancelEdit = () => {
    setIsEditMode(false);
    if (viewingCategory) {
      setForm({
        name: viewingCategory.name || "",
        slug: viewingCategory.slug || "",
        description: viewingCategory.description || "",
        image: viewingCategory.image || "",
      });
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
                <label>Image URL</label>
                <input
                  type="text"
                  name="image"
                  placeholder="https://example.com/image.jpg"
                  value={form.image || ""}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                />
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

                {/* SAME GRID LAYOUT for both View and Edit - only fields change */}
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

                  {/* Image URL - Editable in edit mode */}
                  <div className="view-detail-item full-width">
                    <label>Image URL</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        name="image"
                        placeholder="https://example.com/image.jpg"
                        value={form.image || ""}
                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                      />
                    ) : (
                      <span>{viewingCategory.image || "No image"}</span>
                    )}
                  </div>

                  {/* Image Preview - Only show in view mode if image exists */}
                  {!isEditMode && viewingCategory.image && (
                    <div className="view-detail-item full-width">
                      <label>Image Preview</label>
                      <div className="category-image-preview">
                        <img src={viewingCategory.image} alt={viewingCategory.name} />
                      </div>
                    </div>
                  )}

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
             
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Categories;