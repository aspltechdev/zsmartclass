const dashboardService = require("../services/dashboard.service");

exports.adminDashboard = async (req, res) => {

    try {

        const result = await dashboardService.adminDashboard();

        res.json({
            success: true,
            data: result
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

exports.mentorDashboard = async (req, res) => {

    try {

        const result = await dashboardService.mentorDashboard(
            req.user.id
        );

        res.json({
            success: true,
            data: result
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

exports.studentDashboard = async (req, res) => {

    try {

        const result = await dashboardService.studentDashboard(
            req.user.id
        );

        res.json({
            success: true,
            data: result
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};