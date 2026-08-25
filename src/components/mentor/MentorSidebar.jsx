// src/components/mentor/MentorSidebar.jsx
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
  FileText,
    BadgeCheck,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./MentorSidebar.css";

const menu = [
  { title: "Dashboard", path: "/mentor/dashboard", icon: LayoutDashboard, category: "Main" },

  { title: "My Courses", path: "/mentor/courses", icon: BookOpen, category: "Content" },
  { title: "Modules", path: "/mentor/modules", icon: Layers, category: "Content" },

  { title: "Students Enrollments", path: "/mentor/students", icon: Users, category: "Engagement" },
  { title: "Quiz Marks", path: "/mentor/quizmark", icon: FileQuestion, category: "Engagement" },
  { title: "Certificates", path: "/mentor/certificates", icon: Award, category: "Engagement" },
  { title: "Assignments", path: "/mentor/assignments", icon: ClipboardList, category: "Engagement" },

{ title: "Assignment Submission", path: "/mentor/assignment-submissions", icon:   BadgeCheck, category: "Engagement" },

  { title: "Reviews", path: "/mentor/reviews", icon: Star, category: "Analytics" },
];

const categories = [...new Set(menu.map((item) => item.category))];

function MentorSidebar({ collapsed = false, mobileOpen = false, onNavigate }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    // Use the auth context so in-memory state is cleared too, not just storage.
    if (typeof logout === "function") {
      logout();
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    navigate("/login", { replace: true });
  };

  const handleLinkClick = () => {
    if (typeof onNavigate === "function") onNavigate();
  };

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
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-circle">Z</div>
        <div>
          <h2>ZsmartClass</h2>
          <p>Mentor Panel</p>
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
                    onClick={handleLinkClick}
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
        <button className="logout-btn" onClick={handleLogout} data-title="Logout">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default MentorSidebar;