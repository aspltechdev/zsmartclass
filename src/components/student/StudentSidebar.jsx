// src/components/student/StudentSidebar.jsx
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Compass,
  BookOpen,
  Award,
  Bell,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./StudentSidebar.css";

const menu = [
  { title: "Dashboard", path: "/student/dashboard", icon: LayoutDashboard },
  { title: "Browse courses", path: "/student/courses", icon: Compass },
  { title: "My courses", path: "/student/my-courses", icon: BookOpen },
  { title: "Certificates", path: "/student/certificates", icon: Award },
  { title: "Notifications", path: "/student/notifications", icon: Bell },
  { title: "Profile", path: "/student/profile", icon: User },
];

function StudentSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="student-sidebar">
      <div className="sidebar-logo">
        <div className="logo-circle">Z</div>
        <div>
          <h2>ZsmartClass</h2>
          <p>Student</p>
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
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default StudentSidebar;