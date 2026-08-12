// src/services/module.service.js
const prisma = require("../config/prisma");
const slugify = require("slugify");

class ModuleService {

    // ==========================================
    // CREATE MODULE
    // ==========================================
    async create(data) {
        const { title, description } = data;

        if (!title) {
            throw new Error("Module title is required.");
        }

        const slug = slugify(title, { 
            lower: true, 
            strict: true,
            remove: /[*+~.()'"!:@]/g
        });

        const existing = await prisma.courseModule.findFirst({
            where: {
                moduleSlug: slug,
                isShared: true,
            }
        });

        let finalSlug = slug;
        if (existing) {
            finalSlug = `${slug}-${Date.now()}`;
        }

        const module = await prisma.courseModule.create({
            data: {
                title,
                description: description || null,
                position: 0,
                courseId: null,
                isShared: true,
                isPublished: true,
                moduleSlug: finalSlug,
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
            where: {
                courseId: null,
                isShared: true,
                isPublished: true,
            },
            include: {
                lessons: {
                    where: {
                        isShared: true,
                    },
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
                    where: {
                        isShared: true,
                    },
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

        const updateData = {
            title: title || module.title,
            description: description !== undefined ? description : module.description,
        };

        if (title && title !== module.title) {
            const newSlug = slugify(title, { 
                lower: true, 
                strict: true,
                remove: /[*+~.()'"!:@]/g
            });
            updateData.moduleSlug = newSlug;
        }

        return await prisma.courseModule.update({
            where: {
                id: Number(id)
            },
            data: updateData,
            include: {
                lessons: {
                    where: {
                        isShared: true,
                    },
                    orderBy: {
                        position: "asc"
                    }
                }
            }
        });
    }

    // ==========================================
    // DELETE MODULE
    // ==========================================
    async delete(id) {
        const module = await prisma.courseModule.findUnique({
            where: {
                id: Number(id)
            },
            include: {
                lessons: true
            }
        });

        if (!module) {
            throw new Error("Module not found.");
        }

        if (module.lessons.length > 0) {
            await prisma.lesson.deleteMany({
                where: {
                    moduleId: Number(id)
                }
            });
        }

        await prisma.courseModule.delete({
            where: {
                id: Number(id)
            }
        });

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
            prisma.courseModule.count({
                where: {
                    courseId: null,
                    isShared: true,
                }
            }),
            prisma.lesson.count({
                where: {
                    isShared: true,
                }
            })
        ]);

        return {
            totalModules,
            totalLessons
        };
    }
}

module.exports = new ModuleService();