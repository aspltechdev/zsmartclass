// src/services/enrollment.service.js
const prisma = require("../config/prisma");

class EnrollmentService {

    async enroll(data) {
        const {
            studentId,
            courseId
        } = data;

        const course = await prisma.course.findUnique({
            where: {
                id: Number(courseId)
            }
        });

        if (!course) {
            throw new Error("Course not found.");
        }

        const alreadyEnrolled =
            await prisma.enrollment.findFirst({
                where: {
                    studentId: Number(studentId),
                    courseId: Number(courseId)
                }
            });

        if (alreadyEnrolled) {
            throw new Error("Already enrolled.");
        }

        return await prisma.enrollment.create({
            data: {
                studentId: Number(studentId),
                courseId: Number(courseId)
            },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                course: true
            }
        });
    }

    async myCourses(studentId) {
        return await prisma.enrollment.findMany({
            where: {
                studentId: Number(studentId)
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
    }

    async courseProgress(studentId, courseId) {
        const enrollment =
            await prisma.enrollment.findFirst({
                where: {
                    studentId: Number(studentId),
                    courseId: Number(courseId)
                }
            });

        if (!enrollment) {
            throw new Error("Enrollment not found.");
        }

        return enrollment;
    }

    async cancelEnrollment(studentId, courseId) {
        const enrollment =
            await prisma.enrollment.findFirst({
                where: {
                    studentId: Number(studentId),
                    courseId: Number(courseId)
                }
            });

        if (!enrollment) {
            throw new Error("Enrollment not found.");
        }

        await prisma.enrollment.delete({
            where: {
                id: enrollment.id
            }
        });

        return {
            success: true,
            message: "Enrollment cancelled successfully."
        };
    }

    // ==========================================
    // ADMIN METHODS - FIXED
    // ==========================================

    // Get all enrollments with student and course details
    async getAllEnrollments() {
        try {
            console.log("📊 Fetching all enrollments...");
            
            // First, try to get all enrollments with raw query
            const enrollments = await prisma.enrollment.findMany({
                include: {
                    student: {
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
                    }
                },
                orderBy: {
                    enrolledAt: "desc"
                }
            });
            
            console.log(`✅ Found ${enrollments.length} enrollments`);
            return enrollments;
        } catch (error) {
            console.error("Error in getAllEnrollments:", error);
            // If there's an error, return empty array
            return [];
        }
    }

    // Get enrollment by ID
    async getEnrollmentById(id) {
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                id: Number(id)
            },
            include: {
                student: {
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
                }
            }
        });

        if (!enrollment) {
            throw new Error("Enrollment not found.");
        }

        return enrollment;
    }

    // Update enrollment (admin)
    async updateEnrollment(id, data) {
        const { progress, completed, certificateId, certificateNo } = data;

        const enrollment = await prisma.enrollment.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!enrollment) {
            throw new Error("Enrollment not found.");
        }

        return await prisma.enrollment.update({
            where: {
                id: Number(id)
            },
            data: {
                progress: progress !== undefined ? parseFloat(progress) : undefined,
                completed: completed !== undefined ? completed : undefined,
                certificateId: certificateId ? Number(certificateId) : null,
                certificateNo: certificateNo || null,
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
    }

    // Delete enrollment (admin)
    async deleteEnrollment(id) {
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!enrollment) {
            throw new Error("Enrollment not found.");
        }

        // First, remove certificate reference if exists
        if (enrollment.certificateId) {
            await prisma.enrollment.update({
                where: {
                    id: Number(id)
                },
                data: {
                    certificateId: null,
                    certificateNo: null
                }
            });
        }

        await prisma.enrollment.delete({
            where: {
                id: Number(id)
            }
        });

        return {
            success: true,
            message: "Enrollment deleted successfully."
        };
    }

    // Get enrollments by course
    async getEnrollmentsByCourse(courseId) {
        return await prisma.enrollment.findMany({
            where: {
                courseId: Number(courseId)
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
            },
            orderBy: {
                enrolledAt: "desc"
            }
        });
    }

    // Get enrollment stats
    async getEnrollmentStats() {
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

        return {
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
        };
    }
}

module.exports = new EnrollmentService();