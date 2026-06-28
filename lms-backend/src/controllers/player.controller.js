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