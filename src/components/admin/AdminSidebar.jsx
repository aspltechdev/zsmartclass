// src/components/admin/AdminSidebar.jsx

import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FolderTree,
  CreditCard,
  UserCheck,
  Award,
  Bell,
  BarChart3,
  LogOut,
  Layers,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./AdminSidebar.css";

const menu = [
  {
    title: "Dashboard",
    path: "/admin/dashboard",
    icon: LayoutDashboard,
    category: "Main",
  },

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

  {
    title: "Notifications",
    path: "/admin/notifications",
    icon: Bell,
    category: "Engagement",
  },

  {
    title: "Reports",
    path: "/admin/reports",
    icon: BarChart3,
    category: "Analytics",
  },
];

const categories = [...new Set(menu.map((item) => item.category))];

function AdminSidebar({
  collapsed = false,
  mobileOpen = false,
  onNavigate,
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    if (typeof logout === "function") {
      logout();
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    navigate("/login", { replace: true });
  };

  const handleLinkClick = () => {
    if (typeof onNavigate === "function") {
      onNavigate();
    }
  };

  return (
    <aside
      className={[
        "admin-sidebar",
        collapsed ? "collapsed" : "",
        mobileOpen ? "mobile-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* =================================================
          ZSMARTCLASS LOGO
      ================================================= */}

      <div className="sidebar-logo">
        <div className="logo-mark">
          <span>ZC</span>
        </div>

        <div className="logo-brand-text">
          <h2>ZSMARTCLASS</h2>
          <p>ADMINISTRATOR</p>
        </div>
      </div>

      {/* =================================================
          NAVIGATION
      ================================================= */}

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
                    onClick={handleLinkClick}
                    className={({ isActive }) =>
                      isActive
                        ? "sidebar-link active"
                        : "sidebar-link"
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

      {/* =================================================
          FOOTER
      ================================================= */}

      <div className="sidebar-footer">
        <button
          className="logout-btn"
          onClick={handleLogout}
          data-title="Logout"
          type="button"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;