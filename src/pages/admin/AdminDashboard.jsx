// src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from "react";
import {
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  UserCheck,
  ArrowUpRight,
  TrendingUp,
  Award,
  Clock,
  Banknote,
  Smartphone,
  CheckCircle,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./AdminDashboard.css";

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
} from "chart.js";
import { Line } from "react-chartjs-2";

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

const EMPTY_STATS = {
  users: 0,
  students: 0,
  mentors: 0,
  courses: 0,
  enrollments: 0,
  revenue: 0,
  activeCertificates: 0,
  pendingCertificates: 0,
  cashRevenue: 0,
  upiRevenue: 0,
  completionRate: 0,
};

const EMPTY_SERIES = { labels: [], data: [] };

function AdminDashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(EMPTY_STATS);
  const [enrollmentTrends, setEnrollmentTrends] = useState(EMPTY_SERIES);
  const [userGrowth, setUserGrowth] = useState(EMPTY_SERIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        // Single source of truth: the server aggregates everything.
        const res = await api.get("/dashboard/admin");
        const payload = res.data?.data ?? {};
        const cards = payload.cards ?? {};
        const charts = payload.charts ?? {};

        if (cancelled) return;

        setStats({
          users: cards.users ?? 0,
          students: cards.students ?? 0,
          mentors: cards.mentors ?? 0,
          courses: cards.courses ?? 0,
          enrollments: cards.enrollments ?? 0,
          revenue: cards.revenue ?? 0,
          activeCertificates: cards.activeCertificates ?? 0,
          pendingCertificates: cards.pendingCertificates ?? 0,
          cashRevenue: cards.cashRevenue ?? 0,
          upiRevenue: cards.upiRevenue ?? 0,
          completionRate: cards.completionRate ?? 0,
        });

        setEnrollmentTrends(charts.enrollmentTrends ?? EMPTY_SERIES);
        setUserGrowth(charts.userGrowth ?? EMPTY_SERIES);
      } catch (err) {
        if (cancelled) return;
        setError(
          err.response?.data?.message ||
            "Unable to load dashboard data. Please try again."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDashboardData();
    return () => {
      cancelled = true;
    };
  }, []);

  const enrollmentChartData = {
    labels: enrollmentTrends.labels,
    datasets: [
      {
        label: "Enrollments",
        data: enrollmentTrends.data,
        backgroundColor: "rgba(102, 126, 234, 0.2)",
        borderColor: "#667eea",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#667eea",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const userGrowthChartData = {
    labels: userGrowth.labels,
    datasets: [
      {
        label: "Total Users",
        data: userGrowth.data,
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        borderColor: "#10b981",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#10b981",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(0,0,0,0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: { precision: 0 },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  const cards = [
    { title: "Total Users", value: stats.users, icon: Users, color: "#2563eb" },
    { title: "Students", value: stats.students, icon: GraduationCap, color: "#10b981" },
    { title: "Mentors", value: stats.mentors, icon: UserCheck, color: "#f59e0b" },
    { title: "Courses", value: stats.courses, icon: BookOpen, color: "#8b5cf6" },
    { title: "Enrollments", value: stats.enrollments, icon: TrendingUp, color: "#06b6d4" },
    {
      title: "Revenue",
      value: `₹${Number(stats.revenue).toLocaleString("en-IN")}`,
      icon: CreditCard,
      color: "#ef4444",
    },
    { title: "Completion Rate", value: `${stats.completionRate}%`, icon: CheckCircle, color: "#22c55e" },
    { title: "Certificates Issued", value: stats.activeCertificates, icon: Award, color: "#ec4899" },
    { title: "Pending Certificates", value: stats.pendingCertificates, icon: Clock, color: "#f97316" },
    {
      title: "Cash Collected",
      value: `₹${Number(stats.cashRevenue).toLocaleString("en-IN")}`,
      icon: Banknote,
      color: "#0d9488",
    },
    {
      title: "UPI Collected",
      value: `₹${Number(stats.upiRevenue).toLocaleString("en-IN")}`,
      icon: Smartphone,
      color: "#4f46e5",
    },
  ];

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-title">
        <h1>Welcome Back, {user?.name || "Admin"} 👋</h1>
        <p>Here's what's happening with your platform today.</p>
      </div>

      {error && (
        <div className="dashboard-box" style={{ borderLeft: "4px solid #ef4444" }}>
          <p style={{ color: "#ef4444", margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="dashboard-cards">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div className="dashboard-card" key={card.title}>
              <div className="dashboard-icon" style={{ background: card.color }}>
                <Icon size={26} color="#fff" />
              </div>
              <div>
                <h2>{card.value}</h2>
                <p>{card.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="dashboard-grid">
        <div className="dashboard-box large">
          <h3>📊 Enrollment Trends</h3>
          <div className="chart-container">
            {enrollmentTrends.data?.some((v) => v > 0) ? (
              <Line data={enrollmentChartData} options={chartOptions} />
            ) : (
              <div className="placeholder">
                <p>No enrollment data available yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-box">
          <h3>📈 User Growth</h3>
          <div className="chart-container small">
            {userGrowth.data?.some((v) => v > 0) ? (
              <Line data={userGrowthChartData} options={chartOptions} />
            ) : (
              <div className="placeholder">
                <p>No user data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="dashboard-grid">
        <div className="dashboard-box">
          <h3>⚡ Quick Actions</h3>
          <div className="quick-actions">
            <button onClick={() => (window.location.href = "/admin/users")}>
              <Users size={18} />
              Manage Users
            </button>
            <button onClick={() => (window.location.href = "/admin/courses")}>
              <BookOpen size={18} />
              Create Course
            </button>
            <button onClick={() => (window.location.href = "/admin/categories")}>
              <BookOpen size={18} />
              Add Category
            </button>
            <button onClick={() => (window.location.href = "/admin/modules")}>
              <BookOpen size={18} />
              Create Module
            </button>
            <button onClick={() => (window.location.href = "/admin/notifications")}>
              <ArrowUpRight size={18} />
              Send Notification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;