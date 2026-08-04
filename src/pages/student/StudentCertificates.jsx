// src/pages/student/StudentCertificates.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  ShieldCheck,
} from "lucide-react";
import api from "../../services/api";
import "./StudentCertificates.css";

const TABS = [
  { key: "all", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "ACTIVE", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

function StudentCertificates() {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [downloadingCertNo, setDownloadingCertNo] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setLoadError("");
      const res = await api.get("/certificates/my");
      setCertificates(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
      setLoadError("Couldn't load your certificates. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certNo) => {
    if (!certNo || certNo === "N/A") return;
    try {
      setDownloadingCertNo(certNo);
      const res = await api.get(`/certificates/download/${certNo}`);
      const payload = res.data?.data || res.data;
      const { pdfBuffer, filename } = payload;
      if (!pdfBuffer) throw new Error("No PDF data returned");

      const byteCharacters = atob(pdfBuffer);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `Certificate_${certNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert(err.response?.data?.message || "Couldn't download this certificate.");
    } finally {
      setDownloadingCertNo(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filtered = certificates.filter((c) => {
    if (activeTab === "all") return true;
    return (c.status || "PENDING") === activeTab;
  });

  const statusMeta = (status) => {
    if (status === "ACTIVE") return { label: "Approved", icon: CheckCircle, cls: "active" };
    if (status === "REJECTED") return { label: "Rejected", icon: XCircle, cls: "rejected" };
    if (status === "REVOKED") return { label: "Revoked", icon: XCircle, cls: "rejected" };
    return { label: "Pending review", icon: Clock, cls: "pending" };
  };

  if (loading) {
    return (
      <div className="certificates-page">
        <div className="loading-state">Loading your certificates…</div>
      </div>
    );
  }

  return (
    <div className="certificates-page">
      <div className="dashboard-title">
        <h1>Certificates</h1>
        <p>Track certificate requests and download the ones you've earned.</p>
      </div>

      {loadError && <div className="error-banner">{loadError}</div>}

      <div className="tabs-row">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Award size={32} />
          <p>
            {activeTab === "all"
              ? "No certificate requests yet. Complete a course to request one."
              : "Nothing in this category."}
          </p>
          {activeTab === "all" && (
            <button className="btn-primary" onClick={() => navigate("/student/my-courses")}>
              View my courses
            </button>
          )}
        </div>
      ) : (
        <div className="certificate-grid">
          {filtered.map((cert) => {
            const meta = statusMeta(cert.status);
            const StatusIcon = meta.icon;
            const certNo = cert.certificateNo || cert.certNo;

            return (
              <div key={cert.id} className="certificate-card">
                <div className="certificate-card-top">
                  <div className="cert-icon">
                    <Award size={22} />
                  </div>
                  <span className={`cert-status-badge ${meta.cls}`}>
                    <StatusIcon size={13} />
                    {meta.label}
                  </span>
                </div>

                <h3>{cert.course?.title || `Course ${cert.courseId}`}</h3>

                <div className="cert-details">
                  <div>
                    <label>Requested</label>
                    <span>{formatDate(cert.createdAt)}</span>
                  </div>
                  {cert.status === "ACTIVE" && (
                    <div>
                      <label>Certificate no.</label>
                      <span className="cert-no">{certNo}</span>
                    </div>
                  )}
                  {cert.status === "REJECTED" && cert.reason && (
                    <div className="full-width">
                      <label>Reason</label>
                      <span>{cert.reason}</span>
                    </div>
                  )}
                </div>

                {cert.status === "ACTIVE" && (
                  <div className="cert-actions">
                    <button
                      className="btn-primary"
                      onClick={() => handleDownload(certNo)}
                      disabled={downloadingCertNo === certNo}
                    >
                      <Download size={14} />
                      {downloadingCertNo === certNo ? "Downloading…" : "Download"}
                    </button>
                    <span className="verify-hint">
                      <ShieldCheck size={12} /> Verifiable with certificate no.
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StudentCertificates;