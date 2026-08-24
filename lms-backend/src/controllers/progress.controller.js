const progressService = require("../services/progress.service");
// ---------------------------------------------------------------------------
// DEPLOYMENT MARKER
// If you do NOT see this line in the backend terminal after a restart, this
// file is not the one running — the old build is still loaded.
console.log("✅ progress.controller loaded (fail-safe getLessonProgress v2)");
// ---------------------------------------------------------------------------

exports.markCompleted = async (req, res) => {

    try {

        req.body.studentId = req.user.id;

        const result = await progressService.markCompleted(req.body);

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

exports.getLessonProgress = async (req, res) => {

    /*
     * This endpoint must NEVER fail. The player calls it for every lesson on
     * load; a 400 here means the UI falls back to 0% and the student loses
     * all visible progress even though it is saved in the database.
     * On any error we log it and return an empty-but-valid progress object.
     */
    const lessonId = Number(req.params.lessonId) || 0;

    const emptyProgress = {
        lessonId,
        watchedSeconds: 0,
        lastPosition: 0,
        durationSeconds: 0,
        completed: false,
        percentage: 0
    };

    try {

        const result = await progressService.getLessonProgress(
            req.user.id,
            req.params.lessonId
        );

        return res.status(200).json({
            success: true,
            data: result || emptyProgress
        });

    } catch (err) {

        console.error(
            `getLessonProgress failed (user ${req.user?.id}, lesson ${lessonId}):`,
            err.message
        );

        // 200 with zeros, not 400 — a missing record is not a client error.
        return res.status(200).json({
            success: true,
            data: emptyProgress
        });

    }

};

exports.getCourseProgress = async (req, res) => {

    try {

        const result = await progressService.getCourseProgress(
            req.user.id,
            req.params.courseId
        );

        res.json({
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

exports.continueLearning = async (req, res) => {

    try {

        const result = await progressService.continueLearning(
            req.user.id
        );

        res.json({
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