// src/routes/module.routes.js
const express = require("express");
const router = express.Router();

const moduleController = require("../controllers/module.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Get all modules
router.get("/", moduleController.getAll);

// Get module by ID
router.get("/:id", moduleController.getById);

// Get module stats
router.get("/stats/all", moduleController.getStats);

// ==========================================
// PROTECTED ROUTES (Admin & Mentor)
// ==========================================

// Create module
router.post(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    moduleController.create
);

// Update module
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    moduleController.update
);

// Delete module
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    moduleController.delete
);

// ==========================================
// COURSE MODULE MANAGEMENT
// ==========================================

// Add module to course
router.post(
    "/add-to-course/:courseId/:moduleId",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    moduleController.addModuleToCourse
);

// Remove module from course
router.delete(
    "/remove-from-course/:courseId/:moduleId",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    moduleController.removeModuleFromCourse
);

module.exports = router;