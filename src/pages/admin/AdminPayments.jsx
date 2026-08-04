// src/pages/admin/AdminPayments.jsx
import { useEffect, useState } from "react";
import {
  CreditCard,
  Search,
  Eye,
  Download,
  Mail,
  RefreshCw,
  X,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../../services/api";
import "./AdminPayments.css";

function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [apiError, setApiError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });

  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    refunded: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setApiError("");
      
      // Fetch users and courses
      const [usersRes, coursesRes] = await Promise.all([
        api.get("/users").catch(() => ({ data: { data: [] } })),
        api.get("/courses").catch(() => ({ data: { data: [] } })),
      ]);

      const usersData = usersRes.data?.data || usersRes.data || [];
      const coursesData = coursesRes.data?.data || coursesRes.data || [];
      
      setUsers(usersData);
      setCourses(coursesData);

      // Fetch payments using admin endpoint
      let paymentsData = [];
      
      try {
        console.log("🔍 Fetching payments from /payments/admin/all");
        const res = await api.get("/payments/admin/all");
        paymentsData = res.data?.data || res.data || [];
        console.log(`✅ Found ${paymentsData.length} payments`);
      } catch (err) {
        console.log("❌ /payments/admin/all failed");
        setApiError("Could not fetch payments. Please check your backend.");
        paymentsData = [];
      }

      setPayments(paymentsData);
      calculateStats(paymentsData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setApiError("Failed to load data. Please refresh.");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const completed = data.filter(p => p.status === "COMPLETED" || p.status === "PAID").length;
    const pending = data.filter(p => p.status === "PENDING").length;
    const failed = data.filter(p => p.status === "FAILED").length;
    const refunded = data.filter(p => p.status === "REFUNDED").length;
    const totalRevenue = data
      .filter(p => p.status === "COMPLETED" || p.status === "PAID")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    setStats({
      total: data.length,
      completed,
      pending,
      failed,
      refunded,
      totalRevenue,
    });
  };

  // Send payment receipt
  const sendReceipt = async (paymentId) => {
    try {
      await api.post(`/payments/admin/${paymentId}/send-receipt`);
      alert("Receipt sent successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send receipt");
    }
  };

  // Download invoice
  const downloadInvoice = async (paymentId) => {
    try {
      const res = await api.get(`/payments/admin/${paymentId}/invoice`);
      const data = res.data?.data || res.data;
      
      alert(`Invoice data for payment #${paymentId}:\n\n` + 
        `Order ID: ${data.orderId}\n` +
        `Amount: ₹${data.amount}\n` +
        `Status: ${data.status}\n` +
        `Student: ${data.studentName}\n` +
        `Course: ${data.courseTitle}\n` +
        `Date: ${new Date(data.date).toLocaleDateString()}`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to download invoice");
    }
  };

  // Open detail modal
  const openDetailModal = (payment) => {
    setSelectedPayment(payment);
    setShowDetailModal(true);
  };

  // Get user name by ID
  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : "Unknown User";
  };

  // Get user email by ID
  const getUserEmail = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.email : "";
  };

  // Get course title by ID
  const getCourseTitle = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.title : "Unknown Course";
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format time
  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const classes = {
      COMPLETED: "status-completed",
      PAID: "status-completed",
      PENDING: "status-pending",
      FAILED: "status-failed",
      REFUNDED: "status-refunded",
      CANCELLED: "status-cancelled",
    };
    return classes[status] || "status-pending";
  };

  const getStatusLabel = (status) => {
    const labels = {
      COMPLETED: "Completed",
      PAID: "Paid",
      PENDING: "Pending",
      FAILED: "Failed",
      REFUNDED: "Refunded",
      CANCELLED: "Cancelled",
    };
    return labels[status] || status;
  };

  // Get payment method label
  const getMethodLabel = (method) => {
    const methods = {
      CARD: "Card",
      UPI: "UPI",
      NETBANKING: "Net Banking",
      WALLET: "Wallet",
      COD: "Cash on Delivery",
      RAZORPAY: "Razorpay",
      STRIPE: "Stripe",
      PAYPAL: "PayPal",
    };
    return methods[method] || method || "N/A";
  };

  // Pagination
  const goToPage = (page) => setCurrentPage(page);
  const goToPreviousPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

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

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = 
      payment.orderId?.toLowerCase().includes(search.toLowerCase()) ||
      getUserName(payment.studentId).toLowerCase().includes(search.toLowerCase()) ||
      getCourseTitle(payment.courseId).toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesType = typeFilter === "all" || payment.method === typeFilter;
    
    const matchesDate = 
      (!dateRange.start || new Date(payment.createdAt) >= new Date(dateRange.start)) &&
      (!dateRange.end || new Date(payment.createdAt) <= new Date(dateRange.end));
    
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  // Paginate filtered data
  const paginatedData = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    const total = filteredPayments.length;
    setTotalPages(Math.ceil(total / itemsPerPage) || 1);
    if (currentPage > Math.ceil(total / itemsPerPage)) {
      setCurrentPage(1);
    }
  }, [filteredPayments.length, currentPage, itemsPerPage]);

  if (loading) {
    return (
      <div className="payments-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payments-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Payment Management</h1>
          <p className="subtitle">View and track all financial transactions</p>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={fetchAllData}>
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <p>{apiError}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="payment-stats">
        <div className="stat-card">
          <DollarSign size={24} />
          <div>
            <h3>{formatCurrency(stats.totalRevenue)}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
        <div className="stat-card">
          <CheckCircle size={24} />
          <div>
            <h3>{stats.completed}</h3>
            <p>Completed</p>
          </div>
        </div>
        <div className="stat-card">
          <Clock size={24} />
          <div>
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>
        </div>
        <div className="stat-card">
          <XCircle size={24} />
          <div>
            <h3>{stats.failed}</h3>
            <p>Failed</p>
          </div>
        </div>
        <div className="stat-card">
          <TrendingUp size={24} />
          <div>
            <h3>{stats.total}</h3>
            <p>Total Transactions</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Search by order ID, user, or course..."
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
          <option value="COMPLETED">Completed</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Methods</option>
          <option value="CARD">Card</option>
          <option value="UPI">UPI</option>
          <option value="NETBANKING">Net Banking</option>
          <option value="WALLET">Wallet</option>
          <option value="RAZORPAY">Razorpay</option>
          <option value="STRIPE">Stripe</option>
          <option value="PAYPAL">PayPal</option>
        </select>

        <div className="date-range">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            placeholder="Start"
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            placeholder="End"
          />
        </div>

        <button className="refresh-btn" onClick={fetchAllData}>
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Payments Table */}
      <div className="table-wrapper">
        <table className="payment-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Student</th>
              <th>Course</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Method</th>
              <th>Status</th>
              <th style={{ width: "120px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                  <div className="empty-state">
                    <CreditCard size={48} />
                    <h3>No payments found</h3>
                    <p>
                      {apiError 
                        ? apiError
                        : "Payments will appear here once students make purchases"}
                    </p>
                    <button 
                      onClick={fetchAllData}
                      className="retry-btn"
                    >
                      <RefreshCw size={16} />
                      Retry
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <span className="transaction-id">
                      {payment.orderId || `PAY-${String(payment.id).padStart(6, '0')}`}
                    </span>
                  </td>
                  <td>
                    <div className="user-info">
                      <span className="user-name">{getUserName(payment.studentId)}</span>
                      <span className="user-email">{getUserEmail(payment.studentId)}</span>
                    </div>
                  </td>
                  <td>
                    <span className="course-title">{getCourseTitle(payment.courseId)}</span>
                  </td>
                  <td>
                    <span className="amount-text">{formatCurrency(payment.amount)}</span>
                  </td>
                  <td>
                    <div className="date-info">
                      <span>{formatDate(payment.createdAt)}</span>
                      <span className="time-text">{formatTime(payment.createdAt)}</span>
                    </div>
                  </td>
                  <td>
                    <span className="method-badge">
                      {getMethodLabel(payment.method)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadge(payment.status)}`}>
                      {getStatusLabel(payment.status)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        title="View Details"
                        className="view-btn"
                        onClick={() => openDetailModal(payment)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        title="Send Receipt"
                        className="mail-btn"
                        onClick={() => sendReceipt(payment.id)}
                      >
                        <Mail size={16} />
                      </button>
                      <button
                        title="Download Invoice"
                        className="download-btn"
                        onClick={() => downloadInvoice(payment.id)}
                      >
                        <Download size={16} />
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

        {/* Table Footer */}
        {filteredPayments.length > 0 && (
          <div className="table-footer">
            <span className="total-count">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredPayments.length)} of {filteredPayments.length} payments
            </span>
          </div>
        )}
      </div>

      {/* Payment Detail Modal */}
      {showDetailModal && selectedPayment && (
        <div className="modal detail-modal" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content detail-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Payment Details</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="detail-body">
              <div className="detail-summary">
                <div className="summary-amount">
                  <span className="amount-label">Total Amount</span>
                  <span className="amount-value">{formatCurrency(selectedPayment.amount)}</span>
                </div>
                <div className="summary-status">
                  <span className={`status-badge ${getStatusBadge(selectedPayment.status)}`}>
                    {getStatusLabel(selectedPayment.status)}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Transaction Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Order ID</label>
                    <p>{selectedPayment.orderId || `PAY-${String(selectedPayment.id).padStart(6, '0')}`}</p>
                  </div>
                  <div className="detail-item">
                    <label>Payment Method</label>
                    <p>{getMethodLabel(selectedPayment.method)}</p>
                  </div>
                  <div className="detail-item">
                    <label>Payment Date</label>
                    <p>{formatDate(selectedPayment.createdAt)}</p>
                  </div>
                  <div className="detail-item">
                    <label>Payment Time</label>
                    <p>{formatTime(selectedPayment.createdAt)}</p>
                  </div>
                  <div className="detail-item">
                    <label>Currency</label>
                    <p>{selectedPayment.currency || "INR"}</p>
                  </div>
                  {selectedPayment.paymentId && (
                    <div className="detail-item">
                      <label>Payment ID</label>
                      <p>{selectedPayment.paymentId}</p>
                    </div>
                  )}
                  {selectedPayment.signature && (
                    <div className="detail-item">
                      <label>Signature</label>
                      <p>{selectedPayment.signature}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3>User & Course Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Student</label>
                    <p>{getUserName(selectedPayment.studentId)}</p>
                  </div>
                  <div className="detail-item">
                    <label>Email</label>
                    <p>{getUserEmail(selectedPayment.studentId)}</p>
                  </div>
                  <div className="detail-item">
                    <label>Course</label>
                    <p>{getCourseTitle(selectedPayment.courseId)}</p>
                  </div>
                </div>
              </div>

              <div className="detail-actions">
                <button
                  className="btn-save"
                  onClick={() => sendReceipt(selectedPayment.id)}
                >
                  <Mail size={18} />
                  Send Receipt
                </button>
                <button
                  className="btn-save"
                  onClick={() => downloadInvoice(selectedPayment.id)}
                  style={{ background: '#667eea' }}
                >
                  <Download size={18} />
                  Download Invoice
                </button>
                <button
                  className="btn-cancel"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPayments;