const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notification.controller");

const authMiddleware = require("../middleware/auth.middleware");

// Create Notification
router.post(
    "/",
    authMiddleware,
    notificationController.create
);

// Get My Notifications
router.get(
    "/",
    authMiddleware,
    notificationController.getMyNotifications
);

// Mark One Read
router.put(
    "/:id/read",
    authMiddleware,
    notificationController.markAsRead
);

// Mark All Read
router.put(
    "/read-all",
    authMiddleware,
    notificationController.markAllRead
);

// Delete Notification
router.delete(
    "/:id",
    authMiddleware,
    notificationController.delete
);

module.exports = router;