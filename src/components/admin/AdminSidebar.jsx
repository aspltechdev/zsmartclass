// src/components/admin/AdminSidebar.jsx
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
  FileText,
  Layers,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import "./AdminSidebar.css";

const menu = [
  // ==========================================
  // MAIN DASHBOARD
  // ==========================================
  {
    title: "Dashboard",
    path: "/admin/dashboard",
    icon: LayoutDashboard,
    category: "Main",
  },

  // ==========================================
  // USER MANAGEMENT
  // ==========================================
  {
    title: "Users",
    path: "/admin/users",
    icon: Users,
    category: "Management",
  },
  {
    title: "Categories",
    path: "/admin/categories",
    icon: FolderTree,
    category: "Management",
  },

  // ==========================================
  // CONTENT MANAGEMENT
  // ==========================================
  {
    title: "Courses",
    path: "/admin/courses",
    icon: GraduationCap,
    category: "Content",
  },
  {
    title: "Modules",
    path: "/admin/modules",
    icon: Layers,
    category: "Content",
  },
  {
    title: "Lessons",
    path: "/admin/lessons",
    icon: FileText,
    category: "Content",
  },

  // ==========================================
  // OPERATIONS
  // ==========================================
  {
    title: "Enrollments",
    path: "/admin/enrollments",
    icon: UserCheck,
    category: "Operations",
  },
  {
    title: "Payments",
    path: "/admin/payments",
    icon: CreditCard,
    category: "Operations",
  },
  {
    title: "Certificates",
    path: "/admin/certificates",
    icon: Award,
    category: "Operations",
  },

  // ==========================================
  // ENGAGEMENT
  // ==========================================
  {
    title: "Notifications",
    path: "/admin/notifications",
    icon: Bell,
    category: "Engagement",
  },

  // ==========================================
  // ANALYTICS & SETTINGS
  // ==========================================
  {
    title: "Reports",
    path: "/admin/reports",
    icon: BarChart3,
    category: "Analytics",
  },
  {
    title: "Settings",
    path: "/admin/settings",
    icon: Settings,
    category: "System",
  },
];

// Get unique categories for grouping
const categories = [...new Set(menu.map(item => item.category))];

function AdminSidebar() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <aside className="admin-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-circle">Z</div>
        <div>
          <h2>ZsmartClass</h2>
          <p>Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {categories.map((category) => (
          <div key={category}>
            <div className="nav-category">{category}</div>
            {menu
              .filter((item) => item.category === category)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      isActive ? "sidebar-link active" : "sidebar-link"
                    }
                    data-title={item.title}
                  >
                    <Icon size={20} />
                    <span>{item.title}</span>
                  </NavLink>
                );
              })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;