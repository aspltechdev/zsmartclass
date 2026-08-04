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
} from "lucide-react";
import api from "../../services/api";
import "./AdminDashboard.css";

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
  
  const [recentActivities, setRecentActivities] = useState([]);
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
      // Fetch users (working)
      const usersRes = await api.get("/users");
      const users = usersRes.data.data || usersRes.data || [];
    
      // Fetch courses (working)
      const coursesRes = await api.get("/courses");
      const courses = coursesRes.data.data || coursesRes.data || [];
    
      // Calculate stats from available data
      const students = users.filter(u => u.role === "STUDENT").length;
      const mentors = users.filter(u => u.role === "MENTOR").length;
      const admins = users.filter(u => u.role === "ADMIN").length;
    
      // TEMPORARY: Use placeholder data for missing APIs
      const enrollmentsCount = 0; // Will be updated when API is ready
      const totalRevenue = 0; // Will be updated when API is ready
      const certificatesCount = 0; // Will be updated when API is ready
      
      setStats({
        users: users.length,
        students,
        mentors,
        admins,
        courses: courses.length,
        enrollments: enrollmentsCount,
        revenue: totalRevenue,
        certificates: certificatesCount,
      });
    
      // Generate recent activities from available data
      const activities = generateRecentActivities(users, courses, []);
      setRecentActivities(activities);
    
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Generate recent activities from real data
  const generateRecentActivities = (users, courses, enrollments) => {
    const activities = [];
    
    // Recent users (last 3)
    const sortedUsers = [...users].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    ).slice(0, 3);
    
    sortedUsers.forEach((user) => {
      activities.push({
        id: `user-${user.id}`,
        type: "user",
        message: `New ${user.role} registered: ${user.name}`,
        time: getTimeAgo(new Date(user.createdAt)),
        timestamp: new Date(user.createdAt),
      });
    });
    
    // Recent enrollments
    const sortedEnrollments = [...enrollments].sort((a, b) => 
      new Date(b.enrolledAt) - new Date(a.enrolledAt)
    ).slice(0, 3);
    
    sortedEnrollments.forEach((enrollment) => {
      const course = courses.find(c => c.id === enrollment.courseId);
      const user = users.find(u => u.id === enrollment.userId);
      activities.push({
        id: `enrollment-${enrollment.id}`,
        type: "enrollment",
        message: `${user?.name || 'A student'} enrolled in "${course?.title || 'a course'}"`,
        time: getTimeAgo(new Date(enrollment.enrolledAt)),
        timestamp: new Date(enrollment.enrolledAt),
      });
    });
    
    // Sort all activities by timestamp (newest first)
    activities.sort((a, b) => b.timestamp - a.timestamp);
    
    // Return top 5
    return activities.slice(0, 5);
  };

  // Helper function to get time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Get activity icon based on type
  const getActivityIcon = (type) => {
    const icons = {
      user: Users,
      enrollment: BookOpen,
      payment: CreditCard,
      course: BookOpen,
      review: Award,
      certificate: Award,
    };
    return icons[type] || ArrowUpRight;
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
      title: "Revenue",
      value: `₹${stats.revenue.toLocaleString()}`,
      icon: CreditCard,
      color: "#ef4444",
    },
    {
      title: "Certificates",
      value: stats.certificates,
      icon: Award,
      color: "#06b6d4",
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
        <h1>Welcome Back {userName}.</h1>
        <p>Manage your Learning Management System from one place.</p>
      </div>

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

      <div className="dashboard-grid">
        <div className="dashboard-box">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            <button onClick={() => window.location.href = '/admin/users'}>
              Add User
            </button>
            <button onClick={() => window.location.href = '/admin/courses'}>
              Create Course
            </button>
            <button onClick={() => window.location.href = '/admin/categories'}>
              Add Category
            </button>
            <button onClick={() => window.location.href = '/admin/notifications'}>
              Send Notification
            </button>
          </div>
        </div>

        <div className="dashboard-box">
          <h3>Recent Activity</h3>
          <ul className="activity-list">
            {recentActivities.length === 0 ? (
              <li className="no-activity">No recent activity</li>
            ) : (
              recentActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <li key={activity.id}>
                    <Icon size={16} />
                    <span className="activity-message">{activity.message}</span>
                    <span className="activity-time">{activity.time}</span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-box large">
          <h3>Revenue Overview</h3>
          <div className="placeholder">
            <div className="revenue-summary">
              <span className="revenue-amount">₹{stats.revenue.toLocaleString()}</span>
              <span className="revenue-label">Total Revenue</span>
              <span className="revenue-sub">From {stats.enrollments} enrollments</span>
            </div>
          </div>
        </div>

        <div className="dashboard-box">
          <h3>Quick Stats</h3>
          <div className="quick-stats">
            <div className="quick-stat">
              <span className="stat-number">{stats.users}</span>
              <span className="stat-label">Users</span>
            </div>
            <div className="quick-stat">
              <span className="stat-number">{stats.courses}</span>
              <span className="stat-label">Courses</span>
            </div>
            <div className="quick-stat">
              <span className="stat-number">{stats.enrollments}</span>
              <span className="stat-label">Enrollments</span>
            </div>
            <div className="quick-stat">
              <span className="stat-number">{stats.certificates}</span>
              <span className="stat-label">Certificates</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;