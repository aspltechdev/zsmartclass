// src/routes/AdminRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";

import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminCategories from "../pages/admin/AdminCategories";
import AdminCourses from "../pages/admin/AdminCourses";
import AdminModules from "../pages/admin/AdminModules";
import AdminLessons from "../pages/admin/AdminLessons";
import AdminEnrollments from "../pages/admin/AdminEnrollments";
import AdminPayments from "../pages/admin/AdminPayments";
import AdminCertificates from "../pages/admin/AdminCertificates";
import AdminNotifications from "../pages/admin/AdminNotifications";
import AdminReports from "../pages/admin/AdminReports";
import AdminProfile from "../pages/admin/AdminProfile";

function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />

      {/* Main */}
      <Route path="dashboard" element={<AdminDashboard />} />

      {/* Management */}
      <Route path="users" element={<AdminUsers />} />
      <Route path="categories" element={<AdminCategories />} />

      {/* Content */}
      <Route path="courses" element={<AdminCourses />} />
      <Route path="modules" element={<AdminModules />} />
      <Route path="lessons" element={<AdminLessons />} />

      {/* Operations */}
      <Route path="enrollments" element={<AdminEnrollments />} />
      <Route path="payments" element={<AdminPayments />} />
      <Route path="certificates" element={<AdminCertificates />} />

      {/* Engagement + analytics */}
      <Route path="notifications" element={<AdminNotifications />} />
      <Route path="reports" element={<AdminReports />} />

      {/* System */}
      <Route path="profile" element={<AdminProfile />} />

      {/* Unknown admin path -> dashboard instead of a blank 404 */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}

export default AdminRoutes;