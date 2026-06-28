
const enrollmentService = require("../services/enrollment.service");

exports.enroll = async (req, res) => {

    try {

        req.body.studentId = req.user.id;

        const result = await enrollmentService.enroll(req.body);

        res.status(201).json({
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

exports.myCourses = async (req, res) => {

    try {

        const result = await enrollmentService.myCourses(
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

exports.courseProgress = async (req, res) => {

    try {

        const result = await enrollmentService.courseProgress(
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

exports.cancelEnrollment = async (req, res) => {

    try {

        const result = await enrollmentService.cancelEnrollment(
            req.user.id,
            req.params.courseId
        );

        res.json(result);

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message
        });

    }

};
