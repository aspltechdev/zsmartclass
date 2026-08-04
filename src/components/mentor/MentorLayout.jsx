import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./MentorLayout.css";

import {
  ChevronDown,
  LayoutDashboard,
  BookOpen,
  Users,
  IndianRupee,
  Award,
  BookCopy,
  Star,
  ClipboardList,
  HelpCircle
} from "lucide-react";
function MentorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="mentor-layout">

      {/* ================= HEADER ================= */}

      <header className="mentor-header">

        <div className="sidebar-logo">
        <div className="logo-circle">Z</div>

        <div>
          <h2>ZsmartClass</h2>
          <p>Mentor Panel</p>
        </div>
      </div>

        <div className="header-right">

          {/* Send Notification */}

          <button
            className="notification-btn"
            title="Send Notification"
            onClick={() => navigate("/mentor/notifications")}
          >
            📤
          </button>

          {/* Profile */}

          <div className="profile-dropdown">
<img
  src={
    user?.profilePhoto
      ? `http://localhost:5000${user.profilePhoto}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
          user?.name || "Mentor"
        )}&background=2563eb&color=fff`
  }
  alt="profile"
  onError={(e) => {
    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.name || "Mentor"
    )}&background=2563eb&color=fff`;
  }}
/>

            <div className="profile-info">

              <h4>{user?.name}</h4>

              <p>{user?.role}</p>

            </div>

            <ChevronDown size={18} />

            <div className="dropdown-menu">

              <button onClick={() => navigate("/mentor/profile")}>
                👤 My Profile
              </button>

              <button onClick={handleLogout}>
                🚪 Logout
              </button>

            </div>

          </div>

        </div>

      </header>

      {/* ================= BODY ================= */}

      <div className="mentor-body">

        <aside className="mentor-sidebar">
<button onClick={() => navigate("/mentor/dashboard")}>
    <LayoutDashboard size={18} />
    Dashboard
</button>
          <button onClick={() => navigate("/mentor/courses")}>
            <BookOpen size={18} />
            My Courses
          </button>

          <button onClick={() => navigate("/mentor/students")}>
            <Users size={18} />
            Students
          </button>

          <button onClick={() => navigate("/mentor/earnings")}>
            <IndianRupee size={18} />
            Earnings
          </button>

         

          <button onClick={() => navigate("/mentor/lessons")}>
            <BookCopy size={18} />
            Lessons
          </button>

          <button onClick={() => navigate("/mentor/reviews")}>
            <Star size={18} />
            Reviews
          </button>
          
        <button onClick={() => navigate("/mentor/certificates")}>
  <Award size={18} />
  Certificates
</button>

<button onClick={() => navigate("/mentor/assignments")}>
  <ClipboardList size={18} />
  Assignments
</button>

<button onClick={() => navigate("/mentor/quiz")}>
  <HelpCircle size={18} />
  Quiz
</button>
        </aside>

        <main className="mentor-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default MentorLayout;