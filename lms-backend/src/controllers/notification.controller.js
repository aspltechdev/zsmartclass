const notificationService = require("../services/notification.service");

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

exports.getMyNotifications = async (req, res) => {

    try {

        const notifications =
            await notificationService.getMyNotifications(req.user.id);

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

        const notification =
            await notificationService.markAsRead(req.params.id);

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

        const result =
            await notificationService.markAllRead(req.user.id);

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

        const result =
            await notificationService.delete(req.params.id);

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