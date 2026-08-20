import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  Search,
  UserPlus,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  X,
  Mail,
  Calendar,
  Shield,
  GraduationCap,
  UserCheck,
  Crown,
  Star,
  Send,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Minus,
  Infinity,
  Save,
} from "lucide-react";

import api from "../../services/api";
import "./AdminUsers.css";

const ROLES = {
  ADMIN: {
    label: "Administrators",
    shortLabel: "Admin",
    icon: Crown,
    color: "#7c3aed",
    background: "#f3e8ff",
  },
  MENTOR: {
    label: "Mentors",
    shortLabel: "Mentor",
    icon: Star,
    color: "#2563eb",
    background: "#dbeafe",
  },
  STUDENT: {
    label: "Students",
    shortLabel: "Student",
    icon: GraduationCap,
    color: "#059669",
    background: "#d1fae5",
  },
};

const EMPTY_FORM = {
  name: "",
  email: "",
  role: "STUDENT",
};

const ITEMS_PER_PAGE = 12;

function AdminUsers() {
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [page, setPage] = useState(1);

  const [openRoles, setOpenRoles] = useState({
    ADMIN: true,
    MENTOR: true,
    STUDENT: true,
  });

  const [modal, setModal] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resending, setResending] = useState(false);

  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loadingAccess, setLoadingAccess] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [duration, setDuration] = useState(30);
  const [accessLoading, setAccessLoading] = useState(false);

  // =========================================================
  // USERS
  // =========================================================

  const fetchUsers = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/users");

      const data =
        response.data?.data ??
        response.data?.users ??
        response.data ??
        [];

      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch users error:", err);

      setUsers([]);

      setError(
        err.response?.data?.message ||
          "Unable to load users. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // =========================================================
  // FILTERING
  // =========================================================

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return users.filter((user) => {
      const roleMatch =
        role === "ALL" || user.role?.toUpperCase() === role;

      const searchMatch =
        !keyword ||
        user.name?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword);

      return roleMatch && searchMatch;
    });
  }, [users, search, role]);

  useEffect(() => {
    setPage(1);
  }, [search, role]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const groupedUsers = useMemo(
    () => ({
      ADMIN: visibleUsers.filter((u) => u.role === "ADMIN"),
      MENTOR: visibleUsers.filter((u) => u.role === "MENTOR"),
      STUDENT: visibleUsers.filter((u) => u.role === "STUDENT"),
    }),
    [visibleUsers]
  );

  // =========================================================
  // STATISTICS
  // =========================================================

  const stats = useMemo(
    () => ({
      total: users.length,
      students: users.filter((u) => u.role === "STUDENT").length,
      mentors: users.filter((u) => u.role === "MENTOR").length,
      admins: users.filter((u) => u.role === "ADMIN").length,
      pending: users.filter((u) => u.isActive === false).length,
    }),
    [users]
  );

  // =========================================================
  // HELPERS
  // =========================================================

  const initials = (name = "") => {
    const parts = name.trim().split(/\s+/);

    if (!parts.length || !parts[0]) {
      return "U";
    }

    return parts
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return "—";
    }

    return value.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const toggleRole = (roleName) => {
    setOpenRoles((previous) => ({
      ...previous,
      [roleName]: !previous[roleName],
    }));
  };

  // =========================================================
  // CREATE / EDIT
  // =========================================================

  const openCreate = () => {
    setSelectedUser(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModal("form");
  };

  const openEdit = (user) => {
    setSelectedUser(user);

    setForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "STUDENT",
    });

    setFormErrors({});
    setModal("form");
  };

  const closeModal = () => {
    if (saving || deleting || resending || accessLoading) {
      return;
    }

    setModal(null);
    setSelectedUser(null);
    setSelectedCourse(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = "Name is required.";
    }

    if (!form.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      errors.email = "Enter a valid email address.";
    }

    if (!form.role) {
      errors.role = "Select a role.";
    }

    return errors;
  };

  const saveUser = async () => {
    const errors = validateForm();

    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
      };

      if (selectedUser) {
        await api.put(`/users/${selectedUser.id}`, payload);
      } else {
        await api.post("/users", payload);
      }

      closeModal();
      await fetchUsers(true);

      alert(
        selectedUser
          ? "User updated successfully."
          : "Invitation sent successfully."
      );
    } catch (err) {
      console.error("Save user error:", err);

      setFormErrors({
        submit:
          err.response?.data?.message ||
          "Unable to save user. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const openDelete = (user) => {
    setSelectedUser(user);
    setModal("delete");
  };

  const deleteUser = async () => {
    if (!selectedUser) return;

    try {
      setDeleting(true);

      await api.delete(`/users/${selectedUser.id}`);

      setModal(null);
      setSelectedUser(null);

      await fetchUsers(true);

      alert("User deleted successfully.");
    } catch (err) {
      console.error("Delete user error:", err);

      alert(
        err.response?.data?.message ||
          "Unable to delete this user."
      );
    } finally {
      setDeleting(false);
    }
  };

  // =========================================================
  // RESEND INVITATION
  // =========================================================

  const resendInvitation = async (user) => {
    try {
      setResending(true);

      await api.post(`/users/${user.id}/resend-invitation`);

      alert("Invitation has been resent successfully.");

      await fetchUsers(true);
    } catch (err) {
      console.error("Resend invitation error:", err);

      alert(
        err.response?.data?.message ||
          "Unable to resend invitation."
      );
    } finally {
      setResending(false);
    }
  };

  // =========================================================
  // COURSE ACCESS
  // =========================================================

  const loadCourseAccess = async (userId) => {
    try {
      setLoadingAccess(true);

      const [courseResponse, enrollmentResponse] =
        await Promise.all([
          api.get("/courses"),
          api.get(`/enrollments/admin/student/${userId}`),
        ]);

      const courseData =
        courseResponse.data?.data ??
        courseResponse.data ??
        [];

      const enrollmentData =
        enrollmentResponse.data?.data ??
        enrollmentResponse.data ??
        [];

      setCourses(Array.isArray(courseData) ? courseData : []);
      setEnrollments(
        Array.isArray(enrollmentData) ? enrollmentData : []
      );
    } catch (err) {
      console.error("Course access error:", err);

      setCourses([]);
      setEnrollments([]);

      if (err.response?.status !== 404) {
        console.error(
          err.response?.data?.message ||
            "Unable to load course access."
        );
      }
    } finally {
      setLoadingAccess(false);
    }
  };

  const openView = async (user) => {
    setSelectedUser(user);
    setModal("view");

    if (user.role === "STUDENT") {
      await loadCourseAccess(user.id);
    } else {
      setCourses([]);
      setEnrollments([]);
    }
  };

  const openDuration = (course) => {
    setSelectedCourse(course);
    setDuration(30);
    setModal("duration");
  };

  const grantAccess = async () => {
    if (!selectedUser || !selectedCourse) return;

    try {
      setAccessLoading(true);

      await api.post("/enrollments/admin/grant-access", {
        userId: selectedUser.id,
        courseId: selectedCourse.id,
        durationDays: duration > 0 ? duration : null,
      });

      await loadCourseAccess(selectedUser.id);

      setModal("view");
      setSelectedCourse(null);

      alert("Course access granted successfully.");
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Unable to grant course access."
      );
    } finally {
      setAccessLoading(false);
    }
  };

  const revokeAccess = async (enrollment, course) => {
    const confirmed = window.confirm(
      `Revoke access to "${course.title}"?`
    );

    if (!confirmed) return;

    try {
      setAccessLoading(true);

      await api.delete(
        `/enrollments/admin/${enrollment.id}`
      );

      await loadCourseAccess(selectedUser.id);

      alert("Course access revoked.");
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Unable to revoke access."
      );
    } finally {
      setAccessLoading(false);
    }
  };

  const extendAccess = async (enrollment) => {
    const value = window.prompt(
      "Enter additional days:",
      "30"
    );

    const days = Number(value);

    if (!Number.isFinite(days) || days <= 0) {
      return;
    }

    try {
      setAccessLoading(true);

      await api.put(
        `/enrollments/admin/${enrollment.id}/extend`,
        {
          additionalDays: days,
        }
      );

      await loadCourseAccess(selectedUser.id);

      alert("Course access extended successfully.");
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Unable to extend course access."
      );
    } finally {
      setAccessLoading(false);
    }
  };

  // =========================================================
  // PAGE NUMBERS
  // =========================================================

  const pageNumbers = useMemo(() => {
    const pages = [];

    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }, [currentPage, totalPages]);

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="admin-users-page">
        <div className="users-loading">
          <div className="loading-spinner" />
          <h3>Loading users</h3>
          <p>Please wait...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="admin-users-page">

      {/* HEADER */}

      <header className="users-header">
        <div>
          <span className="header-eyebrow">
            ADMINISTRATION
          </span>

          <h1>User Management</h1>

          <p>
            Manage administrators, mentors and students
            from one place.
          </p>
        </div>

        <button
          className="invite-user-button"
          onClick={openCreate}
        >
          <UserPlus size={18} />
          Invite User
        </button>
      </header>

      {/* STATISTICS */}

      <section className="users-stat-grid">

        <Stat
          title="Total Users"
          value={stats.total}
          icon={<Users size={20} />}
          color="#7c3aed"
        />

        <Stat
          title="Students"
          value={stats.students}
          icon={<GraduationCap size={20} />}
          color="#059669"
        />

        <Stat
          title="Mentors"
          value={stats.mentors}
          icon={<UserCheck size={20} />}
          color="#2563eb"
        />

        <Stat
          title="Admins"
          value={stats.admins}
          icon={<Shield size={20} />}
          color="#d97706"
        />

        <Stat
          title="Pending Invites"
          value={stats.pending}
          icon={<Mail size={20} />}
          color="#ea580c"
        />

      </section>

      {/* TOOLBAR */}

      <section className="users-toolbar">

        <div className="users-search">
          <Search size={18} />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
          />

          {search && (
            <button
              onClick={() => setSearch("")}
              className="search-clear"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="role-filter"
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Administrators</option>
          <option value="MENTOR">Mentors</option>
          <option value="STUDENT">Students</option>
        </select>

        <button
          className={`users-refresh ${
            refreshing ? "is-refreshing" : ""
          }`}
          onClick={() => fetchUsers(true)}
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>

      </section>

      {/* ERROR */}

      {error && (
        <div className="users-error">
          <AlertCircle size={19} />

          <span>{error}</span>

          <button onClick={() => fetchUsers(true)}>
            Retry
          </button>
        </div>
      )}

      {/* USERS */}

      <main className="users-content">

        {Object.entries(ROLES).map(
          ([roleKey, roleConfig]) => {
            const roleUsers = groupedUsers[roleKey];

            if (!roleUsers.length) return null;

            const RoleIcon = roleConfig.icon;
            const expanded = openRoles[roleKey];

            return (
              <section
                className="role-group"
                key={roleKey}
              >

                <button
                  className="role-group-header"
                  onClick={() => toggleRole(roleKey)}
                >

                  <div
                    className="role-group-icon"
                    style={{
                      background: roleConfig.background,
                      color: roleConfig.color,
                    }}
                  >
                    <RoleIcon size={20} />
                  </div>

                  <div className="role-group-title">
                    <h2>{roleConfig.label}</h2>
                    <span>
                      {roleUsers.length} users
                    </span>
                  </div>

                  <span
                    className="role-count"
                    style={{
                      background: roleConfig.color,
                    }}
                  >
                    {roleUsers.length}
                  </span>

                  <span
                    className={`role-chevron ${
                      expanded ? "expanded" : ""
                    }`}
                  >
                    <ChevronRight size={20} />
                  </span>

                </button>

                {expanded && (
                  <div className="users-card-grid">
                    {roleUsers.map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        roleConfig={roleConfig}
                        initials={initials}
                        formatDate={formatDate}
                        onView={openView}
                        onEdit={openEdit}
                        onDelete={openDelete}
                        onResend={resendInvitation}
                      />
                    ))}
                  </div>
                )}

              </section>
            );
          }
        )}

        {!visibleUsers.length && (
          <div className="users-empty">
            <div className="empty-icon">
              <Users size={34} />
            </div>

            <h3>No users found</h3>

            <p>
              Try changing your search or role filter.
            </p>

            {(search || role !== "ALL") && (
              <button
                onClick={() => {
                  setSearch("");
                  setRole("ALL");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

      </main>

      {/* PAGINATION */}

      {totalPages > 1 && (
        <div className="users-pagination">

          <button
            disabled={currentPage === 1}
            onClick={() =>
              setPage((previous) =>
                Math.max(1, previous - 1)
              )
            }
          >
            <ChevronLeft size={17} />
            Previous
          </button>

          <div className="pagination-pages">
            {pageNumbers.map((number) => (
              <button
                key={number}
                className={
                  number === currentPage
                    ? "active"
                    : ""
                }
                onClick={() => setPage(number)}
              >
                {number}
              </button>
            ))}
          </div>

          <button
            disabled={currentPage === totalPages}
            onClick={() =>
              setPage((previous) =>
                Math.min(totalPages, previous + 1)
              )
            }
          >
            Next
            <ChevronRight size={17} />
          </button>

        </div>
      )}

      {/* FOOTER */}

      {filteredUsers.length > 0 && (
        <div className="users-footer">
          Showing{" "}
          {(currentPage - 1) * ITEMS_PER_PAGE + 1}
          {" - "}
          {Math.min(
            currentPage * ITEMS_PER_PAGE,
            filteredUsers.length
          )}
          {" of "}
          {filteredUsers.length} users
        </div>
      )}

      {/* =====================================================
          CREATE / EDIT MODAL
      ====================================================== */}

      {modal === "form" && (
        <Modal onClose={closeModal}>

          <div className="modal-heading">
            <div>
              <span className="modal-kicker">
                USER MANAGEMENT
              </span>

              <h2>
                {selectedUser
                  ? "Edit User"
                  : "Invite New User"}
              </h2>
            </div>

            <button
              className="modal-close"
              onClick={closeModal}
            >
              <X size={20} />
            </button>
          </div>

          {!selectedUser && (
            <div className="invite-message">
              <Mail size={20} />

              <div>
                <strong>Invitation email</strong>

                <p>
                  The user will receive an email with
                  instructions to complete their account.
                </p>
              </div>
            </div>
          )}

          {formErrors.submit && (
            <div className="form-error-box">
              <AlertCircle size={18} />
              {formErrors.submit}
            </div>
          )}

          <div className="user-form">

            <label>
              Full Name

              <input
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                placeholder="Enter full name"
              />

              {formErrors.name && (
                <small>{formErrors.name}</small>
              )}
            </label>

            <label>
              Email Address

              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                placeholder="name@example.com"
              />

              {formErrors.email && (
                <small>{formErrors.email}</small>
              )}
            </label>

            <label>
              Role

              <select
                value={form.role}
                onChange={(e) =>
                  setForm({
                    ...form,
                    role: e.target.value,
                  })
                }
              >
                <option value="STUDENT">
                  Student
                </option>

                <option value="MENTOR">
                  Mentor
                </option>

                <option value="ADMIN">
                  Administrator
                </option>
              </select>

              {formErrors.role && (
                <small>{formErrors.role}</small>
              )}
            </label>

          </div>

          <div className="modal-actions">

            <button
              className="secondary-button"
              onClick={closeModal}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              className="primary-button"
              onClick={saveUser}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="button-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  {selectedUser ? (
                    <Save size={17} />
                  ) : (
                    <Send size={17} />
                  )}

                  {selectedUser
                    ? "Update User"
                    : "Send Invitation"}
                </>
              )}
            </button>

          </div>

        </Modal>
      )}

      {/* =====================================================
          DELETE MODAL
      ====================================================== */}

      {modal === "delete" && selectedUser && (
        <Modal onClose={closeModal}>

          <div className="delete-modal">

            <div className="delete-icon">
              <Trash2 size={26} />
            </div>

            <h2>Delete User?</h2>

            <p>
              Are you sure you want to delete
              <strong> {selectedUser.name}</strong>?
            </p>

            <span>
              This action cannot be undone.
            </span>

            <div className="modal-actions">

              <button
                className="secondary-button"
                onClick={closeModal}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                className="danger-button"
                onClick={deleteUser}
                disabled={deleting}
              >
                <Trash2 size={17} />

                {deleting
                  ? "Deleting..."
                  : "Delete User"}
              </button>

            </div>

          </div>

        </Modal>
      )}

      {/* =====================================================
          VIEW USER MODAL
      ====================================================== */}

      {modal === "view" && selectedUser && (
        <Modal
          className="view-user-modal"
          onClose={closeModal}
        >

          <div className="modal-heading">
            <div>
              <span className="modal-kicker">
                USER PROFILE
              </span>

              <h2>User Details</h2>
            </div>

            <button
              className="modal-close"
              onClick={closeModal}
            >
              <X size={20} />
            </button>
          </div>

          <div className="view-modal-body">

          <div className="profile-overview">

            <div
              className="profile-avatar"
              style={{
                background:
                  ROLES[selectedUser.role]?.color ||
                  "#64748b",
              }}
            >
              {selectedUser.profileImage ? (
                <img
                  src={selectedUser.profileImage}
                  alt={selectedUser.name}
                />
              ) : (
                initials(selectedUser.name)
              )}
            </div>

            <div className="profile-name">
              <h3>
                {selectedUser.name || "Unknown User"}
              </h3>

              <p>
                <Mail size={14} />
                {selectedUser.email || "—"}
              </p>
            </div>

            <span
              className="profile-role"
              style={{
                color:
                  ROLES[selectedUser.role]?.color,
                background:
                  ROLES[selectedUser.role]?.background,
              }}
            >
              {ROLES[selectedUser.role]?.shortLabel ||
                selectedUser.role}
            </span>

          </div>

          <div className="profile-details">

            <Detail
              icon={<Users size={17} />}
              label="Full Name"
              value={selectedUser.name}
            />

            <Detail
              icon={<Mail size={17} />}
              label="Email"
              value={selectedUser.email}
            />

            <Detail
              icon={<Shield size={17} />}
              label="Role"
              value={selectedUser.role}
            />

            <Detail
              icon={<CheckCircle size={17} />}
              label="Status"
              value={
                selectedUser.isActive
                  ? "Active"
                  : "Pending Invitation"
              }
            />

            <Detail
              icon={<Calendar size={17} />}
              label="Joined"
              value={formatDate(
                selectedUser.createdAt
              )}
            />

          </div>

          {/* COURSE ACCESS */}

          {selectedUser.role === "STUDENT" && (
            <section className="access-section">

              <div className="access-header">

                <div>
                  <h3>
                    <BookOpen size={18} />
                    Course Access
                  </h3>

                  <p>
                    Manage this student's course
                    permissions.
                  </p>
                </div>

                <span className="access-total">
                  {
                    enrollments.filter(
                      (item) => !item.isExpired
                    ).length
                  }
                  {" / "}
                  {courses.length}
                </span>

              </div>

              {loadingAccess ? (
                <div className="access-loading">
                  <div className="loading-spinner" />
                  <span>Loading courses...</span>
                </div>
              ) : !courses.length ? (
                <div className="no-courses">
                  <BookOpen size={25} />
                  <p>No courses available.</p>
                </div>
              ) : (
                <div className="course-list">

                  {courses.map((course) => {

                    const enrollment =
                      enrollments.find(
                        (item) =>
                          item.courseId === course.id
                      );

                    const hasAccess = !!enrollment;

                    const expired =
                      enrollment?.isExpired;

                    return (
                      <div
                        className="course-row"
                        key={course.id}
                      >

                        <div className="course-main">

                          <div className="course-icon">
                            <BookOpen size={18} />
                          </div>

                          <div>
                            <h4>{course.title}</h4>

                            <p>
                              {course.level ||
                                "All Levels"}
                            </p>

                            {hasAccess &&
                              !expired && (
                                <span className="remaining">
                                  <Clock size={13} />

                                  {enrollment.remainingDays !=
                                  null
                                    ? `${enrollment.remainingDays} days remaining`
                                    : "Unlimited access"}
                                </span>
                              )}

                            {expired && (
                              <span className="expired-text">
                                Access expired
                              </span>
                            )}
                          </div>

                        </div>

                        <div className="course-status">

                          {hasAccess && !expired ? (
                            <span className="access-granted">
                              <CheckCircle size={14} />
                              Granted
                            </span>
                          ) : hasAccess && expired ? (
                            <span className="access-expired">
                              <XCircle size={14} />
                              Expired
                            </span>
                          ) : (
                            <span className="access-none">
                              <XCircle size={14} />
                              No Access
                            </span>
                          )}

                        </div>

                        <div className="course-actions">

                          {hasAccess &&
                            !expired && (
                              <>
                                <button
                                  className="extend-access"
                                  onClick={() =>
                                    extendAccess(
                                      enrollment
                                    )
                                  }
                                  disabled={
                                    accessLoading
                                  }
                                >
                                  <Calendar size={14} />
                                  Extend
                                </button>

                                <button
                                  className="revoke-access"
                                  onClick={() =>
                                    revokeAccess(
                                      enrollment,
                                      course
                                    )
                                  }
                                  disabled={
                                    accessLoading
                                  }
                                >
                                  <Minus size={14} />
                                  Revoke
                                </button>
                              </>
                            )}

                          {hasAccess && expired && (
                            <button
                              className="renew-access"
                              onClick={() =>
                                openDuration(course)
                              }
                            >
                              <RefreshCw size={14} />
                              Renew
                            </button>
                          )}

                          {!hasAccess && (
                            <button
                              className="grant-access"
                              onClick={() =>
                                openDuration(course)
                              }
                            >
                              <Plus size={15} />
                              Grant Access
                            </button>
                          )}

                        </div>

                      </div>
                    );
                  })}

                </div>
              )}

            </section>
          )}

          </div>

          <div className="modal-actions">

            <button
              className="secondary-button"
              onClick={closeModal}
            >
              Close
            </button>

            {!selectedUser.isActive && (
              <button
                className="invite-button"
                onClick={() =>
                  resendInvitation(selectedUser)
                }
                disabled={resending}
              >
                <Send size={17} />
                {resending
                  ? "Sending..."
                  : "Resend Invitation"}
              </button>
            )}

            <button
              className="primary-button"
              onClick={() => openEdit(selectedUser)}
            >
              <Edit size={17} />
              Edit User
            </button>

          </div>

        </Modal>
      )}

      {/* =====================================================
          DURATION MODAL
      ====================================================== */}

      {modal === "duration" && selectedCourse && (
        <Modal
          className="duration-modal"
          onClose={() => setModal("view")}
        >

          <div className="modal-heading">

            <div>
              <span className="modal-kicker">
                COURSE ACCESS
              </span>

              <h2>Set Access Duration</h2>
            </div>

            <button
              className="modal-close"
              onClick={() => setModal("view")}
            >
              <X size={20} />
            </button>

          </div>

          <div className="duration-course">

            <div className="duration-course-icon">
              <BookOpen size={20} />
            </div>

            <div>
              <strong>
                {selectedCourse.title}
              </strong>

              <span>
                Access for {selectedUser.name}
              </span>
            </div>

          </div>

          <div className="duration-control">

            <label>Duration</label>

            <div className="duration-input">

              <input
                type="number"
                min="0"
                value={duration}
                onChange={(e) =>
                  setDuration(
                    Math.max(
                      0,
                      Number(e.target.value)
                    )
                  )
                }
              />

              <span>days</span>

            </div>

            <p>
              Set 0 for unlimited access.
            </p>

          </div>

          <div className="duration-options">

            {[7, 30, 90, 180].map((days) => (
              <button
                key={days}
                className={
                  duration === days
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  setDuration(days)
                }
              >
                {days} days
              </button>
            ))}

            <button
              className={
                duration === 0
                  ? "selected unlimited"
                  : "unlimited"
              }
              onClick={() => setDuration(0)}
            >
              <Infinity size={16} />
              Unlimited
            </button>

          </div>

          <div className="modal-actions">

            <button
              className="secondary-button"
              onClick={() => setModal("view")}
            >
              Cancel
            </button>

            <button
              className="primary-button"
              onClick={grantAccess}
              disabled={accessLoading}
            >
              <CheckCircle size={17} />

              {accessLoading
                ? "Saving..."
                : "Grant Access"}
            </button>

          </div>

        </Modal>
      )}

    </div>
  );
}

