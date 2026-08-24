// src/controllers/lesson.controller.js
const lessonService = require("../services/lesson.service");

// ==========================================
// CREATE LESSON
// ==========================================
exports.create = async (req, res) => {
    try {
        const result = await lessonService.create(req.body);
        res.status(201).json({
            success: true,
            data: result,
            message: "Lesson created successfully."
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// GET ALL LESSONS
// ==========================================
exports.getAll = async (req, res) => {
    try {
        const result = await lessonService.getAll();
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
// GET LESSON BY ID
// ==========================================
exports.getById = async (req, res) => {
    try {
        const result = await lessonService.getById(req.params.id);
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
// GET LESSONS BY MODULE
// ==========================================
exports.getByModule = async (req, res) => {
    try {
        const result = await lessonService.getByModule(req.params.moduleId);
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
// UPDATE LESSON
// ==========================================
exports.update = async (req, res) => {
    try {
        const result = await lessonService.update(req.params.id, req.body);
        res.json({
            success: true,
            data: result,
            message: "Lesson updated successfully."
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// DELETE LESSON
// ==========================================
exports.delete = async (req, res) => {
    try {
        const result = await lessonService.delete(req.params.id);
        res.json(result);
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// REORDER LESSONS
// ==========================================
exports.reorderLessons = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const { lessonIds } = req.body;
        const result = await lessonService.reorderLessons(moduleId, lessonIds);
        res.json(result);
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// ADMIN/MENTOR: UPLOAD A LESSON VIDEO
// Saves to /uploads/videos and returns the public URL.
// The frontend stores that URL in the lesson's videoUrl.
// ==========================================
exports.uploadVideo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No video file received."
            });
        }

        // Served statically by app.js -> app.use("/uploads", express.static(...))
        const url = `/uploads/videos/${req.file.filename}`;

        res.status(201).json({
            success: true,
            message: "Video uploaded successfully.",
            data: {
                url,
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype
            }
        });
    } catch (err) {
        res.status(err.statusCode || 400).json({
            success: false,
            message: err.message
        });
    }
};
