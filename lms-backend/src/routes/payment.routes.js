const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/payment.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// ==========================================
// Create Razorpay Order
// ==========================================
router.post(
    "/create-order",
    authMiddleware,
    roleMiddleware("STUDENT"),
    paymentController.createOrder
);

// ==========================================
// Verify Payment Signature
// ==========================================
router.post(
    "/verify",
    authMiddleware,
    roleMiddleware("STUDENT"),
    paymentController.verifyPayment
);

// ==========================================
// Payment History
// ==========================================
router.get(
    "/history",
    authMiddleware,
    paymentController.paymentHistory
);

// ==========================================
// Payment Details
// ==========================================
router.get(
    "/:id",
    authMiddleware,
    paymentController.getPayment
);

// ==========================================
// Student Purchased Courses
// ==========================================
router.get(
    "/my-courses",
    authMiddleware,
    roleMiddleware("STUDENT"),
    paymentController.myPurchasedCourses
);

module.exports = router;