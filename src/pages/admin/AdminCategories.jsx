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
import { createPortal } from "react-dom";
import api from "../../services/api";
import "./AdminCategories.css";
import "./AdminShared.css";

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
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const imageRequestRef = useRef(0);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
  });

  useEffect(() => {
    fetchCategories();

    return () => {
      imageRequestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const overlayOpen =
      showModal || showViewModal || showDeleteConfirm !== null;

    if (!overlayOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showModal, showViewModal, showDeleteConfirm]);

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const res = await api.get("/categories");
      const data = res.data.data || res.data;

      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Accept larger source images and resize them before saving.
  const handleImageUpload = async (e) => {
    const input = e.target;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      input.value = "";
      return;
    }

    const requestId = ++imageRequestRef.current;
    const imageUrl = URL.createObjectURL(file);

    setIsProcessingImage(true);

    try {
      const img = new Image();

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => {
          reject(
            new Error(
              "Cannot open this image. Try a JPEG, PNG or WebP image."
            )
          );
        };
        img.src = imageUrl;
      });

      if (requestId !== imageRequestRef.current) return;

      if (!img.naturalWidth || !img.naturalHeight) {
        throw new Error("This image has invalid dimensions.");
      }

      const canvas = document.createElement("canvas");
      const scale = Math.min(
        1,
        1600 / Math.max(img.naturalWidth, img.naturalHeight)
      );

      let width = Math.max(1, Math.round(img.naturalWidth * scale));
      let height = Math.max(1, Math.round(img.naturalHeight * scale));
      let imageData = "";

      // Target at most 2 MiB of encoded image text.
      // The backend accepts a JSON request up to 4 MiB.
      while (true) {
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Image processing is unavailable.");
        }

        context.drawImage(img, 0, 0, width, height);
        imageData = canvas.toDataURL("image/webp", 0.85);

        if (imageData === "data:,") {
          throw new Error("Unable to process this image.");
        }

        if (imageData.length <= 2 * 1024 * 1024) {
          break;
        }

        if (width === 1 && height === 1) {
          throw new Error("Unable to compress this image.");
        }

        width = Math.max(1, Math.round(width * 0.75));
        height = Math.max(1, Math.round(height * 0.75));
      }

      if (requestId !== imageRequestRef.current) return;

      setImagePreview(imageData);

      setForm((prev) => ({
        ...prev,
        image: imageData,
      }));

      setFormErrors((prev) => ({
        ...prev,
        image: "",
      }));
    } catch (error) {
      if (requestId === imageRequestRef.current) {
        alert(error.message || "Unable to process this image.");
      }
    } finally {
      URL.revokeObjectURL(imageUrl);

      if (requestId === imageRequestRef.current) {
        setIsProcessingImage(false);
        input.value = "";
      }
    }
  };

  const cancelImageProcessing = () => {
    imageRequestRef.current += 1;
    setIsProcessingImage(false);
  };

  const handleRemoveImage = () => {
    cancelImageProcessing();
    setImagePreview(null);

    setForm((prev) => ({
      ...prev,
      image: "",
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    cancelImageProcessing();

    setForm({
      name: "",
      slug: "",
      description: "",
      image: "",
    });

    setImagePreview(null);
    setFormErrors({});

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveCategory = async () => {
    if (isSubmitting || isProcessingImage) return;

    const errors = {};

    if (!form.name.trim()) {
      errors.name = "Category name is required";
    }

    if (!form.slug.trim()) {
      errors.slug = "Slug is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const wasEditing = Boolean(editing);

    try {
      setIsSubmitting(true);

      const data = {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase().replace(/ /g, "-"),
        description: form.description || "",
        image: form.image || null,
      };

      let response;

      if (editing) {
        response = await api.put(`/categories/${editing.id}`, data);
      } else {
        response = await api.post("/categories", data);
      }

      const savedCategory = response.data?.data;

      if (editing) {
        setViewingCategory({
          ...editing,
          ...data,
          ...(savedCategory &&
          typeof savedCategory === "object" &&
          !Array.isArray(savedCategory)
            ? savedCategory
            : {}),
        });
      }

      setShowModal(false);
      setEditing(null);
      setIsEditMode(false);
      resetForm();

      await fetchCategories();

      alert(
        wasEditing
          ? "Category updated successfully!"
          : "Category created successfully!"
      );
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to save category";

      alert("Error: " + message);
      console.error("Save error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      await api.delete(`/categories/${id}`);

      setShowDeleteConfirm(null);
      setShowViewModal(false);
      setViewingCategory(null);
      setIsEditMode(false);
      setEditing(null);
      resetForm();

      await fetchCategories();

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
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setEditing(null);
    resetForm();
    setShowModal(true);
  };

  const closeCreateModal = () => {
    if (isSubmitting) return;

    setShowModal(false);
    resetForm();
  };

  const openViewModal = (category) => {
    setViewingCategory(category);
    setEditing(null);
    setIsEditMode(false);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    if (isSubmitting) return;

    cancelImageProcessing();
    setShowViewModal(false);
    setViewingCategory(null);
    setEditing(null);
    setIsEditMode(false);
  };

  const openEditFromView = () => {
    if (!viewingCategory) return;

    cancelImageProcessing();
    setEditing(viewingCategory);

    setForm({
      name: viewingCategory.name || "",
      slug: viewingCategory.slug || "",
      description: viewingCategory.description || "",
      image: viewingCategory.image || "",
    });

    setImagePreview(viewingCategory.image || null);
    setIsEditMode(true);
    setFormErrors({});
  };

  const handleCancelEdit = () => {
    if (isSubmitting) return;

    cancelImageProcessing();
    setIsEditMode(false);
    setEditing(null);

    if (viewingCategory) {
      setForm({
        name: viewingCategory.name || "",
        slug: viewingCategory.slug || "",
        description: viewingCategory.description || "",
        image: viewingCategory.image || "",
      });

      setImagePreview(viewingCategory.image || null);
    }

    setFormErrors({});
  };

  const handleDeleteFromView = () => {
    if (!viewingCategory) return;

    setShowViewModal(false);
    setShowDeleteConfirm(viewingCategory.id);
  };

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

  const filteredCategories = categories.filter((category) => {
    const searchText = search.toLowerCase();

    return (
      category.name?.toLowerCase().includes(searchText) ||
      category.slug?.toLowerCase().includes(searchText) ||
      category.description?.toLowerCase().includes(searchText)
    );
  });

  const detailImage = isEditMode
    ? imagePreview
    : viewingCategory?.image;

  const renderImageUpload = (inputId) => (
    <div className="file-upload-wrapper">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageUpload}
        id={inputId}
        disabled={isSubmitting || isProcessingImage}
        style={{ display: "none" }}
      />

      <label
        htmlFor={inputId}
        className="file-upload-label"
      >
        <Upload size={18} />
        {isProcessingImage
          ? "Processing image..."
          : imagePreview
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
            onClick={handleRemoveImage}
            disabled={isSubmitting}
            title="Remove image"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <p className="field-hint">
        Images are automatically resized for upload.
      </p>

      {formErrors.image && (
        <span className="error-text">{formErrors.image}</span>
      )}
    </div>
  );

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
      <div className="page-header">
        <div>
          <h1>
            <FolderTree size={25} /> Category Management
          </h1>
          <p className="subtitle">
            Organize your courses into categories
          </p>
        </div>

        <button className="add-btn" onClick={openCreateModal}>
          <Plus size={18} />
          New Category
        </button>
      </div>

      <div className="category-stats">
        <div className="stat-card sc-purple">
          <Layers size={24} />

          <div>
            <h3>{categories.length}</h3>
            <p>Total Categories</p>
          </div>
        </div>
      </div>

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

      <div className="table-wrapper">
        <table className="category-table">
          <thead>
            <tr>
              <th style={{ width: "60px" }}>#</th>
              <th style={{ width: "100px" }}>Image</th>
              <th>Name</th>
              <th>Slug</th>
              <th>Description</th>
              <th>Created</th>
              <th style={{ width: "100px" }}>Action</th>
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
                    <h3>No categories found</h3>
                    <p>Create your first category to get started</p>

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
              filteredCategories.map((category, index) => (
                <tr key={category.id}>
                  <td>{index + 1}</td>

                  <td>
                    <div className="table-category-image">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="table-no-image">
                          <Layers size={22} />
                        </div>
                      )}
                    </div>
                  </td>

                  <td>
                    <div className="category-name">
                      <span className="name">{category.name}</span>
                    </div>
                  </td>

                  <td>
                    <span className="category-slug">
                      {category.slug || "—"}
                    </span>
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
                        onClick={() => openViewModal(category)}
                        className="view-btn"
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

      {showDeleteConfirm !== null && (
        <Portal>
          <div
            className="modal category-delete-overlay"
            onClick={() => {
              if (!isSubmitting) setShowDeleteConfirm(null);
            }}
          >
            <div
              className="modal-content confirm-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Confirm Delete</h2>

                <button
                  className="modal-close"
                  disabled={isSubmitting}
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="confirm-body">
                <AlertCircle size={48} className="confirm-icon" />

                <p>Are you sure you want to delete this category?</p>
                <p className="confirm-sub">
                  This action cannot be undone.
                </p>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-cancel"
                  disabled={isSubmitting}
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Cancel
                </button>

                <button
                  className="btn-danger"
                  disabled={isSubmitting}
                  onClick={() =>
                    handleDeleteCategory(showDeleteConfirm)
                  }
                >
                  <Trash2 size={18} />
                  {isSubmitting ? "Deleting..." : "Delete Category"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {showModal && !editing && (
        <Portal>
          <div
            className="modal category-overlay"
            onClick={closeCreateModal}
          >
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Create New Category</h2>

                <button
                  className="modal-close"
                  onClick={closeCreateModal}
                  disabled={isSubmitting}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label>Category Name *</label>

                  <input
                    type="text"
                    placeholder="Enter category name"
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;

                      setForm((prev) => ({
                        ...prev,
                        name,
                        slug: generateSlug(name),
                      }));

                      setFormErrors((prev) => ({
                        ...prev,
                        name: "",
                      }));
                    }}
                    className={formErrors.name ? "error" : ""}
                  />

                  {formErrors.name && (
                    <span className="error-text">
                      {formErrors.name}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label>Slug *</label>

                  <input
                    type="text"
                    placeholder="category-url-slug"
                    value={form.slug}
                    onChange={(e) => {
                      const slug = e.target.value
                        .toLowerCase()
                        .replace(/ /g, "-");

                      setForm((prev) => ({
                        ...prev,
                        slug,
                      }));

                      setFormErrors((prev) => ({
                        ...prev,
                        slug: "",
                      }));
                    }}
                    className={formErrors.slug ? "error" : ""}
                  />

                  {formErrors.slug && (
                    <span className="error-text">
                      {formErrors.slug}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label>Description</label>

                  <textarea
                    rows={4}
                    placeholder="Enter category description"
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Category Image</label>
                  {renderImageUpload("category-image-upload")}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-cancel"
                  onClick={closeCreateModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  className="btn-save"
                  onClick={handleSaveCategory}
                  disabled={isSubmitting || isProcessingImage}
                >
                  {isProcessingImage ? (
                    <>Processing image...</>
                  ) : isSubmitting ? (
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

      {showViewModal && viewingCategory && (
        <Portal>
          <div
            className="modal view-modal"
            onClick={() => {
              if (!isEditMode) closeViewModal();
            }}
          >
            <div
              className="modal-content view-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h2>
                    {isEditMode ? "Edit Category" : "Category Details"}
                  </h2>

                  {!isEditMode && (
                    <p className="modal-subtitle">
                      Complete category information
                    </p>
                  )}
                </div>

                <button
                  className="modal-close"
                  disabled={isSubmitting}
                  onClick={() => {
                    if (isEditMode) {
                      handleCancelEdit();
                    } else {
                      closeViewModal();
                    }
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="view-body">
                <div className="category-detail-hero">
                  <div className="category-detail-image">
                    {detailImage ? (
                      <img
                        key={detailImage}
                        src={detailImage}
                        alt={viewingCategory.name}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="category-detail-no-image">
                        <Layers size={50} />
                        <span>No Image</span>
                      </div>
                    )}
                  </div>

                  <div className="category-detail-title">
                    <span className="detail-label">CATEGORY</span>

                    <h3>
                      {isEditMode
                        ? form.name || viewingCategory.name
                        : viewingCategory.name}
                    </h3>

                    <span className="category-slug">
                      {isEditMode ? form.slug : viewingCategory.slug}
                    </span>
                  </div>
                </div>

                <div className="view-details-grid">
                  <div className="view-detail-item">
                    <label>Category Name</label>

                    {isEditMode ? (
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => {
                          const name = e.target.value;

                          setForm((prev) => ({
                            ...prev,
                            name,
                            slug: generateSlug(name),
                          }));

                          setFormErrors((prev) => ({
                            ...prev,
                            name: "",
                          }));
                        }}
                        className={formErrors.name ? "error" : ""}
                      />
                    ) : (
                      <span>{viewingCategory.name}</span>
                    )}

                    {isEditMode && formErrors.name && (
                      <span className="error-text">
                        {formErrors.name}
                      </span>
                    )}
                  </div>

                  <div className="view-detail-item">
                    <label>Slug</label>

                    {isEditMode ? (
                      <input
                        type="text"
                        value={form.slug}
                        onChange={(e) => {
                          const slug = e.target.value
                            .toLowerCase()
                            .replace(/ /g, "-");

                          setForm((prev) => ({
                            ...prev,
                            slug,
                          }));

                          setFormErrors((prev) => ({
                            ...prev,
                            slug: "",
                          }));
                        }}
                        className={formErrors.slug ? "error" : ""}
                      />
                    ) : (
                      <span className="category-slug">
                        {viewingCategory.slug || "—"}
                      </span>
                    )}

                    {isEditMode && formErrors.slug && (
                      <span className="error-text">
                        {formErrors.slug}
                      </span>
                    )}
                  </div>

                  <div className="view-detail-item full-width">
                    <label>Description</label>

                    {isEditMode ? (
                      <textarea
                        rows={4}
                        value={form.description}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      <span className="description-full">
                        {viewingCategory.description ||
                          "No description available"}
                      </span>
                    )}
                  </div>

                  {isEditMode && (
                    <div className="view-detail-item full-width">
                      <label>Category Image</label>
                      {renderImageUpload("edit-category-image-upload")}
                    </div>
                  )}

                  <div className="view-detail-item">
                    <label>Created At</label>

                    <span>
                      <Calendar size={15} />
                      {formatDate(viewingCategory.createdAt)}
                    </span>
                  </div>

                  <div className="view-detail-item">
                    <label>Last Updated</label>

                    <span>
                      <Calendar size={15} />
                      {formatDate(viewingCategory.updatedAt)}
                    </span>
                  </div>

                  <div className="view-detail-item">
                    <label>Category ID</label>
                    <span>{viewingCategory.id || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                {isEditMode ? (
                  <>
                    <button
                      className="btn-cancel"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>

                    <button
                      className="btn-save"
                      onClick={handleSaveCategory}
                      disabled={isSubmitting || isProcessingImage}
                    >
                      {isProcessingImage ? (
                        <>Processing image...</>
                      ) : isSubmitting ? (
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
                      onClick={openEditFromView}
                    >
                      <Edit size={18} />
                      Edit
                    </button>

                    <button
                      className="btn-danger"
                      onClick={handleDeleteFromView}
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