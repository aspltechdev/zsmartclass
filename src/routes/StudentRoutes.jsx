import { Routes, Route, Navigate } from 'react-router-dom';
import StudentDashboard from '../pages/student/Dashboard';
function StudentRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" />} />
      <Route path="dashboard" element={<StudentDashboard />} />
    </Routes>
  );
}
export default StudentRoutes;
