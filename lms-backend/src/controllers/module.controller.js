// src/controllers/module.controller.js

const moduleService = require("../services/module.service");

// ==========================================
// CREATE MODULE
// ==========================================
exports.create = async (req, res) => {
    try {
        const userId = req.user?.id;

        // ------------------------------------------
        // AUTHENTICATION CHECK
        // ------------------------------------------
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        // ------------------------------------------
        // GET COURSE ID
        // Supports:
//        // body.courseId
//        // params.courseId
        // ------------------------------------------
        const courseId =
            req.body.courseId ||
            req.params.courseId;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: "Course ID is required.",
            });
        }

        // ------------------------------------------
        // BUILD DATA
        // ------------------------------------------
        const data = {
            title: req.body.title,
            description: req.body.description || "",
            courseId: Number(courseId),
            createdBy: Number(userId),
        };

        console.log("📥 Create module data:", data);

        // ------------------------------------------
        // CREATE MODULE
        // ------------------------------------------
        const result = await moduleService.create(data);

        return res.status(201).json({
            success: true,
            data: result,
            message: "Module created successfully.",
        });

    } catch (err) {
        console.error("❌ Create module error:", err);

        return res.status(err.statusCode || 400).json({
            success: false,
            message: err.message || "Failed to create module.",
        });
    }
};

// ==========================================
// GET ALL MODULES
// ==========================================
exports.getAll = async (req, res) => {
    try {
        const result = await moduleService.getAll();

        return res.json({
            success: true,
            data: result,
        });

    } catch (err) {
        console.error("❌ Get modules error:", err);

        return res.status(500).json({
            success: false,
            message: err.message || "Failed to fetch modules.",
        });
    }
};

// ==========================================
// GET MODULE BY ID
// ==========================================
exports.getById = async (req, res) => {
    try {
        const result = await moduleService.getById(
            req.params.id,
            req.user
        );

        return res.json({
            success: true,
            data: result,
        });

    } catch (err) {
        console.error("❌ Get module error:", err);

        return res.status(err.statusCode || 404).json({
            success: false,
            message: err.message || "Module not found.",
        });
    }
};

// ==========================================
// UPDATE MODULE
// ==========================================
exports.update = async (req, res) => {
    try {
        const result = await moduleService.update(
            req.params.id,
            req.body
        );

        return res.json({
            success: true,
            data: result,
            message: "Module updated successfully.",
        });

    } catch (err) {
        console.error("❌ Update module error:", err);

        return res.status(err.statusCode || 400).json({
            success: false,
            message: err.message || "Failed to update module.",
        });
    }
};

// ==========================================
// DELETE MODULE
// ==========================================
exports.delete = async (req, res) => {
    try {
        const result = await moduleService.delete(
            req.params.id
        );

        return res.json(result);

    } catch (err) {
        console.error("❌ Delete module error:", err);

        return res.status(err.statusCode || 400).json({
            success: false,
            message: err.message || "Failed to delete module.",
        });
    }
};

// ==========================================
// GET MODULE STATS
// ==========================================
exports.getStats = async (req, res) => {
    try {
        const result = await moduleService.getStats();

        return res.json({
            success: true,
            data: result,
        });

    } catch (err) {
        console.error("❌ Get module stats error:", err);

        return res.status(500).json({
            success: false,
            message: err.message || "Failed to fetch module statistics.",
        });
    }
};
