// src/services/module.service.js
const prisma = require("../config/prisma");

class ModuleService {

    // ==========================================
    // CREATE MODULE - WITH FORCED DEFAULT
    // ==========================================
    async create(data) {
        const { title, description, createdBy } = data;

        if (!title) {
            throw new Error("Module title is required.");
        }

        if (!createdBy) {
            const error = new Error("Creator is required.");
            error.statusCode = 400;
            throw error;
        }

        const module = await prisma.courseModule.create({
            data: {
                title: title,
                description: description || null,
                position: 0,
                createdBy: Number(createdBy), // real creator (controller passes req.user.id)
                category: null,
                tags: [],
                thumbnail: null,
            },
            include: {
                lessons: {
                    orderBy: {
                        position: "asc"
                    }
                }
            }
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
                        position: "asc"
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });
    }

    // ==========================================
    // GET MODULE BY ID
    // ==========================================
    async getById(id) {
        const module = await prisma.courseModule.findUnique({
            where: {
                id: Number(id)
            },
            include: {
                lessons: {
                    orderBy: {
                        position: "asc"
                    }
                }
            }
        });

        if (!module) {
            throw new Error("Module not found.");
        }

        return module;
    }

    // ==========================================
    // UPDATE MODULE
    // ==========================================
    async update(id, data) {
        const { title, description } = data;

        const module = await prisma.courseModule.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!module) {
            throw new Error("Module not found.");
        }

        return await prisma.courseModule.update({
            where: {
                id: Number(id)
            },
            data: {
                title: title || module.title,
                description: description !== undefined ? description : module.description,
            },
            include: {
                lessons: {
                    orderBy: {
                        position: "asc"
                    }
                }
            }
        });
    }

    // ==========================================
    // DELETE MODULE
    // Atomic bottom-up delete: LessonProgress -> Lessons -> Module.
    // (LessonProgress and Lessons have no DB cascade, so a module whose
    //  lessons have student progress would otherwise fail to delete.
    //  Quizzes cascade automatically.)
    // ==========================================
    async delete(id) {
        const moduleId = Number(id);

        const module = await prisma.courseModule.findUnique({
            where: {
                id: moduleId
            },
            include: {
                lessons: { select: { id: true } }
            }
        });

        if (!module) {
            throw new Error("Module not found.");
        }

        const lessonIds = module.lessons.map((l) => l.id);

        await prisma.$transaction([
            ...(lessonIds.length
                ? [
                      prisma.lessonProgress.deleteMany({
                          where: { lessonId: { in: lessonIds } }
                      }),
                      prisma.lesson.deleteMany({
                          where: { moduleId: moduleId }
                      })
                  ]
                : []),
            prisma.courseModule.delete({
                where: { id: moduleId }
            })
        ]);

        return {
            success: true,
            message: "Module deleted successfully."
        };
    }

    // ==========================================
    // GET MODULE STATS
    // ==========================================
    async getStats() {
        const [totalModules, totalLessons] = await Promise.all([
            prisma.courseModule.count(),
            prisma.lesson.count()
        ]);

        return {
            totalModules,
            totalLessons
        };
    }
}

module.exports = new ModuleService();