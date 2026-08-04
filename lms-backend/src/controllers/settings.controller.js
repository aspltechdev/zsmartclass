// src/controllers/settings.controller.js
const settingsService = require("../services/settings.service");

/**
 * Get platform settings
 * @route GET /api/settings
 */
exports.getSettings = async (req, res) => {
    try {
        const data = await settingsService.get();
        return res.status(200).json({
            success: true,
            data,
        });
    } catch (err) {
        console.error("❌ Error in getSettings:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to fetch settings",
        });
    }
};

/**
 * Update platform settings
 * @route PUT /api/settings
 */
exports.updateSettings = async (req, res) => {
    try {
        const data = await settingsService.update(req.body || {});
        return res.status(200).json({
            success: true,
            message: "Settings updated successfully",
            data,
        });
    } catch (err) {
        console.error("❌ Error in updateSettings:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to update settings",
        });
    }
};