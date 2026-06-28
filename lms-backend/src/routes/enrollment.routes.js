
const express = require("express");
const router = express.Router();

const enrollmentController = require("../controllers/enrollment.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// Student Enrollment
router.post(
    "/",
    authMiddleware,
    roleMiddleware("STUDENT"),
    enrollmentController.enroll
);

// My Courses
router.get(
    "/my-courses",
    authMiddleware,
    roleMiddleware("STUDENT"),
    enrollmentController.myCourses
);

// Course Progress
router.get(
    "/course-progress/:courseId",
    authMiddleware,
    roleMiddleware("STUDENT"),
    enrollmentController.courseProgress
);

// Cancel Enrollment
router.delete(
    "/:courseId",
    authMiddleware,
    roleMiddleware("STUDENT"),
    enrollmentController.cancelEnrollment
);

module.exports = router;
