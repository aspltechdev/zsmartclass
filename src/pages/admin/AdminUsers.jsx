// src/pages/admin/AdminUsers.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  Search,
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
  Mail,
  Calendar,
  Shield,
  GraduationCap,
  UserCheck,
  Sparkles,
  Crown,
  Star,
  Send,
  BookOpen,
  CheckCircle,
  XCircle,
  PlusCircle,
  MinusCircle,
  Loader,
  Clock,
  Calendar as CalendarIcon,
  Infinity,
} from "lucide-react";
import api from "../../services/api";
import "./AdminUsers.css";

const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23667eea'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='20' font-family='sans-serif'%3ECourse%3C/text%3E%3C/svg%3E";

const EMPTY_FORM = {
  name: "",
  email: "",
  role: "STUDENT",
};

const ROLE_CONFIG = {
  ADMIN: {
    title: "Administrators",
    icon: Crown,
    color: "#92400e",
    light: "#fef3c7",
    gradient: "linear-gradient(135deg, #92400e, #b45309)",
    emoji: "👑",
  },
  MENTOR: {
    title: "Mentors",
    icon: Star,
    color: "#1d4ed8",
    light: "#dbeafe",
    gradient: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    emoji: "⭐",
  },
  STUDENT: {
    title: "Students",
    icon: GraduationCap,
    color: "#047857",
    light: "#d1fae5",
    gradient: "linear-gradient(135deg, #047857, #059669)",
    emoji: "🎓",
  },
};

