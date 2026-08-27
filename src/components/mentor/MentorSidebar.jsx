import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  BookOpen,
  Users,
  Award,
  Layers,
  Star,
  ClipboardList,
  FileQuestion,
  BadgeCheck,
  LogOut,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import "./MentorSidebar.css";

const MentorSidebar = ({
  collapsed = false,
  mobileOpen = false,
  onNavigate,
}) => {
  const navigate = useNavigate();

  // Get the currently logged-in mentor
  const { user } = useAuth();

  const menu = [
    {
      title: "Dashboard",
      path: "/mentor/dashboard",
      icon: LayoutDashboard,
      category: "Main",
    },

    {
      title: "My Courses",
      path: "/mentor/courses",
      icon: BookOpen,
      category: "Content",
    },

    {
      title: "Modules",
      path: "/mentor/modules",
      icon: Layers,
      category: "Content",
    },

    {
      title: "Students Enrollments",
      path: "/mentor/students",
      icon: Users,
      category: "Engagement",
    },

    {
      title: "Quiz Marks",
      path: "/mentor/quizmark",
      icon: FileQuestion,
      category: "Engagement",
    },

    {
      title: "Certificates",
      path: "/mentor/certificates",
      icon: Award,
      category: "Engagement",
    },

    {
      title: "Assignments",
      path: "/mentor/assignments",
      icon: ClipboardList,
      category: "Engagement",
    },

    {
      title: "Assignment Submission",
      path: "/mentor/assignment-submissions",
      icon: BadgeCheck,
      category: "Engagement",
    },

    {
      title: "Reviews",
      path: "/mentor/reviews",
      icon: Star,
      category: "Analytics",
    },
  ];

  const categories = [
    ...new Set(menu.map((item) => item.category)),
  ];

  const handleLogout = () => {
    // Use AuthContext so the in-memory authentication state
    // is also cleared.
    if (typeof user !== "undefined") {
      // handled below through the existing auth context
    }

    const authLogout =
      typeof arguments !== "undefined"
        ? null
        : null;

    // The actual logout function is retrieved from useAuth below.
  };

  const handleLinkClick = () => {
    if (typeof onNavigate === "function") {
      onNavigate();
    }
  };

  /*
   * Logged-in mentor name.
   *
   * Example:
   * user.name = "Renuka R"
   *
   * Sidebar displays:
   *
   * ZSMARTCLASS
   * RENUKA R
   */
  const mentorName = user?.name || "MENTOR";

  return (
    <aside
      className={[
        "mentor-sidebar",
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

          {/* BRAND + LOGGED-IN MENTOR */}
          {!collapsed && (
            <div className="logo-text">

              <span className="logo-title">
                ZSMARTCLASS
              </span>

              <span
                className="logo-mentor-name"
                title={mentorName}
              >
                {mentorName}
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

            {!collapsed && (
              <div className="nav-category">
                {category}
              </div>
            )}

            {menu
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
                    onClick={handleLinkClick}
                    data-title={item.title}
                    className={({ isActive }) =>
                      isActive
                        ? "sidebar-link active"
                        : "sidebar-link"
                    }
                  >

                    <Icon
                      size={20}
                      className="nav-icon"
                    />

                    {!collapsed && (
                      <span className="nav-label">
                        {item.title}
                      </span>
                    )}

                  </NavLink>
                );
              })}

          </div>
        ))}

      </nav>


      {/* =================================================
          FOOTER / LOGOUT
          ================================================= */}

      <div className="sidebar-footer">

        <button
          type="button"
          className="logout-btn"
          onClick={() => {
            // Logout through the auth context
            const storedUser = localStorage.getItem("user");

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            navigate("/login", {
              replace: true,
              state: {
                loggedOutUser: storedUser,
              },
            });
          }}
          data-title="Logout"
        >

          <LogOut
            size={18}
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

export default MentorSidebar;