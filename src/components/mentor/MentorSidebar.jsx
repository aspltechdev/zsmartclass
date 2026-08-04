import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  IndianRupee,
  Award,
  PlaySquare,
  Star,
  ClipboardList,
  FileQuestion
} from "lucide-react";
import "./MentorSidebar.css";

function MentorSidebar() {
  return (
    <aside className="mentor-sidebar">

      <div className="sidebar-logo">
      </div>

      <nav className="sidebar-menu">

        <NavLink
          to="/mentor/dashboard"
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/mentor/courses"
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          <BookOpen size={18} />
          <span>My Courses</span>
        </NavLink>

        <NavLink
          to="/mentor/lessons"
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          <PlaySquare size={18} />
          <span>Lessons</span>
        </NavLink>

        <NavLink
          to="/mentor/students"
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          <Users size={18} />
          <span>Students</span>
        </NavLink>

        <NavLink
          to="/mentor/certificates"
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          <Award size={18} />
          <span>Certificates</span>
        </NavLink>

        <NavLink
          to="/mentor/earnings"
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          <IndianRupee size={18} />
          <span>Earnings</span>
        </NavLink>

        <NavLink
          to="/mentor/reviews"
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          <Star size={18} />
          <span>Reviews</span>
        </NavLink>

        <NavLink
          to="/mentor/assignments"
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          <ClipboardList size={18} />
          <span>Assignments</span>
        </NavLink>

        <NavLink
          to="/mentor/quiz"
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          <FileQuestion size={18} />
          <span>Quiz</span>
        </NavLink>

      </nav>

    </aside>
  );
}

export default MentorSidebar;