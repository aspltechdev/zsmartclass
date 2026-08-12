// src/controllers/enrollment.controller.js
const prisma = require("../config/prisma");
const enrollmentService = require("../services/enrollment.service");

// ==========================================
// STUDENT CONTROLLERS (VIEW ONLY)
// ==========================================

// Student views their own courses (VIEW ONLY)
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

// Student views their course progress (VIEW ONLY)
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

// ==========================================
// ADMIN & MENTOR VIEW CONTROLLERS (FULL VIEW ACCESS)
// ==========================================

// Get all enrollments - Admin & Mentor see all
exports.getAllEnrollments = async (req, res) => {
    try {
        const result = await enrollmentService.getAllEnrollments();
        res.json({
            success: true,
            data: result,
            role: req.user.role
        });
    } catch (err) {
        console.error("Error in getAllEnrollments:", err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// Get enrollment by ID - Admin & Mentor see all
exports.getEnrollmentById = async (req, res) => {
    try {
        const result = await enrollmentService.getEnrollmentById(req.params.id);
        res.json({
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

// Get enrollments by course - Admin & Mentor see all
exports.getEnrollmentsByCourse = async (req, res) => {
    try {
        const result = await enrollmentService.getEnrollmentsByCourse(req.params.courseId);
        res.json({
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

// Get enrollment stats - Admin & Mentor see all
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

// Get student's enrollments with access status - Admin & Mentor see all
exports.getStudentEnrollments = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await enrollmentService.getStudentEnrollments(parseInt(userId));
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (err) {
        console.error("Error getting student enrollments:", err);
        res.status(err.statusCode || 400).json({
            success: false,
            message: err.message,
        });
    }
};

// Get mentor's students - Admin & Mentor see all
exports.getMentorStudents = async (req, res) => {
    try {
        const { mentorId } = req.query;
        let targetMentorId = req.user.id;
        
        if (req.user.role === "ADMIN" && mentorId) {
            targetMentorId = parseInt(mentorId);
        }

        const result = await enrollmentService.getMentorStudents(targetMentorId);

        res.status(200).json({
            success: true,
            data: result,
            count: result.length
        });
    } catch (err) {
        console.error("Error getting mentor students:", err);
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

// ==========================================
// ADMIN ONLY CONTROLLERS (WRITE OPERATIONS)
// ==========================================

// Update enrollment - ADMIN ONLY
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
        res.status(err.statusCode || 400).json({
            success: false,
            message: err.message
        });
    }
};

// Delete enrollment - ADMIN ONLY
exports.deleteEnrollment = async (req, res) => {
    try {
        const result = await enrollmentService.deleteEnrollment(req.params.id);
        res.json(result);
    } catch (err) {
        res.status(err.statusCode || 400).json({
            success: false,
            message: err.message
        });
    }
};

// Grant access with duration - ADMIN ONLY
exports.grantAccess = async (req, res) => {
    try {
        const { userId, courseId, durationDays } = req.body;

        if (!userId || !courseId) {
            return res.status(400).json({
                success: false,
                message: "userId and courseId are required",
            });
        }

        const result = await enrollmentService.grantAccess(
            userId,
            courseId,
            durationDays || null,
            req.user.id
        );

        res.status(201).json({
            success: true,
            message: `Access granted successfully${durationDays ? ` for ${durationDays} days` : ' (unlimited)'}`,
            data: result,
        });
    } catch (err) {
        console.error("Error granting access:", err);
        res.status(err.statusCode || 400).json({
            success: false,
            message: err.message,
        });
    }
};

// Extend access duration - ADMIN ONLY
exports.extendAccess = async (req, res) => {
    try {
        const { id } = req.params;
        const { additionalDays } = req.body;

        if (!additionalDays || additionalDays < 1) {
            return res.status(400).json({
                success: false,
                message: "additionalDays is required and must be at least 1",
            });
        }

        const result = await enrollmentService.extendAccess(
            parseInt(id),
            parseInt(additionalDays)
        );

        res.status(200).json({
            success: true,
            message: `Access extended by ${additionalDays} days`,
            data: result,
        });
    } catch (err) {
        console.error("Error extending access:", err);
        res.status(err.statusCode || 400).json({
            success: false,
            message: err.message,
        });
    }
};

// Check and expire enrollments - ADMIN ONLY
exports.checkAndExpireEnrollments = async (req, res) => {
    try {
        const result = await enrollmentService.checkAndExpireEnrollments();
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (err) {
        console.error("Error checking expired enrollments:", err);
        res.status(500).json({
            success: false,
            message: "Failed to check expired enrollments",
        });
    }
};