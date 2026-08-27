import React from "react";
import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  GraduationCap,
  FileText,
  Award,
  Bell,
  User,
  Star,
  LogOut,
  HelpCircle as QuizIcon,
} from "lucide-react";

import "./StudentSidebar.css";

const StudentSidebar = ({
  collapsed,
  mobileOpen,
  onMobileClose,
  onLogout,
}) => {
  const navigate = useNavigate();

  const navItems = [
    {
      path: "/student/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      category: "Main",
    },
    {
      path: "/student/my-courses",
      icon: GraduationCap,
      label: "My Learning",
      category: "Learning",
    },
    {
      path: "/student/assignments",
      icon: FileText,
      label: "Assignments",
      category: "Learning",
    },
    {
      path: "/student/certificates",
      icon: Award,
      label: "Certificates",
      category: "Learning",
    },
    {
      path: "/student/notifications",
      icon: Bell,
      label: "Notifications",
      category: "Activity",
    },
    {
      path: "/student/reviews",
      icon: Star,
      label: "Reviews",
      category: "Activity",
    },
  ];

  const categories = [
    ...new Set(navItems.map((item) => item.category)),
  ];

  const handleLogout = () => {
    // Prefer the handler from StudentLayout — it clears AuthContext state too.
    if (typeof onLogout === "function") {
      onLogout();
      return;
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <aside
      className={`student-sidebar ${
        collapsed ? "collapsed" : ""
      } ${
        mobileOpen
          ? "mobile-open"
          : ""
      }`}
    >

      {/* =================================================
          SIDEBAR HEADER
      ================================================= */}

      <div className="sidebar-header">

        <div className="logo-container">

          <div className="logo-icon">
            Z
          </div>

          {!collapsed && (
            <div className="logo-text">
              <span>ZSmartClass</span>
              <span>Student Panel</span>
            </div>
          )}

        </div>

      </div>

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <nav className="sidebar-nav">

        {categories.map((category) => (
          <div key={category}>

            {!collapsed && (
              <div className="nav-category">
                {category}
              </div>
            )}

            {navItems
              .filter(
                (item) =>
                  item.category === category
              )
              .map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  data-title={item.label}
                  className={({ isActive }) =>
                    `nav-item ${
                      isActive
                        ? "active"
                        : ""
                    }`
                  }
                  onClick={() => {
                    if (
                      mobileOpen &&
                      onMobileClose
                    ) {
                      onMobileClose();
                    }
                  }}
                >

                  <item.icon
                    size={20}
                    className="nav-icon"
                  />

                  {!collapsed && (
                    <span className="nav-label">
                      {item.label}
                    </span>
                  )}

                </NavLink>
              ))}

          </div>
        ))}

      </nav>

      {/* =================================================
          LOGOUT
      ================================================= */}

      <div className="sidebar-footer">

        <button
          type="button"
          className="nav-item logout-btn"
          onClick={
            handleLogout
          }
        >

          <LogOut
            size={20}
            className="nav-icon"
          />

          {!collapsed && (
            <span className="nav-label">
              Logout
            </span>
          )}

        </button>

      </div>

    </aside>
  );
};

export default StudentSidebar;