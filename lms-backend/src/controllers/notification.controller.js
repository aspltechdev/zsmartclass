const notificationService = require("../services/notification.service");

function sendError(res, error) {
  const status = error.statusCode || 500;

  if (status >= 500) {
    console.error("Notification error:", error);
  }

  return res.status(status).json({
    success: false,
    message:
      status >= 500
        ? "Unable to complete the notification request. Please try again."
        : error.message
  });
}

exports.adminSend = async (req, res) => {
  try {
    const result = await notificationService.sendNotification(
      req.body,
      req.user
    );

    return res.status(201).json({
      success: true,
      message:
        `In-app notification sent to ${result.recipients} ` +
        `receiver${result.recipients === 1 ? "" : "s"}.`,
      data: result
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.create = async (req, res) => {
  try {
    const result = await notificationService.create(
      req.body,
      req.user
    );

    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.getAllNotifications = async (req, res) => {
  try {
    const result = await notificationService.getAllNotifications(
      req.user
    );

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.getMyNotifications = async (req, res) => {
  try {
    const result = await notificationService.getMyNotifications(
      req.user.id
    );

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAsRead(
      req.params.id,
      req.user.id
    );

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const result = await notificationService.markAllRead(
      req.user.id
    );

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.delete = async (req, res) => {
  try {
    const result = await notificationService.deleteNotification(
      req.params.id,
      req.user
    );

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.deleteBatch = async (req, res) => {
  try {
    const result = await notificationService.deleteBatch(
      req.body.ids,
      req.user
    );

    return res.json({
      success: true,
      deleted: result.deleted
    });
  } catch (error) {
    return sendError(res, error);
  }
};