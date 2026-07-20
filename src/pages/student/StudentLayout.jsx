// src/components/student/StudentLayout.jsx
import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import StudentSidebar from "./StudentSidebar";
import StudentHeader from "./StudentHeader";
import "./StudentLayout.css";

function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="student-layout">
      {/* Sidebar */}
      <StudentSidebar 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
        currentPath={location.pathname}
      />

      {/* Main Content */}
      <div className={`student-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <StudentHeader 
          user={user}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <motion.main 
          className="student-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="wait">
            <Outlet />
          </AnimatePresence>
        </motion.main>
      </div>
    </div>
  );
}

export default StudentLayout;