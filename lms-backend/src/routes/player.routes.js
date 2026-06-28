const express = require("express");
const router = express.Router();

const playerController = require("../controllers/player.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// ============================================
// Course Player
// Get complete course with modules & lessons
// ============================================
router.get(
    "/course/:courseId",
    authMiddleware,
    roleMiddleware("STUDENT"),
    playerController.getCoursePlayer
);

// ============================================
// Open Lesson
// ============================================
router.get(
    "/lesson/:lessonId",
    authMiddleware,
    roleMiddleware("STUDENT"),
    playerController.getLesson
);

// ============================================
// Mark Lesson Completed
// ============================================
router.post(
    "/complete/:lessonId",
    authMiddleware,
    roleMiddleware("STUDENT"),
    playerController.markCompleted
);

// ============================================
// Continue Learning
// ============================================
router.get(
    "/continue/:courseId",
    authMiddleware,
    roleMiddleware("STUDENT"),
    playerController.continueLearning
);

// ============================================
// Previous Lesson
// ============================================
router.get(
    "/previous/:lessonId",
    authMiddleware,
    roleMiddleware("STUDENT"),
    playerController.previousLesson
);

// ============================================
// Next Lesson
// ============================================
router.get(
    "/next/:lessonId",
    authMiddleware,
    roleMiddleware("STUDENT"),
    playerController.nextLesson
);

module.exports = router;