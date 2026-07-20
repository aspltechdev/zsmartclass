// import { Routes, Route, Navigate } from 'react-router-dom';
// import AdminDashboard from '../pages/admin/Dashboard';
// function AdminRoutes() {
//   return (
//     <Routes>
//       <Route index element={<Navigate to="dashboard" />} />
//       <Route path="dashboard" element={<AdminDashboard />} />
//       <Route path="/admin" element={<AdminLayout />}>

//     <Route index element={<Navigate to="dashboard" />} />

//     <Route path="dashboard" element={<AdminDashboard />} />

//     <Route path="users" element={<AdminUsers />} />

//     <Route path="categories" element={<AdminCategories />} />

//     <Route path="courses" element={<AdminCourses />} />

//     <Route path="modules" element={<AdminModules />} />

//     <Route path="lessons" element={<AdminLessons />} />

//     <Route path="payments" element={<AdminPayments />} />

//     <Route path="certificates" element={<AdminCertificates />} />

//     <Route path="notifications" element={<AdminNotifications />} />

//     <Route path="reports" element={<AdminReports />} />

//     <Route path="settings" element={<AdminSettings />} />

// </Route>
//     </Routes>
//   );
// }
// export default AdminRoutes;

// src/routes/AdminRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import AdminDashboard from '../pages/admin/Dashboard';
import AdminUsers from '../pages/admin/Users';

import AdminCourses from '../pages/admin/Courses';
import AdminModules from '../pages/admin/Modules';
import AdminLessons from '../pages/admin/Lessons';
import AdminPayments from '../pages/admin/Payments';
import AdminCertificates from '../pages/admin/Certificates';
import AdminNotifications from '../pages/admin/Notifications';
import AdminReports from '../pages/admin/Reports';
import AdminSettings from '../pages/admin/Settings';
import AdminCategories from '../pages/admin/AdminCategories';

function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        {/* Default redirect to dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} />
        
        {/* Admin Pages */}
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="courses" element={<AdminCourses />} />
        <Route path="modules" element={<AdminModules />} />
        <Route path="lessons" element={<AdminLessons />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="certificates" element={<AdminCertificates />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
        
        {/* 404 for admin routes */}
        <Route path="*" element={
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2>Page Not Found</h2>
            <p>The admin page you're looking for doesn't exist.</p>
          </div>
        } />
      </Route>
    </Routes>
  );
}

export default AdminRoutes;