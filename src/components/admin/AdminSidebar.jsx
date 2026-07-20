// import React from 'react';
// function AdminSidebar() { return <div>Admin Sidebar</div>; }
// export default AdminSidebar;

import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FolderTree,
  BookOpen,
  CreditCard,
  UserCheck,
  Award,
  Bell,
  Star,
  BarChart3,
  Settings,
  TicketPercent,
  Globe,
  LogOut,
} from "lucide-react";
import "./AdminSidebar.css";

const menu = [
  {
    title: "Dashboard",
    path: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    path: "/admin/users",
    icon: Users,
  },
  {
    title: "Categories",
    path: "/admin/categories",
    icon: FolderTree,
  },
  {
    title: "Courses",
    path: "/admin/courses",
    icon: GraduationCap,
  },
  {
    title: "Modules",
    path: "/admin/modules",
    icon: BookOpen,
  },
  {
    title: "Lessons",
    path: "/admin/lessons",
    icon: BookOpen,
  },
  {
    title: "Enrollments",
    path: "/admin/enrollments",
    icon: UserCheck,
  },
  {
    title: "Payments",
    path: "/admin/payments",
    icon: CreditCard,
  },
  {
    title: "Certificates",
    path: "/admin/certificates",
    icon: Award,
  },
  {
    title: "Notifications",
    path: "/admin/notifications",
    icon: Bell,
  },
  {
    title: "Reviews",
    path: "/admin/reviews",
    icon: Star,
  },
  {
    title: "Reports",
    path: "/admin/reports",
    icon: BarChart3,
  },
  {
    title: "Coupons",
    path: "/admin/coupons",
    icon: TicketPercent,
  },
  {
    title: "CMS",
    path: "/admin/cms",
    icon: Globe,
  },
  {
    title: "Settings",
    path: "/admin/settings",
    icon: Settings,
  },
];

function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="sidebar-logo">
        <div className="logo-circle">Z</div>

        <div>
          <h2>ZsmartClass</h2>
          <p>Admin Panel</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
            >
              <Icon size={20} />

              <span>{item.title}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn">
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;