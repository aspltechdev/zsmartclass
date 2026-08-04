// src/pages/admin/AdminUsers.jsx
import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  RefreshCw,
  AlertCircle,
  Save,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Mail,
  Calendar,
} from "lucide-react";
import api from "../../services/api";
import "./AdminUsers.css";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // Store all users for stats
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stats - FIXED values (never change with filters)
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    mentors: 0,
    admins: 0,
  });

  // ==========================================
  // FETCH FUNCTIONS
  // ==========================================
  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      const usersData = res.data?.data || res.data || [];

      // Store all users for stats (never filtered)
      setAllUsers(usersData);

      // Calculate stats from ALL users (not filtered)
      const total = usersData.length;
      const students = usersData.filter(u => u.role === "STUDENT").length;
      const mentors = usersData.filter(u => u.role === "MENTOR").length;
      const admins = usersData.filter(u => u.role === "ADMIN").length;

      setStats({ total, students, mentors, admins });

      // Apply filters for table display
      let filteredData = [...usersData];

      // Apply role filter
      if (roleFilter !== "all") {
        filteredData = filteredData.filter(u => u.role === roleFilter);
      }

      // Apply search
      if (search) {
        const searchLower = search.toLowerCase();
        filteredData = filteredData.filter(u =>
          u.name?.toLowerCase().includes(searchLower) ||
          u.email?.toLowerCase().includes(searchLower)
        );
      }

      // Calculate pagination
      const totalFiltered = filteredData.length;
      const totalPagesCalc = Math.ceil(totalFiltered / itemsPerPage);
      setTotalPages(totalPagesCalc || 1);
      
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const paginatedData = filteredData.slice(start, end);

      setUsers(paginatedData);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
      setAllUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CRUD OPERATIONS
  // ==========================================
  const handleCreateUser = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        isActive: true,
      };

      await api.post("/users", payload);
      resetForm();
      setShowModal(false);
      fetchUsers();
      alert("User created successfully!");
    } catch (err) {
      setFormErrors({ submit: err.response?.data?.message || "Failed to create user" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        role: form.role,
        isActive: true,
      };

      if (form.password) {
        payload.password = form.password;
      }

      await api.put(`/users/${editingUser.id}`, payload);
      resetForm();
      setShowModal(false);
      setEditingUser(null);
      fetchUsers();
      alert("User updated successfully!");
    } catch (err) {
      setFormErrors({ submit: err.response?.data?.message || "Failed to update user" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await api.delete(`/users/${deletingUser.id}`);
      setShowDeleteModal(false);
      setDeletingUser(null);
      fetchUsers();
      alert("User deleted successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  // ==========================================
  // FORM VALIDATION
  // ==========================================
  const validateForm = () => {
    const errors = {};

    if (!form.name?.trim()) {
      errors.name = "Name is required";
    }

    if (!form.email?.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errors.email = "Email is invalid";
    }

    if (!editingUser && !form.password) {
      errors.password = "Password is required";
    } else if (form.password && form.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!form.role) {
      errors.role = "Role is required";
    }

    return errors;
  };

  // ==========================================
  // MODAL HANDLERS
  // ==========================================
  const openCreateModal = () => {
    resetForm();
    setEditingUser(null);
    setShowModal(true);
    setFormErrors({});
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "STUDENT",
    });
    setShowModal(true);
    setFormErrors({});
  };

  const openDeleteModal = (user) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const openViewModal = (user) => {
    setViewingUser(user);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      password: "",
      role: "STUDENT",
    });
    setFormErrors({});
  };

  // ==========================================
  // PAGINATION HELPERS
  // ==========================================
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // ==========================================
  // RENDER HELPERS
  // ==========================================
  const getRoleBadge = (role) => {
    const badges = {
      ADMIN: <span className="role-badge admin">Admin</span>,
      MENTOR: <span className="role-badge mentor">Mentor</span>,
      STUDENT: <span className="role-badge student">Student</span>,
    };
    return badges[role] || <span className="role-badge">{role}</span>;
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Get filtered count for display
  const getFilteredCount = () => {
    let count = allUsers.length;
    if (roleFilter !== "all") {
      count = allUsers.filter(u => u.role === roleFilter).length;
    }
    if (search) {
      const searchLower = search.toLowerCase();
      count = allUsers.filter(u =>
        u.name?.toLowerCase().includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower)
      ).length;
    }
    return count;
  };

  // ==========================================
  // RENDER
  // ==========================================
  if (loading && users.length === 0) {
    return (
      <div className="users-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  const filteredCount = getFilteredCount();

  return (
    <div className="users-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p className="subtitle">Manage all users on your platform</p>
        </div>
        <button className="add-btn" onClick={openCreateModal}>
          <UserPlus size={18} />
          Add User
        </button>
      </div>

      {/* Stats Cards - FIXED values from allUsers */}
      <div className="user-stats">
        <div className="stat-card">
          <Users size={22} />
          <div>
            <h3>{stats.total}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="stat-card">
          <Users size={22} />
          <div>
            <h3>{stats.students}</h3>
            <p>Students</p>
          </div>
        </div>
        <div className="stat-card">
          <Users size={22} />
          <div>
            <h3>{stats.mentors}</h3>
            <p>Mentors</p>
          </div>
        </div>
        <div className="stat-card">
          <Users size={22} />
          <div>
            <h3>{stats.admins}</h3>
            <p>Admins</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="MENTOR">Mentor</option>
          <option value="STUDENT">Student</option>
        </select>

        <button className="refresh-btn" onClick={fetchUsers}>
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Users Table */}
      <div className="table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <Users size={48} />
                    <h3>No users found</h3>
                    <p>Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.name?.charAt(0) || "U"}
                      </div>
                      <span className="user-name">{user.name || "Unknown"}</span>
                    </div>
                  </td>
                  <td>
                    <span className="user-email">{user.email}</span>
                  </td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>
                    <span className="joined-date">
                      <Calendar size={14} />
                      {formatDate(user.createdAt)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="view-btn"
                        title="View"
                        onClick={() => openViewModal(user)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="edit-btn"
                        title="Edit"
                        onClick={() => openEditModal(user)}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="delete-btn"
                        title="Delete"
                        onClick={() => openDeleteModal(user)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            
            <div className="page-numbers">
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  className={`page-number ${currentPage === page ? 'active' : ''}`}
                  onClick={() => goToPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              className="page-btn"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Show filtered count */}
        {allUsers.length > 0 && (
          <div className="table-footer">
            <span className="total-count">
              Showing {users.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredCount)} of {filteredCount} users
              {filteredCount !== stats.total && (
                <span className="filter-hint"> (filtered from {stats.total} total)</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* Create/Edit Modal */}
      {/* ========================================== */}
      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? "Edit User" : "Create User"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {formErrors.submit && (
                <div className="error-banner">
                  <AlertCircle size={18} />
                  <span>{formErrors.submit}</span>
                </div>
              )}

              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    setFormErrors({ ...formErrors, name: "" });
                  }}
                  className={formErrors.name ? "error" : ""}
                />
                {formErrors.name && <span className="error-text">{formErrors.name}</span>}
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    setFormErrors({ ...formErrors, email: "" });
                  }}
                  className={formErrors.email ? "error" : ""}
                />
                {formErrors.email && <span className="error-text">{formErrors.email}</span>}
              </div>

              <div className="form-group">
                <label>{editingUser ? "New Password (optional)" : "Password *"}</label>
                <input
                  type="password"
                  placeholder={editingUser ? "Leave blank to keep current" : "Enter password"}
                  value={form.password}
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value });
                    setFormErrors({ ...formErrors, password: "" });
                  }}
                  className={formErrors.password ? "error" : ""}
                />
                {formErrors.password && <span className="error-text">{formErrors.password}</span>}
              </div>

              <div className="form-group">
                <label>Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => {
                    setForm({ ...form, role: e.target.value });
                    setFormErrors({ ...formErrors, role: "" });
                  }}
                  className={formErrors.role ? "error" : ""}
                >
                  <option value="STUDENT">Student</option>
                  <option value="MENTOR">Mentor</option>
                  <option value="ADMIN">Admin</option>
                </select>
                {formErrors.role && <span className="error-text">{formErrors.role}</span>}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn-save" onClick={editingUser ? handleUpdateUser : handleCreateUser} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="spinner-small"></div>
                    {editingUser ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {editingUser ? "Update User" : "Create User"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* Delete Confirmation Modal */}
      {/* ========================================== */}
      {showDeleteModal && deletingUser && (
        <div className="modal confirm-modal" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content confirm-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="confirm-body">
              <AlertCircle size={48} className="confirm-icon" />
              <p>Are you sure you want to delete <strong>{deletingUser.name}</strong>?</p>
              <p className="confirm-sub">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDeleteUser}>
                <Trash2 size={18} />
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* View User Modal */}
      {/* ========================================== */}
      {showViewModal && viewingUser && (
        <div className="modal view-modal" onClick={() => setShowViewModal(false)}>
          <div className="modal-content view-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Details</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="view-body">
              <div className="view-user-header">
                <div className="view-avatar">
                  {viewingUser.name?.charAt(0) || "U"}
                </div>
                <div>
                  <h3>{viewingUser.name || "Unknown"}</h3>
                  <span className="view-email">{viewingUser.email}</span>
                </div>
                {getRoleBadge(viewingUser.role)}
              </div>

              <div className="view-details">
                <div className="view-detail-item">
                  <label>Full Name</label>
                  <span>{viewingUser.name || "—"}</span>
                </div>
                <div className="view-detail-item">
                  <label>Email</label>
                  <span>{viewingUser.email || "—"}</span>
                </div>
                <div className="view-detail-item">
                  <label>Role</label>
                  <span>{viewingUser.role || "—"}</span>
                </div>
                <div className="view-detail-item">
                  <label>Joined</label>
                  <span>{formatDate(viewingUser.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowViewModal(false)}>
                Close
              </button>
              <button className="btn-edit" onClick={() => {
                setShowViewModal(false);
                openEditModal(viewingUser);
              }}>
                <Edit size={18} />
                Edit User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;