// =========================================================
// COMPONENTS
// =========================================================

function Stat({
  title,
  value,
  icon,
  color,
}) {
  return (
    <div className="user-stat">

      <div
        className="user-stat-icon"
        style={{
          background: color,
        }}
      >
        {icon}
      </div>

      <div>
        <strong>{value}</strong>
        <span>{title}</span>
      </div>

    </div>
  );
}

function UserCard({
  user,
  roleConfig,
  initials,
  formatDate,
  onView,
  onEdit,
  onDelete,
  onResend,
}) {
  const pending = user.isActive === false;

  return (
    <article className="user-card">

      <div className="card-top">

        <div
          className="user-avatar"
          style={{
            background: roleConfig.color,
          }}
        >
          {user.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.name}
            />
          ) : (
            initials(user.name)
          )}

          <span
            className={`user-status-dot ${
              pending ? "pending" : ""
            }`}
          />
        </div>

      </div>

      <div className="card-user-info">

        <h3>{user.name || "Unknown User"}</h3>

        <p className="card-email">
          <Mail size={13} />
          {user.email || "—"}
        </p>

        <div className="card-badges">

          <span
            className="role-badge"
            style={{
              color: roleConfig.color,
              background:
                roleConfig.background,
            }}
          >
            {roleConfig.shortLabel}
          </span>

          <span
            className={`status-badge ${
              pending ? "pending" : "active"
            }`}
          >
            {pending ? "Pending" : "Active"}
          </span>

        </div>

        <div className="card-date">
          <Calendar size={13} />
          Joined {formatDate(user.createdAt)}
        </div>

      </div>

      <div className="card-footer">

        <button
          className="card-view"
          onClick={() => onView(user)}
        >
          <Eye size={15} />
          View
        </button>

        <button
          className="card-edit"
          onClick={() => onEdit(user)}
        >
          <Edit size={15} />
          Edit
        </button>

        {pending && (
          <button
            className="card-resend"
            onClick={() => onResend(user)}
          >
            <Send size={15} />
          </button>
        )}

        <button
          className="card-delete"
          onClick={() => onDelete(user)}
        >
          <Trash2 size={15} />
        </button>

      </div>

    </article>
  );
}

function Detail({
  icon,
  label,
  value,
}) {
  return (
    <div className="detail-item">

      <div className="detail-icon">
        {icon}
      </div>

      <div>
        <span>{label}</span>
        <strong>{value || "—"}</strong>
      </div>

    </div>
  );
}

function Modal({
  children,
  onClose,
  className = "",
}) {
  // Lock the page behind the modal while it's open, and pad the body by the
  // scrollbar width so the content behind doesn't shift when the scrollbar
  // disappears. Restored on unmount / close via the cleanup fn.
  useEffect(() => {
    const { body, documentElement } = document;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
    };
  }, []);

  return createPortal(
    <div
      className="users-modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className={`users-modal ${className}`}
        onMouseDown={(e) =>
          e.stopPropagation()
        }
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
export default AdminUsers;