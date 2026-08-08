// src/routes/user.routes.js
const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const upload = require("../middleware/upload.middleware");

// All routes require authentication and ADMIN role
router.use(authMiddleware);
router.use(roleMiddleware("ADMIN", "MENTOR"));

// ==========================================
// User CRUD Operations
// ==========================================

// Create new user
router.post(
  "/",
  userController.createUser
);

// Get all users (with pagination, search, filters)
router.get(
  "/",
  userController.getAllUsers
);

// Get Current User Profile (Self)
router.get(
  "/me",
  userController.getCurrentUser
);

// Update Profile (Self)
// upload.single("profileImage") parses the multipart/form-data body
// (text fields + optional "profileImage" file) into req.body / req.file
// before the controller/service ever touch it.
router.put(
  "/update-profile",
  upload.single("profileImage"),
  userController.updateUser
);

// Get single user by ID
router.get(
  "/:id",
  userController.getUserById
);

// Update user
router.put(
  "/:id",
  userController.updateUser
);

// Delete user
router.delete(
  "/:id",
  userController.deleteUser
);

// ==========================================
// User Management Actions
// ==========================================

// Toggle user active/inactive status
router.patch(
  "/:id/toggle-status",
  userController.toggleUserStatus
);

// Change user role
router.patch(
  "/:id/change-role",
  userController.changeUserRole
);

// Reset user password (Admin)
router.patch(
  "/:id/reset-password",
  userController.resetUserPassword
);

// ==========================================
// Bulk Operations
// ==========================================

// Bulk import users
router.post(
  "/bulk-import",
  userController.bulkImportUsers
);

// ==========================================
// Dashboard & Reports
// ==========================================

// Get dashboard statistics
router.get(
  "/stats/dashboard",
  userController.getDashboardStats
);

// Search users (quick search)
router.get(
  "/search/quick",
  userController.searchUsers
);

module.exports = router;