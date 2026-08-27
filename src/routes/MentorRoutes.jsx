import { Routes, Route, Navigate } from "react-router-dom";

import MentorModules from "../pages/mentor/Modules";
import MentorQuiz from "../pages/mentor/Quiz";
import MentorLessons from "../pages/mentor/Lessons";
import QuizMarks from "../pages/mentor/QuizMarks";
import MentorAssignments from "../pages/mentor/Assignments";
import MentorCertificates from "../pages/mentor/Certificates";
import MentorProfile from "../pages/mentor/Profile";
import MentorDashboard from "../pages/mentor/Dashboard";
import MentorCourses from "../pages/mentor/Courses";
import MentorStudents from "../pages/mentor/Students";
import MentorNotification from "../pages/mentor/Notification";
import MentorReviews from "../pages/mentor/Review";
import AssignmentSubmission from "../pages/mentor/AssignmentSubmission";


function MentorRoutes() {
  return (
    <Routes>
      <Route
        index
        element={<Navigate to="dashboard" replace />}
      />

      <Route
        path="dashboard"
        element={<MentorDashboard />}
      />

      <Route
        path="courses"
        element={<MentorCourses />}
      />

      <Route
        path="modules"
        element={<MentorModules />}
      />

      <Route
        path="quiz"
        element={<MentorQuiz />}
      />

      <Route
        path="lessons"
        element={<MentorLessons />}
      />

      <Route
        path="students"
        element={<MentorStudents />}
      />

      <Route
        path="quizmark"
        element={<QuizMarks />}
      />

      <Route
        path="notifications"
        element={<MentorNotification />}
      />

      <Route
        path="profile"
        element={<MentorProfile />}
      />

      <Route
        path="certificates"
        element={<MentorCertificates />}
      />

      <Route
        path="assignments"
        element={<MentorAssignments />}
      />

      {/* THIS IS THE IMPORTANT ROUTE */}
      <Route
        path="assignment-submissions"
        element={<AssignmentSubmission />}
      />

      <Route
        path="reviews"
        element={<MentorReviews />}
      />
    </Routes>
  );
}

export default MentorRoutes;