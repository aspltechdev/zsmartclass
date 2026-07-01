const paymentService = require("../services/payment.service");

// ==========================================
// Create Razorpay Order
// ==========================================
exports.createOrder = async (req, res) => {

    try {

        const result = await paymentService.createOrder(
            req.user.id,
            req.body
        );

        res.status(201).json({
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

// ==========================================
// Verify Razorpay Payment
// ==========================================
exports.verifyPayment = async (req, res) => {

    try {

        const result = await paymentService.verifyPayment(
            req.user.id,
            req.body
        );

        res.status(200).json({
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

// ==========================================
// Payment History
// ==========================================
exports.paymentHistory = async (req, res) => {

    try {

        const result = await paymentService.paymentHistory(
            req.user.id
        );

        res.status(200).json({
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

// ==========================================
// Get Payment Details
// ==========================================
exports.getPayment = async (req, res) => {

    try {

        const result = await paymentService.getPayment(
            req.user.id,
            req.params.id
        );

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (err) {

        res.status(404).json({
            success: false,
            message: err.message
        });

    }

};

// ==========================================
// My Purchased Courses
// ==========================================
exports.myPurchasedCourses = async (req, res) => {

    try {

        const result = await paymentService.myPurchasedCourses(
            req.user.id
        );

        res.status(200).json({
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