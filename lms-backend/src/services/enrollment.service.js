
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

                student: {
                    connect: {
                        id: Number(studentId)
                    }
                },

                course: {
                    connect: {
                        id: Number(courseId)
                    }
                }

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

}

module.exports = new EnrollmentService();
