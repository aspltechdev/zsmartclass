// src/components/student/StudentLayout.jsx
import { Outlet } from "react-router-dom";

import StudentHeader from "./StudentHeader";
import "./StudentLayout.css";
import StudentSidebar from "./StudentSidebar";

function StudentLayout() {
  return (
    <div className="student-layout">

      {/* Sidebar */}
      <StudentSidebar />

      {/* Right Section */}
      <div className="student-main">

        {/* Header */}
        <StudentHeader />

        {/* Page Content */}
        <main className="student-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default StudentLayout;