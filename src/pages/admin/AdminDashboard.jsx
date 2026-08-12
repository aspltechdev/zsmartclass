// src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from "react";
import {
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  Award,
  UserCheck,
  ArrowUpRight,
  TrendingUp,
  Calendar,
  Clock,
} from "lucide-react";
import api from "../../services/api";
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
} from 'chart.js';
import { Line } from 'react-chartjs-2';

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

function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    students: 0,
    mentors: 0,
    admins: 0,
    courses: 0,
    enrollments: 0,
    revenue: 0,
    certificates: 0,
  });
  
  const [enrollmentTrends, setEnrollmentTrends] = useState({ labels: [], data: [] });
  const [userGrowth, setUserGrowth] = useState({ labels: [], data: [] });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Get user name from localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setUserName(user.name || "Admin");
    
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch users
      const usersRes = await api.get("/users");
      const users = usersRes.data.data || usersRes.data || [];
    
      // 2. Fetch courses
      const coursesRes = await api.get("/courses");
      const courses = coursesRes.data.data || coursesRes.data || [];
    
      // 3. Fetch enrollments - Try multiple endpoints
      let enrollments = [];
      try {
        // Try the admin endpoint first
        const enrollRes = await api.get("/enrollments/admin/all");
        enrollments = enrollRes.data.data || enrollRes.data || [];
        console.log("✅ Enrollments from admin endpoint:", enrollments.length);
      } catch (e1) {
        console.log("Admin enrollments endpoint failed, trying regular...");
        try {
          // Try the regular endpoint
          const enrollRes = await api.get("/enrollments");
          enrollments = enrollRes.data.data || enrollRes.data || [];
          console.log("✅ Enrollments from regular endpoint:", enrollments.length);
        } catch (e2) {
          console.log("Regular enrollments endpoint failed, trying direct...");
          try {
            // Try direct URL
            const enrollRes = await api.get("/api/enrollments");
            enrollments = enrollRes.data.data || enrollRes.data || [];
            console.log("✅ Enrollments from direct endpoint:", enrollments.length);
          } catch (e3) {
            console.error("❌ All enrollment endpoints failed");
            enrollments = [];
          }
        }
      }

      // 4. Fetch certificates
      let certificates = [];
      try {
        const certRes = await api.get("/certificates");
        certificates = certRes.data.data || certRes.data || [];
      } catch (e) {
        console.log("Certificates endpoint not available yet");
      }
    
      // Calculate stats
      const students = users.filter(u => u.role === "STUDENT").length;
      const mentors = users.filter(u => u.role === "MENTOR").length;
      const admins = users.filter(u => u.role === "ADMIN").length;
      
      // Calculate revenue from enrollments
      let totalRevenue = 0;
      enrollments.forEach(enrollment => {
        const course = courses.find(c => c.id === enrollment.courseId);
        if (course) {
          totalRevenue += (course.discountPrice || course.price || 0);
        }
      });
      
      console.log("📊 Dashboard Stats:", {
        users: users.length,
        students,
        mentors,
        admins,
        courses: courses.length,
        enrollments: enrollments.length,
        revenue: totalRevenue,
        certificates: certificates.length,
      });
      
      setStats({
        users: users.length,
        students,
        mentors,
        admins,
        courses: courses.length,
        enrollments: enrollments.length,
        revenue: totalRevenue,
        certificates: certificates.length,
      });
    
      // Generate enrollment trends (last 6 months)
      const trends = generateMonthlyTrends(enrollments);
      setEnrollmentTrends(trends);

      // Generate user growth (last 6 months)
      const userGrowthData = generateUserGrowth(users);
      setUserGrowth(userGrowthData);
    
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Generate monthly enrollment trends
  const generateMonthlyTrends = (enrollments) => {
    const months = [];
    const data = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = month.toLocaleString('default', { month: 'short' });
      months.push(monthLabel);
      
      const count = enrollments.filter(e => {
        const date = new Date(e.enrolledAt || e.createdAt || e.enrolledat || e.createdat);
        if (isNaN(date.getTime())) return false;
        return date.getMonth() === month.getMonth() && 
               date.getFullYear() === month.getFullYear();
      }).length;
      data.push(count);
    }
    
    return { labels: months, data };
  };

  // Generate user growth over time
  const generateUserGrowth = (users) => {
    const months = [];
    const data = [];
    const now = new Date();
    let cumulative = 0;
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = month.toLocaleString('default', { month: 'short' });
      months.push(monthLabel);
      
      const count = users.filter(u => {
        const date = new Date(u.createdAt || u.createdat);
        if (isNaN(date.getTime())) return false;
        return date.getMonth() === month.getMonth() && 
               date.getFullYear() === month.getFullYear();
      }).length;
      
      cumulative += count;
      data.push(cumulative);
    }
    
    return { labels: months, data };
  };

  // Chart data configurations
  const enrollmentChartData = {
    labels: enrollmentTrends.labels,
    datasets: [
      {
        label: 'Enrollments',
        data: enrollmentTrends.data,
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        borderColor: '#667eea',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#667eea',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const userGrowthChartData = {
    labels: userGrowth.labels,
    datasets: [
      {
        label: 'Total Users',
        data: userGrowth.data,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: '#10b981',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)',
        },
        ticks: {
          stepSize: 1,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const cards = [
    {
      title: "Total Users",
      value: stats.users,
      icon: Users,
      color: "#2563eb",
    },
    {
      title: "Students",
      value: stats.students,
      icon: GraduationCap,
      color: "#10b981",
    },
    {
      title: "Mentors",
      value: stats.mentors,
      icon: UserCheck,
      color: "#f59e0b",
    },
    {
      title: "Courses",
      value: stats.courses,
      icon: BookOpen,
      color: "#8b5cf6",
    },
    {
      title: "Enrollments",
      value: stats.enrollments,
      icon: TrendingUp,
      color: "#06b6d4",
    },
    {
      title: "Revenue",
      value: `₹${stats.revenue.toLocaleString()}`,
      icon: CreditCard,
      color: "#ef4444",
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
        <h1>Welcome Back, {userName} 👋</h1>
        <p>Here's what's happening with your platform today.</p>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-cards">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div className="dashboard-card" key={index}>
              <div
                className="dashboard-icon"
                style={{ background: card.color }}
              >
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
            {enrollmentTrends.data && enrollmentTrends.data.some(v => v > 0) ? (
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
            {userGrowth.data && userGrowth.data.some(v => v > 0) ? (
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
            <button onClick={() => window.location.href = '/admin/users'}>
              <Users size={18} />
              Manage Users
            </button>
            <button onClick={() => window.location.href = '/admin/courses'}>
              <BookOpen size={18} />
              Create Course
            </button>
            <button onClick={() => window.location.href = '/admin/categories'}>
              <BookOpen size={18} />
              Add Category
            </button>
            <button onClick={() => window.location.href = '/admin/payments'}>
              <ArrowUpRight size={18} />
              Add Payment
            </button>
            <button onClick={() => window.location.href = '/admin/notifications'}>
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