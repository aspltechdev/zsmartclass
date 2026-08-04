// notification.controller.js
const notificationService = require("../services/notification.service");
const prisma = require("../config/prisma"); // ✅ Added missing import

exports.create = async (req, res) => {
    try {
        const notification = await notificationService.create(req.body);
        res.status(201).json({
            success: true,
            data: notification
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// Get all notifications (admin only)
exports.getAllNotifications = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== "ADMIN" && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access required"
            });
        }

        const notifications = await notificationService.getAllNotifications();

        // Format response
        const formatted = notifications.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            isRead: n.isRead,
            studentId: n.studentId,
            studentName: n.student?.name || "Unknown User",
            studentEmail: n.student?.email || "",
            createdAt: n.createdAt,
            updatedAt: n.updatedAt,
        }));

        res.json({
            success: true,
            data: formatted
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getMyNotifications = async (req, res) => {
    try {
        const notifications = await notificationService.getMyNotifications(req.user.id);
        res.json({
            success: true,
            data: notifications
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const notification = await notificationService.markAsRead(req.params.id);
        res.json({
            success: true,
            data: notification
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

exports.markAllRead = async (req, res) => {
    try {
        const result = await notificationService.markAllRead(req.user.id);
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

exports.delete = async (req, res) => {
    try {
        const result = await notificationService.delete(req.params.id);
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