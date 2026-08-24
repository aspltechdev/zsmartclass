// src/pages/student/Dashboard.jsx

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowRight,
  Bell,
  BookOpen,
  Loader2,
  PlayCircle,
  TrendingUp,
  Flame,
  Trophy,
  Clock3,
  Target,
  CalendarDays,
  GraduationCap,
  Sparkles,
  ChevronRight
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import api from "../../services/api";

import "./Dashboard.css";
import "./StudentShared.css";

function Dashboard() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [courseProgress, setCourseProgress] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
     HELPERS
  ========================================================= */

  const unwrap = (response) => {
    return response?.data?.data ?? response?.data ?? null;
  };

  const getArray = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  };

  const formatTime = (seconds) => {
    const value = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  /* =========================================================
     PROFILE
  ========================================================= */

  const loadProfile = async () => {
    try {
      const response = await api.get("/users/me");
      const data = unwrap(response);
      if (data) setProfile(data);
    } catch (err) {
      console.error("Dashboard profile error:", err);
    }
  };

  /* =========================================================
     COURSES
  ========================================================= */

  const loadCourses = async () => {
    try {
      const response = await api.get("/enrollments/my-courses");
      const data = unwrap(response);
      const enrolledCourses = getArray(data);

      // Sort by newest first
      enrolledCourses.sort((a, b) => {
        const dateA = new Date(a?.enrolledAt || a?.createdAt || 0).getTime();
        const dateB = new Date(b?.enrolledAt || b?.createdAt || 0).getTime();
        return dateB - dateA;
      });

      setCourses(enrolledCourses);

      // Fetch progress for each course
      const progressRequests = await Promise.all(
        enrolledCourses.map(async (enrollment) => {
          const courseId = Number(enrollment?.courseId || enrollment?.course?.id);

          if (!Number.isInteger(courseId)) return null;

          try {
            // ✅ FIX: Use player/course endpoint (returns 200, not 400)
            const progressResponse = await api.get(
              `/player/course/${courseId}/progress`
            );

            const payload = unwrap(progressResponse) || {};
            const lessonMap = payload.lessons || {};
            const lessonList = Object.values(lessonMap);

            const completedLessons = lessonList.filter(
              (item) => item?.completed
            ).length;

            const overall = Number(payload.overallProgress || 0);

            // Derive total lessons from percentage
            const derivedTotal = overall > 0 && completedLessons > 0
              ? Math.round(completedLessons / (overall / 100))
              : 0;

            const totalLessons =
              Number(payload.totalLessons) ||
              Number(enrollment?.course?.totalLessons) ||
              derivedTotal ||
              lessonList.length;

            const watchedSeconds = lessonList.reduce(
              (sum, item) => sum + (Number(item?.watchedSeconds) || 0),
              0
            );

            return {
              courseId,
              data: {
                progress: overall,
                completedLessons,
                totalLessons,
                watchedSeconds,
              },
            };
          } catch (err) {
            console.error(`Progress error for course ${courseId}:`, err);
            return {
              courseId,
              data: {
                progress: Number(enrollment?.progress || 0),
                completedLessons: 0,
                totalLessons: Number(enrollment?.course?.totalLessons || 0),
                watchedSeconds: 0,
              },
            };
          }
        })
      );

      const progressMap = {};
      progressRequests.forEach((item) => {
        if (!item) return;
        progressMap[item.courseId] = item.data;
      });

      setCourseProgress(progressMap);
    } catch (err) {
      console.error("Dashboard courses error:", err);
      setCourses([]);
    }
  };

  /* =========================================================
     NOTIFICATIONS
  ========================================================= */

  const loadNotifications = async () => {
    try {
      const response = await api.get("/notifications");
      const list = getArray(unwrap(response));
      setNotifications(list);
    } catch (err) {
      console.error("Dashboard notifications error:", err);
      setNotifications([]);
    }
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        await Promise.all([
          loadProfile(),
          loadCourses(),
          loadNotifications(),
        ]);
      } catch (err) {
        console.error("Dashboard loading error:", err);
        if (mounted) {
          setError("Unable to load dashboard data.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================================
     DERIVED DATA
  ========================================================= */

  const getCourseProgress = (enrollment) => {
    const courseId = Number(enrollment?.courseId || enrollment?.course?.id);
    const saved = courseProgress[courseId];
    const value = saved?.progress ?? enrollment?.progress ?? 0;
    return Math.min(100, Math.max(0, Math.round(Number(value) || 0)));
  };

  const dashboardCourses = useMemo(() => {
    return courses.map((enrollment) => {
      const course = enrollment?.course || {};
      const courseId = Number(enrollment?.courseId || course?.id);
      const progress = getCourseProgress(enrollment);
      const progressData = courseProgress[courseId] || {};

      return {
        ...enrollment,
        id: courseId,
        course,
        title: course?.title || enrollment?.courseTitle || "Untitled Course",
        thumbnail: course?.thumbnail || enrollment?.thumbnail || "/default-course.jpg",
        instructor: course?.createdBy || course?.instructor || enrollment?.instructor || null,
        progress,
        completedLessons: Number(progressData?.completedLessons || 0),
        totalLessons: Number(progressData?.totalLessons || course?.totalLessons || 0),
        watchedSeconds: Number(progressData?.watchedSeconds || 0),
      };
    });
  }, [courses, courseProgress]);

  const continueCourses = useMemo(() => {
    return dashboardCourses
      .filter((course) => Number(course.progress) < 100)
      .sort((a, b) => Number(b.progress) - Number(a.progress))
      .slice(0, 3);
  }, [dashboardCourses]);

  const recentCourses = useMemo(() => {
    return dashboardCourses.slice(0, 4);
  }, [dashboardCourses]);

  const overallProgress = useMemo(() => {
    if (dashboardCourses.length === 0) return 0;
    const total = dashboardCourses.reduce(
      (sum, course) => sum + Number(course.progress || 0),
      0
    );
    return Math.round(total / dashboardCourses.length);
  }, [dashboardCourses]);

  const unreadNotifications = notifications.filter(
    (notification) => !notification?.read && !notification?.isRead
  ).length;

  /* =========================================================
     DERIVED GREETING VALUES
  ========================================================= */

  const firstName = (profile?.name || "there").split(" ")[0];
  const hour = new Date().getHours();
  const greetingLabel =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const progressValues = Object.values(courseProgress || {});

  const totalWatchedSeconds = progressValues.reduce(
    (sum, p) => sum + (Number(p?.watchedSeconds) || 0),
    0
  );

  const totalWatchLabel =
    totalWatchedSeconds >= 3600
      ? `${Math.floor(totalWatchedSeconds / 3600)}h ${Math.floor(
          (totalWatchedSeconds % 3600) / 60
        )}m`
      : `${Math.floor(totalWatchedSeconds / 60)}m`;

  const inProgressCount = progressValues.filter(
    (p) =>
      (Number(p?.completedLessons) || 0) > 0 &&
      (Number(p?.completedLessons) || 0) < (Number(p?.totalLessons) || 0)
  ).length;

  const completedCourses = progressValues.filter(
    (p) => Number(p?.progress || 0) >= 100
  ).length;

  /* =========================================================
     HANDLERS
  ========================================================= */

  const handleContinue = (course) => {
    const courseId = Number(course?.courseId || course?.id || course?.course?.id);
    if (!Number.isInteger(courseId)) return;
    navigate(`/student/player/${courseId}`);
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="student-dashboard-page">
        <div className="student-dashboard-loading">
          <Loader2 size={38} className="dashboard-spinner" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  /* =========================================================
     MAIN
  ========================================================= */

  return (
    <div className="student-dashboard-page">
      <div className="student-dashboard-container">

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="dashboard-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* =================================================
            GREETING HERO
        ================================================= */}

        <section className="dashboard-hero">
          <div className="dashboard-hero-text">
            <span className="dashboard-hero-eyebrow">{greetingLabel}</span>
            <h1>
              Hello, {firstName}
              <span className="wave">👋</span>
            </h1>
            <p>
              {inProgressCount > 0
                ? `You have ${inProgressCount} course${inProgressCount === 1 ? "" : "s"} in progress. Keep it going!`
                : "Ready to start learning today?"}
            </p>
            <div className="dashboard-hero-meta">
              <span>
                <CalendarDays size={14} />
                {todayLabel}
              </span>
              <span>
                <Clock3 size={14} />
                {totalWatchLabel} watched
              </span>
            </div>
          </div>

          {/* REMOVED LESSONS DONE AND LESSONS LEFT FROM HERE */}
        </section>

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <section className="dashboard-summary-grid">
          <div className="dashboard-summary-card">
            <div className="dashboard-summary-icon blue">
              <BookOpen size={20} />
            </div>
            <div>
              <span>Enrolled Courses</span>
              <strong>{dashboardCourses.length}</strong>
            </div>
          </div>

          <div className="dashboard-summary-card">
            <div className="dashboard-summary-icon purple">
              <TrendingUp size={20} />
            </div>
            <div>
              <span>Overall Progress</span>
              <strong>{overallProgress}%</strong>
            </div>
          </div>

          <div className="dashboard-summary-card">
            <div className="dashboard-summary-icon green">
              <Trophy size={20} />
            </div>
            <div>
              <span>Completed</span>
              <strong>{completedCourses}</strong>
            </div>
          </div>

          <div className="dashboard-summary-card">
            <div className="dashboard-summary-icon orange">
              <Bell size={20} />
            </div>
            <div>
              <span>Unread</span>
              <strong>{unreadNotifications}</strong>
            </div>
          </div>
        </section>

        {/* =================================================
            CONTINUE LEARNING
        ================================================= */}

        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <span className="dashboard-section-label">KEEP LEARNING</span>
              <h2>Continue Learning</h2>
            </div>
            <button
              type="button"
              className="dashboard-text-button"
              onClick={() => navigate("/student/my-courses")}
            >
              View all
              <ChevronRight size={15} />
            </button>
          </div>

          {continueCourses.length === 0 ? (
            <div className="dashboard-empty-card">
              <BookOpen size={32} />
              <h3>No courses in progress</h3>
              <p>Start a course to see your progress here.</p>
            </div>
          ) : (
            <div className="dashboard-progress-list">
              {continueCourses.map((course) => (
                <div className="dashboard-progress-card" key={course.id}>
                  <div className="dashboard-course-image">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      onError={(event) => {
                        event.currentTarget.src = "/default-course.jpg";
                      }}
                    />
                  </div>

                  <div className="dashboard-progress-content">
                    <div className="dashboard-course-tag">Continue Learning</div>
                    <h4>{course.title}</h4>

                    <div className="dashboard-course-progress">
                      <div className="dashboard-course-progress-top">
                        <span>Your Progress</span>
                        <strong>{course.progress}%</strong>
                      </div>
                      <div className="dashboard-progress-track">
                        <div
                          className="dashboard-progress-fill"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <div className="dashboard-course-progress-bottom">
                        <span>
                          {course.completedLessons} of {course.totalLessons || 0} lessons
                        </span>
                        <span>{formatTime(course.watchedSeconds)} watched</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="dashboard-continue-button"
                      onClick={() => handleContinue(course)}
                    >
                      <PlayCircle size={16} />
                      Continue
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* =================================================
            RECENT COURSES
        ================================================= */}

        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <span className="dashboard-section-label">RECENT ACTIVITY</span>
              <h2>Recent Courses</h2>
            </div>
            <button
              type="button"
              className="dashboard-text-button"
              onClick={() => navigate("/student/my-courses")}
            >
              View all
              <ChevronRight size={15} />
            </button>
          </div>

          {recentCourses.length === 0 ? (
            <div className="dashboard-empty-card">
              <BookOpen size={30} />
              <h3>No enrolled courses</h3>
              <p>Your recent courses will appear here.</p>
            </div>
          ) : (
            <div className="recent-course-grid">
              {recentCourses.map((course) => (
                <button
                  type="button"
                  className="recent-course-card"
                  key={course.id}
                  onClick={() => handleContinue(course)}
                >
                  <div className="recent-course-image">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      onError={(event) => {
                        event.currentTarget.src = "/default-course.jpg";
                      }}
                    />
                  </div>
                  <div className="recent-course-content">
                    <h3>{course.title}</h3>
                    <div className="recent-course-progress-text">
                      <span>Progress</span>
                      <strong>{course.progress}%</strong>
                    </div>
                    <div className="recent-course-track">
                      <div style={{ width: `${course.progress}%` }} />
                    </div>
                  </div>
                  <ArrowRight size={16} className="recent-course-arrow" />
                </button>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

export default Dashboard;