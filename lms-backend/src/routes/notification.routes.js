// src/routes/notification.routes.js
const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notification.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// ==========================================
// ADMIN ROUTES (role-gated)
// ==========================================

// Send to an audience: broadcast / course / role / single user
router.post(
  "/admin/send",
  authMiddleware,
  roleMiddleware("ADMIN"),
  notificationController.adminSend
);

// Grouped sent history
router.get(
  "/admin",
  authMiddleware,
  roleMiddleware("ADMIN"),
  notificationController.getAllNotifications
);

// Delete a whole broadcast group (body: { ids: [...] })
router.delete(
  "/admin/batch",
  authMiddleware,
  roleMiddleware("ADMIN"),
  notificationController.deleteBatch
);

// Single create (admin only — sets an arbitrary recipient)
router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  notificationController.create
);

// ==========================================
// USER ROUTES (own notifications only)
// ==========================================

// My notifications
router.get("/", authMiddleware, notificationController.getMyNotifications);

// Mark all read (specific path registered before the :id route)
router.put("/read-all", authMiddleware, notificationController.markAllRead);

// Mark one read (ownership enforced in the service)
router.put("/:id/read", authMiddleware, notificationController.markAsRead);

// Delete one (owner or admin, enforced in the service)
router.delete("/:id", authMiddleware, notificationController.delete);

module.exports = router;