const express = require("express");
const router = express.Router();

const progressController = require("../controllers/progress.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// Mark Lesson as Completed
router.post(
    "/complete",
    authMiddleware,
    roleMiddleware("STUDENT"),
    progressController.markCompleted
);

// Get Lesson Progress
router.get(
    "/lesson/:lessonId",
    authMiddleware,
    roleMiddleware("STUDENT"),
    progressController.getLessonProgress
);

// Get Course Progress
router.get(
    "/course/:courseId",
    authMiddleware,
    roleMiddleware("STUDENT"),
    progressController.getCourseProgress
);

// Continue Learning
router.get(
    "/continue-learning",
    authMiddleware,
    roleMiddleware("STUDENT"),
    progressController.continueLearning
);

module.exports = router;