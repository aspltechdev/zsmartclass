// src/controllers/report.controller.js
const reportService = require("../services/report.service");

// ==========================================
// OVERVIEW REPORTS
// ==========================================

/**
 * Get dashboard overview statistics
 * @route GET /api/reports/overview
 */
exports.getOverview = async (req, res) => {
    try {
        const result = await reportService.getOverview();
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        console.error("❌ Error in getOverview:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to fetch overview statistics"
        });
    }
};

/**
 * Get revenue overview with trends
 * @route GET /api/reports/revenue
 */
exports.getRevenueOverview = async (req, res) => {
    try {
        const { period = 'monthly' } = req.query;
        const result = await reportService.getRevenueOverview(period);
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        console.error("❌ Error in getRevenueOverview:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to fetch revenue data"
        });
    }
};

/**
 * Get enrollment trends over time
 * @route GET /api/reports/enrollment-trends
 */
exports.getEnrollmentTrends = async (req, res) => {
    try {
        const { period = 'monthly' } = req.query;
        const result = await reportService.getEnrollmentTrends(period);
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        console.error("❌ Error in getEnrollmentTrends:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to fetch enrollment trends"
        });
    }
};

// ==========================================
// COURSE REPORTS
// ==========================================

/**
 * Get course analytics and performance
 * @route GET /api/reports/courses
 */
exports.getCourseAnalytics = async (req, res) => {
    try {
        const result = await reportService.getCourseAnalytics();
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        console.error("❌ Error in getCourseAnalytics:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to fetch course analytics"
        });
    }
};

/**
 * Get detailed performance for a specific course
 * @route GET /api/reports/courses/:courseId/performance
 */
exports.getCoursePerformance = async (req, res) => {
    try {
        const { courseId } = req.params;
        const result = await reportService.getCoursePerformance(courseId);
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        console.error("❌ Error in getCoursePerformance:", err);
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({
            success: false,
            message: err.message || "Failed to fetch course performance"
        });
    }
};

// ==========================================
// USER REPORTS
// ==========================================

/**
 * Get user analytics
 * @route GET /api/reports/users
 */
exports.getUserAnalytics = async (req, res) => {
    try {
        const result = await reportService.getUserAnalytics();
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        console.error("❌ Error in getUserAnalytics:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to fetch user analytics"
        });
    }
};

/**
 * Get student engagement metrics
 * @route GET /api/reports/users/:studentId/engagement
 */
exports.getStudentEngagement = async (req, res) => {
    try {
        const { studentId } = req.params;
        const result = await reportService.getStudentEngagement(studentId);
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        console.error("❌ Error in getStudentEngagement:", err);
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({
            success: false,
            message: err.message || "Failed to fetch student engagement"
        });
    }
};

// ==========================================
// PAYMENT REPORTS
// ==========================================

/**
 * Get payment analytics
 * @route GET /api/reports/payments
 */
exports.getPaymentAnalytics = async (req, res) => {
    try {
        const { period = 'monthly' } = req.query;
        const result = await reportService.getPaymentAnalytics(period);
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        console.error("❌ Error in getPaymentAnalytics:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to fetch payment analytics"
        });
    }
};

/**
 * Get revenue breakdown by course
 * @route GET /api/reports/revenue-by-course
 */
exports.getRevenueByCourse = async (req, res) => {
    try {
        const result = await reportService.getRevenueByCourse();
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        console.error("❌ Error in getRevenueByCourse:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to fetch revenue by course"
        });
    }
};

// ==========================================
// EXPORT REPORTS
// ==========================================

/**
 * Export report as CSV
 * @route GET /api/reports/export/csv
 */
exports.exportCSV = async (req, res) => {
    try {
        const { type = 'overview', startDate, endDate } = req.query;
        const result = await reportService.exportCSV(type, startDate, endDate);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=report-${type}-${Date.now()}.csv`);
        return res.send(result);
    } catch (err) {
        console.error("❌ Error in exportCSV:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to export CSV"
        });
    }
};

/**
 * Export report as PDF
 * @route GET /api/reports/export/pdf
 */
exports.exportPDF = async (req, res) => {
    try {
        const { type = 'overview', startDate, endDate } = req.query;
        const result = await reportService.exportPDF(type, startDate, endDate);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=report-${type}-${Date.now()}.pdf`);
        return res.send(result);
    } catch (err) {
        console.error("❌ Error in exportPDF:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to export PDF"
        });
    }
};