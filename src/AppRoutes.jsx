import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

// Auth hook — THIS is the line that was missing.
// NOTE: match the path/name your ProtectedRoute.jsx already uses for useAuth.
// If yours differs, copy that exact import line here.
import { useAuth } from "./context/AuthContext";

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

// Page Routes
import AdminRoutes from "./routes/AdminRoutes";
import MentorRoutes from "./routes/MentorRoutes";
import StudentRoutes from "./routes/StudentRoutes";

// Layout Components
import StudentLayout from "./components/student/StudentLayout";
import AdminLayout from "./components/admin/AdminLayout";
import MentorLayout from "./components/mentor/MentorLayout";

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
        {/* Student Routes */}
        {/* ========================================== */}
        <Route
          path="/student/*"
          element={
            <ProtectedRoute roles={["STUDENT"]}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route path="*" element={<StudentRoutes />} />
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
  const { user } = useAuth();

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