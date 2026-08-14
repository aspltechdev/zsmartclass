// src/controllers/payment.controller.js
const prisma = require("../config/prisma");
const notificationService = require("../services/notification.service");
const emailService = require("../services/email.service");
const enrollmentService = require("../services/enrollment.service");

// ==========================================
// STUDENT ROUTES
// ==========================================

// Create a payment (Student)
exports.createPayment = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { courseId, amount, method, currency, orderId } = req.body;

        // Check if course exists
        const course = await prisma.course.findUnique({
            where: { id: Number(courseId) }
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // Check if already enrolled
        const existingEnrollment = await prisma.enrollment.findFirst({
            where: {
                userId: studentId,
                courseId: Number(courseId)
            }
        });

        if (existingEnrollment) {
            return res.status(400).json({
                success: false,
                message: "Already enrolled in this course"
            });
        }

        // Create payment
        const payment = await prisma.payment.create({
            data: {
                studentId: studentId,
                courseId: Number(courseId),
                amount: Number(amount),
                currency: currency || "INR",
                method: method || "CARD",
                status: "PENDING",
                orderId: orderId || `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        res.status(201).json({
            success: true,
            data: payment,
            message: "Payment created successfully"
        });
    } catch (err) {
        console.error("Error creating payment:", err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// Get my payments (Student)
exports.getMyPayments = async (req, res) => {
    try {
        const studentId = req.user.id;

        const payments = await prisma.payment.findMany({
            where: {
                studentId: studentId
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        thumbnail: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        res.json({
            success: true,
            data: payments
        });
    } catch (err) {
        console.error("Error fetching my payments:", err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// Get payment by ID (Student - only their own)
exports.getMyPaymentById = async (req, res) => {
    try {
        const studentId = req.user.id;
        const paymentId = Number(req.params.id);

        const payment = await prisma.payment.findFirst({
            where: {
                id: paymentId,
                studentId: studentId
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        thumbnail: true
                    }
                }
            }
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        res.json({
            success: true,
            data: payment
        });
    } catch (err) {
        console.error("Error fetching payment:", err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// Update payment status (Student - only their own)
exports.updateMyPaymentStatus = async (req, res) => {
    try {
        const studentId = req.user.id;
        const paymentId = Number(req.params.id);
        const { status } = req.body;

        const payment = await prisma.payment.findFirst({
            where: {
                id: paymentId,
                studentId: studentId
            }
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        // Only allow specific status updates
        const allowedStatuses = ["PENDING", "COMPLETED", "FAILED", "CANCELLED"];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status update"
            });
        }

        const updatedPayment = await prisma.payment.update({
            where: {
                id: paymentId
            },
            data: {
                status: status
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        // If payment is completed, create enrollment
        if (status === "COMPLETED") {
            const existingEnrollment = await prisma.enrollment.findFirst({
                where: {
                    userId: studentId,
                    courseId: payment.courseId
                }
            });

            if (!existingEnrollment) {
                await prisma.enrollment.create({
                    data: {
                        userId: studentId,
                        courseId: payment.courseId,
                        progress: 0,
                        completed: false
                    }
                });
            }
        }

        res.json({
            success: true,
            data: updatedPayment,
            message: "Payment status updated successfully"
        });
    } catch (err) {
        console.error("Error updating payment:", err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// ADMIN ROUTES
// ==========================================

// Get all payments (Admin)
exports.getAllPayments = async (req, res) => {
    try {
        const payments = await prisma.payment.findMany({
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        // Attach the full course list for multi-course (manual/bulk) payments.
        // Scalar-only + defensive: if the PaymentCourse table isn't present yet,
        // fall back to the single `course` relation.
        const coursesByPayment = new Map();
        try {
            const paymentIds = payments.map((p) => p.id);
            if (paymentIds.length) {
                const links = await prisma.paymentCourse.findMany({
                    where: { paymentId: { in: paymentIds } },
                    select: { paymentId: true, courseId: true }
                });
                const courseIds = [...new Set(links.map((l) => l.courseId))];
                const courses = courseIds.length
                    ? await prisma.course.findMany({
                          where: { id: { in: courseIds } },
                          select: { id: true, title: true }
                      })
                    : [];
                const courseById = new Map(courses.map((c) => [c.id, c]));
                for (const l of links) {
                    if (!coursesByPayment.has(l.paymentId)) {
                        coursesByPayment.set(l.paymentId, []);
                    }
                    const c = courseById.get(l.courseId);
                    if (c) coursesByPayment.get(l.paymentId).push(c);
                }
            }
        } catch (e) {
            // PaymentCourse table not migrated yet — single-course fallback below.
        }

        const data = payments.map((p) => ({
            ...p,
            courses: coursesByPayment.get(p.id) || (p.course ? [p.course] : [])
        }));

        res.json({
            success: true,
            data
        });
    } catch (err) {
        console.error("Error fetching payments:", err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// Get payment by ID (Admin)
exports.getPaymentById = async (req, res) => {
    try {
        const paymentId = Number(req.params.id);

        const payment = await prisma.payment.findUnique({
            where: {
                id: paymentId
            },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        res.json({
            success: true,
            data: payment
        });
    } catch (err) {
        console.error("Error fetching payment:", err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// Get payment stats (Admin)
exports.getPaymentStats = async (req, res) => {
    try {
        const [total, completed, pending, failed, refunded] = await Promise.all([
            prisma.payment.count(),
            prisma.payment.count({
                where: { status: "COMPLETED" }
            }),
            prisma.payment.count({
                where: { status: "PENDING" }
            }),
            prisma.payment.count({
                where: { status: "FAILED" }
            }),
            prisma.payment.count({
                where: { status: "REFUNDED" }
            })
        ]);

        const totalRevenue = await prisma.payment.aggregate({
            where: { status: "COMPLETED" },
            _sum: {
                amount: true
            }
        });

        // Get monthly revenue for charts
        const now = new Date();
        const monthlyRevenue = [];
        for (let i = 5; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            
            const revenue = await prisma.payment.aggregate({
                where: {
                    status: "COMPLETED",
                    createdAt: {
                        gte: month,
                        lt: nextMonth
                    }
                },
                _sum: {
                    amount: true
                }
            });
            
            monthlyRevenue.push({
                month: month.toLocaleString('default', { month: 'short' }),
                revenue: revenue._sum.amount || 0
            });
        }

        res.json({
            success: true,
            data: {
                total,
                completed,
                pending,
                failed,
                refunded,
                totalRevenue: totalRevenue._sum.amount || 0,
                monthlyRevenue
            }
        });
    } catch (err) {
        console.error("Error fetching payment stats:", err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// Update payment status (Admin)
exports.updatePaymentStatus = async (req, res) => {
    try {
        const paymentId = Number(req.params.id);
        const { status } = req.body;

        const payment = await prisma.payment.findUnique({
            where: {
                id: paymentId
            }
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        const allowedStatuses = ["PENDING", "COMPLETED", "FAILED", "REFUNDED", "CANCELLED"];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status"
            });
        }

        const updatedPayment = await prisma.payment.update({
            where: {
                id: paymentId
            },
            data: {
                status: status,
                updatedAt: new Date()
            },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        // If payment is completed, create enrollment
        if (status === "COMPLETED") {
            const existingEnrollment = await prisma.enrollment.findFirst({
                where: {
                    userId: payment.studentId,
                    courseId: payment.courseId
                }
            });

            if (!existingEnrollment) {
                await prisma.enrollment.create({
                    data: {
                        userId: payment.studentId,
                        courseId: payment.courseId,
                        progress: 0,
                        completed: false
                    }
                });
            }
        }

        res.json({
            success: true,
            data: updatedPayment,
            message: "Payment status updated successfully"
        });
    } catch (err) {
        console.error("Error updating payment:", err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// Delete payment (Admin)
exports.deletePayment = async (req, res) => {
    try {
        const paymentId = Number(req.params.id);

        const payment = await prisma.payment.findUnique({
            where: {
                id: paymentId
            }
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        await prisma.payment.delete({
            where: {
                id: paymentId
            }
        });

        res.json({
            success: true,
            message: "Payment deleted successfully"
        });
    } catch (err) {
        console.error("Error deleting payment:", err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// Send receipt (Admin)
exports.sendReceipt = async (req, res) => {
    try {
        const paymentId = Number(req.params.id);

        const payment = await prisma.payment.findUnique({
            where: {
                id: paymentId
            },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        // Here you would send an email with the receipt
        // Example: await emailService.sendPaymentReceipt(payment);
        console.log(`📧 Receipt sent to ${payment.student.email} for payment #${payment.id}`);

        res.json({
            success: true,
            message: `Receipt sent to ${payment.student.email} successfully`
        });
    } catch (err) {
        console.error("Error sending receipt:", err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// Download invoice (Admin)
exports.downloadInvoice = async (req, res) => {
    try {
        const paymentId = Number(req.params.id);

        const payment = await prisma.payment.findUnique({
            where: {
                id: paymentId
            },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        // Here you would generate a PDF invoice
        // Example: const pdfBuffer = await generateInvoicePDF(payment);
        // For now, return payment data as JSON
        
        res.json({
            success: true,
            data: {
                paymentId: payment.id,
                orderId: payment.orderId,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
                method: payment.method,
                studentName: payment.student.name,
                studentEmail: payment.student.email,
                courseTitle: payment.course.title,
                date: payment.createdAt,
                signature: payment.signature
            },
            message: "Invoice data retrieved successfully"
        });
    } catch (err) {
        console.error("Error downloading invoice:", err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// ADMIN: RECORD A MANUAL (OFFLINE) PAYMENT
// Cash / UPI, one bulk amount covering one or more courses.
// Creates the payment, links the covered courses, grants access,
// and notifies the student (dashboard + email).
// ==========================================
exports.createManualPayment = async (req, res) => {
    try {
        const { studentId, courseIds, amount, method, utr, durationDays } = req.body;

        // ---- Validation ----
        const sId = parseInt(studentId);
        if (!sId) {
            return res.status(400).json({ success: false, message: "Student is required." });
        }

        const amt = parseFloat(amount);
        if (!amt || amt <= 0) {
            return res.status(400).json({ success: false, message: "A valid amount is required." });
        }

        const pm = String(method || "").toUpperCase();
        if (!["CASH", "UPI"].includes(pm)) {
            return res.status(400).json({ success: false, message: "Method must be CASH or UPI." });
        }

        const ids = Array.isArray(courseIds)
            ? [...new Set(courseIds.map(Number).filter((n) => Number.isInteger(n)))]
            : [];
        if (ids.length === 0) {
            return res.status(400).json({ success: false, message: "Select at least one course." });
        }

        let reference = null;
        if (pm === "UPI") {
            reference = String(utr || "").trim();
            if (!reference) {
                return res.status(400).json({ success: false, message: "UTR / reference is required for UPI payments." });
            }
        }

        // ---- Verify student + courses exist ----
        const student = await prisma.user.findUnique({
            where: { id: sId },
            select: { id: true, name: true, email: true, role: true }
        });
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found." });
        }

        const courses = await prisma.course.findMany({
            where: { id: { in: ids } },
            select: { id: true, title: true }
        });
        if (courses.length !== ids.length) {
            return res.status(404).json({ success: false, message: "One or more courses not found." });
        }

        // ---- Duplicate UTR guard (paymentId is unique) ----
        if (reference) {
            const dup = await prisma.payment.findFirst({
                where: { paymentId: reference },
                select: { id: true }
            });
            if (dup) {
                return res.status(409).json({ success: false, message: "A payment with this UTR/reference already exists." });
            }
        }

        // ---- Create payment (temp orderId, then format PAY-000123 from the id) ----
        const tempOrder = `TMP-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        let payment = await prisma.payment.create({
            data: {
                orderId: tempOrder,
                paymentId: reference,        // UPI UTR (null for cash)
                studentId: sId,
                courseId: ids[0],            // primary course (schema requires one)
                amount: amt,
                currency: "INR",
                status: "COMPLETED",
                method: pm
            }
        });

        const orderId = `PAY-${String(payment.id).padStart(6, "0")}`;
        payment = await prisma.payment.update({
            where: { id: payment.id },
            data: { orderId }
        });

        // ---- Grant access FIRST (critical); skip already-active ones ----
        // Done before the optional course-linking so nothing can block access.
        const duration = durationDays ? parseInt(durationDays) : null;
        for (const courseId of ids) {
            try {
                await enrollmentService.grantAccess(sId, courseId, duration, req.user.id);
            } catch (e) {
                // Already-active or non-fatal — the payment is still recorded.
            }
        }

        const courseTitles = courses.map((c) => c.title).join(", ");

        // ---- Link covered courses (OPTIONAL: only if the PaymentCourse model
        // exists in the generated client). Never blocks access/notify. ----
        if (prisma.paymentCourse) {
            try {
                await prisma.$transaction(
                    ids.map((courseId) =>
                        prisma.paymentCourse.create({
                            data: { paymentId: payment.id, courseId }
                        })
                    )
                );
            } catch (e) {
                console.error("PaymentCourse link skipped:", e.message);
            }
        }

        // ---- Dashboard notification ----
        try {
            await notificationService.create({
                studentId: sId,
                title: "Payment Received",
                message: `Your payment of ₹${amt} (${pm}) was recorded. Access granted to: ${courseTitles}.`,
                type: "PAYMENT"
            });
        } catch (e) {
            console.error("Notification failed for manual payment:", e.message);
        }

        // ---- Email receipt ----
        try {
            await emailService.sendMail(
                student.email,
                `Payment Receipt ${orderId} - ZsmartClass`,
                `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
                    <h2 style="color:#4f46e5">Payment Receipt</h2>
                    <p>Hi ${student.name},</p>
                    <p>We have recorded your payment. Here are the details:</p>
                    <table cellpadding="8" style="border-collapse:collapse;width:100%">
                        <tr><td style="border:1px solid #eee"><b>Receipt No</b></td><td style="border:1px solid #eee">${orderId}</td></tr>
                        <tr><td style="border:1px solid #eee"><b>Amount</b></td><td style="border:1px solid #eee">₹${amt}</td></tr>
                        <tr><td style="border:1px solid #eee"><b>Method</b></td><td style="border:1px solid #eee">${pm}${reference ? ` (UTR: ${reference})` : ""}</td></tr>
                        <tr><td style="border:1px solid #eee"><b>Course(s)</b></td><td style="border:1px solid #eee">${courseTitles}</td></tr>
                        <tr><td style="border:1px solid #eee"><b>Date</b></td><td style="border:1px solid #eee">${new Date(payment.createdAt).toLocaleString("en-IN")}</td></tr>
                    </table>
                    <p style="margin-top:16px">You can now access your course(s) from your dashboard.</p>
                    <p style="color:#888;font-size:12px">ZsmartClass LMS</p>
                </div>`
            );
        } catch (e) {
            console.error("Email failed for manual payment:", e.message);
        }

        return res.status(201).json({
            success: true,
            message: "Payment recorded and access granted.",
            data: { ...payment, courses }
        });
    } catch (err) {
        console.error("Error creating manual payment:", err);
        res.status(err.statusCode || 400).json({ success: false, message: err.message });
    }
};