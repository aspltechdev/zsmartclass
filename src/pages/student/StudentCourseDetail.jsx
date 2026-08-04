// src/pages/student/StudentCourseDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  PlayCircle,
  FileText,
  Link as LinkIcon,
  CheckCircle,
  Circle,
  Lock,
  ChevronDown,
  Award,
  Clock,
  BarChart3,
} from "lucide-react";
import api from "../../services/api";
import "./StudentCourseDetail.css";

function StudentCourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);
  const [openModuleId, setOpenModuleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [requestingCert, setRequestingCert] = useState(false);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const [courseRes, modulesRes, lessonsRes, enrollRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get("/modules").catch(() => ({ data: { data: [] } })),
        api.get("/lessons").catch(() => ({ data: { data: [] } })),
        api.get("/enrollments/my").catch(() => ({ data: { data: [] } })),
      ]);

      const courseData = courseRes.data?.data || courseRes.data;
      const allModules = (modulesRes.data?.data || modulesRes.data || [])
        .filter((m) => m.courseId === Number(courseId))
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      const allLessons = lessonsRes.data?.data || lessonsRes.data || [];
      const myEnrollments = enrollRes.data?.data || enrollRes.data || [];
      const myEnrollment = myEnrollments.find((e) => e.courseId === Number(courseId));

      setCourse(courseData);
      setModules(allModules);
      setLessons(allLessons);
      setEnrollment(myEnrollment || null);
      setCompletedLessonIds(myEnrollment?.completedLessonIds || []);
      if (allModules.length > 0) setOpenModuleId(allModules[0].id);
    } catch (err) {
      console.error(err);
      setLoadError("Couldn't load this course. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const lessonsForModule = (moduleId) =>
    lessons
      .filter((l) => l.moduleId === moduleId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));

  const totalLessons = modules.reduce((sum, m) => sum + lessonsForModule(m.id).length, 0);

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      await api.post("/enrollments", { courseId: Number(courseId) });
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't enroll in this course.");
    } finally {
      setEnrolling(false);
    }
  };

  // NOTE: there's no lesson-progress endpoint visible in the admin files you've
  // shared so far — this assumes a PUT /enrollments/:id/progress that takes the
  // lesson just completed and lets the backend recompute the percentage.
  // Point me at the real route once you have it and I'll swap this one line.
  const handleToggleLesson = async (lesson) => {
    if (!enrollment) return;
    const isDone = completedLessonIds.includes(lesson.id);
    const nextIds = isDone
      ? completedLessonIds.filter((id) => id !== lesson.id)
      : [...completedLessonIds, lesson.id];

    setCompletedLessonIds(nextIds);

    try {
      const res = await api.put(`/enrollments/${enrollment.id}/progress`, {
        lessonId: lesson.id,
        completed: !isDone,
      });
      const updated = res.data?.data || res.data;
      if (updated) {
        setEnrollment(updated);
      }
    } catch (err) {
      console.error("Progress update failed:", err);
      setCompletedLessonIds(completedLessonIds);
    }
  };

  const handleRequestCertificate = async () => {
    try {
      setRequestingCert(true);
      await api.post("/certificates/request", { courseId: Number(courseId) });
      alert("Certificate requested — you'll be notified once it's reviewed.");
      navigate("/student/certificates");
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't request a certificate right now.");
    } finally {
      setRequestingCert(false);
    }
  };

  const lessonIcon = (videoType) => {
    if (videoType === "DOCUMENT") return FileText;
    if (videoType === "LINK") return LinkIcon;
    return PlayCircle;
  };

  if (loading) {
    return (
      <div className="course-detail-page">
        <div className="loading-state">Loading course…</div>
      </div>
    );
  }

  if (loadError || !course) {
    return (
      <div className="course-detail-page">
        <div className="error-banner">{loadError || "Course not found."}</div>
      </div>
    );
  }

  const progress = enrollment?.progress || 0;

  return (
    <div className="course-detail-page">
      <div className="course-hero">
        <div className="course-hero-info">
          {course.level && <span className="level-pill">{course.level}</span>}
          <h1>{course.title}</h1>
          <p>{course.subtitle || course.description}</p>

          <div className="course-hero-meta">
            {course.duration && (
              <span>
                <Clock size={14} /> {course.duration}
              </span>
            )}
            <span>
              <BarChart3 size={14} /> {totalLessons} lessons
            </span>
          </div>

          {!enrollment ? (
            <button className="btn-primary" onClick={handleEnroll} disabled={enrolling}>
              {enrolling ? "Enrolling…" : course.isFree ? "Enroll for free" : `Enroll — $${course.discountPrice || course.price}`}
            </button>
          ) : enrollment.completed ? (
            <div className="completed-row">
              <span className="completed-tag">
                <CheckCircle size={15} /> Course completed
              </span>
              {enrollment.certificateNo ? (
                <button className="btn-secondary" onClick={() => navigate("/student/certificates")}>
                  <Award size={15} /> View certificate
                </button>
              ) : (
                <button className="btn-primary" onClick={handleRequestCertificate} disabled={requestingCert}>
                  <Award size={15} /> {requestingCert ? "Requesting…" : "Request certificate"}
                </button>
              )}
            </div>
          ) : (
            <div className="progress-row">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span>{progress}% complete</span>
            </div>
          )}
        </div>
      </div>

      <div className="curriculum-block">
        <h2>Course content</h2>

        {modules.length === 0 ? (
          <div className="empty-state">No modules published for this course yet.</div>
        ) : (
          <div className="module-list">
            {modules.map((mod) => {
              const modLessons = lessonsForModule(mod.id);
              const isOpen = openModuleId === mod.id;
              return (
                <div key={mod.id} className="module-item">
                  <button
                    className="module-header"
                    onClick={() => setOpenModuleId(isOpen ? null : mod.id)}
                  >
                    <span>{mod.title}</span>
                    <div className="module-header-right">
                      <span className="module-count">{modLessons.length} lessons</span>
                      <ChevronDown
                        size={16}
                        style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }}
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="lesson-list">
                      {modLessons.map((lesson) => {
                        const Icon = lessonIcon(lesson.videoType);
                        const isDone = completedLessonIds.includes(lesson.id);
                        const locked = !enrollment && !lesson.isPreview;

                        return (
                          <div
                            key={lesson.id}
                            className={`lesson-row ${locked ? "locked" : ""}`}
                            onClick={() => !locked && enrollment && handleToggleLesson(lesson)}
                          >
                            <span className="lesson-check">
                              {locked ? (
                                <Lock size={16} />
                              ) : isDone ? (
                                <CheckCircle size={18} className="check-done" />
                              ) : (
                                <Circle size={18} className="check-empty" />
                              )}
                            </span>
                            <Icon size={15} className="lesson-type-icon" />
                            <span className="lesson-title">{lesson.title}</span>
                            {lesson.duration && <span className="lesson-duration">{lesson.duration}</span>}
                            {lesson.isPreview && !enrollment && (
                              <span className="preview-tag">Preview</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentCourseDetail;