import { Outlet } from "react-router-dom";

import AdminHeader from "./AdminHeader";
import "./AdminLayout.css";
import AdminSidebar from "./AdminSidebar";

function AdminLayout() {
  return (
    <div className="admin-layout">

      {/* Sidebar */}
      <AdminSidebar />

      {/* Right Section */}
      <div className="admin-main">

        {/* Header */}
        <AdminHeader />

        {/* Page Content */}
        <main className="admin-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default AdminLayout;