// src/controllers/notification.controller.js
const notificationService = require("../services/notification.service");

// ADMIN: send to an audience (broadcast / course / role / user)
exports.adminSend = async (req, res) => {
  try {
    const result = await notificationService.sendNotification(req.body);
    res.status(201).json({
      success: true,
      message: `Notification sent to ${result.recipients} recipient(s).`,
      data: result
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      message: err.message
    });
  }
};

// Single create (kept for compatibility / other flows)
exports.create = async (req, res) => {
  try {
    const notification = await notificationService.create(req.body);
    res.status(201).json({ success: true, data: notification });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

// ADMIN: grouped sent history
exports.getAllNotifications = async (req, res) => {
  try {
    const data = await notificationService.getAllNotifications();
    res.json({ success: true, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// USER: my notifications
exports.getMyNotifications = async (req, res) => {
  try {
    const data = await notificationService.getMyNotifications(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const data = await notificationService.markAsRead(req.params.id, req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const data = await notificationService.markAllRead(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const data = await notificationService.deleteNotification(req.params.id, req.user);
    res.json({ success: true, data });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

// ADMIN: delete a whole broadcast group
exports.deleteBatch = async (req, res) => {
  try {
    const data = await notificationService.deleteBatch(req.body.ids);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};