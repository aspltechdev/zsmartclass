import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyOTP from "./pages/auth/VerifyOTP";
import VerifyResetOTP from "./pages/auth/VerifyResetOTP";
import InviteRegistration from "./pages/InviteRegistration";

// Protected Route Component
import ProtectedRoute from "./ProtectedRoute";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentCourses from "./pages/student/StudentCourses";
import StudentCourseDetail from "./pages/student/StudentCourseDetail";
import StudentMyCourses from "./pages/student/Studentmycourses";
import StudentCertificates from "./pages/student/StudentCertificates";

// // Page Routes
import AdminRoutes from "./routes/AdminRoutes";
import MentorRoutes from "./routes/MentorRoutes";

// Layout Components
import StudentLayout from "./components/student/StudentLayout";
import AdminLayout from "./components/admin/AdminLayout";
import MentorLayout from "./components/mentor/MentorLayout";
import AdminCategories from "./pages/admin/AdminCategories";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
     
        
        <Route path="/" element={<Navigate to="/login" />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-reset-otp" element={<VerifyResetOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register/invite" element={<InviteRegistration />} />

       
        <Route
          path="/student"
          element={
            <ProtectedRoute roles={["STUDENT"]}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="courses" element={<StudentCourses />} />
          <Route path="courses/:courseId" element={<StudentCourseDetail />} />
          <Route path="my-courses" element={<StudentMyCourses />} />
          <Route path="certificates" element={<StudentCertificates />} />
        </Route>


      {/* ========================================== */}
      {/* Admin Routes */}
      {/* ========================================== */}

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="*" element={<AdminRoutes />} />
        </Route>


        {/* ========================================== */}
        {/* Mentor Routes */}
        {/* ========================================== */}

        <Route
          path="/mentor/*"
          element={
            <ProtectedRoute roles={["MENTOR"]}>
              <MentorLayout />
            </ProtectedRoute>
          }
        >
          <Route path="*" element={<MentorRoutes />} />
        </Route>

        {/* ========================================== */}
        {/* Legacy Route (Backward Compatibility) */}
        {/* ========================================== */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={["STUDENT", "ADMIN", "MENTOR"]}>
              <DashboardRouter />
            </ProtectedRoute>
          }
        />

        {/* ========================================== */}
        {/* 404 Not Found */}
        {/* ========================================== */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

// Legacy Dashboard Router (redirects based on role)
function DashboardRouter() {
  const { user } = useAuth(); // You'll need to import useAuth
  
  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case "ADMIN":
      return <Navigate to="/admin/dashboard" />;
    case "MENTOR":
      return <Navigate to="/mentor/dashboard" />;
    case "STUDENT":
      return <Navigate to="/student/dashboard" />;
    default:
      return <Navigate to="/login" />;
  }
}

// 404 Page Component
function NotFound() {
  return (
    <div className="not-found-page">
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/">Go to Home</a>
    </div>
  );
}

export default AppRoutes;