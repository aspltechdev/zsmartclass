const express = require("express");
const router = express.Router();

const assignmentController = require("../controllers/assignment.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// =========================
// Mentor
// =========================

// Create Assignment
router.post(
    "/",
    authMiddleware,
    roleMiddleware("MENTOR", "ADMIN"),
    assignmentController.create
);

// Get All Assignments
router.get(
    "/",
    authMiddleware,
    assignmentController.getAll
);

// Get One Assignment
router.get(
    "/:id",
    authMiddleware,
    assignmentController.getById
);

// Update Assignment
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("MENTOR", "ADMIN"),
    assignmentController.update
);

// Delete Assignment
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("MENTOR", "ADMIN"),
    assignmentController.delete
);

// Get Submissions
router.get(
    "/:id/submissions",
    authMiddleware,
    roleMiddleware("MENTOR", "ADMIN"),
    assignmentController.getSubmissions
);

module.exports = router;