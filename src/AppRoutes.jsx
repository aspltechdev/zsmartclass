// import {
//   BrowserRouter,
//   Routes,
//   Route,
//   Navigate
// } from "react-router-dom";

// import Login from "./pages/auth/Login";
// import Register from "./pages/auth/Register";
// import Dashboard from "./pages/Dashboard";
// import ProtectedRoute from "./ProtectedRoute";

// import ForgotPassword from "./pages/auth/ForgotPassword";
// import ResetPassword from "./pages/auth/ResetPassword";
// import VerifyOTP from "./pages/auth/VerifyOTP";
// import VerifyResetOTP from "./pages/auth/VerifyResetOTP";

// function AppRoutes() {
//   return (
//     <BrowserRouter>
//       <Routes>

//         <Route
//           path="/"
//           element={<Navigate to="/login" />}
//         />

//         <Route
//           path="/login"
//           element={<Login />}
//         />

//         <Route
//           path="/register"
//           element={<Register />}
//         />

        

//         <Route
//           path="/dashboard"
//           element={
//             <ProtectedRoute>
//               <Dashboard />
//             </ProtectedRoute>
//           }
//         />

// <Route
//     path="/verify-otp"
//     element={<VerifyOTP />}
// />

// <Route
//   path="/forgot-password"
//   element={<ForgotPassword />}
// />


// <Route
//     path="/reset-password"
//     element={<ResetPassword />}
// />



// <Route
//   path="/verify-reset-otp"
//   element={<VerifyResetOTP />}
// />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default AppRoutes;


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

// Protected Route Component
import ProtectedRoute from "./ProtectedRoute";

// Student Pages
import StudentDashboard from "./pages/student/Dashboard";
import MyCourses from "./pages/student/MyCourses";
import CoursePlayer from "./pages/student/CoursePlayer";
import Certificates from "./pages/student/Certificates";
import Notifications from "./pages/student/Notifications";
import Payments from "./pages/student/Payments";
import Profile from "./pages/student/Profile";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCourses from "./pages/admin/Courses";
import AdminUsers from "./pages/admin/Users";
import AdminPayments from "./pages/admin/Payments";
import AdminCertificates from "./pages/admin/Certificates";

// Mentor Pages
import MentorDashboard from "./pages/mentor/Dashboard";
import MentorCourses from "./pages/mentor/Courses";
import MentorStudents from "./pages/mentor/Students";
import MentorEarnings from "./pages/mentor/Earnings";

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
          <Route path="my-courses" element={<MyCourses />} />
          <Route path="course/:courseId" element={<CoursePlayer />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="payments" element={<Payments />} />
          <Route path="profile" element={<Profile />} />
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
          <Route path="certificates" element={<AdminCertificates />} />
        </Route>

        {/* ========================================== */}
        {/* Mentor Routes */}
        {/* ========================================== */}
        <Route
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