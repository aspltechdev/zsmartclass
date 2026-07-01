const crypto = require("crypto");
const prisma = require("../config/prisma");

class WebhookService {

    async razorpayWebhook(payload, signature) {

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_WEBHOOK_SECRET
            )
            .update(JSON.stringify(payload))
            .digest("hex");

        if (expectedSignature !== signature) {
            throw new Error("Invalid Razorpay webhook signature.");
        }

        const event = payload.event;

        // Only handle successful payments
        if (event !== "payment.captured") {

            return {
                message: `Webhook ignored: ${event}`
            };

        }

        const payment = payload.payload.payment.entity;

        // Find payment record
        const paymentRecord = await prisma.payment.findFirst({

            where: {
                orderId: payment.order_id
            }

        });

        if (!paymentRecord) {

            throw new Error("Payment record not found.");

        }

        // Already processed?
        if (paymentRecord.status === "COMPLETED") {

            return {
                message: "Already processed."
            };

        }

        // Transaction
        await prisma.$transaction(async (tx) => {

            // Update payment
            await tx.payment.update({

                where: {
                    id: paymentRecord.id
                },

                data: {

                    paymentId: payment.id,

                    signature,

                    status: "COMPLETED"

                }

            });

            // Check enrollment
            const enrollment = await tx.enrollment.findFirst({

                where: {

                    studentId: paymentRecord.studentId,

                    courseId: paymentRecord.courseId

                }

            });

            if (!enrollment) {

                await tx.enrollment.create({

                    data: {

                        studentId: paymentRecord.studentId,

                        courseId: paymentRecord.courseId,

                        progress: 0,

                        completed: false

                    }

                });

            }

        });

        return {

            paymentId: payment.id,

            orderId: payment.order_id,

            status: "COMPLETED"

        };

    }

}

module.exports = new WebhookService();