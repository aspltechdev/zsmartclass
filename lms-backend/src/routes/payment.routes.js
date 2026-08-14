// src/routes/payment.routes.js
const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// ==========================================
// STUDENT ROUTES
// ==========================================

// Create a payment (Student)
router.post(
    "/",
    authMiddleware,
    roleMiddleware("STUDENT"),
    paymentController.createPayment
);

// Get my payments (Student)
router.get(
    "/my",
    authMiddleware,
    roleMiddleware("STUDENT"),
    paymentController.getMyPayments
);

// Get my payment by ID (Student)
router.get(
    "/my/:id",
    authMiddleware,
    roleMiddleware("STUDENT"),
    paymentController.getMyPaymentById
);

// Update my payment status (Student)
router.put(
    "/my/:id/status",
    authMiddleware,
    roleMiddleware("STUDENT"),
    paymentController.updateMyPaymentStatus
);

// ==========================================
// ADMIN ROUTES
// ==========================================

// Record a manual (offline) payment — cash/UPI, one or more courses (Admin)
router.post(
    "/admin/manual",
    authMiddleware,
    roleMiddleware("ADMIN"),
    paymentController.createManualPayment
);

// Get all payments (Admin)
router.get(
    "/admin/all",
    authMiddleware,
    roleMiddleware("ADMIN"),
    paymentController.getAllPayments
);

// Get payment stats (Admin)
router.get(
    "/admin/stats",
    authMiddleware,
    roleMiddleware("ADMIN"),
    paymentController.getPaymentStats
);

// Get payment by ID (Admin)
router.get(
    "/admin/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    paymentController.getPaymentById
);

// Update payment status (Admin)
router.put(
    "/admin/:id/status",
    authMiddleware,
    roleMiddleware("ADMIN"),
    paymentController.updatePaymentStatus
);

// Delete payment (Admin)
router.delete(
    "/admin/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    paymentController.deletePayment
);

// Send receipt (Admin)
router.post(
    "/admin/:id/send-receipt",
    authMiddleware,
    roleMiddleware("ADMIN"),
    paymentController.sendReceipt
);

// Download invoice (Admin)
router.get(
    "/admin/:id/invoice",
    authMiddleware,
    roleMiddleware("ADMIN"),
    paymentController.downloadInvoice
);

module.exports = router;