// src/pages/admin/AdminNotifications.jsx
import { useEffect, useState } from "react";
import {
  Bell,
  Plus,
  Search,
  Trash2,
  Eye,
  X,
  RefreshCw,
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Send,
  Info,
  AlertTriangle,
  AlertOctagon,
  Megaphone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../../services/api";
import "./AdminNotifications.css";

function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingNotification, setViewingNotification] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "INFO",
    studentId: "",
  });

  const [stats, setStats] = useState({
    total: 0,
    read: 0,
    unread: 0,
  });

  const notificationTypes = [
    { value: "INFO", label: "Information", icon: Info, color: "#3b82f6" },
    { value: "SUCCESS", label: "Success", icon: CheckCircle, color: "#10b981" },
    { value: "WARNING", label: "Warning", icon: AlertTriangle, color: "#f59e0b" },
    { value: "ERROR", label: "Error", icon: AlertOctagon, color: "#ef4444" },
    { value: "PROMOTION", label: "Promotion", icon: Megaphone, color: "#8b5cf6" },
    { value: "REMINDER", label: "Reminder", icon: CheckCircle, color: "#a0186a" },
    { value: "CERTIFICATE", label: "Certificate", icon: CheckCircle, color: "#43b910" },
  ];

  useEffect(() => {
    fetchAllData();
  }, [search, typeFilter, statusFilter, currentPage]);

  // ==========================================
  // FETCH ALL DATA - Uses Admin Endpoint
  // ==========================================
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setApiError(null);

      // 1. Get all users (for recipient dropdown)
      const usersRes = await api.get("/users");
      let allUsers = [];
      if (usersRes.data?.data) {
        allUsers = usersRes.data.data;
      } else if (Array.isArray(usersRes.data)) {
        allUsers = usersRes.data;
      }
      setUsers(allUsers || []);
      console.log("👥 Users loaded:", allUsers.length);

      // 2. Get all notifications from admin endpoint
      try {
        const res = await api.get("/notifications/admin");
        console.log("📥 Admin API Response:", res);

        let data = [];
        if (res.data?.data) {
          data = res.data.data;
        } else if (Array.isArray(res.data)) {
          data = res.data;
        }

        console.log(`📥 Notifications loaded: ${data.length}`);
        
        // Ensure each notification has all required fields
        const enhanced = data.map((n) => ({
          id: n.id || Date.now(),
          title: n.title || "Untitled",
          message: n.message || "",
          type: n.type || "INFO",
          isRead: n.isRead || n.read || false,
          studentId: n.studentId || n.userId || n.student_id,
          studentName: n.studentName || n.user?.name || "Unknown User",
          studentEmail: n.studentEmail || n.user?.email || "",
          createdAt: n.createdAt || n.created_at || new Date().toISOString(),
          updatedAt: n.updatedAt || n.updated_at || null,
        }));

        // Apply filters
        let filtered = enhanced;
        
        // Search filter
        if (search) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter(n =>
            n.title?.toLowerCase().includes(searchLower) ||
            n.message?.toLowerCase().includes(searchLower) ||
            n.studentName?.toLowerCase().includes(searchLower)
          );
        }

        // Type filter
        if (typeFilter !== "all") {
          filtered = filtered.filter(n => n.type === typeFilter);
        }

        // Status filter
        if (statusFilter !== "all") {
          filtered = filtered.filter(n =>
            statusFilter === "read" ? n.isRead === true : n.isRead === false
          );
        }

        // Calculate total pages
        const total = filtered.length;
        const totalPagesCalc = Math.ceil(total / itemsPerPage);
        setTotalPages(totalPagesCalc || 1);

        // Get current page data
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedData = filtered.slice(startIndex, endIndex);

        setNotifications(paginatedData);
        calculateStats(enhanced);
      } catch (err) {
        console.error("❌ Admin endpoint failed:", err);
        setApiError("Admin endpoint not available. Please check backend configuration.");
        
        // Fallback: Try regular endpoint
        try {
          const res = await api.get("/notifications");
          let data = res.data?.data || res.data || [];
          const enhanced = data.map((n) => ({
            ...n,
            studentName: "You (Admin)",
            studentEmail: "",
          }));
          
          // Apply filters and pagination
          let filtered = enhanced;
          if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(n =>
              n.title?.toLowerCase().includes(searchLower) ||
              n.message?.toLowerCase().includes(searchLower)
            );
          }
          if (typeFilter !== "all") {
            filtered = filtered.filter(n => n.type === typeFilter);
          }
          if (statusFilter !== "all") {
            filtered = filtered.filter(n =>
              statusFilter === "read" ? n.isRead === true : n.isRead === false
            );
          }

          const total = filtered.length;
          const totalPagesCalc = Math.ceil(total / itemsPerPage);
          setTotalPages(totalPagesCalc || 1);

          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginatedData = filtered.slice(startIndex, endIndex);

          setNotifications(paginatedData);
          calculateStats(enhanced);
        } catch (fallbackErr) {
          console.error("❌ Fallback also failed:", fallbackErr);
          setNotifications([]);
          calculateStats([]);
        }
      }
    } catch (err) {
      console.error("❌ Error fetching data:", err);
      setApiError("Failed to load notifications");
      setNotifications([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CALCULATE STATS
  // ==========================================
  const calculateStats = (data) => {
    const total = data.length;
    const read = data.filter((n) => n.isRead === true).length;
    const unread = data.filter((n) => n.isRead === false).length;
    setStats({ total, read, unread });
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

  // ==========================================
  // SEND NOTIFICATION
  // ==========================================
  const handleSendNotification = async () => {
    try {
      const errors = {};
      if (!form.title || form.title.trim() === "") {
        errors.title = "Title is required";
      }
      if (!form.message || form.message.trim() === "") {
        errors.message = "Message is required";
      }
      if (!form.studentId) {
        errors.studentId = "Recipient is required";
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      setIsSubmitting(true);

      const data = {
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        studentId: parseInt(form.studentId),
      };

      console.log("📤 Sending notification:", data);

      await api.post("/notifications", data);

      setShowModal(false);
      resetForm();
      setIsSubmitting(false);

      await fetchAllData();
      alert("Notification sent successfully!");
    } catch (err) {
      setIsSubmitting(false);
      console.error("❌ Error sending notification:", err);
      alert(err.response?.data?.message || "Failed to send notification");
    }
  };

  // ==========================================
  // DELETE NOTIFICATION
  // ==========================================
  const handleDeleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      await fetchAllData();
      setShowDeleteConfirm(null);
      setShowViewModal(false);
      alert("Notification deleted successfully!");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete notification. Please try again.");
    }
  };

  // ==========================================
  // TOGGLE READ STATUS
  // ==========================================
  const handleToggleRead = async (id, isRead) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: !isRead } : n))
      );

      await api.put(`/notifications/${id}/read`);
      await fetchAllData();
    } catch (err) {
      console.error("Toggle read error:", err);
      await fetchAllData();
    }
  };

  // ==========================================
  // FORM HELPERS
  // ==========================================
  const resetForm = () => {
    setForm({
      title: "",
      message: "",
      type: "INFO",
      studentId: "",
    });
    setFormErrors({});
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openViewModal = (notification) => {
    setViewingNotification(notification);
    setShowViewModal(true);
  };

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================
  const getStudentName = (studentId) => {
    if (!studentId) return "Unknown User";
    const user = users.find((u) => u.id === studentId);
    return user ? user.name : "Unknown User";
  };

  const getStudentEmail = (studentId) => {
    if (!studentId) return "";
    const user = users.find((u) => u.id === studentId);
    return user ? user.email : "";
  };

  const getTypeDetails = (type) => {
    const found = notificationTypes.find((t) => t.value === type);
    return found || notificationTypes[0];
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

  // ==========================================
  // FILTER NOTIFICATIONS
  // ==========================================
  const filteredNotifications = notifications.filter((notification) => {
    const studentName = notification.studentName || getStudentName(notification.studentId);
    const matchesSearch =
      notification.title?.toLowerCase().includes(search.toLowerCase()) ||
      notification.message?.toLowerCase().includes(search.toLowerCase()) ||
      studentName.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === "all" || notification.type === typeFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "read" && notification.isRead === true) ||
      (statusFilter === "unread" && notification.isRead === false);

    return matchesSearch && matchesType && matchesStatus;
  });

  // ==========================================
  // LOADING STATE
  // ==========================================
  if (loading) {
    return (
      <div className="notifications-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="notifications-page">
      {/* ===== HEADER ===== */}
      <div className="page-header">
        <div>
          <h1>Notification Management</h1>
          <p className="subtitle">Send notifications and track read status</p>
          {apiError && (
            <p
              style={{
                color: "#ef4444",
                fontSize: "0.875rem",
                marginTop: "4px",
              }}
            >
              ⚠️ {apiError}
            </p>
          )}
        </div>
        <button className="add-btn" onClick={openCreateModal}>
          <Plus size={18} />
          Send Notification
        </button>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="notification-stats">
        <div className="stat-card">
          <Bell size={24} />
          <div>
            <h3>{stats.total}</h3>
            <p>Total Notifications</p>
          </div>
        </div>
        <div className="stat-card unread">
          <Clock size={24} />
          <div>
            <h3>{stats.unread}</h3>
            <p>Unread</p>
          </div>
        </div>
        <div className="stat-card read">
          <CheckCircle size={24} />
          <div>
            <h3>{stats.read}</h3>
            <p>Read</p>
          </div>
        </div>
      </div>

      {/* ===== TOOLBAR ===== */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          {notificationTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>

        <button className="refresh-btn" onClick={fetchAllData}>
          <RefreshCw size={18} />
        </button>
      </div>

      {/* ===== TABLE ===== */}
      <div className="table-wrapper">
        <table className="notification-table">
          <thead>
            <tr>
              <th style={{ width: "18%" }}>Title</th>
              <th style={{ width: "22%" }}>Message</th>
              <th style={{ width: "15%" }}>Recipient</th>
              <th style={{ width: "10%" }}>Type</th>
              <th style={{ width: "10%" }}>Status</th>
              <th style={{ width: "15%" }}>Sent</th>
              <th style={{ width: "60px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredNotifications.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "40px" }}>
                  <div className="empty-state">
                    <Bell size={48} />
                    <h3>No notifications found</h3>
                    <p>
                      {apiError
                        ? "Contact your administrator: The notification API needs to be configured."
                        : "Send your first notification to get started"}
                    </p>
                    <button className="add-btn" onClick={openCreateModal}>
                      <Plus size={18} />
                      Send Notification
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredNotifications.map((notification) => {
                const typeDetails = getTypeDetails(notification.type);
                const TypeIcon = typeDetails.icon;
                const studentName =
                  notification.studentName || getStudentName(notification.studentId);

                return (
                  <tr key={notification.id}>
                    <td>
                      <span className="notification-title">{notification.title}</span>
                    </td>
                    <td>
                      <span className="notification-message">
                        {notification.message?.length > 40
                          ? notification.message.substring(0, 40) + "..."
                          : notification.message}
                      </span>
                    </td>
                    <td>
                      <div className="user-info">
                        <span className="user-name">{studentName}</span>
                        <span className="user-email">
                          {notification.studentEmail ||
                            getStudentEmail(notification.studentId)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className="type-badge"
                        style={{
                          backgroundColor: typeDetails.color + "20",
                          color: typeDetails.color,
                        }}
                      >
                        <TypeIcon size={12} />
                        {notification.type}
                      </span>
                    </td>
                    <td>
                      {notification.isRead === true ? (
                        <span className="status-badge read">
                          <CheckCircle size={14} />
                          Read
                        </span>
                      ) : (
                        <span className="status-badge unread">
                          <Clock size={14} />
                          Unread
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="sent-date">
                        <Calendar size={14} />
                        {formatDate(notification.createdAt)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          title="View"
                          className="view-btn"
                          onClick={() => openViewModal(notification)}
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* ===== PAGINATION ===== */}
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

        {/* ===== TABLE FOOTER ===== */}
        {filteredNotifications.length > 0 && (
          <div className="table-footer">
            <span className="total-count">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, stats.total)} of {stats.total} notifications
            </span>
          </div>
        )}
      </div>

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {showDeleteConfirm && (
        <div
          className="modal confirm-modal"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="modal-content confirm-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button
                className="modal-close"
                onClick={() => setShowDeleteConfirm(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="confirm-body">
              <AlertCircle size={48} className="confirm-icon" />
              <p>Are you sure you want to delete this notification?</p>
              <p className="confirm-sub">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={() => handleDeleteNotification(showDeleteConfirm)}
              >
                <Trash2 size={18} />
                Delete Notification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SEND NOTIFICATION MODAL ===== */}
      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Send Notification</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  placeholder="Enter notification title"
                  value={form.title}
                  onChange={(e) => {
                    setForm({ ...form, title: e.target.value });
                    setFormErrors({ ...formErrors, title: "" });
                  }}
                  className={formErrors.title ? "error" : ""}
                />
                {formErrors.title && (
                  <span className="error-text">{formErrors.title}</span>
                )}
              </div>

              <div className="form-group">
                <label>Message *</label>
                <textarea
                  placeholder="Enter notification message"
                  rows={4}
                  value={form.message}
                  onChange={(e) => {
                    setForm({ ...form, message: e.target.value });
                    setFormErrors({ ...formErrors, message: "" });
                  }}
                  className={formErrors.message ? "error" : ""}
                />
                {formErrors.message && (
                  <span className="error-text">{formErrors.message}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    {notificationTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Recipient *</label>
                  <select
                    value={form.studentId}
                    onChange={(e) => {
                      setForm({ ...form, studentId: e.target.value });
                      setFormErrors({ ...formErrors, studentId: "" });
                    }}
                    className={formErrors.studentId ? "error" : ""}
                  >
                    <option value="">Select Recipient</option>
                    {users
                      .filter((u) => u.role === "STUDENT" || u.role === "MENTOR")
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                  </select>
                  {formErrors.studentId && (
                    <span className="error-text">{formErrors.studentId}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleSendNotification}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner-small"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Notification
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== VIEW NOTIFICATION MODAL ===== */}
      {showViewModal && viewingNotification && (
        <div className="modal view-modal" onClick={() => setShowViewModal(false)}>
          <div
            className="modal-content view-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Notification Details</h2>
              <button
                className="modal-close"
                onClick={() => setShowViewModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="view-body">
              <div className="view-info">
                <div className="view-header">
                  <h3>{viewingNotification.title}</h3>
                  <span
                    className="type-badge"
                    style={{
                      backgroundColor:
                        getTypeDetails(viewingNotification.type).color + "20",
                      color: getTypeDetails(viewingNotification.type).color,
                    }}
                  >
                    {viewingNotification.type}
                  </span>
                  {viewingNotification.isRead === true ? (
                    <span className="status-badge read">Read</span>
                  ) : (
                    <span className="status-badge unread">Unread</span>
                  )}
                </div>

                <div className="view-section">
                  <h4>Message</h4>
                  <p>{viewingNotification.message}</p>
                </div>

                <div className="view-details-grid">
                  <div className="view-detail-item">
                    <label>Recipient</label>
                    <span>
                      {viewingNotification.studentName ||
                        getStudentName(viewingNotification.studentId)}
                    </span>
                  </div>
                  <div className="view-detail-item">
                    <label>Email</label>
                    <span>
                      {viewingNotification.studentEmail ||
                        getStudentEmail(viewingNotification.studentId)}
                    </span>
                  </div>
                  <div className="view-detail-item">
                    <label>Type</label>
                    <span>{viewingNotification.type}</span>
                  </div>
                  <div className="view-detail-item">
                    <label>Status</label>
                    <span>
                      {viewingNotification.isRead === true ? "Read" : "Unread"}
                    </span>
                  </div>
                  <div className="view-detail-item">
                    <label>Sent</label>
                    <span>{formatDate(viewingNotification.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-toggle"
                onClick={() => {
                  handleToggleRead(viewingNotification.id, viewingNotification.isRead);
                  setShowViewModal(false);
                }}
              >
                {viewingNotification.isRead === true ? "Mark Unread" : "Mark Read"}
              </button>
              <button
                className="btn-danger"
                onClick={() => {
                  setShowViewModal(false);
                  setShowDeleteConfirm(viewingNotification.id);
                }}
              >
                <Trash2 size={18} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminNotifications;