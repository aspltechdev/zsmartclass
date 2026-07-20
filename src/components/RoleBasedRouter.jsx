import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
function RoleBasedRouter() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to='/login' replace />;
  switch (user.role) {
    case 'ADMIN': return <Navigate to='/admin/dashboard' replace />;
    case 'MENTOR': return <Navigate to='/mentor/dashboard' replace />;
    case 'STUDENT': return <Navigate to='/student/dashboard' replace />;
    default: return <Navigate to='/login' replace />;
  }
}
export default RoleBasedRouter;
