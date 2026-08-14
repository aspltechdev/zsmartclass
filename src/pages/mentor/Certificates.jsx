// src/pages/admin/CertificateManagement.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Clock,
  FileCheck,
  FileX,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
  Edit,
  Save,
  X
} from "lucide-react";
import "./Certificates.css";

function CertificateManagement() {
  const [certificates, setCertificates] = useState([]);
  const [filteredCertificates, setFilteredCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [stats, setStats] = useState({
    pending: 0,
    active: 0,
    rejected: 0,
    total: 0,
  });
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [expandedRows, setExpandedRows] = useState({});


useEffect(() => {
    fetchCertificates();
}, []);

  useEffect(() => {
    filterCertificates();
  }, [certificates, searchTerm, statusFilter]);

  // ==========================================
  // FETCH CERTIFICATES
  // ==========================================
  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/api/certificates/mentor/all",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setCertificates(res.data.data || []);
      setFilteredCertificates(res.data.data || []);
    } catch (err) {
      console.error("Error fetching certificates:", err);
      setError(err.response?.data?.message || "Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FETCH STATS
  // ==========================================
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/api/certificates/mentor/stats",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setStats(res.data.data || {
        pending: 0,
        active: 0,
        rejected: 0,
        total: 0,
        templates: 0
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // ==========================================
  // FILTER CERTIFICATES
  // ==========================================
  const filterCertificates = () => {
    let filtered = [...certificates];

    // Status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(cert => cert.status === statusFilter);
    }

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(cert =>
        cert.certificateNo?.toLowerCase().includes(search) ||
        cert.studentName?.toLowerCase().includes(search) ||
        cert.courseTitle?.toLowerCase().includes(search) ||
        cert.student?.email?.toLowerCase().includes(search)
      );
    }

    setFilteredCertificates(filtered);
  };

  // ==========================================
  // APPROVE CERTIFICATE
  // ==========================================
  const approveCertificate = async (id) => {
    if (!window.confirm("Are you sure you want to approve this certificate?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/certificates/mentor/${id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      await fetchCertificates();
      await fetchStats();
      alert("Certificate approved successfully!");
    } catch (err) {
      console.error("Error approving certificate:", err);
      alert(err.response?.data?.message || "Failed to approve certificate");
    }
  };

  // ==========================================
  // REJECT CERTIFICATE
  // ==========================================
  const rejectCertificate = async (id) => {
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/certificates/mentor/${id}/reject`,
        { reason: rejectReason },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setShowRejectModal(false);
      setRejectReason("");
      await fetchCertificates();
      await fetchStats();
      alert("Certificate rejected successfully!");
    } catch (err) {
      console.error("Error rejecting certificate:", err);
      alert(err.response?.data?.message || "Failed to reject certificate");
    }
  };

  // ==========================================
  // DELETE CERTIFICATE
  // ==========================================
  const deleteCertificate = async (id) => {
    if (!window.confirm("Are you sure you want to delete this certificate? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/certificates/mentor/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      await fetchCertificates();
      await fetchStats();
      alert("Certificate deleted successfully!");
    } catch (err) {
      console.error("Error deleting certificate:", err);
      alert(err.response?.data?.message || "Failed to delete certificate");
    }
  };

  // ==========================================
  // DOWNLOAD CERTIFICATE
  // ==========================================
  const downloadCertificate = async (certificateNo) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/certificates/download/${certificateNo}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Certificate_${certificateNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error downloading certificate:", err);
      alert("Failed to download certificate");
    }
  };

  // ==========================================
  // TOGGLE ROW EXPANSION
  // ==========================================
  const toggleRowExpand = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // ==========================================
  // GET STATUS BADGE
  // ==========================================
  const getStatusBadge = (status) => {
    const statusMap = {
      PENDING: { class: "status-pending", icon: <Clock size={14} />, label: "Pending Review" },
      ACTIVE: { class: "status-active", icon: <CheckCircle size={14} />, label: "Approved" },
      REJECTED: { class: "status-rejected", icon: <XCircle size={14} />, label: "Rejected" },
      REVOKED: { class: "status-revoked", icon: <XCircle size={14} />, label: "Revoked" }
    };
    
    return statusMap[status] || statusMap.PENDING;
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // ==========================================
  // RENDER STATS CARDS
  // ==========================================
  const renderStatsCards = () => {
    const cards = [
      {
        label: "Pending Review",
        value: stats.pending,
        icon: <Clock size={24} />,
        color: "#f59e0b",
        bgColor: "#fef3c7"
      },
      {
        label: "Active Certificates",
        value: stats.active,
        icon: <CheckCircle size={24} />,
        color: "#10b981",
        bgColor: "#d1fae5"
      },
      {
        label: "Rejected",
        value: stats.rejected,
        icon: <XCircle size={24} />,
        color: "#ef4444",
        bgColor: "#fee2e2"
      },
      {
        label: "Total Certificates",
        value: stats.total,
        icon: <FileText size={24} />,
        color: "#6366f1",
        bgColor: "#e0e7ff"
      }
    ];

    return (
      <div className="stats-grid">
        {cards.map((card, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: card.bgColor, color: card.color }}>
              {card.icon}
            </div>
            <div className="stat-info">
              <span className="stat-value">{card.value}</span>
              <span className="stat-label">{card.label}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="certificate-loading">
        <RefreshCw className="spinning" size={32} />
        <p>Loading certificates...</p>
      </div>
    );
  }

  return (
    <div className="certificate-management">
      {/* HEADER */}
      <div className="certificate-header">
        <div>
          <h1>Certificate Management</h1>
          <p>Review pending certificates, manage templates, and verify certificates</p>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={fetchCertificates}>
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      {renderStatsCards()}

      {/* SECONDARY STATS */}
      <div className="secondary-stats">
        <div className="secondary-stat">
          <span className="dot pending"></span>
          <span className="stat-label">{stats.pending} Pending Review</span>
        </div>
        <div className="secondary-stat">
          <span className="dot active"></span>
          <span className="stat-label">{stats.active} Approved</span>
        </div>
        <div className="secondary-stat">
          <span className="dot rejected"></span>
          <span className="stat-label">{stats.rejected} Rejected</span>
        </div>
      </div>

      {/* SEARCH & FILTER */}
      <div className="certificate-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by student, course, or certificate #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <Filter size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="ACTIVE">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="REVOKED">Revoked</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="certificate-table-container">
        <table className="certificate-table">
          <thead>
            <tr>
              <th>CERTIFICATE #</th>
              <th>STUDENT</th>
              <th>COURSE</th>
              <th>ISSUE DATE</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredCertificates.length > 0 ? (
              filteredCertificates.map((cert) => {
                const status = getStatusBadge(cert.status);
                const isExpanded = expandedRows[cert.id] || false;

                return (
                  <>
                    <tr key={cert.id} className="certificate-row">
                      <td>
                        <div className="certificate-number">
                          <FileText size={16} />
                          <span>{cert.certificateNo}</span>
                        </div>
                      </td>
                      <td>
                        <div className="student-info">
                          <span className="student-name">{cert.studentName || cert.student?.name}</span>
                          <span className="student-email">{cert.student?.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className="course-title">{cert.courseTitle || cert.course?.title}</span>
                      </td>
                      <td>{formatDate(cert.issueDate)}</td>
                      <td>
                        <span className={`status-badge ${status.class}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-view"
                            onClick={() => {
                              setSelectedCertificate(cert);
                              setShowDetailsModal(true);
                            }}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          
                          {cert.status === "PENDING" && (
                            <>
                              <button
                                className="btn-approve"
                                onClick={() => approveCertificate(cert.id)}
                                title="Approve"
                              >
                                <CheckCircle size={16} />
                              </button>
                            </>
                          )}
                          
                          {cert.status === "ACTIVE" && (
                            <button
                              className="btn-download"
                              onClick={() => downloadCertificate(cert.certificateNo)}
                              title="Download"
                            >
                              <Download size={16} />
                            </button>
                          )}
                          
                          <button
                            className="btn-expand"
                            onClick={() => toggleRowExpand(cert.id)}
                            title="Toggle Details"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Row */}
                    {isExpanded && (
                      <tr className="expanded-row">
                        <td colSpan="6">
                          <div className="expanded-content">
                            <div className="expanded-grid">
                              <div className="expanded-item">
                                <label>Student Name</label>
                                <p>{cert.studentName || cert.student?.name}</p>
                              </div>
                              <div className="expanded-item">
                                <label>Student Email</label>
                                <p>{cert.student?.email}</p>
                              </div>
                              <div className="expanded-item">
                                <label>Course Title</label>
                                <p>{cert.courseTitle || cert.course?.title}</p>
                              </div>
                              <div className="expanded-item">
                                <label>Instructor</label>
                                <p>{cert.instructorName}</p>
                              </div>
                              <div className="expanded-item">
                                <label>Issue Date</label>
                                <p>{formatDate(cert.issueDate)}</p>
                              </div>
                              <div className="expanded-item">
                                <label>Reviewed By</label>
                                <p>{cert.reviewedBy?.name || "Not reviewed yet"}</p>
                              </div>
                              {cert.revokeReason && (
                                <div className="expanded-item full-width">
                                  <label>Reason</label>
                                  <p className="reason-text">{cert.revokeReason}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="empty-state">
                  <div className="empty-content">
                    <FileText size={48} />
                    <h3>No certificates found</h3>
                    <p>All certificates have been reviewed.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* DETAILS MODAL */}
      {showDetailsModal && selectedCertificate && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Certificate Details</h2>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Certificate #</label>
                  <p className="highlight">{selectedCertificate.certificateNo}</p>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <span className={`status-badge ${getStatusBadge(selectedCertificate.status).class}`}>
                    {getStatusBadge(selectedCertificate.status).icon}
                    {getStatusBadge(selectedCertificate.status).label}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Student Name</label>
                  <p>{selectedCertificate.studentName}</p>
                </div>
                <div className="detail-item">
                  <label>Student Email</label>
                  <p>{selectedCertificate.student?.email}</p>
                </div>
                <div className="detail-item">
                  <label>Course</label>
                  <p>{selectedCertificate.courseTitle}</p>
                </div>
                <div className="detail-item">
                  <label>Instructor</label>
                  <p>{selectedCertificate.instructorName}</p>
                </div>
                <div className="detail-item">
                  <label>Issue Date</label>
                  <p>{formatDate(selectedCertificate.issueDate)}</p>
                </div>
                <div className="detail-item">
                  <label>Created At</label>
                  <p>{formatDate(selectedCertificate.createdAt)}</p>
                </div>
                <div className="detail-item full-width">
                  <label>QR Code URL</label>
                  <p className="truncate">{selectedCertificate.qrCodeUrl || "N/A"}</p>
                </div>
                {selectedCertificate.revokeReason && (
                  <div className="detail-item full-width">
                    <label>Revoke Reason</label>
                    <p className="error-text">{selectedCertificate.revokeReason}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              {selectedCertificate.status === "PENDING" && (
                <>
                  <button
                    className="btn-approve-modal"
                    onClick={() => {
                      setShowDetailsModal(false);
                      approveCertificate(selectedCertificate.id);
                    }}
                  >
                    <CheckCircle size={18} />
                    Approve
                  </button>
                  <button
                    className="btn-reject-modal"
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowRejectModal(true);
                    }}
                  >
                    <XCircle size={18} />
                    Reject
                  </button>
                </>
              )}
              {selectedCertificate.status === "ACTIVE" && (
                <button
                  className="btn-download-modal"
                  onClick={() => {
                    downloadCertificate(selectedCertificate.certificateNo);
                  }}
                >
                  <Download size={18} />
                  Download PDF
                </button>
              )}
              <button className="btn-close-modal" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content reject-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reject Certificate</h2>
              <button className="modal-close" onClick={() => setShowRejectModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <p className="reject-warning">
                Are you sure you want to reject this certificate?
              </p>
              <div className="form-group">
                <label>Reason for rejection</label>
                <textarea
                  rows="4"
                  placeholder="Please provide a reason for rejecting this certificate..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowRejectModal(false)}>
                Cancel
              </button>
              <button
                className="btn-reject-modal"
                onClick={() => rejectCertificate(selectedCertificate?.id)}
                disabled={!rejectReason.trim()}
              >
                <XCircle size={18} />
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CertificateManagement;