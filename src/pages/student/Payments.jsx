import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import './Payments.css';
import "./StudentShared.css";
import api from "../../services/api";
const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await PaymentService.getPaymentHistory();
      
      if (response.success) {
        setPayments(response.data);
      } else {
        setError(response.message || 'Failed to load payment history');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load payments');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed':
        return <CheckCircle size={18} />;
      case 'pending':
        return <Clock size={18} />;
      case 'failed':
        return <XCircle size={18} />;
      default:
        return <Clock size={18} />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed':
        return '#0a9d5a';
      case 'pending':
        return '#e37400';
      case 'failed':
        return '#dc3545';
      default:
        return '#6b6b8a';
    }
  };

  const getStatusBgColor = (status) => {
    switch(status) {
      case 'completed':
        return '#e6f7ed';
      case 'pending':
        return '#fef3e2';
      case 'failed':
        return '#fce8e8';
      default:
        return '#f5f7fa';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const totalSpent = payments.reduce((sum, p) => {
    if (p.status === 'completed') {
      return sum + (p.amount || 0);
    }
    return sum;
  }, 0);

  const completedCount = payments.filter(p => p.status === 'completed').length;
  const pendingCount = payments.filter(p => p.status === 'pending').length;

  if (loading) {
    return (
      <div className="payments-loading">
        <div className="loading-spinner"></div>
        <p>Loading payment history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payments-error">
        <AlertCircle size={48} className="error-icon" />
        <h3>Unable to load payments</h3>
        <p>{error}</p>
        <button onClick={fetchPayments} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="payments-container">
      {/* Header */}
      <div className="payments-header">
        <div>
          <h1 className="payments-title">Payment History</h1>
          <p className="payments-subtitle">
            View all your course payments and invoices
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="payments-stats">
        <div className="stat-card">
          <div className="stat-icon-wrapper total">
            <CreditCard size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(totalSpent)}</span>
            <span className="stat-label">Total Spent</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper success">
            <CheckCircle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{completedCount}</span>
            <span className="stat-label">Successful Payments</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper pending">
            <Clock size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{pendingCount}</span>
            <span className="stat-label">Pending Payments</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper total">
            <FileText size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{payments.length}</span>
            <span className="stat-label">Total Transactions</span>
          </div>
        </div>
      </div>

      {/* Payment List */}
      {payments.length === 0 ? (
        <div className="payments-empty">
          <div className="empty-icon">💳</div>
          <h2>No Payment History</h2>
          <p>You haven't made any payments yet. Start learning with our free courses!</p>
          <a href="/student/courses" className="browse-btn">
            Browse Courses
          </a>
        </div>
      ) : (
        <div className="payments-list">
          {payments.map((payment) => (
            <div key={payment.id} className="payment-item">
              <div className="payment-item-main">
                <div className="payment-icon" style={{ backgroundColor: getStatusBgColor(payment.status) }}>
                  {getStatusIcon(payment.status)}
                </div>

                <div className="payment-info">
                  <div className="payment-top">
                    <h4 className="payment-title">
                      {payment.course?.title || 'Course Payment'}
                    </h4>
                    <span 
                      className="payment-status"
                      style={{ 
                        color: getStatusColor(payment.status),
                        backgroundColor: getStatusBgColor(payment.status)
                      }}
                    >
                      {getStatusIcon(payment.status)}
                      {getStatusLabel(payment.status)}
                    </span>
                  </div>
                  <div className="payment-meta">
                    <span className="meta-item">
                      <Calendar size={14} />
                      {formatDate(payment.createdAt)}
                    </span>
                    <span className="meta-item">
                      <FileText size={14} />
                      Order: {payment.orderId || 'N/A'}
                    </span>
                    {payment.paymentId && (
                      <span className="meta-item">
                        <CreditCard size={14} />
                        Payment: {payment.paymentId}
                      </span>
                    )}
                  </div>
                </div>

                <div className="payment-amount">
                  <span className="amount">{formatCurrency(payment.amount, payment.currency)}</span>
                  <button className="expand-btn-sm" onClick={() => toggleExpand(payment.id)}>
                    {expandedId === payment.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === payment.id && (
                <div className="payment-details">
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Payment ID</span>
                      <span className="detail-value">{payment.paymentId || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Order ID</span>
                      <span className="detail-value">{payment.orderId || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Course</span>
                      <span className="detail-value">{payment.course?.title || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Date</span>
                      <span className="detail-value">{formatDate(payment.createdAt)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Amount</span>
                      <span className="detail-value">{formatCurrency(payment.amount, payment.currency)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status</span>
                      <span className="detail-value" style={{ color: getStatusColor(payment.status) }}>
                        {getStatusLabel(payment.status)}
                      </span>
                    </div>
                  </div>

                  <div className="details-actions">
                    <button className="detail-btn invoice-btn">
                      <Download size={16} />
                      Download Invoice
                    </button>
                    <button className="detail-btn view-btn">
                      <Eye size={16} />
                      View Receipt
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Payments;