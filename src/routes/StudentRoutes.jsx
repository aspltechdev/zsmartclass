import { Routes, Route, Navigate } from 'react-router-dom';

// Student Pages (all live under src/pages/student/)
//import Dashboard from '../pages/student/Dashboard';
// import CourseCatalog from '../pages/student/CourseCatalog';
// import CourseDetails from '../pages/student/CourseDetails';
// import MyLearning from '../pages/student/MyLearning';
// import CoursePlayer from '../pages/student/CoursePlayer';
// import Quiz from '../pages/student/Quiz';
// import Assignments from '../pages/student/Assignments';
// import Certificates from '../pages/student/Certificates';
// import Progress from '../pages/student/Progress';
// import Notifications from '../pages/student/Notifications';
// import Payments from '../pages/student/Payments';
// import Reviews from '../pages/student/Reviews';
// import Profile from '../pages/student/Profile';
// import Settings from '../pages/student/Settings';
// import Support from '../pages/student/Support';

/**
 * Nested student routes. Mounted by AppRoutes under the protected
 * `/student/*` branch, inside <StudentLayout /> (which renders <Outlet />).
 * Paths here are RELATIVE to /student, and were chosen to match the links
 * the pages already point at:
 *   /student/courses            (CourseCatalog links, "Browse")
 *   /student/courses/:courseId  (CourseDetails reads useParams().courseId)
 *   /student/my-courses         (Dashboard/Quiz/Player "View All" links)
 *   /student/player/:courseId   (Catalog/Notifications/Progress links)
 *   /student/certificates       (Progress "View certificate" link)
 */
function StudentRoutes() {
  return (
    <Routes>
      {/* /student -> /student/dashboard */}
      <Route index element={<Navigate to="dashboard" replace />} />

      {/* <Route path="dashboard" element={<Dashboard />} /> */}

      {/* Catalog + details */}
      {/* <Route path="courses" element={<CourseCatalog />} />
      <Route path="courses/:courseId" element={<CourseDetails />} /> */}

      {/* Enrolled learning */}
      {/* <Route path="my-courses" element={<MyLearning />} />
      <Route path="player/:courseId" element={<CoursePlayer />} /> */}

      {/* Coursework */}
      {/* <Route path="quiz" element={<Quiz />} />
      <Route path="assignments" element={<Assignments />} /> */}

      {/* Records + progress */}
      {/* <Route path="certificates" element={<Certificates />} />
      <Route path="progress" element={<Progress />} /> */}

      {/* Account + comms */}
      {/* <Route path="notifications" element={<Notifications />} />
      <Route path="payments" element={<Payments />} />
      <Route path="reviews" element={<Reviews />} />
      <Route path="profile" element={<Profile />} />
      <Route path="settings" element={<Settings />} />
      <Route path="support" element={<Support />} /> */}

      {/* Unknown /student/* -> dashboard */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}

export default StudentRoutes;