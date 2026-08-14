// src/services/enrollment.service.js
const prisma = require("../config/prisma");

class EnrollmentService {

    // ==========================================
    // STUDENT: VIEW OWN COURSES (VIEW ONLY)
    // ==========================================
    async myCourses(studentId) {
        const enrollments = await prisma.enrollment.findMany({
            where: {
                userId: Number(studentId),
            },
            include: {
                course: {
                    include: {
                        category: true,
                        createdBy: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                enrolledAt: "desc",
            },
        });

        const now = new Date();
        return enrollments.map(enrollment => {
            const isExpired = enrollment.accessExpiry 
                ? new Date(enrollment.accessExpiry) < now 
                : false;
            
            return {
                ...enrollment,
                isExpired: isExpired || enrollment.isExpired,
                remainingDays: enrollment.accessExpiry
                    ? Math.max(0, Math.ceil((new Date(enrollment.accessExpiry) - now) / (1000 * 60 * 60 * 24)))
                    : null,
                canAccess: !(isExpired || enrollment.isExpired),
            };
        });
    }

    // ==========================================
    // STUDENT: VIEW COURSE PROGRESS (VIEW ONLY)
    // ==========================================
    async courseProgress(studentId, courseId) {
        const enrollment =
            await prisma.enrollment.findFirst({
                where: {
                    userId: Number(studentId),
                    courseId: Number(courseId)
                }
            });

        if (!enrollment) {
            throw new Error("Enrollment not found.");
        }

        const now = new Date();
        const isExpired = enrollment.accessExpiry 
            ? new Date(enrollment.accessExpiry) < now 
            : false;

        if (isExpired || enrollment.isExpired) {
            throw new Error("Your access to this course has expired. Please contact the admin.");
        }

        return enrollment;
    }

    // ==========================================
    // ADMIN & MENTOR: GET ALL ENROLLMENTS (FULL VIEW)
    // ==========================================
    async getAllEnrollments() {
        try {
            console.log("📊 Fetching all enrollments...");
            
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
                            thumbnail: true,
                            createdById: true,
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
            
            console.log(`✅ Found ${enrollments.length} enrollments`);
            return enrollments;
        } catch (error) {
            console.error("Error in getAllEnrollments:", error);
            return [];
        }
    }

    // ==========================================
    // ADMIN & MENTOR: GET ENROLLMENT BY ID (FULL VIEW)
    // ==========================================
    async getEnrollmentById(id) {
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                id: Number(id)
            },
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
                        thumbnail: true,
                        createdById: true,
                        createdBy: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (!enrollment) {
            throw new Error("Enrollment not found.");
        }

        return enrollment;
    }

    // ==========================================
    // ADMIN & MENTOR: GET ENROLLMENTS BY COURSE (FULL VIEW)
    // ==========================================
    async getEnrollmentsByCourse(courseId) {
        return await prisma.enrollment.findMany({
            where: {
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

    // ==========================================
    // ADMIN & MENTOR: GET ENROLLMENT STATS (FULL VIEW)
    // ==========================================
    async getEnrollmentStats() {
        const [total, completed, inProgress, notStarted, expired, needsReminder] = await Promise.all([
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
            }),
            prisma.enrollment.count({
                where: {
                    isExpired: true,
                    completed: false
                }
            }),
            prisma.enrollment.count({
                where: {
                    progress: { lt: 50 },
                    completed: false,
                    isExpired: false
                }
            })
        ]);

        return {
            total,
            completed,
            inProgress,
            notStarted,
            expired,
            needsReminder
        };
    }

    // ==========================================
    // ADMIN & MENTOR: GET STUDENT ENROLLMENTS (FULL VIEW)
    // ==========================================
    async getStudentEnrollments(userId) {
        const enrollments = await prisma.enrollment.findMany({
            where: {
                userId: parseInt(userId),
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        thumbnail: true,
                        level: true,
                    },
                },
            },
            orderBy: {
                enrolledAt: 'desc',
            },
        });

        const now = new Date();
        return enrollments.map(enrollment => {
            const isExpired = enrollment.accessExpiry 
                ? new Date(enrollment.accessExpiry) < now 
                : false;

            return {
                ...enrollment,
                isExpired: isExpired || enrollment.isExpired,
                accessExpiry: enrollment.accessExpiry,
                accessDuration: enrollment.accessDuration,
                remainingDays: enrollment.accessExpiry
                    ? Math.max(0, Math.ceil((new Date(enrollment.accessExpiry) - now) / (1000 * 60 * 60 * 24)))
                    : null,
            };
        });
    }

    // ==========================================
    // ADMIN & MENTOR: GET MENTOR'S STUDENTS (FULL VIEW)
    // ==========================================
    async getMentorStudents(mentorId) {
        const courses = await prisma.course.findMany({
            where: {
                createdById: parseInt(mentorId)
            },
            select: {
                id: true,
                title: true,
                enrollments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                profileImage: true,
                            }
                        }
                    }
                }
            }
        });

        const studentsMap = new Map();
        
        courses.forEach(course => {
            course.enrollments.forEach(enrollment => {
                if (!studentsMap.has(enrollment.user.id)) {
                    studentsMap.set(enrollment.user.id, {
                        ...enrollment.user,
                        courses: []
                    });
                }
                studentsMap.get(enrollment.user.id).courses.push({
                    id: course.id,
                    title: course.title,
                    enrollmentId: enrollment.id,
                    progress: enrollment.progress,
                    completed: enrollment.completed,
                    enrolledAt: enrollment.enrolledAt,
                    isExpired: enrollment.isExpired,
                    accessExpiry: enrollment.accessExpiry,
                });
            });
        });

        return Array.from(studentsMap.values());
    }

    // ==========================================
    // ADMIN ONLY: UPDATE ENROLLMENT
    // ==========================================
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
    }

    // ==========================================
    // ADMIN ONLY: DELETE ENROLLMENT
    // ==========================================
    async deleteEnrollment(id) {
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!enrollment) {
            throw new Error("Enrollment not found.");
        }

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

    // ==========================================
    // ADMIN ONLY: GRANT ACCESS
    // ==========================================
    async grantAccess(userId, courseId, durationDays = null, grantedBy = null) {
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: parseInt(userId),
                    courseId: parseInt(courseId),
                },
            },
        });

        if (existingEnrollment) {
            if (existingEnrollment.isExpired || 
                (existingEnrollment.accessExpiry && new Date(existingEnrollment.accessExpiry) < new Date())) {
                
                const accessExpiry = durationDays 
                    ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
                    : null;

                return await prisma.enrollment.update({
                    where: { id: existingEnrollment.id },
                    data: {
                        isExpired: false,
                        accessExpiry: accessExpiry,
                        accessDuration: durationDays || null,
                        progress: 0,
                        completed: false,
                        updatedAt: new Date(),
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                        course: {
                            select: {
                                id: true,
                                title: true,
                                thumbnail: true,
                            },
                        },
                    },
                });
            }

            const error = new Error("Student already has active access to this course");
            error.statusCode = 400;
            throw error;
        }

        const accessExpiry = durationDays 
            ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
            : null;

        const enrollment = await prisma.enrollment.create({
            data: {
                userId: parseInt(userId),
                courseId: parseInt(courseId),
                enrolledAt: new Date(),
                accessExpiry: accessExpiry,
                accessDuration: durationDays || null,
                isExpired: false,
                progress: 0,
                completed: false,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                course: {
                    select: {
                        id: true,
                        title: true,
                        thumbnail: true,
                        level: true,
                    },
                },
            },
        });

        return enrollment;
    }

    // ==========================================
    // ADMIN ONLY: EXTEND ACCESS
    // ==========================================
    async extendAccess(enrollmentId, additionalDays) {
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: parseInt(enrollmentId) },
        });

        if (!enrollment) {
            const error = new Error("Enrollment not found");
            error.statusCode = 404;
            throw error;
        }

        const currentExpiry = enrollment.accessExpiry || new Date();
        const newExpiry = new Date(currentExpiry);
        newExpiry.setDate(newExpiry.getDate() + additionalDays);

        const updatedEnrollment = await prisma.enrollment.update({
            where: { id: parseInt(enrollmentId) },
            data: {
                accessExpiry: newExpiry,
                isExpired: false,
                accessDuration: (enrollment.accessDuration || 0) + additionalDays,
                updatedAt: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                course: {
                    select: {
                        id: true,
                        title: true,
                        thumbnail: true,
                    },
                },
            },
        });

        return updatedEnrollment;
    }

    // ==========================================
    // ADMIN ONLY: CHECK AND EXPIRE ENROLLMENTS
    // ==========================================
    async checkAndExpireEnrollments() {
        const now = new Date();

        const expiredEnrollments = await prisma.enrollment.updateMany({
            where: {
                isExpired: false,
                accessExpiry: {
                    lt: now,
                    not: null,
                },
            },
            data: {
                isExpired: true,
                updatedAt: now,
            },
        });

        return {
            expiredCount: expiredEnrollments.count,
            message: `${expiredEnrollments.count} enrollment(s) expired`,
        };
    }
}

module.exports = new EnrollmentService();