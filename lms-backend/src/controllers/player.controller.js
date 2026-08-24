const playerService = require("../services/player.service");

// ==========================================
// Get Complete Course Player
// ==========================================
exports.getCoursePlayer = async (req, res) => {

    try {

        const result = await playerService.getCoursePlayer(
            req.user.id,
            req.params.courseId
        );

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message
        });

    }

};

// ==========================================
// Get Single Lesson
// ==========================================
exports.getLesson = async (req, res) => {

    try {

        const result = await playerService.getLesson(
            req.user.id,
            req.params.lessonId
        );

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message
        });

    }

};

// ==========================================
// Mark Lesson Completed
// ==========================================
exports.markCompleted = async (req, res) => {

    try {

        const result = await playerService.markCompleted(
            req.user.id,
            req.params.lessonId
        );

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message
        });

    }

};

// ==========================================
// Continue Learning
// ==========================================
exports.continueLearning = async (req, res) => {

    try {

        const result = await playerService.continueLearning(
            req.user.id,
            req.params.courseId
        );

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message
        });

    }

};

// ==========================================
// Previous Lesson
// ==========================================
exports.previousLesson = async (req, res) => {

    try {

        const result = await playerService.previousLesson(
            req.user.id,
            req.params.lessonId
        );

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message
        });

    }

};

// ==========================================
// Next Lesson
// ==========================================
exports.nextLesson = async (req, res) => {

    try {

        const result = await playerService.nextLesson(
            req.user.id,
            req.params.lessonId
        );

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message
        });

    }

};

/* =========================================================
   SAVE WATCH TIME  (POST /api/player/lesson/:lessonId/watch-time)

   The student CoursePlayer posts here every few seconds. The route did
   not exist, so every save 404'd and no progress was ever recorded —
   course progress and lesson progress both stayed at 0%.

   Writes LessonProgress, then recalculates Enrollment.progress from the
   course's real lesson count (resolved through the module link table).
========================================================= */
exports.saveWatchTime = async (req, res) => {

    try {

        const result = await playerService.saveWatchTime(
            req.user.id,
            req.params.lessonId,
            req.body || {}
        );

        res.status(200).json({
            success: true,
            data: result
        });

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