// src/components/mentor/MentorLayout.jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import MentorHeader from "./MentorHeader";
import MentorSidebar from "./MentorSidebar";
import "./MentorLayout.css";

function MentorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <div className="mentor-layout">
      <MentorSidebar 
        isOpen={sidebarOpen} 
        isMobileOpen={mobileSidebarOpen}
        toggleMobile={toggleMobileSidebar}
      />
      <div className={`mentor-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <MentorHeader 
          toggleSidebar={toggleSidebar} 
          toggleMobileSidebar={toggleMobileSidebar}
          sidebarOpen={sidebarOpen}
          onToggleMobile={toggleMobileSidebar}
        />
        <div className="mentor-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default MentorLayout;