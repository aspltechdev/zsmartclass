const express = require("express");
const router = express.Router();

const playerController = require("../controllers/player.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// ============================================
// BULK PROGRESS (CRITICAL - MUST BE FIRST!)
// ============================================
router.get(
    "/course/:courseId/progress",
    authMiddleware,
    playerController.getCourseLessonProgress
);

// ============================================
// GATING (module unlock / quiz-pass state)
// Must be declared before "/course/:courseId".
// ============================================
router.get(
    "/course/:courseId/gating",
    authMiddleware,
    roleMiddleware("STUDENT"),
    playerController.getCourseGating
);

// ============================================
// Course Player
// Get complete course with modules & lessons (gated)
// ============================================
router.get(
    "/course/:courseId",
    authMiddleware,
    roleMiddleware("STUDENT"),
    playerController.getCoursePlayer
);

// ============================================
// Open Lesson (gated; only path to a playable video URL)
// courseId is passed as a query param: /lesson/:lessonId?courseId=123
// ============================================
router.get(
    "/lesson/:lessonId",
    authMiddleware,
    roleMiddleware("STUDENT"),
    playerController.getLesson
);

// ============================================
// Save Watch Time (drives lesson completion + course progress)
// ============================================
router.post(
    "/lesson/:lessonId/watch-time",
    authMiddleware,
    playerController.saveWatchTime
);

module.exports = router;
