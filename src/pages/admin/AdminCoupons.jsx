// src/pages/admin/AdminCoupons.jsx
import { useEffect, useState } from "react";
import {
  Tag,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Filter,
  RefreshCw,
  X,
  Percent,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  BookOpen,
  Copy,
  Send,
  AlertCircle,
  TrendingUp,
  Gift,
  Sparkles,
  Zap,
} from "lucide-react";
import api from "../../services/api";
import "./AdminCoupons.css";

function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [showUsageModal, setShowUsageModal] = useState(false);

  // Form state
  const [couponForm, setCouponForm] = useState({
    code: "",
    description: "",
    type: "PERCENTAGE",
    value: "",
    minOrderAmount: "",
    maxDiscountAmount: "",
    courseId: "",
    usageLimit: "",
    perUserLimit: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    isActive: true,
    isUnlimited: false,
  });

  const couponTypes = [
    { value: "PERCENTAGE", label: "Percentage Discount", icon: Percent },
    { value: "FIXED", label: "Fixed Amount", icon: DollarSign },
    { value: "FREE_COURSE", label: "Free Course", icon: Gift },
  ];

  const statuses = [
    { value: "active", label: "Active", color: "#10b981" },
    { value: "expired", label: "Expired", color: "#ef4444" },
    { value: "upcoming", label: "Upcoming", color: "#3b82f6" },
    { value: "exhausted", label: "Exhausted", color: "#f59e0b" },
  ];

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    upcoming: 0,
    totalUsed: 0,
    totalDiscount: 0,
  });

  useEffect(() => {
    fetchCoupons();
    fetchCourses();
  }, []);

  // Fetch all coupons
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await api.get("/coupons");
      const data = res.data.data || res.data;
      setCoupons(data);
      calculateStats(data);
    } catch (err) {
      console.error("Error fetching coupons:", err);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch courses
  const fetchCourses = async () => {
    try {
      const res = await api.get("/courses");
      setCourses(res.data.data || res.data);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setCourses([]);
    }
  };

  // Calculate statistics
  const calculateStats = (data) => {
    const now = new Date();
    const total = data.length;
    const active = data.filter(c => {
      const start = new Date(c.startDate);
      const end = c.endDate ? new Date(c.endDate) : null;
      return c.isActive && start <= now && (!end || end >= now) && (!c.usageLimit || c.usedCount < c.usageLimit);
    }).length;
    const expired = data.filter(c => {
      const end = c.endDate ? new Date(c.endDate) : null;
      return end && end < now;
    }).length;
    const upcoming = data.filter(c => {
      const start = new Date(c.startDate);
      return c.isActive && start > now;
    }).length;
    const totalUsed = data.reduce((sum, c) => sum + (c.usedCount || 0), 0);
    const totalDiscount = data.reduce((sum, c) => sum + (c.totalDiscount || 0), 0);

    setStats({ total, active, expired, upcoming, totalUsed, totalDiscount });
  };

  // Generate coupon code
  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Create coupon
  const handleCreateCoupon = async () => {
    try {
      const errors = {};
      if (!couponForm.code) errors.code = "Coupon code is required";
      if (!couponForm.type) errors.type = "Type is required";
      if (!couponForm.value || couponForm.value <= 0) {
        errors.value = "Valid value is required";
      }
      if (!couponForm.startDate) errors.startDate = "Start date is required";

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      const data = {
        ...couponForm,
        value: Number(couponForm.value),
        minOrderAmount: couponForm.minOrderAmount ? Number(couponForm.minOrderAmount) : null,
        maxDiscountAmount: couponForm.maxDiscountAmount ? Number(couponForm.maxDiscountAmount) : null,
        usageLimit: couponForm.isUnlimited ? null : (couponForm.usageLimit ? Number(couponForm.usageLimit) : null),
        perUserLimit: Number(couponForm.perUserLimit) || 1,
        courseId: couponForm.courseId ? Number(couponForm.courseId) : null,
      };

      if (editing) {
        await api.put(`/coupons/${editing.id}`, data);
      } else {
        await api.post("/coupons", data);
      }

      setShowModal(false);
      setEditing(null);
      resetForm();
      fetchCoupons();
      setFormErrors({});
      alert(editing ? "Coupon updated successfully!" : "Coupon created successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save coupon");
      console.error("Save error:", err);
    }
  };

  // Delete coupon
  const deleteCoupon = async (id) => {
    if (!window.confirm("Delete this coupon? This action cannot be undone.")) return;

    try {
      await api.delete(`/coupons/${id}`);
      fetchCoupons();
      alert("Coupon deleted successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete coupon");
    }
  };

  // Toggle coupon status
  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/coupons/${id}`, { isActive: !currentStatus });
      fetchCoupons();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update coupon");
    }
  };

  // Copy coupon code
  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert("Coupon code copied to clipboard!");
  };

  // Reset form
  const resetForm = () => {
    setCouponForm({
      code: "",
      description: "",
      type: "PERCENTAGE",
      value: "",
      minOrderAmount: "",
      maxDiscountAmount: "",
      courseId: "",
      usageLimit: "",
      perUserLimit: 1,
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      isActive: true,
      isUnlimited: false,
    });
  };

  // Open create modal
  const openCreateModal = () => {
    setEditing(null);
    resetForm();
    setCouponForm(prev => ({
      ...prev,
      code: generateCouponCode(),
    }));
    setShowModal(true);
    setFormErrors({});
  };

  // Open edit modal
  const openEditModal = (coupon) => {
    setEditing(coupon);
    setCouponForm({
      code: coupon.code || "",
      description: coupon.description || "",
      type: coupon.type || "PERCENTAGE",
      value: coupon.value || "",
      minOrderAmount: coupon.minOrderAmount || "",
      maxDiscountAmount: coupon.maxDiscountAmount || "",
      courseId: coupon.courseId || "",
      usageLimit: coupon.usageLimit || "",
      perUserLimit: coupon.perUserLimit || 1,
      startDate: coupon.startDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      endDate: coupon.endDate?.split('T')[0] || "",
      isActive: coupon.isActive !== undefined ? coupon.isActive : true,
      isUnlimited: !coupon.usageLimit,
    });
    setShowModal(true);
    setFormErrors({});
  };

  // Open detail modal
  const openDetailModal = (coupon) => {
    setSelectedCoupon(coupon);
    setShowDetailModal(true);
  };

  // Get coupon status
  const getCouponStatus = (coupon) => {
    const now = new Date();
    const start = new Date(coupon.startDate);
    const end = coupon.endDate ? new Date(coupon.endDate) : null;
    
    if (!coupon.isActive) return "inactive";
    if (start > now) return "upcoming";
    if (end && end < now) return "expired";
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return "exhausted";
    return "active";
  };

  // Get status badge
  const getStatusBadge = (coupon) => {
    const status = getCouponStatus(coupon);
    const classes = {
      active: "status-active",
      upcoming: "status-upcoming",
      expired: "status-expired",
      exhausted: "status-exhausted",
      inactive: "status-inactive",
    };
    return classes[status] || "status-active";
  };

  // Get status label
  const getStatusLabel = (coupon) => {
    const status = getCouponStatus(coupon);
    const labels = {
      active: "Active",
      upcoming: "Upcoming",
      expired: "Expired",
      exhausted: "Exhausted",
      inactive: "Inactive",
    };
    return labels[status] || "Active";
  };

  // Get type label
  const getTypeLabel = (type) => {
    const found = couponTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  // Get type icon
  const getTypeIcon = (type) => {
    const found = couponTypes.find(t => t.value === type);
    return found ? found.icon : Tag;
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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

  // Get course title by ID
  const getCourseTitle = (courseId) => {
    if (!courseId) return "All Courses";
    const course = courses.find(c => c.id === courseId);
    return course ? course.title : "Unknown Course";
  };

  // Filter coupons
  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch = 
      coupon.code?.toLowerCase().includes(search.toLowerCase()) ||
      coupon.description?.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = typeFilter === "all" || coupon.type === typeFilter;
    const status = getCouponStatus(coupon);
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <div className="coupons-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="coupons-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Coupon Management</h1>
          <p className="subtitle">Create and manage promotional coupons and discounts</p>
        </div>
        <button className="add-btn" onClick={openCreateModal}>
          <Plus size={18} />
          New Coupon
        </button>
      </div>

      {/* Stats Cards */}
      <div className="coupon-stats">
        <div className="stat-card">
          <Tag size={24} />
          <div>
            <h3>{stats.total}</h3>
            <p>Total Coupons</p>
          </div>
        </div>
        <div className="stat-card success">
          <CheckCircle size={24} />
          <div>
            <h3>{stats.active}</h3>
            <p>Active</p>
          </div>
        </div>
        <div className="stat-card warning">
          <Clock size={24} />
          <div>
            <h3>{stats.upcoming}</h3>
            <p>Upcoming</p>
          </div>
        </div>
        <div className="stat-card danger">
          <XCircle size={24} />
          <div>
            <h3>{stats.expired}</h3>
            <p>Expired</p>
          </div>
        </div>
        <div className="stat-card info">
          <TrendingUp size={24} />
          <div>
            <h3>{stats.totalUsed}</h3>
            <p>Total Uses</p>
          </div>
        </div>
        <div className="stat-card purple">
          <DollarSign size={24} />
          <div>
            <h3>{formatCurrency(stats.totalDiscount)}</h3>
            <p>Total Discount</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Search coupons..."
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
          {couponTypes.map((type) => (
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
          <option value="active">Active</option>
          <option value="upcoming">Upcoming</option>
          <option value="expired">Expired</option>
          <option value="exhausted">Exhausted</option>
          <option value="inactive">Inactive</option>
        </select>

        <button className="refresh-btn" onClick={fetchCoupons}>
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Coupons Grid */}
      <div className="coupons-grid">
        {filteredCoupons.length === 0 ? (
          <div className="empty-state">
            <Tag size={48} />
            <h3>No coupons found</h3>
            <p>Create your first coupon to start offering discounts</p>
            <button className="add-btn" onClick={openCreateModal}>
              <Plus size={18} />
              Create Coupon
            </button>
          </div>
        ) : (
          filteredCoupons.map((coupon) => {
            const Icon = getTypeIcon(coupon.type);
            const status = getCouponStatus(coupon);
            const isExpiringSoon = status === "active" && coupon.endDate && 
              new Date(coupon.endDate) - new Date() < 7 * 24 * 60 * 60 * 1000;

            return (
              <div key={coupon.id} className="coupon-card">
                <div className="coupon-card-header">
                  <div className="coupon-code-wrapper">
                    <span className="coupon-code">{coupon.code}</span>
                    <button 
                      className="copy-btn"
                      onClick={() => copyCode(coupon.code)}
                      title="Copy code"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <span className={`status-badge ${getStatusBadge(coupon)}`}>
                    {getStatusLabel(coupon)}
                  </span>
                </div>

                <div className="coupon-card-body">
                  <div className="coupon-value">
                    {coupon.type === "PERCENTAGE" && (
                      <span className="value-display">{coupon.value}%</span>
                    )}
                    {coupon.type === "FIXED" && (
                      <span className="value-display">{formatCurrency(coupon.value)}</span>
                    )}
                    {coupon.type === "FREE_COURSE" && (
                      <span className="value-display free">Free</span>
                    )}
                    <span className="value-label">{getTypeLabel(coupon.type)}</span>
                  </div>

                  <div className="coupon-details">
                    {coupon.description && (
                      <p className="coupon-description">{coupon.description}</p>
                    )}
                    <div className="coupon-meta">
                      <span>
                        <BookOpen size={14} />
                        {getCourseTitle(coupon.courseId)}
                      </span>
                      {coupon.minOrderAmount > 0 && (
                        <span>
                          <DollarSign size={14} />
                          Min: {formatCurrency(coupon.minOrderAmount)}
                        </span>
                      )}
                      {coupon.maxDiscountAmount > 0 && coupon.type === "PERCENTAGE" && (
                        <span>
                          <Tag size={14} />
                          Max: {formatCurrency(coupon.maxDiscountAmount)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="coupon-card-footer">
                  <div className="coupon-usage">
                    <span>
                      Used: {coupon.usedCount || 0}
                      {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                    </span>
                    <span>
                      <Users size={14} />
                      {coupon.perUserLimit || 1} per user
                    </span>
                  </div>
                  <div className="coupon-dates">
                    <span>
                      <Calendar size={14} />
                      {formatDate(coupon.startDate)}
                      {coupon.endDate && ` - ${formatDate(coupon.endDate)}`}
                    </span>
                  </div>
                </div>

                {isExpiringSoon && (
                  <div className="coupon-warning">
                    <AlertCircle size={14} />
                    Expires in {Math.ceil((new Date(coupon.endDate) - new Date()) / (1000 * 60 * 60 * 24))} days
                  </div>
                )}

                <div className="coupon-card-actions">
                  <button
                    title="View Details"
                    onClick={() => openDetailModal(coupon)}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    title="Edit"
                    onClick={() => openEditModal(coupon)}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    title={coupon.isActive ? "Deactivate" : "Activate"}
                    onClick={() => toggleStatus(coupon.id, coupon.isActive)}
                  >
                    {coupon.isActive ? <XCircle size={16} /> : <CheckCircle size={16} />}
                  </button>
                  <button
                    title="Delete"
                    onClick={() => deleteCoupon(coupon.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? "Edit Coupon" : "Create New Coupon"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Coupon Code *</label>
                  <div className="code-input-wrapper">
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponForm.code}
                      onChange={(e) => {
                        setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() });
                        setFormErrors({ ...formErrors, code: "" });
                      }}
                      className={formErrors.code ? "error" : ""}
                      style={{ textTransform: 'uppercase' }}
                    />
                    <button 
                      type="button"
                      className="generate-btn"
                      onClick={() => setCouponForm({ ...couponForm, code: generateCouponCode() })}
                      title="Generate random code"
                    >
                      <Sparkles size={16} />
                    </button>
                  </div>
                  {formErrors.code && <span className="error-text">{formErrors.code}</span>}
                </div>

                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={couponForm.type}
                    onChange={(e) => {
                      setCouponForm({ ...couponForm, type: e.target.value });
                      setFormErrors({ ...formErrors, type: "" });
                    }}
                    className={formErrors.type ? "error" : ""}
                  >
                    {couponTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.type && <span className="error-text">{formErrors.type}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Brief description of this coupon"
                  rows={2}
                  value={couponForm.description}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, description: e.target.value })
                  }
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Value *</label>
                  <div className="value-input-wrapper">
                    {couponForm.type === "PERCENTAGE" && (
                      <input
                        type="number"
                        placeholder="10"
                        min="1"
                        max="100"
                        value={couponForm.value}
                        onChange={(e) => {
                          setCouponForm({ ...couponForm, value: e.target.value });
                          setFormErrors({ ...formErrors, value: "" });
                        }}
                        className={formErrors.value ? "error" : ""}
                      />
                    )}
                    {couponForm.type === "FIXED" && (
                      <input
                        type="number"
                        placeholder="500"
                        min="1"
                        value={couponForm.value}
                        onChange={(e) => {
                          setCouponForm({ ...couponForm, value: e.target.value });
                          setFormErrors({ ...formErrors, value: "" });
                        }}
                        className={formErrors.value ? "error" : ""}
                      />
                    )}
                    {couponForm.type === "FREE_COURSE" && (
                      <input
                        type="number"
                        placeholder="100"
                        min="1"
                        value={couponForm.value || 100}
                        onChange={(e) => {
                          setCouponForm({ ...couponForm, value: e.target.value });
                          setFormErrors({ ...formErrors, value: "" });
                        }}
                        className={formErrors.value ? "error" : ""}
                        disabled
                      />
                    )}
                    {couponForm.type === "PERCENTAGE" && (
                      <span className="value-suffix">%</span>
                    )}
                  </div>
                  {formErrors.value && <span className="error-text">{formErrors.value}</span>}
                </div>

                <div className="form-group">
                  <label>Course</label>
                  <select
                    value={couponForm.courseId}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, courseId: e.target.value })
                    }
                  >
                    <option value="">All Courses</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Minimum Order Amount</label>
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    value={couponForm.minOrderAmount}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, minOrderAmount: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Maximum Discount</label>
                  <input
                    type="number"
                    placeholder="No limit"
                    min="0"
                    value={couponForm.maxDiscountAmount}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, maxDiscountAmount: e.target.value })
                    }
                  />
                  <span className="field-hint">Only for percentage coupons</span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Usage Limit</label>
                  <div className="limit-input-wrapper">
                    <input
                      type="number"
                      placeholder="No limit"
                      min="1"
                      value={couponForm.usageLimit}
                      onChange={(e) =>
                        setCouponForm({ ...couponForm, usageLimit: e.target.value })
                      }
                      disabled={couponForm.isUnlimited}
                    />
                    <label className="unlimited-label">
                      <input
                        type="checkbox"
                        checked={couponForm.isUnlimited}
                        onChange={(e) =>
                          setCouponForm({ 
                            ...couponForm, 
                            isUnlimited: e.target.checked,
                            usageLimit: e.target.checked ? "" : couponForm.usageLimit
                          })
                        }
                      />
                      Unlimited
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Uses Per User</label>
                  <input
                    type="number"
                    placeholder="1"
                    min="1"
                    value={couponForm.perUserLimit}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, perUserLimit: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={couponForm.startDate}
                    onChange={(e) => {
                      setCouponForm({ ...couponForm, startDate: e.target.value });
                      setFormErrors({ ...formErrors, startDate: "" });
                    }}
                    className={formErrors.startDate ? "error" : ""}
                  />
                  {formErrors.startDate && <span className="error-text">{formErrors.startDate}</span>}
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={couponForm.endDate}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, endDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={couponForm.isActive}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, isActive: e.target.checked })
                    }
                  />
                  <span>Active</span>
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleCreateCoupon}>
                {editing ? "Update Coupon" : "Create Coupon"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedCoupon && (
        <div className="modal detail-modal" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content detail-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Coupon Details</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="detail-body">
              <div className="detail-summary">
                <div className="summary-code">
                  <span className="code-label">Coupon Code</span>
                  <div className="code-display">
                    <span>{selectedCoupon.code}</span>
                    <button onClick={() => copyCode(selectedCoupon.code)}>
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
                <div className="summary-status">
                  <span className={`status-badge ${getStatusBadge(selectedCoupon)}`}>
                    {getStatusLabel(selectedCoupon)}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Type</label>
                    <p>{getTypeLabel(selectedCoupon.type)}</p>
                  </div>
                  <div className="detail-item">
                    <label>Value</label>
                    <p>
                      {selectedCoupon.type === "PERCENTAGE" && `${selectedCoupon.value}%`}
                      {selectedCoupon.type === "FIXED" && formatCurrency(selectedCoupon.value)}
                      {selectedCoupon.type === "FREE_COURSE" && "Free Course"}
                    </p>
                  </div>
                  {selectedCoupon.description && (
                    <div className="detail-item full-width">
                      <label>Description</label>
                      <p>{selectedCoupon.description}</p>
                    </div>
                  )}
                  <div className="detail-item">
                    <label>Course</label>
                    <p>{getCourseTitle(selectedCoupon.courseId)}</p>
                  </div>
                  <div className="detail-item">
                    <label>Min Order Amount</label>
                    <p>{selectedCoupon.minOrderAmount ? formatCurrency(selectedCoupon.minOrderAmount) : "None"}</p>
                  </div>
                  {selectedCoupon.maxDiscountAmount > 0 && (
                    <div className="detail-item">
                      <label>Max Discount</label>
                      <p>{formatCurrency(selectedCoupon.maxDiscountAmount)}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3>Usage</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Used Count</label>
                    <p>{selectedCoupon.usedCount || 0}</p>
                  </div>
                  <div className="detail-item">
                    <label>Usage Limit</label>
                    <p>{selectedCoupon.usageLimit || "Unlimited"}</p>
                  </div>
                  <div className="detail-item">
                    <label>Per User Limit</label>
                    <p>{selectedCoupon.perUserLimit || 1}</p>
                  </div>
                  <div className="detail-item">
                    <label>Total Discount</label>
                    <p>{formatCurrency(selectedCoupon.totalDiscount || 0)}</p>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Validity</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Start Date</label>
                    <p>{formatDate(selectedCoupon.startDate)}</p>
                  </div>
                  <div className="detail-item">
                    <label>End Date</label>
                    <p>{selectedCoupon.endDate ? formatDate(selectedCoupon.endDate) : "No expiry"}</p>
                  </div>
                  <div className="detail-item">
                    <label>Status</label>
                    <p>{selectedCoupon.isActive ? "Active" : "Inactive"}</p>
                  </div>
                </div>
              </div>

              <div className="detail-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </button>
                <button
                  className="btn-save"
                  onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(selectedCoupon);
                  }}
                >
                  <Edit size={18} />
                  Edit Coupon
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCoupons;