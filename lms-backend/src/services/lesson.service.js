// src/services/lesson.service.js
const prisma = require("../config/prisma");
const slugify = require("slugify");

class LessonService {

    // ==========================================
    // CREATE LESSON (NO duration)
    // ==========================================
    async create(data) {
        const {
            title,
            description,
            videoUrl,
            videoType,
            attachment,
            position,
            isPreview,
            moduleId
        } = data;

        if (!title) {
            throw new Error("Lesson title is required.");
        }

        if (!videoType) {
            throw new Error("Video type is required.");
        }

        const module = await prisma.courseModule.findUnique({
            where: {
                id: Number(moduleId)
            }
        });

        if (!module) {
            throw new Error("Module not found.");
        }

        // Generate lesson slug
        const slug = slugify(title, { 
            lower: true, 
            strict: true,
            remove: /[*+~.()'"!:@]/g
        });
        
        const lessonSlug = `${module.moduleSlug}-${slug}`;

        // Calculate position if not provided
        let finalPosition = position || 0;
        if (!position) {
            const maxPosition = await prisma.lesson.aggregate({
                where: {
                    moduleId: Number(moduleId)
                },
                _max: {
                    position: true
                }
            });
            finalPosition = (maxPosition._max.position || 0) + 1;
        }

        const lesson = await prisma.lesson.create({
            data: {
                title,
                description: description || null,
                videoUrl: videoUrl || null,
                videoType: videoType || "VIDEO",
                attachment: attachment || null,
                position: Number(finalPosition),
                isPreview: Boolean(isPreview || false),
                isShared: true,
                lessonSlug: lessonSlug,
                moduleId: Number(moduleId)
            },
            include: {
                module: true
            }
        });

        return lesson;
    }

    // ==========================================
    // GET ALL LESSONS
    // ==========================================
    async getAll() {
        return await prisma.lesson.findMany({
            where: {
                isShared: true,
            },
            include: {
                module: true
            },
            orderBy: [
                {
                    moduleId: "asc"
                },
                {
                    position: "asc"
                }
            ]
        });
    }

    // ==========================================
    // GET LESSON BY ID
    // ==========================================
    async getById(id) {
        const lesson = await prisma.lesson.findUnique({
            where: {
                id: Number(id)
            },
            include: {
                module: true
            }
        });

        if (!lesson) {
            throw new Error("Lesson not found.");
        }

        return lesson;
    }

    // ==========================================
    // GET LESSONS BY MODULE
    // ==========================================
    async getByModule(moduleId) {
        const module = await prisma.courseModule.findUnique({
            where: {
                id: Number(moduleId)
            }
        });

        if (!module) {
            throw new Error("Module not found.");
        }

        return await prisma.lesson.findMany({
            where: {
                moduleId: Number(moduleId),
                isShared: true,
            },
            include: {
                module: true
            },
            orderBy: {
                position: "asc"
            }
        });
    }

    // ==========================================
    // UPDATE LESSON (NO duration)
    // ==========================================
    async update(id, data) {
        const {
            title,
            description,
            videoUrl,
            videoType,
            attachment,
            position,
            isPreview
        } = data;

        const lesson = await prisma.lesson.findUnique({
            where: {
                id: Number(id)
            },
            include: {
                module: true
            }
        });

        if (!lesson) {
            throw new Error("Lesson not found.");
        }

        const updateData = {
            title: title || lesson.title,
            description: description !== undefined ? description : lesson.description,
            videoUrl: videoUrl !== undefined ? videoUrl : lesson.videoUrl,
            videoType: videoType || lesson.videoType,
            attachment: attachment !== undefined ? attachment : lesson.attachment,
            position: position !== undefined ? Number(position) : lesson.position,
            isPreview: isPreview !== undefined ? Boolean(isPreview) : lesson.isPreview,
        };

        // Update lesson slug if title changed
        if (title && title !== lesson.title) {
            const slug = slugify(title, { 
                lower: true, 
                strict: true,
                remove: /[*+~.()'"!:@]/g
            });
            updateData.lessonSlug = `${lesson.module.moduleSlug}-${slug}`;
        }

        return await prisma.lesson.update({
            where: {
                id: Number(id)
            },
            data: updateData,
            include: {
                module: true
            }
        });
    }

    // ==========================================
    // DELETE LESSON
    // ==========================================
    async delete(id) {
        const lesson = await prisma.lesson.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!lesson) {
            throw new Error("Lesson not found.");
        }

        await prisma.lesson.delete({
            where: {
                id: Number(id)
            }
        });

        return {
            success: true,
            message: "Lesson deleted successfully."
        };
    }

    // ==========================================
    // REORDER LESSONS
    // ==========================================
    async reorderLessons(moduleId, lessonIds) {
        const module = await prisma.courseModule.findUnique({
            where: {
                id: Number(moduleId)
            }
        });

        if (!module) {
            throw new Error("Module not found.");
        }

        // Update each lesson's position
        for (let i = 0; i < lessonIds.length; i++) {
            await prisma.lesson.update({
                where: {
                    id: Number(lessonIds[i])
                },
                data: {
                    position: i + 1
                }
            });
        }

        return {
            success: true,
            message: "Lessons reordered successfully."
        };
    }
}

module.exports = new LessonService();