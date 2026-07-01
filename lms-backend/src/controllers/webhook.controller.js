const webhookService = require("../services/webhook.service");

exports.razorpayWebhook = async (req, res) => {

    try {

        const signature = req.headers["x-razorpay-signature"];

        const result = await webhookService.razorpayWebhook(
            req.body,
            signature
        );

        return res.status(200).json({
            success: true,
            message: "Webhook processed successfully.",
            data: result
        });

    } catch (err) {

        console.error(err);

        return res.status(400).json({
            success: false,
            message: err.message
        });

    }

};