// src/pages/admin/AdminCertificates.jsx
import { useEffect, useState } from "react";
import {
  Award,
  Search,
  Eye,
  Download,
  CheckCircle,
  Clock,
  X,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  BadgeCheck,
  Palette,
  Edit,
  Info,
  Check,
  XCircle,
  Clock as ClockIcon,
  Trash2,
  Plus,
  Zap,
  Printer,
} from "lucide-react";
import api from "../../services/api";
import "./AdminCertificates.css";

function AdminCertificates() {
  // ==========================================
  // STATE
  // ==========================================
  const [certificates, setCertificates] = useState([]);
  const [pendingCertificates, setPendingCertificates] = useState([]);
  const [activeCertificates, setActiveCertificates] = useState([]);
  const [rejectedCertificates, setRejectedCertificates] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Verify modal
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyCertNo, setVerifyCertNo] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState("");

  // Template modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedCourseTitle, setSelectedCourseTitle] = useState("");
  const [templateForm, setTemplateForm] = useState({
    header: "Certificate of Completion",
    footer: "Issued by ZSmartClass",
    textColor: "#1a1a2e",
    backgroundColor: "#ffffff",
    borderColor: "#667eea",
    fontFamily: "Helvetica",
    isActive: true,
  });
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateSaveLoading, setTemplateSaveLoading] = useState(false);
  const [existingTemplates, setExistingTemplates] = useState([]);

  // Download state
  const [downloadingCertNo, setDownloadingCertNo] = useState(null);

  // Action state
  const [actionLoading, setActionLoading] = useState(null);

  // Success message
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // ==========================================
  // FETCH FUNCTIONS
  // ==========================================
  const fetchAll = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const coursesData = await fetchCourses();
      await Promise.all([
        fetchPendingCertificates(),
        fetchAllCertificates(),
      ]);
      if (coursesData && coursesData.length > 0) {
        await fetchAllTemplates(coursesData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setLoadError("Failed to load certificate data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCertificates = async () => {
    try {
      const res = await api.get("/certificates/admin/pending");
      const data = res.data?.data || res.data;
      const pending = Array.isArray(data) ? data : [];
      setPendingCertificates(pending);
    } catch (err) {
      console.error("Error fetching pending certificates:", err);
      setPendingCertificates([]);
    }
  };

  const fetchAllCertificates = async () => {
    try {
      const res = await api.get("/certificates/admin/all");
      const data = res.data?.data || res.data;
      const allCerts = Array.isArray(data) ? data : [];
      setCertificates(allCerts);
      
      const active = allCerts.filter(c => c.status === "ACTIVE");
      const rejected = allCerts.filter(c => c.status === "REJECTED");
      setActiveCertificates(active);
      setRejectedCertificates(rejected);
    } catch (err) {
      console.error("Error fetching all certificates:", err);
      setCertificates([]);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get("/courses");
      const data = res.data?.data || res.data;
      const coursesData = Array.isArray(data) ? data : [];
      setCourses(coursesData);
      return coursesData;
    } catch (err) {
      console.error("Error fetching courses:", err);
      setCourses([]);
      return [];
    }
  };

  const fetchAllTemplates = async (coursesData) => {
    try {
      if (!coursesData || coursesData.length === 0) {
        setExistingTemplates([]);
        return;
      }

      const templatePromises = coursesData.map(course => 
        api.get(`/certificates/admin/templates/${course.id}`)
          .then(res => {
            const data = res.data?.data || res.data;
            if (data && Object.keys(data).length > 0) {
              return { ...data, courseId: course.id, courseTitle: course.title };
            }
            return null;
          })
          .catch(() => null)
      );
      
      const results = await Promise.all(templatePromises);
      const validTemplates = results.filter(t => t !== null);
      setExistingTemplates(validTemplates);
    } catch (err) {
      console.error("Error fetching templates:", err);
      setExistingTemplates([]);
    }
  };

  const fetchTemplate = async (courseId) => {
    setTemplateLoading(true);
    try {
      const numericCourseId = Number(courseId);
      if (isNaN(numericCourseId)) {
        throw new Error("Invalid course ID");
      }
      
      const res = await api.get(`/certificates/admin/templates/${numericCourseId}`);
      const data = res.data?.data || res.data;
      
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        setTemplateForm({
          header: data.header || "Certificate of Completion",
          footer: data.footer || "Issued by ZSmartClass",
          textColor: data.textColor || "#1a1a2e",
          backgroundColor: data.backgroundColor || "#ffffff",
          borderColor: data.borderColor || "#667eea",
          fontFamily: data.fontFamily || "Helvetica",
          isActive: data.isActive !== undefined ? data.isActive : true,
        });
      } else {
        setTemplateForm({
          header: "Certificate of Completion",
          footer: "Issued by ZSmartClass",
          textColor: "#1a1a2e",
          backgroundColor: "#ffffff",
          borderColor: "#667eea",
          fontFamily: "Helvetica",
          isActive: true,
        });
      }
    } catch (err) {
      console.error("Error fetching template:", err);
      setTemplateForm({
        header: "Certificate of Completion",
        footer: "Issued by ZSmartClass",
        textColor: "#1a1a2e",
        backgroundColor: "#ffffff",
        borderColor: "#667eea",
        fontFamily: "Helvetica",
        isActive: true,
      });
    } finally {
      setTemplateLoading(false);
    }
  };

  // ==========================================
  // TEMPLATE FUNCTIONS
  // ==========================================
  const openTemplateModal = async (courseId, courseTitle) => {
    setSelectedCourseId(courseId);
    setSelectedCourseTitle(courseTitle);
    await fetchTemplate(courseId);
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = async () => {
    if (!selectedCourseId) return;
    setTemplateSaveLoading(true);
    try {
      const numericCourseId = Number(selectedCourseId);
      if (isNaN(numericCourseId)) {
        throw new Error("Invalid course ID");
      }
      
      const payload = {
        header: templateForm.header || "Certificate of Completion",
        footer: templateForm.footer || "Issued by ZSmartClass",
        textColor: templateForm.textColor || "#1a1a2e",
        backgroundColor: templateForm.backgroundColor || "#ffffff",
        borderColor: templateForm.borderColor || "#667eea",
        fontFamily: templateForm.fontFamily || "Helvetica",
        isActive: templateForm.isActive !== undefined ? templateForm.isActive : true,
      };
      
      await api.put(`/certificates/admin/templates/${numericCourseId}`, payload);
      showSuccessMessage("Template saved successfully!");
      setShowTemplateModal(false);
      
      await fetchCourses().then(coursesData => {
        if (coursesData && coursesData.length > 0) {
          fetchAllTemplates(coursesData);
        }
      });
    } catch (err) {
      console.error("Error saving template:", err);
      const errorMessage = err.response?.data?.message || "Failed to save template. Please try again.";
      alert(errorMessage);
    } finally {
      setTemplateSaveLoading(false);
    }
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  // ==========================================
  // CERTIFICATE ACTION FUNCTIONS
  // ==========================================
  // Trigger the auto-verify job immediately (no waiting for the 10-min timer)
  const handleVerifyNow = async () => {
    try {
      setActionLoading("verify-now");
      const res = await api.post("/certificates/admin/verify-now");
      await fetchAll();
      showSuccessMessage(res.data?.message || "Verification run complete.");
    } catch (err) {
      alert(err.response?.data?.message || "Verify-now failed. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // Open the certificate PDF in a new tab and print it
  const handlePrintCertificate = async (certNo) => {
    if (!certNo || certNo === "N/A") {
      alert("Certificate number not available");
      return;
    }
    try {
      setDownloadingCertNo(certNo);
      const res = await api.get(`/certificates/download/${certNo}`);
      const payload = res.data?.data || res.data;
      const { pdfBuffer } = payload;
      if (!pdfBuffer) throw new Error("No PDF data returned");

      const byteCharacters = atob(pdfBuffer);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([new Uint8Array(byteNumbers)], {
        type: "application/pdf",
      });
      const url = window.URL.createObjectURL(blob);

      const win = window.open(url, "_blank");
      if (!win) {
        alert("Please allow pop-ups to print the certificate.");
        return;
      }
      // Best-effort auto-print; the PDF is open either way for manual print.
      setTimeout(() => {
        try {
          win.focus();
          win.print();
        } catch (e) {
          /* user can print from the PDF viewer */
        }
      }, 700);
    } catch (err) {
      console.error("Print error:", err);
      alert(
        err.response?.data?.message ||
          "Couldn't open this certificate for printing."
      );
    } finally {
      setDownloadingCertNo(null);
    }
  };

  const handleApprove = async (certificateId) => {
    if (!certificateId) {
      alert("Invalid certificate ID");
      return;
    }
    
    if (!window.confirm("Approve this certificate? The student will be notified via email.")) return;
    
    setActionLoading(certificateId);
    try {
      await api.put(`/certificates/admin/${certificateId}/approve`);
      await fetchAll();
      showSuccessMessage("✅ Certificate approved successfully! Student has been notified.");
    } catch (err) {
      console.error("Error approving certificate:", err);
      const errorMessage = err.response?.data?.message || "Failed to approve certificate. Please try again.";
      alert(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (certificateId) => {
    if (!certificateId) {
      alert("Invalid certificate ID");
      return;
    }
    
    const reason = window.prompt("Enter rejection reason (optional):");
    if (reason === null) return;
    
    setActionLoading(certificateId);
    try {
      await api.put(`/certificates/admin/${certificateId}/reject`, { reason });
      await fetchAll();
      showSuccessMessage("❌ Certificate rejected.");
    } catch (err) {
      console.error("Error rejecting certificate:", err);
      const errorMessage = err.response?.data?.message || "Failed to reject certificate. Please try again.";
      alert(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (certificateId) => {
    if (!certificateId) {
      alert("Invalid certificate ID");
      return;
    }
    
    if (!window.confirm("Delete this certificate permanently?")) return;
    
    setActionLoading(certificateId);
    try {
      await api.delete(`/certificates/admin/${certificateId}`);
      await fetchAll();
      showSuccessMessage("🗑️ Certificate deleted successfully.");
    } catch (err) {
      console.error("Error deleting certificate:", err);
      const errorMessage = err.response?.data?.message || "Failed to delete certificate. Please try again.";
      alert(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================
  // VERIFY FUNCTIONS
  // ==========================================
  const openVerifyModal = (certNo = "") => {
    setVerifyCertNo(certNo);
    setVerifyResult(null);
    setVerifyError("");
    setShowVerifyModal(true);
    if (certNo) {
      handleVerify(certNo);
    }
  };

  const handleVerify = async (certNoOverride) => {
    const certNo = (certNoOverride ?? verifyCertNo).trim();
    if (!certNo) {
      setVerifyError("Enter a certificate number to verify.");
      return;
    }
    try {
      setVerifying(true);
      setVerifyError("");
      setVerifyResult(null);
      const res = await api.get(`/certificates/verify/${certNo}`);
      const data = res.data?.data || res.data;
      setVerifyResult(data);
    } catch (err) {
      setVerifyResult(null);
      setVerifyError(
        err.response?.data?.message ||
          "Invalid certificate number or certificate has been revoked."
      );
    } finally {
      setVerifying(false);
    }
  };

  // ==========================================
  // DOWNLOAD FUNCTIONS
  // ==========================================
  const handleDownload = async (certNo) => {
    if (!certNo || certNo === 'N/A') {
      alert("Certificate number not available");
      return;
    }
    try {
      setDownloadingCertNo(certNo);
      const res = await api.get(`/certificates/download/${certNo}`);
      const payload = res.data?.data || res.data;
      const { pdfBuffer, filename } = payload;

      if (!pdfBuffer) {
        throw new Error("No PDF data returned");
      }

      const byteCharacters = atob(pdfBuffer);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `Certificate_${certNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      showSuccessMessage("📥 Certificate downloaded successfully!");
    } catch (err) {
      console.error("Download error:", err);
      alert(
        err.response?.data?.message ||
          "Couldn't download this certificate. Please try again."
      );
    } finally {
      setDownloadingCertNo(null);
    }
  };

  // ==========================================
  // FORMATTING HELPERS
  // ==========================================
  const formatDate = (date) => {
    if (!date) return "—";
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        return "—";
      }
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "—";
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: <span className="status-badge pending"><ClockIcon size={14} /> Pending</span>,
      ACTIVE: <span className="status-badge active"><CheckCircle size={14} /> Active</span>,
      REJECTED: <span className="status-badge rejected"><XCircle size={14} /> Rejected</span>,
      REVOKED: <span className="status-badge revoked"><XCircle size={14} /> Revoked</span>,
    };
    return badges[status] || <span className="status-badge">{status || 'Unknown'}</span>;
  };

  // ==========================================
  // FILTERING
  // ==========================================
  const getDisplayData = () => {
    let data = activeTab === "pending" ? pendingCertificates : 
               activeTab === "active" ? activeCertificates :
               activeTab === "rejected" ? rejectedCertificates :
               certificates;
    
    if (search) {
      data = data.filter(cert => {
        const studentName = cert.studentName || cert.student?.name || '';
        const studentEmail = cert.student?.email || cert.studentEmail || '';
        const courseTitle = cert.courseTitle || cert.course?.title || '';
        const certNo = cert.certificateNo || '';
        
        return studentName.toLowerCase().includes(search.toLowerCase()) ||
               studentEmail.toLowerCase().includes(search.toLowerCase()) ||
               courseTitle.toLowerCase().includes(search.toLowerCase()) ||
               certNo.toLowerCase().includes(search.toLowerCase());
      });
    }

    if (statusFilter !== "all") {
      data = data.filter(cert => cert.status === statusFilter);
    }

    return data;
  };

  const displayData = getDisplayData();

  // ==========================================
  // STATS
  // ==========================================
  const stats = {
    total: certificates.length,
    pending: pendingCertificates.length,
    active: activeCertificates.length,
    rejected: rejectedCertificates.length,
  };

  // ==========================================
  // EFFECTS
  // ==========================================
  useEffect(() => {
    fetchAll();
  }, []);

  // ==========================================
  // RENDER
  // ==========================================
  if (loading) {
    return (
      <div className="certificates-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="certificates-page">
      {/* Success Message */}
      {showSuccess && (
        <div className="success-banner">
          <CheckCircle size={20} />
          <p>{successMessage}</p>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Certificate Management</h1>
          <p className="subtitle">
            Review pending certificates, manage templates, and verify certificates
          </p>
        </div>
        <div className="header-actions">
          <button
            className="add-btn"
            onClick={handleVerifyNow}
            disabled={actionLoading === "verify-now"}
            title="Verify all pending applications now"
          >
            <Zap size={18} />
            {actionLoading === "verify-now" ? "Verifying…" : "Verify Now"}
          </button>
          <button className="add-btn" onClick={() => openVerifyModal()}>
            <ShieldCheck size={18} />
            Verify Certificate
          </button>
          <button className="refresh-btn" onClick={fetchAll}>
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {loadError && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <p>{loadError}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="certificate-stats">
        <div className="stat-card pending-card">
          <Clock size={24} />
          <div>
            <h3>{stats.pending}</h3>
            <p>Pending Review</p>
          </div>
        </div>
        <div className="stat-card active-card">
          <CheckCircle size={24} />
          <div>
            <h3>{stats.active}</h3>
            <p>Active Certificates</p>
          </div>
        </div>
        <div className="stat-card rejected-card">
          <XCircle size={24} />
          <div>
            <h3>{stats.rejected}</h3>
            <p>Rejected</p>
          </div>
        </div>
        <div className="stat-card total-card">
          <Award size={24} />
          <div>
            <h3>{stats.total}</h3>
            <p>Total Certificates</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          <Clock size={16} />
          Pending Review
          {pendingCertificates.length > 0 && (
            <span className="tab-badge">{pendingCertificates.length}</span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === "active" ? "active" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          <CheckCircle size={16} />
          Approved
          {activeCertificates.length > 0 && (
            <span className="tab-badge active-badge">{activeCertificates.length}</span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === "rejected" ? "active" : ""}`}
          onClick={() => setActiveTab("rejected")}
        >
          <XCircle size={16} />
          Rejected
          {rejectedCertificates.length > 0 && (
            <span className="tab-badge rejected-badge">{rejectedCertificates.length}</span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === "templates" ? "active" : ""}`}
          onClick={() => setActiveTab("templates")}
        >
          <Palette size={16} />
          Templates
          {existingTemplates.length > 0 && (
            <span className="tab-badge template-badge">{existingTemplates.length}</span>
          )}
        </button>
      </div>

      {/* Certificates Content */}
      {activeTab !== "templates" && (
        <>
          <div className="toolbar">
            <div className="search-box">
              <Search size={18} />
              <input
                placeholder="Search by student, course, or certificate #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ACTIVE">Active</option>
              <option value="REJECTED">Rejected</option>
              <option value="REVOKED">Revoked</option>
            </select>
          </div>

          <div className="table-wrapper">
            <table className="certificate-table">
              <thead>
                <tr>
                  <th>Certificate #</th>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Issue Date</th>
                  <th>Status</th>
                  <th style={{ width: "140px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayData.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <Award size={48} />
                        <h3>No certificates found</h3>
                        <p>
                          {activeTab === "pending"
                            ? "All certificates have been reviewed."
                            : activeTab === "active"
                            ? "No approved certificates yet."
                            : activeTab === "rejected"
                            ? "No rejected certificates."
                            : "No certificates match your filters."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayData.map((cert) => {
                    const certificateNo = cert.certificateNo || 'N/A';
                    const studentName = cert.studentName || cert.student?.name || 'Unknown';
                    const studentEmail = cert.student?.email || cert.studentEmail || '';
                    const courseTitle = cert.courseTitle || cert.course?.title || 'Unknown Course';
                    const issueDate = cert.issueDate || cert.createdAt;
                    const status = cert.status || 'PENDING';
                    
                    return (
                      <tr key={cert.id}>
                        <td>
                          <span className="cert-number">{certificateNo}</span>
                        </td>
                        <td>
                          <div className="user-info">
                            <span className="user-name">{studentName}</span>
                            <span className="user-email">{studentEmail}</span>
                          </div>
                        </td>
                        <td>
                          <span className="course-name">{courseTitle}</span>
                        </td>
                        <td>{formatDate(issueDate)}</td>
                        <td>{getStatusBadge(status)}</td>
                        <td>
                          <div className="action-buttons">
                            {status === "PENDING" && (
                              <>
                                <button
                                  className="action-btn approve-btn"
                                  title="Approve"
                                  onClick={() => handleApprove(cert.id)}
                                  disabled={actionLoading === cert.id}
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  className="action-btn reject-btn"
                                  title="Reject"
                                  onClick={() => handleReject(cert.id)}
                                  disabled={actionLoading === cert.id}
                                >
                                  <X size={16} />
                                </button>
                              </>
                            )}
                            {status === "ACTIVE" && (
                              <>
                                <button
                                  className="action-btn download-btn"
                                  title="Download PDF"
                                  onClick={() => handleDownload(certificateNo)}
                                  disabled={downloadingCertNo === certificateNo || certificateNo === 'N/A'}
                                >
                                  <Download size={16} />
                                </button>
                                <button
                                  className="action-btn view-btn"
                                  title="Print certificate"
                                  onClick={() => handlePrintCertificate(certificateNo)}
                                  disabled={downloadingCertNo === certificateNo || certificateNo === 'N/A'}
                                >
                                  <Printer size={16} />
                                </button>
                                <button
                                  className="action-btn view-btn"
                                  title="View Certificate"
                                  onClick={() => openVerifyModal(certificateNo)}
                                  disabled={certificateNo === 'N/A'}
                                >
                                  <Eye size={16} />
                                </button>
                              </>
                            )}
                            {(status === "REJECTED" || status === "REVOKED") && (
                              <button
                                className="action-btn delete-btn"
                                title="Delete"
                                onClick={() => handleDelete(cert.id)}
                                disabled={actionLoading === cert.id}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Templates Content */}
      {activeTab === "templates" && (
        <div className="templates-section">
          <div className="section-header">
            <div>
              <h3>
                <Palette size={20} style={{ verticalAlign: "middle", marginRight: "0.5rem" }} />
                Certificate Templates
              </h3>
              <p className="section-subtitle">
                Customize the design for each course's certificate
              </p>
            </div>
            <div className="header-actions">
              <button className="refresh-btn" onClick={fetchAll} title="Refresh">
                <RefreshCw size={18} />
              </button>
            </div>
          </div>

          {existingTemplates.length > 0 && (
            <div className="existing-templates-info">
              <Info size={18} />
              <span>{existingTemplates.length} template(s) already created</span>
            </div>
          )}

          {courses.length === 0 ? (
            <div className="empty-templates">
              <AlertCircle size={48} />
              <h3>No courses available</h3>
              <p>Create courses first to design certificate templates for them.</p>
            </div>
          ) : (
            <div className="templates-grid">
              {courses.map((course) => {
                const hasExistingTemplate = existingTemplates.some(t => t.courseId === course.id);
                
                return (
                  <div key={course.id} className="template-card">
                    <div className="template-preview-mini">
                      <div className="template-mini-content">
                        <Award size={24} className="template-mini-icon" />
                        <h4>{course.title}</h4>
                        <span className="template-mini-course-id">
                          ID: {course.id}
                        </span>
                        {hasExistingTemplate && (
                          <span className="template-exists-badge">✅ Template Set</span>
                        )}
                      </div>
                    </div>
                    <div className="template-info">
                      <div className="template-meta">
                        <span className={`template-status ${hasExistingTemplate ? 'has-template' : 'no-template'}`}>
                          {hasExistingTemplate ? '✅ Template Set' : '⚠️ No Template'}
                        </span>
                      </div>
                      <div className="template-actions">
                        <button 
                          className="edit-template-btn"
                          onClick={() => openTemplateModal(course.id, course.title)}
                        >
                          <Edit size={16} />
                          {hasExistingTemplate ? 'Edit Template' : 'Create Template'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="template-help-text">
            <Info size={18} />
            <p>
              <strong>How it works:</strong> Design a certificate template for each course. 
              When students generate certificates, they'll use the course's custom template. 
              Templates include colors, fonts, header, and footer text.
            </p>
          </div>
        </div>
      )}

      {/* Verify Modal */}
      {showVerifyModal && (
        <div className="modal" onClick={() => setShowVerifyModal(false)}>
          <div
            className="modal-content preview-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Verify Certificate</h2>
              <button
                className="modal-close"
                onClick={() => setShowVerifyModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Certificate Number</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    placeholder="e.g. CERT-123456-0001"
                    value={verifyCertNo}
                    onChange={(e) => setVerifyCertNo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleVerify();
                    }}
                  />
                  <button
                    className="btn-save"
                    style={{ flex: "0 0 auto" }}
                    onClick={() => handleVerify()}
                    disabled={verifying}
                  >
                    {verifying ? "Checking..." : "Verify"}
                  </button>
                </div>
                {verifyError && (
                  <span className="error-text">{verifyError}</span>
                )}
              </div>

              {verifyResult && verifyResult.certificate && (
                <>
                  <div className="certificate-preview">
                    <div className="certificate-card">
                      <div className="certificate-header">
                        Certificate of Completion
                      </div>
                      <div className="certificate-body">
                        <BadgeCheck size={56} className="certificate-icon" />
                        <p className="cert-label">
                          This certificate is proudly presented to
                        </p>
                        <h2 className="cert-user">
                          {verifyResult.certificate.studentName}
                        </h2>
                        <p className="cert-course">
                          for successfully completing
                        </p>
                        <h3 className="cert-course-name">
                          {verifyResult.certificate.courseTitle}
                        </h3>
                        <div className="cert-details">
                          <span>
                            Certificate #: {verifyResult.certificate.certificateNo}
                          </span>
                          <span>
                            Issued: {formatDate(verifyResult.certificate.issueDate)}
                          </span>
                        </div>
                      </div>
                      <div className="certificate-footer">
                        Instructor: {verifyResult.certificate.instructorName}
                      </div>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginTop: "1rem" }}>
                    <span className={`status-badge ${verifyResult.isValid ? "active" : "pending"}`}>
                      {verifyResult.isValid ? "✅ Valid Certificate" : "❌ Invalid"}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowVerifyModal(false)}
              >
                Close
              </button>
              {verifyResult?.certificate && (
                <button
                  className="btn-save"
                  disabled={downloadingCertNo === verifyResult.certificate.certificateNo}
                  onClick={() => handleDownload(verifyResult.certificate.certificateNo)}
                >
                  <Download size={18} />
                  Download PDF
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="modal" onClick={() => setShowTemplateModal(false)}>
          <div
            className="modal-content template-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Design Certificate Template</h2>
              <button
                className="modal-close"
                onClick={() => setShowTemplateModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {templateLoading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading template...</p>
                </div>
              ) : (
                <>
                  <div className="template-course-info">
                    <h3>{selectedCourseTitle}</h3>
                    <p>Customize the certificate design for this course</p>
                  </div>

                  <div className="form-group">
                    <label>Header Text</label>
                    <input
                      type="text"
                      placeholder="Certificate of Completion"
                      value={templateForm.header}
                      onChange={(e) =>
                        setTemplateForm({ ...templateForm, header: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Footer Text</label>
                    <input
                      type="text"
                      placeholder="Issued by ZSmartClass"
                      value={templateForm.footer}
                      onChange={(e) =>
                        setTemplateForm({ ...templateForm, footer: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Text Color</label>
                      <div className="color-picker-wrapper">
                        <input
                          type="color"
                          value={templateForm.textColor}
                          onChange={(e) =>
                            setTemplateForm({
                              ...templateForm,
                              textColor: e.target.value,
                            })
                          }
                        />
                        <input
                          type="text"
                          value={templateForm.textColor}
                          onChange={(e) =>
                            setTemplateForm({
                              ...templateForm,
                              textColor: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Background Color</label>
                      <div className="color-picker-wrapper">
                        <input
                          type="color"
                          value={templateForm.backgroundColor}
                          onChange={(e) =>
                            setTemplateForm({
                              ...templateForm,
                              backgroundColor: e.target.value,
                            })
                          }
                        />
                        <input
                          type="text"
                          value={templateForm.backgroundColor}
                          onChange={(e) =>
                            setTemplateForm({
                              ...templateForm,
                              backgroundColor: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Border Color</label>
                      <div className="color-picker-wrapper">
                        <input
                          type="color"
                          value={templateForm.borderColor}
                          onChange={(e) =>
                            setTemplateForm({
                              ...templateForm,
                              borderColor: e.target.value,
                            })
                          }
                        />
                        <input
                          type="text"
                          value={templateForm.borderColor}
                          onChange={(e) =>
                            setTemplateForm({
                              ...templateForm,
                              borderColor: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Font Family</label>
                      <select
                        value={templateForm.fontFamily}
                        onChange={(e) =>
                          setTemplateForm({
                            ...templateForm,
                            fontFamily: e.target.value,
                          })
                        }
                      >
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times-Roman">Times New Roman</option>
                        <option value="Courier">Courier</option>
                        <option value="Arial">Arial</option>
                        <option value="Georgia">Georgia</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={templateForm.isActive}
                        onChange={(e) =>
                          setTemplateForm({
                            ...templateForm,
                            isActive: e.target.checked,
                          })
                        }
                      />
                      Active Template
                    </label>
                    <small>Inactive templates won't be used for new certificates</small>
                  </div>

                  {/* Template Preview Section — faithful replica of the PDF */}
                  <div className="template-preview-section">
                    <h4>Design Preview</h4>
                    <div
                      style={{
                        containerType: "inline-size",
                        position: "relative",
                        width: "100%",
                        aspectRatio: "842 / 595",
                        background: templateForm.backgroundColor || "#ffffff",
                        borderRadius: "6px",
                        overflow: "hidden",
                        fontFamily: templateForm.fontFamily || "Helvetica, Arial, sans-serif",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                      }}
                    >
                      {/* Border frame (PDF: rect inset 30px) */}
                      <div
                        style={{
                          position: "absolute",
                          left: "3.56%",
                          top: "5.04%",
                          right: "3.56%",
                          bottom: "5.04%",
                          border: `0.24cqw solid ${templateForm.borderColor || "#667eea"}`,
                          pointerEvents: "none",
                        }}
                      />

                      {/* Top-left logo */}
                      <div
                        style={{
                          position: "absolute",
                          left: "5.94%",
                          top: "7.5%",
                          display: "flex",
                          alignItems: "center",
                          gap: "1.2cqw",
                        }}
                      >
                        <div
                          style={{
                            width: "5.94cqw",
                            height: "5.94cqw",
                            borderRadius: "1.3cqw",
                            background: "linear-gradient(135deg,#7A8BF5,#7048C6)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "Georgia, 'Times New Roman', serif",
                            fontSize: "3.4cqw",
                            fontWeight: 700,
                          }}
                        >
                          Z
                        </div>
                        <span style={{ fontSize: "1.7cqw", fontWeight: 700, color: templateForm.textColor || "#1a1a2e" }}>
                          ZSmartClass
                        </span>
                      </div>

                      {/* Top-right badge slot */}
                      <div
                        style={{
                          position: "absolute",
                          right: "8.3%",
                          top: "6%",
                          width: "7cqw",
                          height: "7cqw",
                          borderRadius: "50%",
                          border: `0.3cqw solid ${templateForm.borderColor || "#667eea"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: templateForm.borderColor || "#667eea",
                        }}
                      >
                        <Award style={{ width: "3.4cqw", height: "3.4cqw" }} />
                      </div>

                      {/* CERTIFICATE OF */}
                      <div style={{ position: "absolute", left: 0, right: 0, top: "10.9%", textAlign: "center", color: templateForm.borderColor || "#667eea", fontWeight: 700, fontSize: "2.14cqw", letterSpacing: "0.36cqw" }}>
                        CERTIFICATE OF
                      </div>
                      {/* COMPLETION */}
                      <div style={{ position: "absolute", left: 0, right: 0, top: "15.1%", textAlign: "center", color: templateForm.textColor || "#1a1a2e", fontWeight: 800, fontSize: "4.99cqw", letterSpacing: "0.24cqw" }}>
                        COMPLETION
                      </div>

                      {/* Subtitle */}
                      <div style={{ position: "absolute", left: 0, right: 0, top: "25.2%", textAlign: "center", color: "#64748b", fontSize: "2.14cqw" }}>
                        This Certificate is proudly Presented to
                      </div>
                      {/* Student name */}
                      <div style={{ position: "absolute", left: 0, right: 0, top: "31.1%", textAlign: "center", color: templateForm.textColor || "#1a1a2e", fontWeight: 700, fontSize: "3.8cqw" }}>
                        [Student Name]
                      </div>
                      {/* Completed course line */}
                      <div style={{ position: "absolute", left: 0, right: 0, top: "39.5%", textAlign: "center", color: "#64748b", fontSize: "2.14cqw" }}>
                        has successfully completed the online Course:
                      </div>
                      {/* Course name */}
                      <div style={{ position: "absolute", left: 0, right: 0, top: "44.5%", textAlign: "center", color: templateForm.borderColor || "#667eea", fontWeight: 700, fontSize: "3.09cqw" }}>
                        {selectedCourseTitle || "Course Name"}
                      </div>
                      {/* Description */}
                      <div style={{ position: "absolute", left: 0, right: 0, top: "52.1%", textAlign: "center", color: "#94a3b8", fontSize: "1.66cqw", lineHeight: 1.5 }}>
                        This professional has demonstrated initiative and a commitment to<br />
                        deepening their skills and advancing their career. Well done!
                      </div>

                      {/* Divider */}
                      <div style={{ position: "absolute", left: "11.9%", width: "76.3%", top: "66.4%", height: "1px", background: "#e2e8f0" }} />

                      {/* Date + Certificate id (left aligned) */}
                      <div style={{ position: "absolute", left: "11.9%", top: "69.7%", fontSize: "1.31cqw", color: "#64748b" }}>
                        Date of issue: <span style={{ color: templateForm.textColor || "#1a1a2e", fontWeight: 700 }}>[Issue Date]</span>
                      </div>
                      <div style={{ position: "absolute", left: "11.9%", top: "73.1%", fontSize: "1.31cqw", color: "#64748b" }}>
                        Certificate id: <span style={{ color: templateForm.textColor || "#1a1a2e", fontWeight: 700 }}>[Certificate ID]</span>
                      </div>

                      {/* Seal (PDF circle at 550,450 r40) */}
                      <div style={{ position: "absolute", left: "60.6%", top: "68.9%", width: "9.5cqw", height: "9.5cqw", borderRadius: "50%", border: `0.24cqw solid ${templateForm.borderColor || "#667eea"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ position: "absolute", inset: "0.6cqw", borderRadius: "50%", border: `0.12cqw solid ${templateForm.borderColor || "#667eea"}` }} />
                        <span style={{ fontSize: "0.85cqw", fontWeight: 700, color: templateForm.textColor || "#1a1a2e", letterSpacing: "0.1cqw" }}>ZSMARTCLASS</span>
                        <span style={{ fontSize: "0.72cqw", fontWeight: 700, color: "#020202", marginTop: "0.3cqw" }}>COMPLETED</span>
                      </div>

                      {/* QR slot (PDF at 630,410 80x80) */}
                      <div style={{ position: "absolute", left: "74.8%", top: "68.9%", width: "9.5cqw", height: "9.5cqw", border: "0.12cqw solid #e2e8f0", background: "repeating-conic-gradient(#111 0% 25%, #fff 0% 50%) 50% / 1.6cqw 1.6cqw", opacity: 0.85 }} />
                      <div style={{ position: "absolute", left: "74.8%", top: "83.2%", width: "9.5cqw", textAlign: "center", fontSize: "0.83cqw", color: "#94a3b8" }}>Scan to verify</div>

                      {/* Footer */}
                      <div style={{ position: "absolute", left: 0, right: 0, top: "90.8%", textAlign: "center", color: "#94a3b8", fontSize: "1.07cqw" }}>
                        {templateForm.footer || "Issued by ZSmartClass"}
                      </div>
                      <div style={{ position: "absolute", left: 0, right: 0, top: "93.8%", textAlign: "center", color: "#cbd5e1", fontSize: "0.83cqw" }}>
                        Verify at: your-site.com/verify-certificate/[Certificate ID]
                      </div>
                    </div>

                    <div className="template-preview-note">
                      <Info size={14} />
                      <span>This preview mirrors the actual downloaded certificate. Student name, date, ID, and QR code are filled in automatically when issued.</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowTemplateModal(false)}
                disabled={templateSaveLoading}
              >
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleSaveTemplate}
                disabled={templateSaveLoading || templateLoading}
              >
                {templateSaveLoading ? "Saving..." : "Save Template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCertificates;