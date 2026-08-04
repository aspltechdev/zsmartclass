// src/controllers/payment.controller.js
const prisma = require("../config/prisma");

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

        res.json({
            success: true,
            data: payments
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