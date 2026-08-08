// src/routes/enrollment.routes.js
const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// ==========================================
// STUDENT ROUTES
// ==========================================

// Student Enrollment
router.post(
    "/",
    authMiddleware,
    roleMiddleware("STUDENT"),
    async (req, res) => {
        try {
            const { studentId, courseId } = req.body;
            
            const course = await prisma.course.findUnique({
                where: { id: Number(courseId) }
            });

            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: "Course not found."
                });
            }

            const alreadyEnrolled = await prisma.enrollment.findFirst({
                where: {
                    userId: Number(studentId),
                    courseId: Number(courseId)
                }
            });

            if (alreadyEnrolled) {
                return res.status(400).json({
                    success: false,
                    message: "Already enrolled."
                });
            }

            const enrollment = await prisma.enrollment.create({
                data: {
                    userId: Number(studentId),
                    courseId: Number(courseId)
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    course: true
                }
            });

            res.status(201).json({
                success: true,
                data: enrollment
            });
        } catch (err) {
            console.error("Enrollment error:", err);
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }
);

// My Courses
router.get(
    "/my-courses",
    authMiddleware,
    roleMiddleware("STUDENT"),
    async (req, res) => {
        try {
            const enrollments = await prisma.enrollment.findMany({
                where: {
                    userId: Number(req.user.id)
                },
                include: {
                    course: {
                        include: {
                            category: true,
                            createdBy: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    enrolledAt: "desc"
                }
            });

            res.json({
                success: true,
                data: enrollments
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }
);

// Course Progress
router.get(
    "/course-progress/:courseId",
    authMiddleware,
    roleMiddleware("STUDENT"),
    async (req, res) => {
        try {
            const enrollment = await prisma.enrollment.findFirst({
                where: {
                    userId: Number(req.user.id),
                    courseId: Number(req.params.courseId)
                }
            });

            if (!enrollment) {
                return res.status(404).json({
                    success: false,
                    message: "Enrollment not found."
                });
            }

            res.json({
                success: true,
                data: enrollment
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }
);

// Cancel Enrollment
router.delete(
    "/:courseId",
    authMiddleware,
    roleMiddleware("STUDENT"),
    async (req, res) => {
        try {
            const enrollment = await prisma.enrollment.findFirst({
                where: {
                    userId: Number(req.user.id),
                    courseId: Number(req.params.courseId)
                }
            });

            if (!enrollment) {
                return res.status(404).json({
                    success: false,
                    message: "Enrollment not found."
                });
            }

            await prisma.enrollment.delete({
                where: {
                    id: enrollment.id
                }
            });

            res.json({
                success: true,
                message: "Enrollment cancelled successfully."
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }
);

// ==========================================
// ADMIN ROUTES
// ==========================================

// GET ALL ENROLLMENTS - Admin
router.get(
    "/admin/all",
    authMiddleware,
    roleMiddleware("ADMIN","MENTOR"),
    async (req, res) => {
        try {
            console.log("📊 Admin fetching all enrollments...");
            
            const enrollments = await prisma.enrollment.findMany({
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true
                        }
                    },
                    course: {
                        select: {
                            id: true,
                            title: true,
                            thumbnail: true
                        }
                    },
                    certificate: {
                        select: {
                            id: true,
                            certificateNo: true,
                            status: true
                        }
                    }
                },
                orderBy: {
                    enrolledAt: "desc"
                }
            });

            console.log(`✅ Found ${enrollments.length} enrollments`);
            
            res.json({
                success: true,
                data: enrollments,
                count: enrollments.length
            });
        } catch (err) {
            console.error("Error in admin/all:", err);
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }
);

// GET ENROLLMENT BY ID - Admin
router.get(
    "/admin/:id",
    authMiddleware,
    roleMiddleware("ADMIN","MENTOR"),
    async (req, res) => {
        try {
            const enrollment = await prisma.enrollment.findUnique({
                where: {
                    id: Number(req.params.id)
                },
                include: {
                    user: {
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
                    },
                    certificate: {
                        select: {
                            id: true,
                            certificateNo: true,
                            status: true
                        }
                    }
                }
            });

            if (!enrollment) {
                return res.status(404).json({
                    success: false,
                    message: "Enrollment not found."
                });
            }

            res.json({
                success: true,
                data: enrollment
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }
);

// UPDATE ENROLLMENT - Admin
router.put(
    "/admin/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    async (req, res) => {
        try {
            const { progress, completed, certificateId, certificateNo } = req.body;

            const enrollment = await prisma.enrollment.findUnique({
                where: {
                    id: Number(req.params.id)
                }
            });

            if (!enrollment) {
                return res.status(404).json({
                    success: false,
                    message: "Enrollment not found."
                });
            }

            const updated = await prisma.enrollment.update({
                where: {
                    id: Number(req.params.id)
                },
                data: {
                    progress: progress !== undefined ? parseFloat(progress) : undefined,
                    completed: completed !== undefined ? completed : undefined,
                    certificateId: certificateId ? Number(certificateId) : null,
                    certificateNo: certificateNo || null,
                    updatedAt: new Date()
                },
                include: {
                    user: {
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

            res.json({
                success: true,
                data: updated,
                message: "Enrollment updated successfully."
            });
        } catch (err) {
            console.error("Update enrollment error:", err);
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }
);

// DELETE ENROLLMENT - Admin
router.delete(
    "/admin/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    async (req, res) => {
        try {
            const enrollment = await prisma.enrollment.findUnique({
                where: {
                    id: Number(req.params.id)
                }
            });

            if (!enrollment) {
                return res.status(404).json({
                    success: false,
                    message: "Enrollment not found."
                });
            }

            // Remove certificate reference if exists
            if (enrollment.certificateId) {
                await prisma.enrollment.update({
                    where: {
                        id: Number(req.params.id)
                    },
                    data: {
                        certificateId: null,
                        certificateNo: null
                    }
                });
            }

            await prisma.enrollment.delete({
                where: {
                    id: Number(req.params.id)
                }
            });

            res.json({
                success: true,
                message: "Enrollment deleted successfully."
            });
        } catch (err) {
            console.error("Delete enrollment error:", err);
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }
);

// GET ENROLLMENTS BY COURSE - Admin
router.get(
    "/admin/course/:courseId",
    authMiddleware,
    roleMiddleware("ADMIN"),
    async (req, res) => {
        try {
            const enrollments = await prisma.enrollment.findMany({
                where: {
                    courseId: Number(req.params.courseId)
                },
                include: {
                    user: {
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
                    enrolledAt: "desc"
                }
            });

            res.json({
                success: true,
                data: enrollments
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }
);

// GET ENROLLMENT STATS - Admin
router.get(
    "/admin/stats",
    authMiddleware,
    roleMiddleware("ADMIN"),
    async (req, res) => {
        try {
            const [total, completed, inProgress, notStarted] = await Promise.all([
                prisma.enrollment.count(),
                prisma.enrollment.count({
                    where: { completed: true }
                }),
                prisma.enrollment.count({
                    where: {
                        progress: { gt: 0, lt: 100 },
                        completed: false
                    }
                }),
                prisma.enrollment.count({
                    where: {
                        progress: 0,
                        completed: false
                    }
                })
            ]);

            res.json({
                success: true,
                data: {
                    total,
                    completed,
                    inProgress,
                    notStarted,
                    needsReminder: await prisma.enrollment.count({
                        where: {
                            progress: { lt: 50 },
                            completed: false
                        }
                    })
                }
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }
);

// TEST ROUTE - Check if routes are working
router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Enrollment routes are working!",
        endpoints: {
            admin: {
                all: "GET /admin/all",
                get: "GET /admin/:id",
                update: "PUT /admin/:id",
                delete: "DELETE /admin/:id",
                byCourse: "GET /admin/course/:courseId",
                stats: "GET /admin/stats"
            },
            student: {
                enroll: "POST /",
                myCourses: "GET /my-courses",
                progress: "GET /course-progress/:courseId",
                cancel: "DELETE /:courseId"
            }
        }
    });
});

module.exports = router;