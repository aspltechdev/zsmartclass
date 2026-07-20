import { Routes, Route, Navigate } from 'react-router-dom';
import MentorDashboard from '../pages/mentor/Dashboard';
function MentorRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" />} />
      <Route path="dashboard" element={<MentorDashboard />} />
    </Routes>
  );
}
export default MentorRoutes;
