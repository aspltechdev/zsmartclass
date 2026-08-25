const playerService = require("../services/player.service");

// ==========================================
// Get Complete Course Player (gated structure + progress)
// ==========================================
exports.getCoursePlayer = async (req, res) => {
    try {
        const result = await playerService.getCoursePlayer(
            req.user.id,
            req.params.courseId
        );
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        res.status(err.statusCode || 400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// Get Course Gating (module unlock / quiz-pass state only)
// ==========================================
exports.getCourseGating = async (req, res) => {
    try {
        const result = await playerService.getCourseGating(
            req.user.id,
            req.params.courseId
        );
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        res.status(err.statusCode || 400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// Get Single Lesson (only path to a playable video URL — gated)
// courseId comes from the query string so gating is course-scoped.
// ==========================================
exports.getLesson = async (req, res) => {
    try {
        const result = await playerService.getLesson(
            req.user.id,
            req.params.lessonId,
            req.query.courseId
        );
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        res.status(err.statusCode || 400).json({
            success: false,
            message: err.message
        });
    }
};

/* =========================================================
   SAVE WATCH TIME  (POST /api/player/lesson/:lessonId/watch-time)

   The student CoursePlayer posts here every few seconds. Writes
   LessonProgress, then recalculates Enrollment.progress from the
   course's real lesson count (resolved through the module link table).
========================================================= */
exports.saveWatchTime = async (req, res) => {
    try {
        const result = await playerService.saveWatchTime(
            req.user.id,
            req.params.lessonId,
            req.body || {}
        );
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        res.status(err.statusCode || 400).json({
            success: false,
            message: err.message
        });
    }
};

/* =========================================================
   BULK PROGRESS  (GET /api/player/course/:courseId/progress)
   Never fails: returns an empty map rather than an error status, so the
   player always renders something.
========================================================= */
exports.getCourseLessonProgress = async (req, res) => {
    try {
        const result = await playerService.getCourseLessonProgress(
            req.user.id,
            req.params.courseId
        );
        return res.status(200).json({ success: true, data: result });
    } catch (err) {
        console.error("getCourseLessonProgress failed:", err.message);
        return res.status(200).json({
            success: true,
            data: { lessons: {}, overallProgress: 0, totalLessons: 0, completedLessons: 0 }
        });
    }
};
