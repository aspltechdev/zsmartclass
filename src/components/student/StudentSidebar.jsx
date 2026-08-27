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
  Star,
  LogOut,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import "./StudentSidebar.css";

const StudentSidebar = ({
  collapsed = false,
  mobileOpen = false,
  onMobileClose,
  onLogout,
}) => {
  const navigate = useNavigate();

  // Get the currently logged-in student
  const { user } = useAuth();

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
    // Prefer the handler from StudentLayout.
    // This clears AuthContext state as well.
    if (typeof onLogout === "function") {
      onLogout();
      return;
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const handleNavigation = () => {
    if (mobileOpen && typeof onMobileClose === "function") {
      onMobileClose();
    }
  };

  /*
   * Display the logged-in student's name.
   *
   * Example:
   * user.name = "Renuka R"
   *
   * The sidebar will show:
   *
   * ZSMARTCLASS
   * RENUKA R
   */
  const studentName = user?.name || "STUDENT";

  return (
    <aside
      className={[
        "student-sidebar",
        collapsed ? "collapsed" : "",
        mobileOpen ? "mobile-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >

      {/* =================================================
          SIDEBAR HEADER / LOGO
          ================================================= */}

      <div className="sidebar-header">

        <div className="logo-container">

          {/* ZC LOGO */}
          <div className="logo-icon">
            <span>ZC</span>
          </div>

          {/* BRAND NAME + LOGGED-IN STUDENT */}
          {!collapsed && (
            <div className="logo-text">

              <span className="logo-title">
                ZSMARTCLASS
              </span>

              <span
                className="logo-student-name"
                title={studentName}
              >
                {studentName}
              </span>

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

            {/* CATEGORY TITLE */}
            {!collapsed && (
              <div className="nav-category">
                {category}
              </div>
            )}

            {/* CATEGORY ITEMS */}
            {navItems
              .filter(
                (item) =>
                  item.category === category
              )
              .map((item) => {

                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    data-title={item.label}
                    onClick={handleNavigation}
                    className={({ isActive }) =>
                      `nav-item ${
                        isActive ? "active" : ""
                      }`
                    }
                  >

                    <Icon
                      size={20}
                      className="nav-icon"
                    />

                    {!collapsed && (
                      <span className="nav-label">
                        {item.label}
                      </span>
                    )}

                  </NavLink>
                );
              })}

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
          onClick={handleLogout}
          data-title="Logout"
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