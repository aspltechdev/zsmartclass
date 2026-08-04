// src/pages/student/StudentDashboard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Award,
  TrendingUp,
  CheckCircle,
  Clock,
  Download,
  ArrowRight,
  PlayCircle,
  AlertCircle,
} from "lucide-react";
import api from "../../services/api";
import "./StudentDashboard.css";

function StudentDashboard() {
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [downloadingCertNo, setDownloadingCertNo] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setLoadError("");

      console.log("🔍 Fetching student dashboard data...");

      // Fetch enrollments and certificates
      const [enrollRes, certRes] = await Promise.all([
        api.get("/enrollments/my-courses").catch((err) => {
          console.error("❌ Enrollments fetch error:", err);
          // Try alternative endpoint if first fails
          return api.get("/enrollments").catch(() => ({ data: { data: [] } }));
        }),
        api.get("/certificates/my-certificates").catch((err) => {
          console.error("❌ Certificates fetch error:", err);
          // Try alternative endpoint if first fails
          return api.get("/certificates").catch(() => ({ data: { data: [] } }));
        }),
      ]);

      // Process enrollments
      let enrollmentsData = enrollRes.data?.data || enrollRes.data || [];
      if (!Array.isArray(enrollmentsData)) {
        enrollmentsData = [];
      }
      
      // Process certificates
      let certificatesData = certRes.data?.data || certRes.data || [];
      if (!Array.isArray(certificatesData)) {
        certificatesData = [];
      }

      console.log("📊 Enrollments found:", enrollmentsData.length);
      console.log("📊 Certificates found:", certificatesData.length);

      setEnrollments(enrollmentsData);
      setCertificates(certificatesData);

      if (enrollmentsData.length === 0 && certificatesData.length === 0) {
        setLoadError("No courses or certificates found. Start learning today!");
      }

    } catch (err) {
      console.error("❌ Error loading dashboard:", err);
      setLoadError("Couldn't load your dashboard. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const inProgress = enrollments.filter((e) => !e.completed && e.progress > 0);
  const completed = enrollments.filter((e) => e.completed);
  const notStarted = enrollments.filter((e) => !e.completed && (!e.progress || e.progress === 0));

  const stats = [
    {
      label: "Enrolled courses",
      value: enrollments.length,
      icon: BookOpen,
      tone: "purple",
    },
    {
      label: "In progress",
      value: inProgress.length,
      icon: TrendingUp,
      tone: "amber",
    },
    {
      label: "Completed",
      value: completed.length,
      icon: CheckCircle,
      tone: "green",
    },
    {
      label: "Certificates earned",
      value: certificates.filter((c) => c.status === "ACTIVE" || c.status === "active").length,
      icon: Award,
      tone: "blue",
    },
  ];

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

  // Debug function
  const debugData = () => {
    console.log("🔍 Debug Info:");
    console.log("Enrollments:", enrollments);
    console.log("Certificates:", certificates);
    alert(`Enrollments: ${enrollments.length}\nCertificates: ${certificates.length}\n\nCheck console for full data.`);
  };

  if (loading) {
    return (
      <div className="student-dashboard-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard-page">
      <div className="dashboard-title">
        <h1>Welcome back 👋</h1>
        <p>Here's where you left off, and what you've earned so far.</p>
      </div>

      {loadError && (
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>{loadError}</span>
          <button className="retry-btn" onClick={fetchDashboardData}>
            Retry
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="stat-cards">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`stat-card tone-${stat.tone}`}>
              <div className="stat-icon">
                <Icon size={22} />
              </div>
              <div>
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Continue learning */}
      <div className="section-block">
        <div className="section-header">
          <h2>Continue learning</h2>
          <Link to="/student/my-courses" className="see-all-link">
            See all <ArrowRight size={15} />
          </Link>
        </div>

        {enrollments.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={32} />
            <p>You haven't enrolled in any courses yet.</p>
            <Link to="/student/courses" className="btn-primary">
              Browse courses
            </Link>
          </div>
        ) : inProgress.length === 0 && notStarted.length === 0 ? (
          <div className="empty-state">
            <CheckCircle size={32} />
            <p>You've completed all your courses! 🎉</p>
            <Link to="/student/courses" className="btn-primary">
              Find more courses
            </Link>
          </div>
        ) : (
          <div className="continue-grid">
            {[...inProgress, ...notStarted].slice(0, 3).map((enrollment) => (
              <Link
                to={`/student/courses/${enrollment.courseId}`}
                key={enrollment.id}
                className="continue-card"
              >
                <div className="continue-thumb">
                  {enrollment.course?.thumbnail ? (
                    <img src={enrollment.course.thumbnail} alt="" />
                  ) : (
                    <PlayCircle size={28} />
                  )}
                </div>
                <div className="continue-body">
                  <h4>{enrollment.course?.title || `Course ${enrollment.courseId}`}</h4>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${enrollment.progress || 0}%` }}
                    />
                  </div>
                  <span className="progress-label">{enrollment.progress || 0}% complete</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent certificates */}
      <div className="section-block">
        <div className="section-header">
          <h2>Your certificates</h2>
          <Link to="/student/certificates" className="see-all-link">
            See all <ArrowRight size={15} />
          </Link>
        </div>

        {certificates.length === 0 ? (
          <div className="empty-state">
            <Award size={32} />
            <p>No certificates yet. Complete a course to earn one.</p>
          </div>
        ) : (
          <div className="certificate-list">
            {certificates.slice(0, 3).map((cert) => (
              <div key={cert.id} className="certificate-row">
                <div className="certificate-icon">
                  <Award size={20} />
                </div>
                <div className="certificate-info">
                  <h4>{cert.courseTitle || cert.course?.title || `Course ${cert.courseId}`}</h4>
                  <span className={`cert-status status-${(cert.status || "pending").toLowerCase()}`}>
                    {cert.status === "PENDING" && <Clock size={12} />}
                    {cert.status === "ACTIVE" && <CheckCircle size={12} />}
                    {cert.status === "PENDING" ? "Pending review" : 
                     cert.status === "ACTIVE" ? "Approved" : 
                     cert.status === "REJECTED" ? "Rejected" : "Draft"}
                  </span>
                  <span className="certificate-date">Requested {formatDate(cert.createdAt)}</span>
                </div>
                {cert.status === "ACTIVE" && (
                  <button
                    className="download-btn"
                    title="Download certificate"
                    onClick={() => handleDownload(cert.certificateNo || cert.certNo)}
                    disabled={downloadingCertNo === (cert.certificateNo || cert.certNo)}
                  >
                    <Download size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;