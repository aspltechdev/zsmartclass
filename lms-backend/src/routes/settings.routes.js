// src/routes/settings.routes.js
const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settings.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

/**
 * @route   GET /api/settings
 * @desc    Get platform settings
 * @access  Admin only
 */
router.get(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN"),
    settingsController.getSettings
);

/**
 * @route   PUT /api/settings
 * @desc    Update platform settings
 * @access  Admin only
 */
router.put(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN"),
    settingsController.updateSettings
);

module.exports = router;