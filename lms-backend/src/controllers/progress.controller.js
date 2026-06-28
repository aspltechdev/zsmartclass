const progressService = require("../services/progress.service");

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

    try {

        const result = await progressService.getLessonProgress(
            req.user.id,
            req.params.lessonId
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