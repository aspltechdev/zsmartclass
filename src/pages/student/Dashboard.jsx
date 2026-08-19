import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import {
  BookOpen,
  Award,
  Clock,
  ChevronRight,
  TrendingUp,
  Calendar
} from 'lucide-react';

// Single source of truth for HTTP: base URL + auth token are handled inside
// api.js (interceptor), so pages never touch localStorage/sessionStorage or
// hardcode a host. No per-domain "dashboard.service" wrapper in between.
import api from '../../services/api';

import './Dashboard.css';

/**
 * Progress model (see backend progress.service.js):
 *   progress = completed lessons ÷ total course lessons, in [0, 100].
 * The backend recomputes it on every lesson completion and stores it on the
 * Enrollment row, so each enrollment in `recentCourses` already carries a
 * `progress` number. We read that directly instead of re-deriving from
 * watchedSeconds/durationSeconds (which nothing populates -> always 0%).
 */
const clampPct = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
};

const enrollmentProgress = (enrollment) => clampPct(enrollment?.progress);

const Dashboard = () => {

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================
  // FETCH DASHBOARD
  // ==========================================

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // GET /dashboard/student  ->  { success, data: {...} }
      const res = await api.get('/dashboard/student');
      const body = res.data;

      if (!body?.success) {
        setError(body?.message || 'Failed to load dashboard data');
        return;
      }

      setDashboardData(body.data);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-icon">⚠️</div>
        <h3>Unable to load dashboard</h3>
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  // ==========================================
  // NO COURSES
  // ==========================================

  if (!dashboardData || dashboardData.myCourses === 0) {
    return (
      <div className="dashboard-empty">
        <div className="empty-icon">📚</div>
        <h2>Welcome to Your Learning Dashboard</h2>
        <p>
          You haven't enrolled in any courses yet. An admin will grant you
          access — check back once you've been enrolled.
        </p>
      </div>
    );
  }

  // ==========================================
  // DERIVED VALUES
  // ==========================================

  const recentCourses = dashboardData.recentCourses || [];

  const overallProgress =
    recentCourses.length > 0
      ? clampPct(
          recentCourses.reduce(
            (sum, enrollment) => sum + enrollmentProgress(enrollment),
            0
          ) / recentCourses.length
        )
      : 0;

  const completedCourses = dashboardData.completedCourses || 0;

  const inProgressCourses = Math.max(
    0,
    dashboardData.myCourses - completedCourses
  );

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="dashboard-container">

      {/* ====================================== WELCOME ====================================== */}
      <div className="dashboard-welcome">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back! Continue your learning journey.
          </p>
        </div>

        <div className="welcome-date">
          <Calendar size={16} />
          <span>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
      </div>

      {/* ====================================== STATS ====================================== */}
      <div className="stats-grid">

        {/* ENROLLED */}
        <div className="stat-card">
          <div className="stat-icon-wrapper enrolled">
            <BookOpen size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{dashboardData.myCourses}</span>
            <span className="stat-label">Enrolled Courses</span>
          </div>
        </div>

        {/* COMPLETED */}
        <div className="stat-card">
          <div className="stat-icon-wrapper completed">
            <Award size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{completedCourses}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>

        {/* OVERALL PROGRESS */}
        <div className="stat-card">
          <div className="stat-icon-wrapper progress">
            <TrendingUp size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{overallProgress}%</span>
            <span className="stat-label">Overall Progress</span>
          </div>
        </div>

        {/* IN PROGRESS */}
        <div className="stat-card">
          <div className="stat-icon-wrapper in-progress">
            <Clock size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{inProgressCourses}</span>
            <span className="stat-label">In Progress</span>
          </div>
        </div>
      </div>

      {/* ====================================== RECENT COURSES ====================================== */}
      <div className="recent-section">
        <div className="section-header">
          <h2>Recent Courses</h2>
          <Link to="/student/my-courses" className="view-all">
            View All
            <ChevronRight size={16} />
          </Link>
        </div>

        <div className="recent-grid">
          {recentCourses.length > 0 ? (
            recentCourses.map((enrollment) => {
              const courseProgress = enrollmentProgress(enrollment);

              return (
                <div key={enrollment.id} className="recent-card">

                  {/* THUMBNAIL */}
                  <div className="recent-card-thumbnail">
                    {enrollment.course?.thumbnail ? (
                      <img
                        src={enrollment.course.thumbnail}
                        alt={enrollment.course.title}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="thumbnail-placeholder">
                        <BookOpen size={28} />
                      </div>
                    )}

                    {enrollment.completed && (
                      <span className="completed-badge">
                        <Award size={12} />
                        Completed
                      </span>
                    )}
                  </div>

                  {/* BODY */}
                  <div className="recent-card-body">
                    <h4 className="recent-card-title">
                      {enrollment.course?.title || 'Course'}
                    </h4>

                    <div className="recent-card-meta">
                      <span>
                        <Calendar size={14} />
                        {enrollment.enrolledAt
                          ? new Date(enrollment.enrolledAt).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>

                    {/* COMPLETED-LESSONS PROGRESS */}
                    <div className="recent-card-progress">
                      <div className="mini-progress">
                        <div
                          className="mini-progress-fill"
                          style={{ width: `${courseProgress}%` }}
                        />
                      </div>
                      <span className="mini-progress-text">
                        {courseProgress}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-recent-courses">
              <p>No recent courses</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;