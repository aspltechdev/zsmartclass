// src/pages/student/StudentMyCourses.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlayCircle, CheckCircle, Award, TrendingUp } from "lucide-react";
import api from "../../services/api";
import "./StudentMyCourses.css";

const TABS = [
  { key: "all", label: "All" },
  { key: "inProgress", label: "In progress" },
  { key: "completed", label: "Completed" },
];

function StudentMyCourses() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [requestingCourseId, setRequestingCourseId] = useState(null);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setLoadError("");
      const res = await api.get("/enrollments/my-courses");
      setEnrollments(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
      setLoadError("Couldn't load your courses. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCertificate = async (courseId) => {
    try {
      setRequestingCourseId(courseId);
      await api.post("/certificates/request", { courseId });
      alert("Certificate requested — you'll be notified once it's reviewed.");
      fetchEnrollments();
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't request a certificate right now.");
    } finally {
      setRequestingCourseId(null);
    }
  };

  const filtered = enrollments.filter((e) => {
    if (activeTab === "inProgress") return !e.completed;
    if (activeTab === "completed") return e.completed;
    return true;
  });

  if (loading) {
    return (
      <div className="my-courses-page">
        <div className="loading-state">Loading your courses…</div>
      </div>
    );
  }

  return (
    <div className="my-courses-page">
      <div className="dashboard-title">
        <h1>My courses</h1>
        <p>Everything you're enrolled in, in one place.</p>
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
            {tab.key !== "all" && (
              <span className="tab-count">
                {tab.key === "completed"
                  ? enrollments.filter((e) => e.completed).length
                  : enrollments.filter((e) => !e.completed).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <PlayCircle size={32} />
          <p>Nothing here yet.</p>
          <button className="btn-primary" onClick={() => navigate("/student/courses")}>
            Browse courses
          </button>
        </div>
      ) : (
        <div className="my-course-list">
          {filtered.map((enrollment) => (
            <div key={enrollment.id} className="my-course-row">
              <div
                className="my-course-thumb"
                onClick={() => navigate(`/student/courses/${enrollment.courseId}`)}
              >
                {enrollment.course?.thumbnail ? (
                  <img src={enrollment.course.thumbnail} alt="" />
                ) : (
                  <PlayCircle size={26} />
                )}
              </div>

              <div className="my-course-info">
                <h3 onClick={() => navigate(`/student/courses/${enrollment.courseId}`)}>
                  {enrollment.course?.title || `Course ${enrollment.courseId}`}
                </h3>

                {enrollment.completed ? (
                  <span className="status-tag completed">
                    <CheckCircle size={13} /> Completed
                  </span>
                ) : (
                  <div className="progress-inline">
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${enrollment.progress || 0}%` }} />
                    </div>
                    <span>{enrollment.progress || 0}%</span>
                  </div>
                )}
              </div>

              <div className="my-course-actions">
                {enrollment.completed ? (
                  enrollment.certificateNo ? (
                    <button className="btn-secondary" onClick={() => navigate("/student/certificates")}>
                      <Award size={14} /> View certificate
                    </button>
                  ) : (
                    <button
                      className="btn-primary"
                      onClick={() => handleRequestCertificate(enrollment.courseId)}
                      disabled={requestingCourseId === enrollment.courseId}
                    >
                      <Award size={14} />
                      {requestingCourseId === enrollment.courseId ? "Requesting…" : "Request certificate"}
                    </button>
                  )
                ) : (
                  <button
                    className="btn-continue"
                    onClick={() => navigate(`/student/courses/${enrollment.courseId}`)}
                  >
                    <TrendingUp size={14} /> Continue
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentMyCourses;