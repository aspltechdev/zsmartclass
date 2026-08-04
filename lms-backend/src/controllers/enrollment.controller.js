// src/controllers/enrollment.controller.js
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
        const result = await enrollmentService.myCourses(req.user.id);
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

// ==========================================
// ADMIN CONTROLLERS
// ==========================================

exports.getAllEnrollments = async (req, res) => {
    try {
        const result = await enrollmentService.getAllEnrollments();
        res.json({
            success: true,
            data: result
        });
    } catch (err) {
        console.error("Error in getAllEnrollments:", err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

exports.getEnrollmentById = async (req, res) => {
    try {
        const result = await enrollmentService.getEnrollmentById(req.params.id);
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

exports.updateEnrollment = async (req, res) => {
    try {
        const result = await enrollmentService.updateEnrollment(
            req.params.id,
            req.body
        );
        res.json({
            success: true,
            data: result,
            message: "Enrollment updated successfully."
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

exports.deleteEnrollment = async (req, res) => {
    try {
        const result = await enrollmentService.deleteEnrollment(req.params.id);
        res.json(result);
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

exports.getEnrollmentsByCourse = async (req, res) => {
    try {
        const result = await enrollmentService.getEnrollmentsByCourse(req.params.courseId);
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

exports.getEnrollmentStats = async (req, res) => {
    try {
        const result = await enrollmentService.getEnrollmentStats();
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