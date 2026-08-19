// src/components/mentor/MentorSidebar.jsx
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  IndianRupee,
  Award,
  Layers,
  Star,
  ClipboardList,
  FileQuestion,
  Settings,
  LogOut,
} from "lucide-react";
import "./MentorSidebar.css";

const menu = [
  // ==========================================
  // MAIN DASHBOARD
  // ==========================================
  {
    title: "Dashboard",
    path: "/mentor/dashboard",
    icon: LayoutDashboard,
    category: "Main",
  },

  // ==========================================
  // CONTENT MANAGEMENT
  // ==========================================
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

  // ==========================================
  // STUDENTS & ENGAGEMENT
  // ==========================================
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
  

  // ==========================================
  // ANALYTICS
  // ==========================================
  {
    title: "Reviews",
    path: "/mentor/reviews",
    icon: Star,
    category: "Analytics",
  },
];

// Get unique categories
const categories = [...new Set(menu.map(item => item.category))];

function MentorSidebar({ isOpen, isMobileOpen, toggleMobile }) {
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <aside className={`mentor-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
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
                    className={({ isActive }) =>
                      isActive ? "sidebar-link active" : "sidebar-link"
                    }
                    data-title={item.title}
                    onClick={() => {
                      if (window.innerWidth <= 768) {
                        toggleMobile?.();
                      }
                    }}
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

export default MentorSidebar;