function AdminUsers() {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);

  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Course Access Management State
  const [allCourses, setAllCourses] = useState([]);
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [managingAccess, setManagingAccess] = useState(null);
  const [selectedCourseForAccess, setSelectedCourseForAccess] = useState(null);
  const [accessDuration, setAccessDuration] = useState(30);
  const [extendDays, setExtendDays] = useState(30);

  // ==========================================
  // FETCH FUNCTIONS
  // ==========================================
  const fetchUsers = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/users");
      const data = response.data?.data ?? response.data ?? [];

      const normalizedUsers = Array.isArray(data) ? data : [];
      setAllUsers(normalizedUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
      setAllUsers([]);
      setError(
        err.response?.data?.message ||
          "Unable to load users. Please check the server connection."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchCoursesAndEnrollments = useCallback(async (userId) => {
    try {
      setLoadingCourses(true);
      
      const coursesRes = await api.get("/courses");
      const courses = coursesRes.data?.data || coursesRes.data || [];
      setAllCourses(courses);

      try {
        const enrollmentsRes = await api.get(`/enrollments/admin/student/${userId}`);
        const enrollments = enrollmentsRes.data?.data || enrollmentsRes.data || [];
        setStudentEnrollments(enrollments);
      } catch (err) {
        if (err.response?.status === 404) {
          setStudentEnrollments([]);
        } else {
          console.error("Error fetching enrollments:", err);
          setStudentEnrollments([]);
        }
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
      setAllCourses([]);
      setStudentEnrollments([]);
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  // ==========================================
  // ACCESS MANAGEMENT FUNCTIONS
  // ==========================================
  const handleGrantAccess = async (courseId, durationDays) => {
    if (!viewingUser) return;
    
    setManagingAccess(courseId);
    try {
      await api.post("/enrollments/admin/grant-access", {
        userId: viewingUser.id,
        courseId: courseId,
        durationDays: durationDays || null,
      });
      
      await fetchCoursesAndEnrollments(viewingUser.id);
      
      const courseTitle = allCourses.find(c => c.id === courseId)?.title;
      alert(
        `✅ Access granted successfully!\n\n` +
        `Course: ${courseTitle}\n` +
        `Duration: ${durationDays ? durationDays + ' days' : 'Unlimited'}`
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to grant access");
    } finally {
      setManagingAccess(null);
      setShowDurationModal(false);
      setSelectedCourseForAccess(null);
    }
  };

  const handleRevokeAccess = async (enrollmentId, courseTitle) => {
    if (!confirm(`⚠️ Are you sure you want to revoke access to "${courseTitle}"?\n\nThe student will lose all progress in this course.`)) return;
    
    setManagingAccess(enrollmentId);
    try {
      await api.delete(`/enrollments/admin/${enrollmentId}`);
      
      await fetchCoursesAndEnrollments(viewingUser.id);
      alert(`✅ Access revoked from "${courseTitle}" successfully!`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to revoke access");
    } finally {
      setManagingAccess(null);
    }
  };

  const handleExtendAccess = async (enrollmentId, additionalDays) => {
    if (!confirm(`Extend access by ${additionalDays} days?`)) return;
    
    setManagingAccess(enrollmentId);
    try {
      await api.put(`/enrollments/admin/${enrollmentId}/extend`, {
        additionalDays: additionalDays,
      });
      
      await fetchCoursesAndEnrollments(viewingUser.id);
      alert(`✅ Access extended by ${additionalDays} days successfully!`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to extend access");
    } finally {
      setManagingAccess(null);
    }
  };

  const openDurationModal = (courseId) => {
    setSelectedCourseForAccess(courseId);
    setAccessDuration(30);
    setShowDurationModal(true);
  };

  // ==========================================
  // USER CRUD FUNCTIONS
  // ==========================================
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const stats = useMemo(() => {
    return {
      total: allUsers.length,
      students: allUsers.filter((user) => user.role === "STUDENT").length,
      mentors: allUsers.filter((user) => user.role === "MENTOR").length,
      admins: allUsers.filter((user) => user.role === "ADMIN").length,
      pending: allUsers.filter((user) => user.isActive === false).length,
    };
  }, [allUsers]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return allUsers.filter((user) => {
      const matchesRole =
        roleFilter === "all" || user.role === roleFilter;

      const matchesSearch =
        !term ||
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term);

      return matchesRole && matchesSearch;
    });
  }, [allUsers, roleFilter, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / itemsPerPage)
  );

  const safePage = Math.min(currentPage, totalPages);

  const paginatedUsers = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, safePage]);

  const adminUsers = paginatedUsers.filter(
    (user) => user.role === "ADMIN"
  );
  const mentorUsers = paginatedUsers.filter(
    (user) => user.role === "MENTOR"
  );
  const studentUsers = paginatedUsers.filter(
    (user) => user.role === "STUDENT"
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  const validateForm = () => {
    const errors = {};
    const name = form.name.trim();
    const email = form.email.trim();

    if (!name) {
      errors.name = "Name is required";
    }

    if (!email) {
      errors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = "Enter a valid email address";
    }

    if (!form.role) {
      errors.role = "Role is required";
    }

    return errors;
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  const openCreateModal = () => {
    setEditingUser(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "STUDENT",
    });
    setFormErrors({});
    setShowModal(true);
  };

  const closeFormModal = () => {
    if (isSubmitting) return;
    setShowModal(false);
    setEditingUser(null);
    resetForm();
  };

  const openViewModal = async (user) => {
    setViewingUser(user);
    setShowViewModal(true);
    if (user.role === "STUDENT") {
      await fetchCoursesAndEnrollments(user.id);
    }
  };

  const openDeleteModal = (user) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setFormErrors((previous) => ({
      ...previous,
      [field]: "",
      submit: "",
    }));
  };

  const handleSubmit = async () => {
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
      };

      let response;
      
      if (!editingUser) {
        response = await api.post("/users", payload);
        
        const userName = response.data?.data?.name || form.name;
        const userEmail = response.data?.data?.email || form.email;
        
        alert(
          `✅ Invitation Sent Successfully!\n\n` +
          `An invitation email has been sent to:\n` +
          `📧 ${userEmail}\n\n` +
          `The user will receive instructions to set up their account and create a password.\n` +
          `They have 48 hours to complete the registration.`
        );
      } else {
        response = await api.put(`/users/${editingUser.id}`, payload);
        alert("✅ User updated successfully!");
      }

      closeFormModal();
      await fetchUsers(true);
    } catch (err) {
      console.error("User save error:", err);
      setFormErrors({
        submit: err.response?.data?.message || 
          (editingUser ? "Failed to update user" : "Failed to send invitation"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendInvitation = async (userId) => {
    try {
      const response = await api.post(`/users/${userId}/resend-invitation`);
      alert(
        `✅ Invitation Resent!\n\n` +
        `A new invitation email has been sent to the user.\n` +
        `They have 48 hours to complete the registration.`
      );
      await fetchUsers(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to resend invitation");
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    try {
      setIsSubmitting(true);

      await api.delete(`/users/${deletingUser.id}`);

      setShowDeleteModal(false);
      setDeletingUser(null);

      await fetchUsers(true);
    } catch (err) {
      console.error("Delete user error:", err);
      alert(
        err.response?.data?.message || "Failed to delete user"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";

    return name
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const goToPage = (page) => {
    const nextPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(nextPage);
  };

  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 5;

    let start = Math.max(1, safePage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [safePage, totalPages]);

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("all");
  };

  const renderRoleSection = (role, users) => {
    if (!users.length) return null;

    const config = ROLE_CONFIG[role];
    const Icon = config.icon;

    return (
      <section
        className="role-section"
        data-role={role.toLowerCase()}
        style={{ "--role-color": config.color }}
      >
        <div className="role-section-header">
          <div
            className="role-header-icon"
            style={{
              background: config.color,
              color: "#fff",
            }}
          >
            <Icon size={19} />
          </div>

          <h2>{config.title}</h2>

          <span
            className="role-count"
            style={{
              background: config.color,
              color: "#fff",
            }}
          >
            {users.length}
          </span>

          <Sparkles
            className="role-header-sparkle"
            size={14}
            style={{ color: config.color }}
          />
        </div>

        <div className="user-cards-grid">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              config={config}
              getInitials={getInitials}
              formatDate={formatDate}
              onView={openViewModal}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
              onResend={handleResendInvitation}
            />
          ))}
        </div>
      </section>
    );
  };

  if (loading) {
    return (
      <div className="users-page">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p className="subtitle">
            Invite users to join the platform. They will receive an email to set up their account.
          </p>
        </div>

        <button className="add-btn" onClick={openCreateModal}>
          <UserPlus size={18} />
          Invite User
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="user-stats">
        <StatCard
          className="total-card"
          color="#7c3aed"
          icon={<Users size={21} />}
          value={stats.total}
          label="Total Users"
        />

        <StatCard
          className="student-card"
          color="#047857"
          icon={<GraduationCap size={21} />}
          value={stats.students}
          label="Students"
        />

        <StatCard
          className="mentor-card"
          color="#1d4ed8"
          icon={<UserCheck size={21} />}
          value={stats.mentors}
          label="Mentors"
        />

        <StatCard
          className="admin-card"
          color="#92400e"
          icon={<Shield size={21} />}
          value={stats.admins}
          label="Admins"
        />

        <StatCard
          className="pending-card"
          color="#f59e0b"
          icon={<Mail size={21} />}
          value={stats.pending}
          label="Pending Invites"
        />
      </div>

      {/* SEARCH / FILTER */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={17} />

          <input
            type="text"
            value={search}
            placeholder="Search users by name or email..."
            onChange={(event) => setSearch(event.target.value)}
          />

          {search && (
            <button
              type="button"
              className="clear-search"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <select
          className="filter-select"
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="ADMIN">👑 Admin</option>
          <option value="MENTOR">⭐ Mentor</option>
          <option value="STUDENT">🎓 Student</option>
        </select>

        <button
          type="button"
          className={`refresh-btn ${refreshing ? "spinning" : ""}`}
          onClick={() => fetchUsers(true)}
          title="Refresh users"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      {error && (
        <div className="error-banner page-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => fetchUsers(true)}>
            Retry
          </button>
        </div>
      )}

      {/* USER SECTIONS */}
      <div className="users-container">
        {renderRoleSection("ADMIN", adminUsers)}
        {renderRoleSection("MENTOR", mentorUsers)}
        {renderRoleSection("STUDENT", studentUsers)}

        {paginatedUsers.length === 0 && (
          <div className="empty-state">
            <Users size={46} />
            <h3>No users found</h3>
            <p>Try adjusting your search or role filter.</p>

            {(search || roleFilter !== "all") && (
              <button type="button" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="page-btn"
            onClick={() => goToPage(safePage - 1)}
            disabled={safePage === 1}
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <div className="page-numbers">
            {pageNumbers.map((page) => (
              <button
                type="button"
                key={page}
                className={`page-number ${safePage === page ? "active" : ""}`}
                onClick={() => goToPage(page)}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="page-btn"
            onClick={() => goToPage(safePage + 1)}
            disabled={safePage === totalPages}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {allUsers.length > 0 && (
        <div className="table-footer">
          Showing{" "}
          {filteredUsers.length === 0
            ? 0
            : (safePage - 1) * itemsPerPage + 1}{" "}
          to{" "}
          {Math.min(safePage * itemsPerPage, filteredUsers.length)} of{" "}
          {filteredUsers.length} users
          {filteredUsers.length !== allUsers.length && (
            <span className="filter-hint">
              {" "}
              (filtered from {allUsers.length} total)
            </span>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* CREATE / EDIT MODAL */}
      {/* ========================================== */}
      {showModal && (
        <div className="modal" onMouseDown={closeFormModal}>
          <div
            className="modal-content"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{editingUser ? "Edit User" : "Invite New User"}</h2>
              <button
                type="button"
                className="modal-close"
                onClick={closeFormModal}
              >
                <X size={19} />
              </button>
            </div>

            <div className="modal-body">
              {formErrors.submit && (
                <div className="error-banner">
                  <AlertCircle size={18} />
                  <span>{formErrors.submit}</span>
                </div>
              )}

              {!editingUser && (
                <div className="invite-info-banner">
                  <Mail size={18} />
                  <span>The user will receive an email invitation to set up their account.</span>
                </div>
              )}

              <FormField label="Full Name" error={formErrors.name}>
                <input
                  type="text"
                  value={form.name}
                  placeholder="Enter full name"
                  onChange={(event) => updateField("name", event.target.value)}
                  className={formErrors.name ? "error" : ""}
                />
              </FormField>

              <FormField label="Email Address" error={formErrors.email}>
                <input
                  type="email"
                  value={form.email}
                  placeholder="Enter email address"
                  onChange={(event) => updateField("email", event.target.value)}
                  className={formErrors.email ? "error" : ""}
                />
              </FormField>

              <FormField label="Role" error={formErrors.role}>
                <select
                  value={form.role}
                  onChange={(event) => updateField("role", event.target.value)}
                  className={formErrors.role ? "error" : ""}
                >
                  <option value="STUDENT">🎓 Student</option>
                  <option value="MENTOR">⭐ Mentor</option>
                  <option value="ADMIN">👑 Admin</option>
                </select>
              </FormField>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={closeFormModal}
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn-save"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-small" />
                    {editingUser ? "Updating..." : "Sending Invitation..."}
                  </>
                ) : (
                  <>
                    {editingUser ? (
                      <>
                        <Save size={17} />
                        Update User
                      </>
                    ) : (
                      <>
                        <Send size={17} />
                        Send Invitation
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* DELETE MODAL */}
      {/* ========================================== */}
      {showDeleteModal && deletingUser && (
        <div
          className="modal"
          onMouseDown={() => {
            if (!isSubmitting) setShowDeleteModal(false);
          }}
        >
          <div
            className="modal-content confirm-content"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                <X size={19} />
              </button>
            </div>

            <div className="confirm-body">
              <AlertCircle size={48} className="confirm-icon" />
              <p>
                Are you sure you want to delete{" "}
                <strong>{deletingUser.name}</strong>?
              </p>
              <p className="confirm-sub">
                This action cannot be undone. All related records will be automatically deleted.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowDeleteModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn-danger"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                <Trash2 size={17} />
                {isSubmitting ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* VIEW MODAL - WITH COURSE ACCESS MANAGEMENT */}
      {/* ========================================== */}
      {showViewModal && viewingUser && (
        <div
          className="modal view-modal"
          onMouseDown={() => setShowViewModal(false)}
        >
          <div
            className="modal-content view-content"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2>User Details</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowViewModal(false)}
              >
                <X size={19} />
              </button>
            </div>

            <div className="view-body">
              {/* User Info Header */}
              <div className="view-user-header">
                <div
                  className="view-avatar"
                  style={{
                    background: ROLE_CONFIG[viewingUser.role]?.gradient || "#64748b",
                  }}
                >
                  {getInitials(viewingUser.name)}
                </div>

                <div className="view-user-title">
                  <h3>{viewingUser.name || "Unknown"}</h3>
                  <span>{viewingUser.email || "—"}</span>
                </div>

                <span
                  className={`role-badge ${(viewingUser.role || "").toLowerCase()}`}
                >
                  {viewingUser.role || "USER"}
                </span>
              </div>

              {/* User Details Grid */}
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
                  <label>Status</label>
                  <span>{viewingUser.isActive ? "✅ Active" : "⏳ Pending Invitation"}</span>
                </div>
                <div className="view-detail-item">
                  <label>Joined</label>
                  <span>{formatDate(viewingUser.createdAt)}</span>
                </div>
              </div>

              {/* ========================================== */}
              {/* COURSE ACCESS MANAGEMENT - ONLY FOR STUDENTS */}
              {/* ========================================== */}
              {viewingUser.role === "STUDENT" && (
                <div className="view-section course-access-section">
                  <div className="section-header">
                    <h4>
                      <BookOpen size={18} />
                      Course Access Management
                    </h4>
                    <span className="access-count">
                      {loadingCourses ? (
                        <Loader size={16} className="spinning" />
                      ) : (
                        `${studentEnrollments.filter(e => !e.isExpired).length} / ${allCourses.length} active`
                      )}
                    </span>
                  </div>

                  <div className="course-access-list">
                    {loadingCourses ? (
                      <div className="loading-courses">
                        <Loader size={24} className="spinning" />
                        <p>Loading courses...</p>
                      </div>
                    ) : allCourses.length === 0 ? (
                      <div className="empty-courses">
                        <p>No courses available in the system.</p>
                      </div>
                    ) : (
                      allCourses.map((course) => {
                        const enrollment = studentEnrollments.find(
                          (e) => e.courseId === course.id
                        );
                        const hasAccess = !!enrollment;
                        const isExpired = enrollment?.isExpired || false;
                        const remainingDays = enrollment?.remainingDays || 0;
                        const accessExpiry = enrollment?.accessExpiry;
                        const isPending = managingAccess === course.id || managingAccess === enrollment?.id;

                        return (
                          <div key={course.id} className={`course-access-item ${isExpired ? 'expired' : ''}`}>
                            <div className="course-info">
                              {course.thumbnail ? (
                                <img
                                  src={course.thumbnail}
                                  alt={course.title}
                                  className="course-thumbnail-small"
                                  onError={(e) => {
                                    e.target.src = FALLBACK_IMAGE;
                                  }}
                                />
                              ) : (
                                <div className="course-thumbnail-placeholder">
                                  <BookOpen size={20} />
                                </div>
                              )}
                              <div className="course-details">
                                <span className="course-title">{course.title}</span>
                                <span className="course-meta">
                                  {course.level || "All Levels"} • 
                                  {course.isFree ? " Free" : ` ₹${course.price || 0}`}
                                </span>
                                {hasAccess && (
                                  <span className="access-duration">
                                    {isExpired ? (
                                      <span className="expired-text">⚠️ Access Expired</span>
                                    ) : accessExpiry ? (
                                      <span className="days-left">
                                        <Clock size={12} />
                                        {remainingDays} day{remainingDays !== 1 ? 's' : ''} left
                                      </span>
                                    ) : (
                                      <span className="unlimited-text">
                                        <Infinity size={12} />
                                        Unlimited Access
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="course-access-status">
                              {hasAccess && !isExpired ? (
                                <span className="access-badge granted">
                                  <CheckCircle size={14} />
                                  Access Granted
                                </span>
                              ) : hasAccess && isExpired ? (
                                <span className="access-badge expired">
                                  <XCircle size={14} />
                                  Expired
                                </span>
                              ) : (
                                <span className="access-badge revoked">
                                  <XCircle size={14} />
                                  No Access
                                </span>
                              )}
                            </div>

                            <div className="course-access-actions">
                              {hasAccess && !isExpired ? (
                                <>
                                  <button
                                    className="btn-extend-access"
                                    onClick={() => {
                                      const days = prompt("Enter additional days to extend:", "30");
                                      if (days && parseInt(days) > 0) {
                                        handleExtendAccess(enrollment.id, parseInt(days));
                                      }
                                    }}
                                    disabled={isPending}
                                    title="Extend access duration"
                                  >
                                    <CalendarIcon size={14} />
                                    Extend
                                  </button>
                                  <button
                                    className="btn-revoke-access"
                                    onClick={() =>
                                      handleRevokeAccess(enrollment.id, course.title)
                                    }
                                    disabled={isPending}
                                  >
                                    {isPending ? (
                                      <span className="spinner-small" />
                                    ) : (
                                      <>
                                        <MinusCircle size={16} />
                                        Revoke
                                      </>
                                    )}
                                  </button>
                                </>
                              ) : hasAccess && isExpired ? (
                                <button
                                  className="btn-renew-access"
                                  onClick={() => openDurationModal(course.id)}
                                  disabled={isPending}
                                >
                                  <RefreshCw size={14} />
                                  Renew Access
                                </button>
                              ) : (
                                <button
                                  className="btn-grant-access"
                                  onClick={() => openDurationModal(course.id)}
                                  disabled={isPending}
                                >
                                  {isPending ? (
                                    <span className="spinner-small" />
                                  ) : (
                                    <>
                                      <PlusCircle size={16} />
                                      Grant Access
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="access-help-text">
                    <span>💡 Only admins can grant or revoke course access. Set duration in days (leave empty for unlimited).</span>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>

              {!viewingUser.isActive && (
                <button
                  type="button"
                  className="btn-resend"
                  onClick={() => {
                    setShowViewModal(false);
                    handleResendInvitation(viewingUser.id);
                  }}
                >
                  <Send size={17} />
                  Resend Invitation
                </button>
              )}

              <button
                type="button"
                className="btn-edit"
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(viewingUser);
                }}
              >
                <Edit size={17} />
                Edit User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* DURATION SELECTION MODAL */}
      {/* ========================================== */}
      {showDurationModal && selectedCourseForAccess && (
        <div className="modal" onMouseDown={() => setShowDurationModal(false)}>
          <div
            className="modal-content duration-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Set Access Duration</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowDurationModal(false)}
              >
                <X size={19} />
              </button>
            </div>

            <div className="modal-body">
              <p className="duration-info">
                Grant access to <strong>{allCourses.find(c => c.id === selectedCourseForAccess)?.title}</strong>
              </p>

              <div className="form-group">
                <label>Duration (in days)</label>
                <div className="duration-input-group">
                  <input
                    type="number"
                    value={accessDuration}
                    onChange={(e) => setAccessDuration(parseInt(e.target.value) || 0)}
                    min="1"
                    max="365"
                    className="duration-input"
                    placeholder="Enter days"
                  />
                  <span className="duration-unit">days</span>
                </div>
                <p className="duration-hint">
                  Enter 0 or leave blank for unlimited access.
                </p>
              </div>

              <div className="duration-presets">
                <button
                  className="preset-btn"
                  onClick={() => setAccessDuration(7)}
                >
                  7 days
                </button>
                <button
                  className="preset-btn"
                  onClick={() => setAccessDuration(30)}
                >
                  30 days
                </button>
                <button
                  className="preset-btn"
                  onClick={() => setAccessDuration(90)}
                >
                  90 days
                </button>
                <button
                  className="preset-btn"
                  onClick={() => setAccessDuration(180)}
                >
                  180 days
                </button>
                <button
                  className="preset-btn unlimited"
                  onClick={() => setAccessDuration(0)}
                >
                  <Infinity size={16} />
                  Unlimited
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowDurationModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-save"
                onClick={() => {
                  const duration = accessDuration > 0 ? accessDuration : null;
                  handleGrantAccess(selectedCourseForAccess, duration);
                }}
                disabled={isSubmitting}
              >
                <PlusCircle size={17} />
                Grant Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

function StatCard({ className, color, icon, value, label }) {
  return (
    <div
      className={`stat-card ${className}`}
      style={{ "--stat-color": color }}
    >
      <div
        className="stat-icon-wrapper"
        style={{ background: color, color: "#fff" }}
      >
        {icon}
      </div>
      <div className="stat-content">
        <h3>{value}</h3>
        <p>{label}</p>
      </div>
    </div>
  );
}

function FormField({ label, error, children }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      {children}
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}

function UserCard({ user, config, getInitials, formatDate, onView, onEdit, onDelete, onResend }) {
  const isPending = user.isActive === false;

  return (
    <article
      className="user-card"
      style={{
        "--card-color": config.color,
        borderColor: isPending ? "#fcd34d" : undefined,
      }}
    >
      <div className="user-card-avatar">
        <div
          className="user-avatar-circle"
          style={{
            background: config.gradient,
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {user.profileImage ? (
            <img src={user.profileImage} alt={user.name || "User"} />
          ) : (
            <span className="avatar-text">{getInitials(user.name)}</span>
          )}
        </div>
        <span
          className="avatar-status-dot"
          style={{ background: isPending ? "#f59e0b" : config.color }}
        />
      </div>

      <div className="user-card-info">
        <h4 className="user-card-name">{user.name || "Unknown"}</h4>
        <p className="user-card-email">
          <Mail size={12} />
          <span>{user.email || "—"}</span>
        </p>
        <div className="user-card-role">
          <span className={`role-badge ${user.role?.toLowerCase() || ""}`}>
            {config.emoji} {user.role || "USER"}
          </span>
        </div>
        <div className="user-card-status">
          {isPending ? (
            <span className="status-badge pending">⏳ Pending Invite</span>
          ) : (
            <span className="status-badge active">✅ Active</span>
          )}
        </div>
        <div className="user-card-joined">
          <Calendar size={12} />
          <span>{formatDate(user.createdAt)}</span>
        </div>
      </div>

      <div className="user-card-actions">
        <button
          type="button"
          className="card-action-btn view-btn"
          title="View Details"
          onClick={() => onView(user)}
        >
          <Eye size={16} />
        </button>
        <button
          type="button"
          className="card-action-btn edit-btn"
          title="Edit User"
          onClick={() => onEdit(user)}
        >
          <Edit size={16} />
        </button>
        {isPending && (
          <button
            type="button"
            className="card-action-btn resend-btn"
            title="Resend Invitation"
            onClick={() => onResend(user.id)}
          >
            <Send size={16} />
          </button>
        )}
        <button
          type="button"
          className="card-action-btn delete-btn"
          title="Delete User"
          onClick={() => onDelete(user)}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}

export default AdminUsers;