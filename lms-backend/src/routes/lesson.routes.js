// src/routes/lesson.routes.js
const express = require("express");
const router = express.Router();

const lessonController = require("../controllers/lesson.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const upload = require("../middleware/upload.middleware");

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Get all lessons
router.get("/", lessonController.getAll);

// Get lessons by module
router.get("/module/:moduleId", lessonController.getByModule);

// Get lesson by ID
router.get("/:id", lessonController.getById);

// ==========================================
// PROTECTED ROUTES (Admin & Mentor)
// ==========================================

// Upload a lesson video (multipart field name: "video")
router.post(
    "/upload-video",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    upload.single("video"),
    lessonController.uploadVideo
);

// Create lesson
router.post(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    lessonController.create
);

// Update lesson
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    lessonController.update
);

// Delete lesson
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    lessonController.delete
);

// Reorder lessons in a module
router.put(
    "/reorder/:moduleId",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    lessonController.reorderLessons
);

module.exports = router;