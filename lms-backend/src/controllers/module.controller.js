// src/controllers/module.controller.js
const moduleService = require("../services/module.service");

// ==========================================
// CREATE MODULE
// ==========================================
exports.create = async (req, res) => {
    try {
        // ─── FIX: Get user from req.user ─────────────────────────────
        const userId = req.user?.id || 1;
        
        const data = {
            title: req.body.title,
            description: req.body.description || "",
            createdBy: userId,
        };

        console.log("📥 Received data:", data);

        const result = await moduleService.create(data);
        res.status(201).json({
            success: true,
            data: result,
            message: "Module created successfully."
        });
    } catch (err) {
        console.error("❌ Create module error:", err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// GET ALL MODULES
// ==========================================
exports.getAll = async (req, res) => {
    try {
        const result = await moduleService.getAll();
        res.json({
            success: true,
            data: result
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// GET MODULE BY ID
// ==========================================
exports.getById = async (req, res) => {
    try {
        const result = await moduleService.getById(req.params.id);
        res.json({
            success: true,
            data: result
        });
    } catch (err) {
        res.status(404).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// UPDATE MODULE
// ==========================================
exports.update = async (req, res) => {
    try {
        const result = await moduleService.update(req.params.id, req.body);
        res.json({
            success: true,
            data: result,
            message: "Module updated successfully."
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// DELETE MODULE
// ==========================================
exports.delete = async (req, res) => {
    try {
        const result = await moduleService.delete(req.params.id);
        res.json(result);
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// GET MODULE STATS
// ==========================================
exports.getStats = async (req, res) => {
    try {
        const result = await moduleService.getStats();
        res.json({
            success: true,
            data: result
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};