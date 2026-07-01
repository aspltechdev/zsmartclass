const express = require("express");
const router = express.Router();

const webhookController = require("../controllers/webhook.controller");

// Razorpay Webhook
router.post(
    "/razorpay",
    webhookController.razorpayWebhook
);

module.exports = router;