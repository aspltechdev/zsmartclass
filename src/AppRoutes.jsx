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

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminCertificates from "./pages/admin/AdminCertificates";
import AdminModules from "./pages/admin/AdminModules";
import AdminEnrollments from "./pages/admin/AdminEnrollments";
//import AdminLessons from "./pages/admin/AdminLessons";
import AdminNotifications from "./pages/admin/AdminNotifications";
//import AdminReviews from "./pages/admin/AdminReviews";
import AdminReports from "./pages/admin/AdminReports";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminProfile from "./pages/admin/AdminProfile";

// Mentor Pages
//import MentorAssignments from "./pages/mentor/Assignments";
//import MentorQuiz from "./pages/mentor/Quiz";
//import MentorLessons from "./pages/mentor/Lessons";
//import MentorCertificates from "./pages/mentor/Certificates";
//import MentorReviews from "./pages/mentor/Review";
//import MentorProfile from "./pages/mentor/Profile";
//import MentorDashboard from "./pages/mentor/Dashboard";
//import MentorCourses from "./pages/mentor/Courses";
//import MentorStudents from "./pages/mentor/Students";
//import MentorEarnings from "./pages/mentor/Earnings";
//import MentorNotification from "./pages/mentor/Notification";

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

 
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="categories" element ={<AdminCategories/>}/>
          <Route path="/admin/certificates" element={<AdminCertificates />} />
          <Route path="/admin/modules" element={<AdminModules />} />
          <Route path="/admin/enrollments" element={<AdminEnrollments />} />
          {/*<Route path="/admin/lessons" element={<AdminLessons />} />*/}
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          {/*<Route path="/admin/reviews" element={<AdminReviews />} />*/}
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/coupons" element={<AdminCoupons />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
        </Route>

        {/* ========================================== */}
        {/* Mentor Routes */}
        {/* ========================================== */}
        {/*<Route
          path="/mentor"
          element={
            <ProtectedRoute roles={["MENTOR"]}>
              <MentorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<MentorDashboard />} />
          <Route path="courses" element={<MentorCourses />} />
          <Route path="students" element={<MentorStudents />} />
          <Route path="earnings" element={<MentorEarnings />} />
          <Route path="lessons" element={<MentorLessons />} />
          <Route path="certificates" element={<MentorCertificates />} />
          <Route path="reviews" element={<MentorReviews />} />
          <Route path="assignments" element={<MentorAssignments />} />
          <Route path="quiz" element={<MentorQuiz />} />
          <Route path="notifications" element={<MentorNotification />} />
          <Route path="profile" element={<MentorProfile />} />
        </Route>*/}

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