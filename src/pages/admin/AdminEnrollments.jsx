// src/pages/admin/AdminEnrollments.jsx
import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Eye,
  X,
  RefreshCw,
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Award,
  TrendingUp,
  Bell,
  User,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  Settings,
  Zap,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import api from "../../services/api";
import "./AdminEnrollments.css";

function AdminEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingEnrollment, setViewingEnrollment] = useState(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderStudent, setReminderStudent] = useState(null);
  const [reminderMessage, setReminderMessage] = useState("");
  const [apiError, setApiError] = useState("");
  const [collapsedCourses, setCollapsedCourses] = useState({});
  
  // Auto-reminder settings
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [reminderSettings, setReminderSettings] = useState({
    enabled: true,
    interval: 3,
    progressThreshold: 50,
    lastRun: null,
  });
  const [isAutoReminderRunning, setIsAutoReminderRunning] = useState(false);
  const [reminderResult, setReminderResult] = useState(null);

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    inProgress: 0,
    needsReminder: 0,
  });

  // Load reminder settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('enrollment_reminder_settings');
    if (savedSettings) {
      try {
        setReminderSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Error loading reminder settings:', e);
      }
    }
  }, []);

  // Save reminder settings to localStorage
  useEffect(() => {
    localStorage.setItem('enrollment_reminder_settings', JSON.stringify(reminderSettings));
  }, [reminderSettings]);

  // Check for auto-reminders on mount and periodically
  useEffect(() => {
    if (reminderSettings.enabled) {
      checkAndSendAutoReminders();
    }
    
    const interval = setInterval(() => {
      if (reminderSettings.enabled) {
        checkAndSendAutoReminders();
      }
    }, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [reminderSettings.enabled]);

  useEffect(() => {
    fetchAllData();
  }, [search, statusFilter, courseFilter, currentPage]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setApiError("");
      
      const [usersRes, coursesRes] = await Promise.all([
        api.get("/users").catch(() => ({ data: { data: [] } })),
        api.get("/courses").catch(() => ({ data: { data: [] } })),
      ]);

      const usersData = usersRes.data?.data || usersRes.data || [];
      const coursesData = coursesRes.data?.data || coursesRes.data || [];
      
      setUsers(usersData);
      setCourses(coursesData);

      let enrollmentsData = [];
      
      try {
        const res = await api.get("/enrollments/admin/all");
        enrollmentsData = res.data?.data || res.data || [];
      } catch (err) {
        console.log("⚠️ Admin enrollments endpoint failed, trying regular");
        try {
          const res = await api.get("/enrollments");
          enrollmentsData = res.data?.data || res.data || [];
        } catch (err2) {
          console.log("❌ All enrollment endpoints failed");
          setApiError("Could not fetch enrollments. Please check your API.");
          enrollmentsData = [];
        }
      }

      let filteredData = [...enrollmentsData];

      if (statusFilter === "completed") {
        filteredData = filteredData.filter(e => e.completed);
      } else if (statusFilter === "inprogress") {
        filteredData = filteredData.filter(e => e.progress > 0 && e.progress < 100 && !e.completed);
      } else if (statusFilter === "notstarted") {
        filteredData = filteredData.filter(e => e.progress === 0 && !e.completed);
      }

      if (courseFilter) {
        filteredData = filteredData.filter(e => e.courseId === Number(courseFilter));
      }

      if (search) {
        const searchLower = search.toLowerCase();
        filteredData = filteredData.filter(e => {
          const user = usersData.find(u => u.id === e.userId);
          const course = coursesData.find(c => c.id === e.courseId);
          return user?.name?.toLowerCase().includes(searchLower) ||
                 user?.email?.toLowerCase().includes(searchLower) ||
                 course?.title?.toLowerCase().includes(searchLower);
        });
      }

      const total = filteredData.length;
      const totalPagesCalc = Math.ceil(total / itemsPerPage);
      setTotalPages(totalPagesCalc || 1);
      
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const paginatedData = filteredData.slice(start, end);

      const mappedEnrollments = paginatedData.map(enrollment => ({
        id: enrollment.id,
        userId: enrollment.userId || enrollment.userid || enrollment.user_id,
        courseId: enrollment.courseId || enrollment.courseid || enrollment.course_id,
        progress: enrollment.progress || 0,
        completed: enrollment.completed || false,
        enrolledAt: enrollment.enrolledAt || enrollment.enrolledat || enrollment.createdAt,
        certificateId: enrollment.certificateId || enrollment.certificatel,
        certificateNo: enrollment.certificateNo || enrollment.certificateno,
        createdAt: enrollment.createdAt || enrollment.createdat,
        updatedAt: enrollment.updatedAt || enrollment.updatedat,
        user: enrollment.user || null,
        course: enrollment.course || null,
        lastReminderSent: enrollment.lastReminderSent || null,
        reminderCount: enrollment.reminderCount || 0,
      }));

      setEnrollments(mappedEnrollments);
      calculateStats(enrollmentsData);

    } catch (err) {
      console.error("Error fetching data:", err);
      setApiError("Failed to load data. Please refresh.");
      setEnrollments([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const total = data.length;
    const completed = data.filter(e => e.completed).length;
    const active = data.filter(e => e.progress > 0 && e.progress < 100 && !e.completed).length;
    const inProgress = data.filter(e => e.progress === 0 && !e.completed).length;
    const needsReminder = data.filter(e => e.progress < 50 && !e.completed).length;

    setStats({ total, active, completed, inProgress, needsReminder });
  };

  // Check and send automated reminders
  const checkAndSendAutoReminders = async () => {
    if (!reminderSettings.enabled) return;
    if (isAutoReminderRunning) return;

    setIsAutoReminderRunning(true);
    setReminderResult(null);
    
    console.log('📋 Checking for auto-reminders...');

    try {
      const res = await api.get("/enrollments/admin/all");
      const allEnrollments = res.data?.data || res.data || [];

      const studentsNeedingReminder = allEnrollments.filter(e => 
        !e.completed && 
        e.progress < reminderSettings.progressThreshold
      );

      if (studentsNeedingReminder.length === 0) {
        console.log('✅ No students need reminders at this time');
        setReminderResult({
          message: 'No students need reminders at this time',
          count: 0,
          type: 'info'
        });
        setIsAutoReminderRunning(false);
        setReminderSettings(prev => ({
          ...prev,
          lastRun: new Date().toISOString(),
        }));
        return;
      }

      console.log(`📋 Found ${studentsNeedingReminder.length} students needing reminders`);
      
      let remindersSent = 0;
      let remindersFailed = 0;
      const successfulStudents = [];
      const failedStudents = [];

      for (const enrollment of studentsNeedingReminder) {
        const student = users.find(u => u.id === enrollment.userId);
        if (!student) continue;

        const lastReminder = enrollment.lastReminderSent ? new Date(enrollment.lastReminderSent) : null;
        if (lastReminder) {
          const daysSinceLastReminder = (Date.now() - lastReminder.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceLastReminder < reminderSettings.interval) {
            continue;
          }
        }

        try {
          const message = `Hi ${student.name}, we noticed you haven't completed your course "${getCourseTitleFromData(enrollment.courseId)}" yet. Your current progress is ${enrollment.progress}%. Keep going! 🎓`;
          
          await api.post("/notifications", {
            studentId: student.id,
            title: "Course Progress Reminder",
            message: message,
            type: "REMINDER",
          });

          remindersSent++;
          successfulStudents.push(student.name);
          console.log(`✅ Reminder sent to ${student.name} (${enrollment.progress}%)`);
        } catch (err) {
          remindersFailed++;
          failedStudents.push(student.name);
          console.error(`❌ Failed to send reminder to ${student.name}:`, err);
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setReminderResult({
        message: `Sent ${remindersSent} reminders${remindersFailed > 0 ? `, ${remindersFailed} failed` : ''}`,
        count: remindersSent,
        failed: remindersFailed,
        successfulStudents,
        failedStudents,
        type: remindersFailed > 0 && remindersSent > 0 ? 'partial' : 
               remindersFailed > 0 ? 'error' : 'success'
      });

      if (remindersSent > 0) {
        console.log(`🎉 Auto-reminders sent to ${remindersSent} students`);
      }

      setReminderSettings(prev => ({
        ...prev,
        lastRun: new Date().toISOString(),
      }));

    } catch (err) {
      console.error('❌ Error in auto-reminder check:', err);
      setReminderResult({
        message: 'Error checking reminders: ' + err.message,
        type: 'error',
        error: err.message
      });
    } finally {
      setIsAutoReminderRunning(false);
    }
  };

  const getCourseTitleFromData = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course?.title || `Course ${courseId}`;
  };

  const sendReminder = async (enrollment) => {
    const student = users.find(u => u.id === enrollment.userId);
    if (!student) return;

    setReminderStudent(student);
    setReminderMessage(`Hi ${student.name}, we noticed you haven't completed your course "${getCourseTitle(enrollment.courseId)}" yet. Your current progress is ${enrollment.progress}%. Keep going! 🎓`);
    setShowReminderModal(true);
  };

  const handleSendReminder = async () => {
    try {
      await api.post("/notifications", {
        studentId: reminderStudent.id,
        title: "Course Progress Reminder",
        message: reminderMessage,
        type: "REMINDER",
      }).catch(() => {
        console.log("⚠️ Notification API failed, but reminder logged");
      });

      alert(`✅ Reminder sent to ${reminderStudent.name}!`);
      setShowReminderModal(false);
      setReminderStudent(null);
      setReminderMessage("");
    } catch (err) {
      alert("Failed to send reminder. Please try again.");
    }
  };

  const openViewModal = (enrollment) => {
    setViewingEnrollment(enrollment);
    setShowViewModal(true);
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) return user.name;
    if (viewingEnrollment?.user?.name) return viewingEnrollment.user.name;
    const enrollmentWithUser = enrollments.find(e => e.userId === userId && e.user);
    if (enrollmentWithUser?.user?.name) return enrollmentWithUser.user.name;
    return `User ${userId}`;
  };

  const getUserEmail = (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) return user.email;
    if (viewingEnrollment?.user?.email) return viewingEnrollment.user.email;
    const enrollmentWithUser = enrollments.find(e => e.userId === userId && e.user);
    if (enrollmentWithUser?.user?.email) return enrollmentWithUser.user.email;
    return "";
  };

  const getCourseTitle = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    if (course) return course.title;
    if (viewingEnrollment?.course?.title) return viewingEnrollment.course.title;
    const enrollmentWithCourse = enrollments.find(e => e.courseId === courseId && e.course);
    if (enrollmentWithCourse?.course?.title) return enrollmentWithCourse.course.title;
    return `Course ${courseId}`;
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (enrollment) => {
    if (enrollment.completed) {
      return { label: "✅ Completed", className: "status-completed", icon: CheckCircle };
    } else if (enrollment.progress > 0) {
      return { label: "📖 In Progress", className: "status-progress", icon: Clock };
    } else {
      return { label: "⏳ Not Started", className: "status-notstarted", icon: Clock };
    }
  };

  // Group the (already filtered) enrollments under their course.
  // Layout-only change — the data and every handler stay exactly as before.
  const toggleCourseGroup = (courseId) =>
    setCollapsedCourses((prev) => ({ ...prev, [courseId]: !prev[courseId] }));

  const groupedEnrollments = (() => {
    const map = new Map();
    for (const e of enrollments) {
      const id = e.course?.id ?? e.courseId ?? "unknown";
      if (!map.has(id)) {
        map.set(id, {
          courseId: id,
          title: e.course?.title || getCourseTitle(e.courseId),
          items: [],
        });
      }
      map.get(id).items.push(e);
    }
    const list = Array.from(map.values());
    list.forEach((g) =>
      g.items.sort(
        (a, b) => new Date(b.enrolledAt || 0) - new Date(a.enrolledAt || 0)
      )
    );
    return list.sort((a, b) => b.items.length - a.items.length);
  })();

  const goToPage = (page) => setCurrentPage(page);
  const goToPreviousPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="enrollments-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading enrollments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="enrollments-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Enrollment Management</h1>
          <p className="subtitle">View and manage all student enrollments</p>
        </div>
        <div className="header-actions">
          <button 
            className="add-btn secondary" 
            onClick={() => setShowReminderSettings(!showReminderSettings)}
            title="Auto-Reminder Settings"
          >
            <Settings size={18} />
            Auto-Reminder
          </button>
          <button className="refresh-btn" onClick={fetchAllData}>
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Auto-Reminder Settings Panel */}
      {showReminderSettings && (
        <div className="reminder-settings-panel">
          <div className="settings-header">
            <h3>
              <Zap size={20} />
              Auto-Reminder Settings
            </h3>
            <button className="close-btn" onClick={() => setShowReminderSettings(false)}>
              <X size={18} />
            </button>
          </div>
          <div className="settings-body">
            <div className="settings-row">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={reminderSettings.enabled}
                  onChange={(e) => setReminderSettings({ ...reminderSettings, enabled: e.target.checked })}
                />
                <span>Enable Auto-Reminders</span>
              </label>
            </div>
            <div className="settings-row">
              <label>Reminder Interval (Days)</label>
              <select
                value={reminderSettings.interval}
                onChange={(e) => setReminderSettings({ ...reminderSettings, interval: Number(e.target.value) })}
                disabled={!reminderSettings.enabled}
              >
                <option value={1}>Every day</option>
                <option value={2}>Every 2 days</option>
                <option value={3}>Every 3 days</option>
                <option value={5}>Every 5 days</option>
                <option value={7}>Every week</option>
              </select>
            </div>
            <div className="settings-row">
              <label>Progress Threshold (%)</label>
              <select
                value={reminderSettings.progressThreshold}
                onChange={(e) => setReminderSettings({ ...reminderSettings, progressThreshold: Number(e.target.value) })}
                disabled={!reminderSettings.enabled}
              >
                <option value={30}>Below 30%</option>
                <option value={40}>Below 40%</option>
                <option value={50}>Below 50%</option>
                <option value={60}>Below 60%</option>
                <option value={70}>Below 70%</option>
              </select>
            </div>
            <div className="settings-row">
              <span className="status-text">
                {reminderSettings.enabled ? (
                  <span className="status-active">✅ Auto-reminders are active</span>
                ) : (
                  <span className="status-inactive">⏸️ Auto-reminders are paused</span>
                )}
              </span>
              {reminderSettings.lastRun && (
                <span className="last-run">
                  Last check: {new Date(reminderSettings.lastRun).toLocaleString()}
                </span>
              )}
              {isAutoReminderRunning && (
                <span className="running">⏳ Checking for reminders...</span>
              )}
            </div>
            <div className="settings-actions">
              <button 
                className="btn-save" 
                onClick={checkAndSendAutoReminders}
                disabled={isAutoReminderRunning || !reminderSettings.enabled}
              >
                {isAutoReminderRunning ? '⏳ Checking...' : '📨 Check Now'}
              </button>
              
              {reminderResult && (
                <div className={`reminder-result ${reminderResult.type}`}>
                  {reminderResult.type === 'success' && (
                    <span className="result-success">✅ {reminderResult.message}</span>
                  )}
                  {reminderResult.type === 'info' && (
                    <span className="result-info">ℹ️ {reminderResult.message}</span>
                  )}
                  {reminderResult.type === 'partial' && (
                    <span className="result-partial">⚠️ {reminderResult.message}</span>
                  )}
                  {reminderResult.type === 'error' && (
                    <span className="result-error">❌ {reminderResult.message}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {apiError && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <p>{apiError}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="enrollment-stats">
        <div className="stat-card">
          <Users size={22} />
          <div>
            <h3>{stats.total}</h3>
            <p>Total Enrollments</p>
          </div>
        </div>
        <div className="stat-card">
          <Clock size={22} />
          <div>
            <h3>{stats.inProgress}</h3>
            <p>Not Started</p>
          </div>
        </div>
        <div className="stat-card">
          <TrendingUp size={22} />
          <div>
            <h3>{stats.active}</h3>
            <p>In Progress</p>
          </div>
        </div>
        <div className="stat-card">
          <CheckCircle size={22} />
          <div>
            <h3>{stats.completed}</h3>
            <p>Completed</p>
          </div>
        </div>
        <div className="stat-card">
          <Bell size={22} />
          <div>
            <h3>{stats.needsReminder}</h3>
            <p>Need Reminder</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Search by student, email, or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="notstarted">Not Started</option>
          <option value="inprogress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select
          className="filter-select"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
        >
          <option value="">All Courses</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>

        <button className="refresh-btn" onClick={fetchAllData}>
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Enrollments grouped by course */}
      <div className="table-wrapper">
        {groupedEnrollments.length === 0 ? (
          <div className="empty-state" style={{ padding: "48px 20px", textAlign: "center" }}>
            <Users size={48} />
            <h3>No enrollments found</h3>
            <p>
              {apiError
                ? apiError
                : "Students will appear here once they enroll in courses"}
            </p>
          </div>
        ) : (
          groupedEnrollments.map((group) => {
            const isOpen = !collapsedCourses[group.courseId];
            const doneCount = group.items.filter((e) => e.completed).length;

            return (
              <div className="course-block" key={group.courseId}>
                <button
                  className="course-block-head"
                  onClick={() => toggleCourseGroup(group.courseId)}
                >
                  <span className="course-block-chevron">
                    {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </span>
                  <span className="course-block-icon">
                    <BookOpen size={18} />
                  </span>
                  <span className="course-block-title">{group.title}</span>
                  <span className="course-block-count">
                    {group.items.length} student{group.items.length === 1 ? "" : "s"} · {doneCount} completed
                  </span>
                </button>

                {isOpen && (
                  <div className="course-block-table">
                    <table className="enrollment-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Enrolled</th>
                          <th>Progress</th>
                          <th>Status</th>
                          <th>Certificate</th>
                          <th style={{ width: "120px" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((enrollment) => {
                          const status = getStatusBadge(enrollment);
                          const progress = Math.round(Number(enrollment.progress) || 0);
                          const studentName = enrollment.user?.name || getUserName(enrollment.userId);
                          const studentEmail = enrollment.user?.email || getUserEmail(enrollment.userId);

                          return (
                            <tr key={enrollment.id}>
                              <td>
                                <div className="student-cell">
                                  <span className="student-avatar">
                                    {(studentName || "?")
                                      .split(" ")
                                      .map((n) => n[0])
                                      .slice(0, 2)
                                      .join("")
                                      .toUpperCase()}
                                  </span>
                                  <div>
                                    <div className="student-name">{studentName}</div>
                                    <div className="student-email">{studentEmail}</div>
                                  </div>
                                </div>
                              </td>

                              <td>
                                <span className="enrolled-date">
                                  <Calendar size={13} /> {formatDate(enrollment.enrolledAt)}
                                </span>
                              </td>

                              <td>
                                <div className="progress-cell">
                                  <div className="progress-track">
                                    <div
                                      className={`progress-fill ${status.className}`}
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <span className="progress-pct">{progress}%</span>
                                </div>
                              </td>

                              <td>
                                <span className={`status-badge ${status.className}`}>
                                  {status.label}
                                </span>
                                {enrollment.isExpired && (
                                  <span className="status-badge status-expired">Expired</span>
                                )}
                              </td>

                              <td>
                                {enrollment.certificateNo ? (
                                  <span className="cert-no">{enrollment.certificateNo}</span>
                                ) : (
                                  <span className="cert-none">—</span>
                                )}
                              </td>

                              <td>
                                <div className="row-actions">
                                  <button
                                    className="action-btn view"
                                    title="View details"
                                    onClick={() => openViewModal(enrollment)}
                                  >
                                    <Eye size={16} />
                                  </button>
                                  {!enrollment.completed && (
                                    <button
                                      className="action-btn remind"
                                      title="Send reminder"
                                      onClick={() => sendReminder(enrollment)}
                                    >
                                      <Bell size={16} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <div className="page-numbers">
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  className={`page-number ${currentPage === page ? 'active' : ''}`}
                  onClick={() => goToPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              className="page-btn"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {enrollments.length > 0 && (
          <div className="table-footer">
            <span className="total-count">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, stats.total)} of {stats.total} enrollments
            </span>
          </div>
        )}
      </div>

      {/* Reminder Modal */}
      {showReminderModal && reminderStudent && (
        <div className="modal" onClick={() => setShowReminderModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Send Progress Reminder</h2>
              <button className="modal-close" onClick={() => setShowReminderModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="reminder-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <User size={40} style={{ color: '#667eea' }} />
                  <div>
                    <h3 style={{ margin: 0 }}>{reminderStudent.name}</h3>
                    <p style={{ margin: 0, color: '#94a3b8' }}>{reminderStudent.email}</p>
                  </div>
                </div>
                <div className="form-group">
                  <label>Reminder Message</label>
                  <textarea
                    value={reminderMessage}
                    onChange={(e) => setReminderMessage(e.target.value)}
                    rows={4}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                  💡 This reminder will be sent as a notification to the student
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowReminderModal(false)}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleSendReminder}>
                <Bell size={18} />
                Send Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingEnrollment && (
        <div className="modal view-modal" onClick={() => setShowViewModal(false)}>
          <div className="modal-content view-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Enrollment Details</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="view-body">
              <div className="view-info">
                <div className="view-header">
                  <h3>{getUserName(viewingEnrollment.userId)}</h3>
                  <span className="course-badge">{getCourseTitle(viewingEnrollment.courseId)}</span>
                </div>

                <div className="view-details-grid">
                  <div className="view-detail-item">
                    <label>Student</label>
                    <span>{getUserName(viewingEnrollment.userId)}</span>
                  </div>
                  <div className="view-detail-item">
                    <label>Email</label>
                    <span>{getUserEmail(viewingEnrollment.userId)}</span>
                  </div>
                  <div className="view-detail-item">
                    <label>Course</label>
                    <span>{getCourseTitle(viewingEnrollment.courseId)}</span>
                  </div>
                  <div className="view-detail-item">
                    <label>Progress</label>
                    <div className="progress-wrapper">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${viewingEnrollment.progress || 0}%` }}
                        />
                      </div>
                      <span className="progress-text">{viewingEnrollment.progress || 0}%</span>
                    </div>
                  </div>
                  <div className="view-detail-item">
                    <label>Status</label>
                    <span className={`status-badge ${getStatusBadge(viewingEnrollment).className}`}>
                      {getStatusBadge(viewingEnrollment).label}
                    </span>
                  </div>
                  <div className="view-detail-item">
                    <label>Enrolled</label>
                    <span>{formatDate(viewingEnrollment.enrolledAt)}</span>
                  </div>
                  <div className="view-detail-item">
                    <label>Completed</label>
                    <span>{viewingEnrollment.completed ? "✅ Yes" : "❌ No"}</span>
                  </div>
                  {viewingEnrollment.certificateId && (
                    <div className="view-detail-item">
                      <label>Certificate ID</label>
                      <span>{viewingEnrollment.certificateId}</span>
                    </div>
                  )}
                  {viewingEnrollment.certificateNo && (
                    <div className="view-detail-item">
                      <label>Certificate No</label>
                      <span className="certificate-text">{viewingEnrollment.certificateNo}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowViewModal(false)}>
                Close
              </button>
              {viewingEnrollment.progress < 50 && !viewingEnrollment.completed && (
                <button 
                  className="btn-save" 
                  onClick={() => {
                    setShowViewModal(false);
                    sendReminder(viewingEnrollment);
                  }}
                  style={{ background: '#f59e0b' }}
                >
                  <Bell size={18} />
                  Send Reminder
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminEnrollments;