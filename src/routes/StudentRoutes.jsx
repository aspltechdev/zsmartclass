import { Routes, Route, Navigate } from "react-router-dom";


// Student Pages
import StudentDashboard from "../pages/student/Dashboard";
import MyLearning from "../pages/student/MyLearning";
import CoursePlayer from "../pages/student/CoursePlayer";
import Assignments from "../pages/student/Assignments";
import Progress from "../pages/student/Progress";
import Quiz from "../pages/student/Quiz";
import Certificates from "../pages/student/Certificates";
import Notifications from "../pages/student/Notifications";
import Payments from "../pages/student/Payments";
import Profile from "../pages/student/Profile";
import Reviews from "../pages/student/Reviews";


function StudentRoutes() {
  return (
    <Routes>
        <Route index element={<Navigate to="dashboard" replace />}/>

        {/* MAIN */}

        <Route path="dashboard" element={<StudentDashboard />}/>

        {/* ========================================== */}
        {/* COURSES / LEARNING */}
        {/* ========================================== */}

        {/* Course details for an enrolled course */}

        {/* My enrolled courses */}
        <Route
          path="my-courses"
          element={<MyLearning />}
        />

        {/* Course player */}
        <Route
          path="player/:courseId"
          element={<CoursePlayer />}
        />

        {/* ========================================== */}
        {/* ASSIGNMENTS */}
        {/* ========================================== */}

        <Route
          path="assignments"
          element={<Assignments />}
        />

        {/* ========================================== */}
        {/* PROGRESS */}
        {/* ========================================== */}

        <Route
          path="progress"
          element={<Progress />}
        />

        {/* ========================================== */}
        {/* QUIZ */}
        {/* ========================================== */}

        <Route
          path="quiz"
          element={<Quiz />}
        />

        {/* ========================================== */}
        {/* CERTIFICATES */}
        {/* ========================================== */}

        <Route
          path="certificates"
          element={<Certificates />}
        />

        {/* ========================================== */}
        {/* NOTIFICATIONS */}
        {/* ========================================== */}

        <Route
          path="notifications"
          element={<Notifications />}
        />

        {/* ========================================== */}
        {/* PAYMENTS */}
        {/* ========================================== */}

        <Route
          path="payments"
          element={<Payments />}
        />

        {/* ========================================== */}
        {/* PROFILE */}
        {/* ========================================== */}

        <Route
          path="profile"
          element={<Profile />}
        />

        {/* ========================================== */}
        {/* REVIEWS */}
        {/* ========================================== */}

        <Route
          path="reviews"
          element={<Reviews />}
        />

        {/* ========================================== */}
        {/* SUPPORT */}
        {/* ========================================== */}

     
    </Routes>
  );
}

export default StudentRoutes;