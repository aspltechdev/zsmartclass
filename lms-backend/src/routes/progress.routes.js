// src/routes/progress.routes.js
//
// Student progress endpoints. These are backed by progress.controller /
// progress.service (schema-correct: modules via CourseModuleAssignment,
// LessonProgress.studentId, Enrollment.userId, lessons-only progress formula).
//
// NOTE: this file previously pointed at playerController and re-declared the
// old player routes (markCompleted / continue / previous / next). Those player
// methods were removed when the player service was rewritten for gating, and
// nothing on the frontend consumes those paths. The only /progress/* calls the
// app makes are the two GETs below (student Progress page). Completion is driven
// server-side by watch-time (POST /api/player/lesson/:id/watch-time), so no raw
// "mark complete" mutation is exposed here — that would bypass gating.

const express = require("express");
const router = express.Router();

const progressController = require("../controllers/progress.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// Courses the student is still working through (completed:false).
router.get(
    "/continue-learning",
    authMiddleware,
    roleMiddleware("STUDENT"),
    progressController.continueLearning
);

// A single course's progress: { totalLessons, completedLessons, progress }.
router.get(
    "/course/:courseId",
    authMiddleware,
    roleMiddleware("STUDENT"),
    progressController.getCourseProgress
);

// Read-only progress for one lesson (fail-safe: never 400s). Harmless read of
// the caller's own data.
router.get(
    "/lesson/:lessonId",
    authMiddleware,
    progressController.getLessonProgress
);

module.exports = router;
