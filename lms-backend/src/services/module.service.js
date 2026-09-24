
const prisma = require("../config/prisma");

class ModuleService {
    // ==========================================
    // CREATE MODULE
    // ==========================================
    async create(data) {
        const {
            title,
            description,
            createdBy,
            courseId,
        } = data;

        // ------------------------------------------
        // VALIDATION
        // ------------------------------------------
        if (!title || !title.trim()) {
            const error = new Error("Module title is required.");
            error.statusCode = 400;
            throw error;
        }

        if (!createdBy) {
            const error = new Error("Creator is required.");
            error.statusCode = 400;
            throw error;
        }

        if (!courseId) {
            const error = new Error("Course is required.");
            error.statusCode = 400;
            throw error;
        }

        const creatorId = Number(createdBy);
        const selectedCourseId = Number(courseId);

        if (!Number.isInteger(creatorId)) {
            const error = new Error("Invalid creator ID.");
            error.statusCode = 400;
            throw error;
        }

        if (!Number.isInteger(selectedCourseId)) {
            const error = new Error("Invalid course ID.");
            error.statusCode = 400;
            throw error;
        }

        // ------------------------------------------
        // VERIFY CREATOR
        // ------------------------------------------
        const creator = await prisma.user.findUnique({
            where: {
                id: creatorId,
            },
            select: {
                id: true,
                name: true,
                role: true,
            },
        });

        if (!creator) {
            const error = new Error("Creator not found.");
            error.statusCode = 404;
            throw error;
        }

        // ------------------------------------------
        // VERIFY COURSE
        // ------------------------------------------
        const course = await prisma.course.findUnique({
            where: {
                id: selectedCourseId,
            },
            select: {
                id: true,
                title: true,
            },
        });

        if (!course) {
            const error = new Error("Course not found.");
            error.statusCode = 404;
            throw error;
        }

        // ------------------------------------------
        // CREATE MODULE
        // ------------------------------------------
        const module = await prisma.courseModule.create({
            data: {
                title: title.trim(),
                description:
                    description !== undefined &&
                    description !== null &&
                    description !== ""
                        ? description
                        : null,

                position: 0,

                createdBy: creatorId,
                courseId: selectedCourseId,

                category: null,
                tags: [],
                thumbnail: null,
            },

            include: {
                lessons: {
                    orderBy: {
                        position: "asc",
                    },
                },
            },
        });

        return module;
    }

    // ==========================================
    // GET ALL MODULES
    // ==========================================
    async getAll() {
        return await prisma.courseModule.findMany({
            include: {
                lessons: {
                    orderBy: {
                        position: "asc",
                    },
                },
            },

            orderBy: {
                createdAt: "desc",
            },
        });
    }

    // ==========================================
    // GET MODULE BY ID
    // ==========================================
    async getById(id, requester) {
        const moduleId = Number(id);

        if (!Number.isInteger(moduleId)) {
            const error = new Error("Invalid module ID.");
            error.statusCode = 400;
            throw error;
        }

        const module = await prisma.courseModule.findUnique({
            where: {
                id: moduleId,
            },

            include: {
                lessons: {
                    orderBy: {
                        position: "asc",
                    },
                },
            },
        });

        if (!module) {
            const error = new Error("Module not found.");
            error.statusCode = 404;
            throw error;
        }

        // ------------------------------------------
        // HIDE VIDEO URL FROM NON-PRIVILEGED USERS
        // ------------------------------------------
        const privileged =
            requester?.role === "MENTOR" ||
            requester?.role === "ADMIN";

        if (!privileged && Array.isArray(module.lessons)) {
            module.lessons = module.lessons.map((lesson) => ({
                ...lesson,
                videoUrl: null,
            }));
        }

        return module;
    }

    // ==========================================
    // UPDATE MODULE
    // ==========================================
    async update(id, data) {
        const moduleId = Number(id);

        if (!Number.isInteger(moduleId)) {
            const error = new Error("Invalid module ID.");
            error.statusCode = 400;
            throw error;
        }

        const {
            title,
            description,
        } = data;

        const existingModule = await prisma.courseModule.findUnique({
            where: {
                id: moduleId,
            },
        });

        if (!existingModule) {
            const error = new Error("Module not found.");
            error.statusCode = 404;
            throw error;
        }

        const updatedModule = await prisma.courseModule.update({
            where: {
                id: moduleId,
            },

            data: {
                title:
                    title !== undefined &&
                    title !== null &&
                    title.trim() !== ""
                        ? title.trim()
                        : existingModule.title,

                description:
                    description !== undefined
                        ? description
                        : existingModule.description,
            },

            include: {
                lessons: {
                    orderBy: {
                        position: "asc",
                    },
                },
            },
        });

        return updatedModule;
    }

    // ==========================================
    // DELETE MODULE
    // ==========================================
    async delete(id) {
        const moduleId = Number(id);

        if (!Number.isInteger(moduleId)) {
            const error = new Error("Invalid module ID.");
            error.statusCode = 400;
            throw error;
        }

        const module = await prisma.courseModule.findUnique({
            where: {
                id: moduleId,
            },

            include: {
                lessons: {
                    select: {
                        id: true,
                    },
                },
            },
        });

        if (!module) {
            const error = new Error("Module not found.");
            error.statusCode = 404;
            throw error;
        }

        const lessonIds = module.lessons.map(
            (lesson) => lesson.id
        );

        await prisma.$transaction([
            // --------------------------------------
            // DELETE LESSON PROGRESS
            // --------------------------------------
            ...(lessonIds.length
                ? [
                      prisma.lessonProgress.deleteMany({
                          where: {
                              lessonId: {
                                  in: lessonIds,
                              },
                          },
                      }),

                      // --------------------------------
                      // DELETE LESSONS
                      // --------------------------------
                      prisma.lesson.deleteMany({
                          where: {
                              moduleId: moduleId,
                          },
                      }),
                  ]
                : []),

            // --------------------------------------
            // DELETE MODULE
            // --------------------------------------
            prisma.courseModule.delete({
                where: {
                    id: moduleId,
                },
            }),
        ]);

        return {
            success: true,
            message: "Module deleted successfully.",
        };
    }

    // ==========================================
    // GET MODULE STATS
    // ==========================================
    async getStats() {
        const [
            totalModules,
            totalLessons,
        ] = await Promise.all([
            prisma.courseModule.count(),
            prisma.lesson.count(),
        ]);

        return {
            totalModules,
            totalLessons,
        };
    }
}

module.exports = new ModuleService();