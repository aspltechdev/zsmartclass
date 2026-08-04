// src/routes/report.routes.js
const express = require("express");
const router = express.Router();
const reportController = require("../controllers/report.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// ==========================================
// All report routes require ADMIN role
// ==========================================

// ==========================================
// OVERVIEW REPORTS
// ==========================================

/**
 * @route   GET /api/reports/overview
 * @desc    Get dashboard overview statistics
 * @access  Admin only
 */
router.get(
    "/overview",
    authMiddleware,
    roleMiddleware("ADMIN"),
    reportController.getOverview
);

/**
 * @route   GET /api/reports/revenue
 * @desc    Get revenue overview with trends
 * @access  Admin only
 * @param   {string} period - daily, weekly, monthly, yearly
 */
router.get(
    "/revenue",
    authMiddleware,
    roleMiddleware("ADMIN"),
    reportController.getRevenueOverview
);

/**
 * @route   GET /api/reports/enrollment-trends
 * @desc    Get enrollment trends over time
 * @access  Admin only
 * @param   {string} period - daily, weekly, monthly, yearly
 */
router.get(
    "/enrollment-trends",
    authMiddleware,
    roleMiddleware("ADMIN"),
    reportController.getEnrollmentTrends
);

// ==========================================
// COURSE REPORTS
// ==========================================

/**
 * @route   GET /api/reports/courses
 * @desc    Get course analytics and performance
 * @access  Admin only
 */
router.get(
    "/courses",
    authMiddleware,
    roleMiddleware("ADMIN"),
    reportController.getCourseAnalytics
);

/**
 * @route   GET /api/reports/courses/:courseId/performance
 * @desc    Get detailed performance for a specific course
 * @access  Admin only
 */
router.get(
    "/courses/:courseId/performance",
    authMiddleware,
    roleMiddleware("ADMIN"),
    reportController.getCoursePerformance
);

// ==========================================
// USER REPORTS
// ==========================================

/**
 * @route   GET /api/reports/users
 * @desc    Get user analytics
 * @access  Admin only
 */
router.get(
    "/users",
    authMiddleware,
    roleMiddleware("ADMIN"),
    reportController.getUserAnalytics
);

/**
 * @route   GET /api/reports/users/:studentId/engagement
 * @desc    Get student engagement metrics
 * @access  Admin only
 */
router.get(
    "/users/:studentId/engagement",
    authMiddleware,
    roleMiddleware("ADMIN"),
    reportController.getStudentEngagement
);

// ==========================================
// PAYMENT REPORTS
// ==========================================

/**
 * @route   GET /api/reports/payments
 * @desc    Get payment analytics
 * @access  Admin only
 * @param   {string} period - daily, weekly, monthly, yearly
 */
router.get(
    "/payments",
    authMiddleware,
    roleMiddleware("ADMIN"),
    reportController.getPaymentAnalytics
);

/**
 * @route   GET /api/reports/revenue-by-course
 * @desc    Get revenue breakdown by course
 * @access  Admin only
 */
router.get(
    "/revenue-by-course",
    authMiddleware,
    roleMiddleware("ADMIN"),
    reportController.getRevenueByCourse
);

// ==========================================
// EXPORT REPORTS
// ==========================================

/**
 * @route   GET /api/reports/export/csv
 * @desc    Export report as CSV
 * @access  Admin only
 * @param   {string} type - overview, courses, users, payments
 * @param   {string} startDate - Start date for filtering
 * @param   {string} endDate - End date for filtering
 */
router.get(
    "/export/csv",
    authMiddleware,
    roleMiddleware("ADMIN"),
    reportController.exportCSV
);

/**
 * @route   GET /api/reports/export/pdf
 * @desc    Export report as PDF
 * @access  Admin only
 * @param   {string} type - overview, courses, users, payments
 * @param   {string} startDate - Start date for filtering
 * @param   {string} endDate - End date for filtering
 */
router.get(
    "/export/pdf",
    authMiddleware,
    roleMiddleware("ADMIN"),
    reportController.exportPDF
);

module.exports = router;