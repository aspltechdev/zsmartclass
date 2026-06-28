const prisma = require("../config/prisma");

class ProgressService {

    // Mark Lesson Completed
    async markCompleted(data) {

        const { studentId, lessonId } = data;

        const lesson = await prisma.lesson.findUnique({
            where: {
                id: Number(lessonId)
            },
            include: {
                module: {
                    include: {
                        course: true
                    }
                }
            }
        });

        if (!lesson) {
            throw new Error("Lesson not found.");
        }

        // Check Enrollment
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                studentId: Number(studentId),
                courseId: lesson.module.course.id
            }
        });

        if (!enrollment) {
            throw new Error("Student is not enrolled in this course.");
        }

        // Already Completed?
        const existing = await prisma.lessonProgress.findFirst({
            where: {
                studentId: Number(studentId),
                lessonId: Number(lessonId)
            }
        });

        if (existing) {
            return existing;
        }

        // Create Progress
        await prisma.lessonProgress.create({

            data: {

                student: {
                    connect: {
                        id: Number(studentId)
                    }
                },

                lesson: {
                    connect: {
                        id: Number(lessonId)
                    }
                },

                completed: true,

                watchedAt: new Date()

            }

        });

        // Update Course Progress
        await this.updateCourseProgress(
            studentId,
            lesson.module.course.id
        );

        return {
            success: true,
            message: "Lesson marked as completed."
        };

    }

    // Lesson Progress
    async getLessonProgress(studentId, lessonId) {

        return await prisma.lessonProgress.findFirst({

            where: {

                studentId: Number(studentId),

                lessonId: Number(lessonId)

            }

        });

    }

    // Course Progress
    async getCourseProgress(studentId, courseId) {

        const lessons = await prisma.lesson.findMany({

            where: {

                module: {

                    courseId: Number(courseId)

                }

            }

        });

        const totalLessons = lessons.length;

        const completedLessons =
            await prisma.lessonProgress.count({

                where: {

                    studentId: Number(studentId),

                    completed: true,

                    lesson: {

                        module: {

                            courseId: Number(courseId)

                        }

                    }

                }

            });

        const progress = totalLessons === 0
            ? 0
            : Math.round(
                (completedLessons / totalLessons) * 100
            );

        return {

            totalLessons,

            completedLessons,

            progress

        };

    }

    // Update Enrollment Progress
    async updateCourseProgress(studentId, courseId) {

        const result = await this.getCourseProgress(
            studentId,
            courseId
        );

        await prisma.enrollment.updateMany({

            where: {

                studentId: Number(studentId),

                courseId: Number(courseId)

            },

            data: {

                progress: result.progress,

                completed: result.progress === 100,

                completedAt:
                    result.progress === 100
                        ? new Date()
                        : null

            }

        });

    }

    // Continue Learning
    async continueLearning(studentId) {

        const enrollments =
            await prisma.enrollment.findMany({

                where: {

                    studentId: Number(studentId),

                    completed: false

                },

                include: {

                    course: {

                        include: {

                            modules: {

                                include: {

                                    lessons: {

                                        orderBy: {

                                            position: "asc"

                                        }

                                    }

                                },

                                orderBy: {

                                    position: "asc"

                                }

                            }

                        }

                    }

                }

            });

        return enrollments;

    }

}

module.exports = new ProgressService();