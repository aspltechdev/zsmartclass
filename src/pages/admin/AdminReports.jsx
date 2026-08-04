// src/pages/admin/AdminReports.jsx
import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  DollarSign,
  Star,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  X,
  Clock,
  CheckCircle,
  Award,
  CreditCard,
  Activity,
  PieChart,
  LineChart,
  FileText,
  Eye,
  UserCheck,
  GraduationCap,
  AlertCircle,
} from "lucide-react";
import api from "../../services/api";
import "./AdminReports.css";

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
  Filler
);

function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [apiError, setApiError] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  // Data states
  const [overviewData, setOverviewData] = useState({
    users: { total: 0, students: 0, mentors: 0, admins: 0 },
    courses: { total: 0, published: 0, draft: 0, archived: 0 },
    enrollments: { total: 0, completed: 0, inProgress: 0 },
    revenue: 0,
    certificates: { total: 0, active: 0, pending: 0 },
    reviews: { total: 0, averageRating: 0 },
  });

  const [revenueData, setRevenueData] = useState({
    labels: [],
    data: [],
    total: 0,
    growth: 0,
  });

  const [enrollmentData, setEnrollmentData] = useState({
    labels: [],
    data: [],
    total: 0,
    growth: 0,
  });

  const [courseStats, setCourseStats] = useState([]);
  const [userStats, setUserStats] = useState([]);
  const [paymentStats, setPaymentStats] = useState({
    completed: 0,
    pending: 0,
    failed: 0,
    refunded: 0,
    totalPayments: 0,
  });
  const [revenueByCourse, setRevenueByCourse] = useState([]);

  // Report types
  const reportTypes = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "revenue", label: "Revenue", icon: DollarSign },
    { id: "enrollments", label: "Enrollments", icon: Users },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "users", label: "Users", icon: UserCheck },
    { id: "payments", label: "Payments", icon: CreditCard },
  ];

  useEffect(() => {
    fetchAllData();
  }, [dateRange]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setApiError("");

      // Call report endpoints directly with error catching
      const [
        overviewRes,
        revenueRes,
        enrollmentRes,
        courseRes,
        userRes,
        paymentRes,
        revenueByCourseRes,
      ] = await Promise.all([
        api.get("/reports/overview").catch((err) => {
          console.log("⚠️ Overview API error:", err.message);
          return { data: { data: null } };
        }),
        api.get("/reports/revenue").catch((err) => {
          console.log("⚠️ Revenue API error:", err.message);
          return { data: { data: null } };
        }),
        api.get("/reports/enrollment-trends").catch((err) => {
          console.log("⚠️ Enrollment API error:", err.message);
          return { data: { data: null } };
        }),
        api.get("/reports/courses").catch((err) => {
          console.log("⚠️ Courses API error:", err.message);
          return { data: { data: [] } };
        }),
        api.get("/reports/users").catch((err) => {
          console.log("⚠️ Users API error:", err.message);
          return { data: { data: [] } };
        }),
        api.get("/reports/payments").catch((err) => {
          console.log("⚠️ Payments API error:", err.message);
          return { data: { data: null } };
        }),
        api.get("/reports/revenue-by-course").catch((err) => {
          console.log("⚠️ Revenue by course API error:", err.message);
          return { data: { data: [] } };
        }),
      ]);

      setOverviewData(overviewRes.data?.data || overviewData);
      setRevenueData(revenueRes.data?.data || revenueData);
      setEnrollmentData(enrollmentRes.data?.data || enrollmentData);
      setCourseStats(courseRes.data?.data || []);
      setUserStats(userRes.data?.data || []);
      setPaymentStats(paymentRes.data?.data || paymentStats);
      setRevenueByCourse(revenueByCourseRes.data?.data || []);

    } catch (err) {
      console.error("Error fetching report data:", err);
      setApiError("Failed to load reports. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleExport = async (format) => {
    try {
      setExportLoading(true);
      const response = await api.get(`/reports/export/${format}`, {
        params: {
          type: activeTab,
          startDate: dateRange.start,
          endDate: dateRange.end,
        },
        responseType: format === 'pdf' ? 'blob' : 'text',
      });

      if (format === 'pdf') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `report-${activeTab}-${Date.now()}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `report-${activeTab}-${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      
      alert(`${format.toUpperCase()} exported successfully!`);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export report. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const printReport = () => {
    window.print();
  };

  // Chart configurations
  const revenueChartData = {
    labels: revenueData.labels || [],
    datasets: [
      {
        label: 'Revenue (₹)',
        data: revenueData.data || [],
        backgroundColor: 'rgba(102, 126, 234, 0.6)',
        borderColor: '#667eea',
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            return '₹' + context.raw.toLocaleString();
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        }
      }
    }
  };

  const enrollmentChartData = {
    labels: enrollmentData.labels || [],
    datasets: [
      {
        label: 'Enrollments',
        data: enrollmentData.data || [],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: '#3b82f6',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const enrollmentChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.raw + ' enrollments';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        }
      }
    }
  };

  const paymentChartData = {
    labels: ['Completed', 'Pending', 'Failed', 'Refunded'],
    datasets: [
      {
        data: [
          paymentStats.completed || 0,
          paymentStats.pending || 0,
          paymentStats.failed || 0,
          paymentStats.refunded || 0,
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        borderWidth: 0,
      },
    ],
  };

  const paymentChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
          }
        },
      },
    },
    cutout: '60%',
  };

  if (loading) {
    return (
      <div className="reports-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p className="subtitle">Get insights into your platform's performance</p>
          {apiError && (
            <p className="error-text">
              <AlertCircle size={14} />
              {apiError}
            </p>
          )}
        </div>
        <div className="header-actions">
          <button className="add-btn secondary" onClick={() => setShowDatePicker(!showDatePicker)}>
            <Calendar size={18} />
            <span className="date-range-text">
              {dateRange.start} to {dateRange.end}
            </span>
          </button>
          <button 
            className="add-btn secondary" 
            onClick={() => handleExport('csv')} 
            disabled={exportLoading}
          >
            <Download size={18} />
            CSV
          </button>
          <button 
            className="add-btn secondary" 
            onClick={() => handleExport('pdf')} 
            disabled={exportLoading}
          >
            <FileText size={18} />
            PDF
          </button>
          <button className="add-btn secondary" onClick={printReport}>
            <Printer size={18} />
            Print
          </button>
          <button className="refresh-btn" onClick={fetchAllData}>
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Date Picker */}
      {showDatePicker && (
        <div className="date-picker-popup">
          <div className="date-picker-content">
            <div className="date-picker-header">
              <h3>Select Date Range</h3>
              <button onClick={() => setShowDatePicker(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="date-picker-body">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </div>
            <div className="date-picker-footer">
              <button 
                className="btn-cancel" 
                onClick={() => {
                  setDateRange({
                    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
                    end: new Date().toISOString().split('T')[0],
                  });
                  setShowDatePicker(false);
                }}
              >
                Reset
              </button>
              <button 
                className="btn-save" 
                onClick={() => {
                  fetchAllData();
                  setShowDatePicker(false);
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="report-tabs">
        {reportTypes.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================== */}
      {/* Overview Tab */}
      {/* ========================================== */}
      {activeTab === 'overview' && (
        <div className="report-content">
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon"><Users size={24} /></div>
              <div className="metric-info">
                <span className="metric-value">{overviewData.users.total}</span>
                <span className="metric-label">Total Users</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><BookOpen size={24} /></div>
              <div className="metric-info">
                <span className="metric-value">{overviewData.courses.total}</span>
                <span className="metric-label">Total Courses</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><DollarSign size={24} /></div>
              <div className="metric-info">
                <span className="metric-value">{formatCurrency(overviewData.revenue)}</span>
                <span className="metric-label">Total Revenue</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><GraduationCap size={24} /></div>
              <div className="metric-info">
                <span className="metric-value">{overviewData.enrollments.total}</span>
                <span className="metric-label">Enrollments</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><Award size={24} /></div>
              <div className="metric-info">
                <span className="metric-value">{overviewData.certificates.total}</span>
                <span className="metric-label">Certificates</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><Star size={24} /></div>
              <div className="metric-info">
                <span className="metric-value">{overviewData.reviews.averageRating.toFixed(1)}</span>
                <span className="metric-label">Avg Rating</span>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-header">
                <h3>Revenue Overview</h3>
                <span className="chart-total">{formatCurrency(revenueData.total)}</span>
              </div>
              <div className="chart-body">
                {revenueData.data?.some(v => v > 0) ? (
                  <Bar data={revenueChartData} options={revenueChartOptions} />
                ) : (
                  <div className="chart-placeholder">
                    <DollarSign size={48} />
                    <p>No revenue data available</p>
                  </div>
                )}
              </div>
            </div>
            <div className="chart-card">
              <div className="chart-header">
                <h3>Enrollment Trends</h3>
                <span className="chart-total">{enrollmentData.total}</span>
              </div>
              <div className="chart-body">
                {enrollmentData.data?.some(v => v > 0) ? (
                  <Line data={enrollmentChartData} options={enrollmentChartOptions} />
                ) : (
                  <div className="chart-placeholder">
                    <Users size={48} />
                    <p>No enrollment data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* Revenue Tab */}
      {/* ========================================== */}
      {activeTab === 'revenue' && (
        <div className="report-content">
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon"><DollarSign size={24} /></div>
              <div className="metric-info">
                <span className="metric-value">{formatCurrency(overviewData.revenue)}</span>
                <span className="metric-label">Total Revenue</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><TrendingUp size={24} /></div>
              <div className="metric-info">
                <span className="metric-value">{revenueData.growth || 0}%</span>
                <span className="metric-label">Growth</span>
              </div>
            </div>
          </div>

          <div className="chart-card full-width">
            <div className="chart-header">
              <h3>Revenue Overview</h3>
            </div>
            <div className="chart-body">
              {revenueData.data?.some(v => v > 0) ? (
                <Bar data={revenueChartData} options={revenueChartOptions} />
              ) : (
                <div className="chart-placeholder">
                  <BarChart3 size={48} />
                  <p>No revenue data available</p>
                </div>
              )}
            </div>
          </div>

          <div className="table-wrapper">
            <h3 className="table-title">Top Revenue Courses</h3>
            <table className="report-table">
              <thead>
                <tr><th>Course</th><th>Enrollments</th><th>Revenue</th></tr>
              </thead>
              <tbody>
                {revenueByCourse.length === 0 ? (
                  <tr><td colSpan={3} className="empty-cell">No data available</td></tr>
                ) : (
                  revenueByCourse.slice(0, 10).map((course, idx) => (
                    <tr key={idx}>
                      <td>{course.title}</td>
                      <td>{course.enrollments}</td>
                      <td>{formatCurrency(course.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* Enrollments Tab */}
      {/* ========================================== */}
      {activeTab === 'enrollments' && (
        <div className="report-content">
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon"><Users size={24} /></div>
              <div className="metric-info">
                <span className="metric-value">{overviewData.enrollments.total}</span>
                <span className="metric-label">Total Enrollments</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><CheckCircle size={24} /></div>
              <div className="metric-info">
                <span className="metric-value">{overviewData.enrollments.completed}</span>
                <span className="metric-label">Completed</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><Clock size={24} /></div>
              <div className="metric-info">
                <span className="metric-value">{overviewData.enrollments.inProgress}</span>
                <span className="metric-label">In Progress</span>
              </div>
            </div>
          </div>

          <div className="chart-card full-width">
            <div className="chart-header">
              <h3>Enrollment Trends</h3>
            </div>
            <div className="chart-body">
              {enrollmentData.data?.some(v => v > 0) ? (
                <Line data={enrollmentChartData} options={enrollmentChartOptions} />
              ) : (
                <div className="chart-placeholder">
                  <LineChart size={48} />
                  <p>No enrollment data available</p>
                </div>
              )}
            </div>
          </div>

          <div className="table-wrapper">
            <h3 className="table-title">Course Enrollment Stats</h3>
            <table className="report-table">
              <thead>
                <tr><th>Course</th><th>Enrollments</th><th>Completion Rate</th><th>Avg Rating</th></tr>
              </thead>
              <tbody>
                {courseStats.length === 0 ? (
                  <tr><td colSpan={4} className="empty-cell">No data available</td></tr>
                ) : (
                  courseStats.slice(0, 10).map((course, idx) => (
                    <tr key={idx}>
                      <td>{course.title}</td>
                      <td>{course.enrollments}</td>
                      <td>{course.completionRate || 0}%</td>
                      <td>{course.avgRating ? course.avgRating.toFixed(1) : 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* Courses Tab */}
      {/* ========================================== */}
      {activeTab === 'courses' && (
        <div className="report-content">
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon"><BookOpen size={24} /></div>
              <div className="metric-info">
                <span className="metric-value">{overviewData.courses.total}</span>
                <span className="metric-label">Total Courses</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><CheckCircle size={24} /></div>
              <div className="metric-info">
                <span className="metric-value">{overviewData.courses.published}</span>
                <span className="metric-label">Published</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><Clock size={24} /></div>
              <div className="metric-info">
                <span className="metric-value">{overviewData.courses.draft}</span>
                <span className="metric-label">Drafts</span>
              </div>
            </div>
          </div>

          <div className="table-wrapper">
            <h3 className="table-title">All Courses</h3>
            <table className="report-table">
              <thead>
                <tr><th>Course</th><th>Category</th><th>Enrollments</th><th>Rating</th><th>Status</th></tr>
              </thead>
              <tbody>
                {courseStats.length === 0 ? (
                  <tr><td colSpan={5} className="empty-cell">No data available</td></tr>
                ) : (
                  courseStats.map((course, idx) => (
                    <tr key={idx}>
                      <td>{course.title}</td>
                      <td>{course.category}</td>
                      <td>{course.enrollments}</td>
                      <td>{course.avgRating ? course.avgRating.toFixed(1) : 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${course.status?.toLowerCase()}`}>
                          {course.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* Users Tab */}
      {/* ========================================== */}
      {activeTab === 'users' && (
        <div className="report-content">
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon"><Users size={24} /></div>
              <div className="metric-info">
                <span className="metric-value">{overviewData.users.total}</span>
                <span className="metric-label">Total Users</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><GraduationCap size={24} /></div>
              <div className="metric-info">
                <span className="metric-value">{overviewData.users.students}</span>
                <span className="metric-label">Students</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><UserCheck size={24} /></div>
              <div className="metric-info">
                <span className="metric-value">{overviewData.users.mentors}</span>
                <span className="metric-label">Mentors</span>
              </div>
            </div>
          </div>

          <div className="table-wrapper">
            <h3 className="table-title">All Users</h3>
            <table className="report-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {userStats.length === 0 ? (
                  <tr><td colSpan={4} className="empty-cell">No data available</td></tr>
                ) : (
                  userStats.slice(0, 15).map((user, idx) => (
                    <tr key={idx}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td><span className="role-badge">{user.role}</span></td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* Payments Tab */}
      {/* ========================================== */}
      {activeTab === 'payments' && (
        <div className="report-content">
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon"><DollarSign size={24} /></div>
              <div className="metric-info">
                <span className="metric-value">{formatCurrency(overviewData.revenue)}</span>
                <span className="metric-label">Total Revenue</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><CheckCircle size={24} /></div>
              <div className="metric-info">
                <span className="metric-value">{paymentStats.completed}</span>
                <span className="metric-label">Completed</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon"><Clock size={24} /></div>
              <div className="metric-info">
                <span className="metric-value">{paymentStats.pending}</span>
                <span className="metric-label">Pending</span>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-header">
                <h3>Payment Distribution</h3>
              </div>
              <div className="chart-body">
                {paymentStats.completed > 0 || paymentStats.pending > 0 ? (
                  <Doughnut data={paymentChartData} options={paymentChartOptions} />
                ) : (
                  <div className="chart-placeholder">
                    <PieChart size={48} />
                    <p>No payment data</p>
                  </div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3>Revenue Overview</h3>
              </div>
              <div className="chart-body">
                {revenueData.data?.some(v => v > 0) ? (
                  <Bar data={revenueChartData} options={revenueChartOptions} />
                ) : (
                  <div className="chart-placeholder">
                    <BarChart3 size={48} />
                    <p>No revenue data</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReports;