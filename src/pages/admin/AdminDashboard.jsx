// import React from 'react';
// import AdminUsers from './Users';
// function AdminDashboard() { return <div><h1>Admin Dashboard</h1><p>Coming soon...</p>
// <AdminUsers/>
// </div>; }
// export default AdminDashboard;

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
    courses: 0,
    enrollments: 0,
    revenue: 0,
    certificates: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get("/dashboard/admin");

      setStats({
        users: res.data.totalUsers || 0,
        students: res.data.totalStudents || 0,
        mentors: res.data.totalMentors || 0,
        courses: res.data.totalCourses || 0,
        enrollments: res.data.totalEnrollments || 0,
        revenue: res.data.totalRevenue || 0,
        certificates: res.data.totalCertificates || 0,
      });
    } catch (err) {
      console.log(err);
    }
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
      value: `₹${stats.revenue}`,
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

  return (
    <div className="dashboard-page">

      <div className="dashboard-title">
        <h1>Welcome Back 👋</h1>
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

            <button>Add User</button>

            <button>Create Course</button>

            <button>Add Category</button>

            <button>Send Notification</button>

          </div>

        </div>

        <div className="dashboard-box">

          <h3>Recent Activity</h3>

          <ul className="activity-list">

            <li>
              <ArrowUpRight size={16} />
              New student registered
            </li>

            <li>
              <ArrowUpRight size={16} />
              Payment received
            </li>

            <li>
              <ArrowUpRight size={16} />
              Course published
            </li>

            <li>
              <ArrowUpRight size={16} />
              Certificate generated
            </li>

          </ul>

        </div>

      </div>

      <div className="dashboard-grid">

        <div className="dashboard-box large">

          <h3>Revenue Overview</h3>

          <div className="placeholder">
            Chart Coming Soon...
          </div>

        </div>

        <div className="dashboard-box">

          <h3>Recent Users</h3>

          <div className="placeholder">
            Latest registered users...
          </div>

        </div>

      </div>

    </div>
  );
}

export default AdminDashboard;