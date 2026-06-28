const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboard.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// Admin Dashboard
router.get(
    "/admin",
    authMiddleware,
    roleMiddleware("ADMIN"),
    dashboardController.adminDashboard
);

// Mentor Dashboard
router.get(
    "/mentor",
    authMiddleware,
    roleMiddleware("MENTOR"),
    dashboardController.mentorDashboard
);

// Student Dashboard
router.get(
    "/student",
    authMiddleware,
    roleMiddleware("STUDENT"),
    dashboardController.studentDashboard
);

module.exports = router;