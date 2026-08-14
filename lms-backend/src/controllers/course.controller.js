// src/controllers/course.controller.js
const courseService = require("../services/course.service");

// ==========================================
// CREATE COURSE
// ==========================================
exports.create = async (req, res) => {
    try {
        const data = {
            ...req.body,
            createdById: req.user.id
        };

        if (req.file) {
            data.thumbnail = "/uploads/thumbnails/" + req.file.filename;
        }

        const result = await courseService.create(data);
        res.status(201).json({
            success: true,
            data: result,
            message: "Course created successfully."
        });
    } catch (err) {
        console.log(err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// GET ALL COURSES
// ==========================================
exports.getAll = async (req, res) => {
    try {
        const result = await courseService.getAll();
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
// GET COURSE BY ID
// ==========================================
exports.getById = async (req, res) => {
    try {
        const result = await courseService.getById(req.params.id);
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
// UPDATE COURSE
// ==========================================
exports.update = async (req, res) => {
    try {
        console.log("📥 Incoming update request for ID:", req.params.id);
        console.log("📥 Body:", JSON.stringify(req.body, null, 2));

        const cleanData = { ...req.body };

        Object.keys(cleanData).forEach(key => {
            if (cleanData[key] === undefined) {
                delete cleanData[key];
            }
        });

        if (cleanData.discountPrice !== undefined) {
            if (cleanData.discountPrice === "" || 
                cleanData.discountPrice === "0" || 
                cleanData.discountPrice === 0) {
                cleanData.discountPrice = null;
            }
        }

        if (req.file) {
            cleanData.thumbnail = "/uploads/thumbnails/" + req.file.filename;
        }

        const result = await courseService.update(req.params.id, cleanData);
        res.json({
            success: true,
            data: result,
            message: "Course updated successfully."
        });
    } catch (err) {
        console.error("❌ Update error:", err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// DELETE COURSE
// ==========================================
exports.delete = async (req, res) => {
    try {
        const result = await courseService.delete(req.params.id);
        res.json({
            success: true,
            message: result.message
        });
    } catch (err) {
        console.error("❌ Delete error:", err);
        res.status(err.statusCode || 400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// FORCE DELETE COURSE (Cascade)
// ==========================================
exports.forceDelete = async (req, res) => {
    try {
        const result = await courseService.forceDelete(req.params.id);
        res.json({
            success: true,
            message: result.message
        });
    } catch (err) {
        console.error("❌ Force delete error:", err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// GET COURSES BY CATEGORY
// ==========================================
exports.getByCategory = async (req, res) => {
    try {
        const result = await courseService.getByCategory(req.params.categoryId);
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
// GET COURSES BY INSTRUCTOR
// ==========================================
exports.getByInstructor = async (req, res) => {
    try {
        const result = await courseService.getByInstructor(req.params.instructorId);
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
// GET COURSE STATS
// ==========================================
exports.getStats = async (req, res) => {
    try {
        const result = await courseService.getStats();
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
// TOGGLE COURSE STATUS
// ==========================================
exports.toggleStatus = async (req, res) => {
    try {
        const result = await courseService.toggleStatus(req.params.id);
        res.json({
            success: true,
            data: result,
            message: `Course ${result.status === "PUBLISHED" ? "published" : "unpublished"} successfully.`
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// TOGGLE FEATURED
// ==========================================
exports.toggleFeatured = async (req, res) => {
    try {
        const result = await courseService.toggleFeatured(req.params.id);
        res.json({
            success: true,
            data: result,
            message: `Course ${result.isFeatured ? "featured" : "unfeatured"} successfully.`
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// GET MODULES AVAILABLE TO ATTACH
// ==========================================
exports.getAvailableModules = async (req, res) => {
    try {
        const result = await courseService.getAvailableModules(req.params.id);
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

// ==========================================
// ATTACH EXISTING MODULE(S) TO COURSE
// Body: { moduleId } or { moduleIds: [...] }
// ==========================================
exports.attachModules = async (req, res) => {
    try {
        const { moduleId, moduleIds } = req.body;
        const input = moduleIds !== undefined ? moduleIds : moduleId;

        const result = await courseService.attachModules(req.params.id, input);
        res.json({
            success: true,
            data: result,
            message: "Module(s) attached successfully."
        });
    } catch (err) {
        res.status(err.statusCode || 400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// DETACH A MODULE FROM COURSE
// ==========================================
exports.detachModule = async (req, res) => {
    try {
        const result = await courseService.detachModule(
            req.params.id,
            req.params.moduleId
        );
        res.json({
            success: true,
            data: result,
            message: "Module detached successfully."
        });
    } catch (err) {
        res.status(err.statusCode || 400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// SEARCH COURSES
// ==========================================
exports.search = async (req, res) => {
    try {
        const { q } = req.query;
        const result = await courseService.search(q);
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