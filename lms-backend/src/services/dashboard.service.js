const prisma = require("../config/prisma");

class DashboardService {

    // ==========================
    // ADMIN DASHBOARD
    // ==========================
    async adminDashboard() {

        const students = await prisma.user.count({
            where: {
                role: "STUDENT"
            }
        });

        const mentors = await prisma.user.count({
            where: {
                role: "MENTOR"
            }
        });

        const admins = await prisma.user.count({
            where: {
                role: "ADMIN"
            }
        });

        const courses = await prisma.course.count();

        const publishedCourses = await prisma.course.count({
            where: {
                status: "Published"
            }
        });

        const draftCourses = await prisma.course.count({
            where: {
                status: "Draft"
            }
        });

        const categories = await prisma.category.count();

        const modules = await prisma.courseModule.count();

        const lessons = await prisma.lesson.count();

        const enrollments = await prisma.enrollment.count();

        const completedCourses = await prisma.enrollment.count({
            where: {
                completed: true
            }
        });

        const recentCourses = await prisma.course.findMany({

            take: 5,

            orderBy: {
                createdAt: "desc"
            },

            include: {
                category: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }

        });

        const recentStudents = await prisma.user.findMany({

            where: {
                role: "STUDENT"
            },

            take: 5,

            orderBy: {
                createdAt: "desc"
            },

            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true
            }

        });

        const recentEnrollments = await prisma.enrollment.findMany({

            take: 5,

            orderBy: {
                enrolledAt: "desc"
            },

            include: {
                student: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                course: true
            }

        });

        return {

            cards: {

                students,

                mentors,

                admins,

                courses,

                publishedCourses,

                draftCourses,

                categories,

                modules,

                lessons,

                enrollments,

                completedCourses

            },

            recentCourses,

            recentStudents,

            recentEnrollments

        };

    }

    // ==========================
    // MENTOR DASHBOARD
    // ==========================
    async mentorDashboard(mentorId) {

        const myCourses = await prisma.course.count({

            where: {

                createdById: Number(mentorId)

            }

        });

        const publishedCourses = await prisma.course.count({

            where: {

                createdById: Number(mentorId),

                status: "Published"

            }

        });

        const draftCourses = await prisma.course.count({

            where: {

                createdById: Number(mentorId),

                status: "Draft"

            }

        });

        const modules = await prisma.courseModule.count({

            where: {

                course: {

                    createdById: Number(mentorId)

                }

            }

        });

        const lessons = await prisma.lesson.count({

            where: {

                module: {

                    course: {

                        createdById: Number(mentorId)

                    }

                }

            }

        });

        const students = await prisma.enrollment.count({

            where: {

                course: {

                    createdById: Number(mentorId)

                }

            }

        });

        const recentCourses = await prisma.course.findMany({

            where: {

                createdById: Number(mentorId)

            },

            take: 5,

            orderBy: {

                createdAt: "desc"

            }

        });

        return {

            myCourses,

            publishedCourses,

            draftCourses,

            modules,

            lessons,

            students,

            recentCourses

        };

    }

    // ==========================
    // STUDENT DASHBOARD
    // ==========================
    async studentDashboard(studentId) {

        const myCourses = await prisma.enrollment.count({

            where: {

                studentId: Number(studentId)

            }

        });

        const completedCourses = await prisma.enrollment.count({

            where: {

                studentId: Number(studentId),

                completed: true

            }

        });

        const continueLearning = await prisma.enrollment.findFirst({

            where: {

                studentId: Number(studentId),

                completed: false

            },

            include: {

                course: true

            },

            orderBy: {

                enrolledAt: "desc"

            }

        });

        const recentCourses = await prisma.enrollment.findMany({

            where: {

                studentId: Number(studentId)

            },

            take: 5,

            include: {

                course: true

            }

        });

        return {

            myCourses,

            completedCourses,

            continueLearning,

            recentCourses

        };

    }

}

module.exports = new DashboardService();