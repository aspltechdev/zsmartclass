// src/routes/user.routes.js
const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const upload = require("../middleware/upload.middleware");

// ==========================================
// PUBLIC ROUTES - Invitation flow (NO auth required)
// ==========================================

// Check if invitation token is valid
router.get(
  "/check-invitation/:token",
  userController.checkInvitation
);

// Verify invitation and set password
router.post(
  "/verify-invitation",
  userController.verifyInvitation
);

// ==========================================
// PROTECTED ROUTES - Authentication required
// ==========================================

// Get Current User Profile (Self)
router.get(
  "/me",
  authMiddleware,
  userController.getCurrentUser
);

// Update Profile (Self)
router.put(
  "/update-profile",
  authMiddleware,
  upload.single("profileImage"),
  userController.updateUser
);

// Change password (Self)
router.put(
  "/change-password",
  authMiddleware,
  userController.changePassword
);

// ==========================================
// ADMIN ROUTES - Authentication + ADMIN role required
// ==========================================

// All routes below require authentication and ADMIN role
router.use(authMiddleware);
router.use(roleMiddleware("ADMIN"));

// ==========================================
// User CRUD Operations
// ==========================================

// Create new user (INVITE user)
router.post(
  "/",
  userController.createUser
);

// Resend invitation to a pending user
router.post(
  "/:id/resend-invitation",
  userController.resendInvitation
);

// Get all users (with pagination, search, filters)
router.get(
  "/",
  userController.getAllUsers
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