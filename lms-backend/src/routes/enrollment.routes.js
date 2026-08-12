// src/routes/enrollment.routes.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const enrollmentController = require("../controllers/enrollment.controller");

// ==========================================
// STUDENT ROUTES (VIEW ONLY)
// ==========================================

// My Courses (VIEW ONLY - Student can see their enrollments)
router.get(
    "/my-courses",
    authMiddleware,
    roleMiddleware("STUDENT"),
    enrollmentController.myCourses
);

// Course Progress (VIEW ONLY - Student can see their progress)
router.get(
    "/course-progress/:courseId",
    authMiddleware,
    roleMiddleware("STUDENT"),
    enrollmentController.courseProgress
);

// ==========================================
// ADMIN & MENTOR ROUTES (FULL VIEW ACCESS)
// ==========================================

// GET ALL ENROLLMENTS - Admin & Mentor see all enrollments
router.get(
    "/admin/all",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    enrollmentController.getAllEnrollments
);

// GET ENROLLMENT BY ID - Admin & Mentor see all
router.get(
    "/admin/:id",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    enrollmentController.getEnrollmentById
);

// GET ENROLLMENTS BY COURSE - Admin & Mentor see all
router.get(
    "/admin/course/:courseId",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    enrollmentController.getEnrollmentsByCourse
);

// GET ENROLLMENT STATS - Admin & Mentor see all
router.get(
    "/admin/stats",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    enrollmentController.getEnrollmentStats
);

// Get student's enrollments with access status - Admin & Mentor see all
router.get(
    "/admin/student/:userId",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    enrollmentController.getStudentEnrollments
);

// Get mentor's students - Admin & Mentor see all
router.get(
    "/mentor/students",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    enrollmentController.getMentorStudents
);

// ==========================================
// ADMIN ONLY ROUTES (ALL WRITE OPERATIONS)
// ==========================================

// UPDATE ENROLLMENT - ADMIN ONLY
router.put(
    "/admin/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    enrollmentController.updateEnrollment
);

// DELETE ENROLLMENT - ADMIN ONLY
router.delete(
    "/admin/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    enrollmentController.deleteEnrollment
);

// Grant access with duration - ADMIN ONLY
router.post(
    "/admin/grant-access",
    authMiddleware,
    roleMiddleware("ADMIN"),
    enrollmentController.grantAccess
);

// Extend access duration - ADMIN ONLY
router.put(
    "/admin/:id/extend",
    authMiddleware,
    roleMiddleware("ADMIN"),
    enrollmentController.extendAccess
);

// Check and expire enrollments (cron job) - ADMIN ONLY
router.post(
    "/admin/check-expiry",
    authMiddleware,
    roleMiddleware("ADMIN"),
    enrollmentController.checkAndExpireEnrollments
);

// ==========================================
// TEST ROUTE
// ==========================================
router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Enrollment routes are working!",
        endpoints: {
            student_view_only: {
                myCourses: "GET /my-courses",
                progress: "GET /course-progress/:courseId"
            },
            admin_mentor_view: {
                all: "GET /admin/all",
                get: "GET /admin/:id",
                byCourse: "GET /admin/course/:courseId",
                stats: "GET /admin/stats",
                studentEnrollments: "GET /admin/student/:userId",
                mentorStudents: "GET /mentor/students"
            },
            admin_only: {
                update: "PUT /admin/:id",
                delete: "DELETE /admin/:id",
                grantAccess: "POST /admin/grant-access",
                extendAccess: "PUT /admin/:id/extend",
                checkExpiry: "POST /admin/check-expiry"
            }
        }
    });
});

module.exports = router;