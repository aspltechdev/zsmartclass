// src/services/course.service.js
const prisma = require("../config/prisma");
const slugify = require("slugify");

class CourseService {

    // ==========================================
    // CREATE COURSE
    // ==========================================
    async create(data) {
        const {
            title,
            subtitle,
            description,
            thumbnail,
            trailer,
            language,
            level,
            requirements,
            outcomes,
            audience,
            categoryId,
            createdById,
            isFeatured,
            isPublished,
            status
        } = data;

        if (!title) {
            throw new Error("Course title is required.");
        }

        const category = await prisma.category.findUnique({
            where: { id: Number(categoryId) }
        });

        if (!category) {
            throw new Error("Category not found.");
        }

        const instructor = await prisma.user.findUnique({
            where: { id: Number(createdById) }
        });

        if (!instructor) {
            throw new Error("Instructor not found.");
        }

        const slug = slugify(title, {
            lower: true,
            strict: true
        });

        const exists = await prisma.course.findUnique({
            where: { slug }
        });

        if (exists) {
            throw new Error("Course already exists.");
        }

        const courseData = {
            title,
            slug,
            subtitle: subtitle || null,
            description: description || null,
            thumbnail: thumbnail || null,
            trailer: trailer || null,
            language: language || "English",
            level: level || "BEGINNER",
            requirements: requirements || null,
            outcomes: outcomes || null,
            audience: audience || null,
            isFeatured: isFeatured || false,
            isPublished: isPublished || false,
            status: status || "DRAFT",
            category: {
                connect: { id: Number(categoryId) }
            },
            createdBy: {
                connect: { id: Number(createdById) }
            }
        };

        const course = await prisma.course.create({
            data: courseData,
            include: {
                category: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }
            }
        });

        return course;
    }

    // ==========================================
    // GET ALL COURSES
    // ==========================================
    async getAll() {
        return await prisma.course.findMany({
            include: {
                category: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        enrollments: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });
    }

    // ==========================================
    // GET COURSE BY ID
    // ==========================================
    async getById(id) {
        const course = await prisma.course.findUnique({
            where: { id: Number(id) },
            include: {
                category: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        enrollments: true
                    }
                }
            }
        });

        if (!course) {
            throw new Error("Course not found.");
        }

        // Modules linked to this course via the join table (shared, not copied).
        // Built from the same helper as attach/detach so the shape is identical.
        const modules = await this._courseModules(Number(id));
        return { ...course, modules };
    }

    // ==========================================
    // MODULE ATTACHMENT HELPERS (many-to-many)
    // ==========================================

    /**
     * Modules linked to a course, in this course's order, each with a lesson
     * count. Reads through CourseModuleAssignment so a single module can belong
     * to many courses without being duplicated.
     */
    async _courseModules(courseId) {
        const cId = Number(courseId);

        // Read link rows using ONLY column names (courseId/moduleId/position),
        // never relation navigation — those names depend on how `prisma db pull`
        // introspected the table and can differ, which would break the query.
        const assignments = await prisma.courseModuleAssignment.findMany({
            where: { courseId: cId },
            orderBy: { position: "asc" },
            select: { id: true, moduleId: true, position: true }
        });

        if (assignments.length === 0) return [];

        const moduleIds = assignments.map((a) => a.moduleId);

        const modules = await prisma.courseModule.findMany({
            where: { id: { in: moduleIds } },
            include: { _count: { select: { lessons: true } } }
        });
        const moduleById = new Map(modules.map((m) => [m.id, m]));

        // Preserve this course's ordering from the link rows.
        return assignments
            .map((a) => {
                const m = moduleById.get(a.moduleId);
                if (!m) return null;
                return { ...m, position: a.position, assignmentId: a.id };
            })
            .filter(Boolean);
    }

    /** Ensure a course exists or throw a 404. Returns the course id as Number. */
    async _requireCourse(courseId) {
        const id = Number(courseId);
        const course = await prisma.course.findUnique({
            where: { id },
            select: { id: true }
        });
        if (!course) {
            const error = new Error("Course not found.");
            error.statusCode = 404;
            throw error;
        }
        return id;
    }

    // ==========================================
    // GET MODULES AVAILABLE TO ATTACH
    // Any module NOT already linked to THIS course (it may be used by others).
    // ==========================================
    async getAvailableModules(courseId) {
        const cId = await this._requireCourse(courseId);

        // Module ids already linked to THIS course (scalar-only query).
        const linked = await prisma.courseModuleAssignment.findMany({
            where: { courseId: cId },
            select: { moduleId: true }
        });
        const linkedIds = linked.map((l) => l.moduleId);

        // Every other module is available — even if it's used by other courses.
        return await prisma.courseModule.findMany({
            where: linkedIds.length ? { id: { notIn: linkedIds } } : {},
            orderBy: { createdAt: "desc" },
            include: {
                _count: { select: { lessons: true } }
            }
        });
    }

    // ==========================================
    // ATTACH EXISTING MODULE(S) TO A COURSE
    // Creates link rows — the module/lessons are shared, never copied.
    // ==========================================
    async attachModules(courseId, moduleInput) {
        const cId = await this._requireCourse(courseId);

        const ids = (Array.isArray(moduleInput) ? moduleInput : [moduleInput])
            .map(Number)
            .filter((n) => Number.isInteger(n));

        if (ids.length === 0) {
            const error = new Error("At least one valid moduleId is required.");
            error.statusCode = 400;
            throw error;
        }

        const modules = await prisma.courseModule.findMany({
            where: { id: { in: ids } },
            select: { id: true }
        });

        if (modules.length !== ids.length) {
            const found = new Set(modules.map((m) => m.id));
            const missing = ids.filter((i) => !found.has(i));
            const error = new Error(`Module(s) not found: ${missing.join(", ")}`);
            error.statusCode = 404;
            throw error;
        }

        // Skip modules already linked to THIS course (idempotent). A module
        // linked to OTHER courses is fine — that's the whole point of sharing.
        const existing = await prisma.courseModuleAssignment.findMany({
            where: { courseId: cId, moduleId: { in: ids } },
            select: { moduleId: true }
        });
        const alreadyLinked = new Set(existing.map((e) => e.moduleId));
        const toAttach = ids.filter((id) => !alreadyLinked.has(id));

        if (toAttach.length > 0) {
            const agg = await prisma.courseModuleAssignment.aggregate({
                where: { courseId: cId },
                _max: { position: true }
            });
            let nextPosition = (agg._max.position ?? -1) + 1;

            await prisma.$transaction(
                toAttach.map((moduleId) =>
                    prisma.courseModuleAssignment.create({
                        data: { courseId: cId, moduleId, position: nextPosition++ }
                    })
                )
            );
        }

        return await this._courseModules(cId);
    }

    // ==========================================
    // DETACH A MODULE FROM A COURSE
    // Removes only the link for THIS course — the module stays in the library
    // and remains linked to any other courses using it.
    // ==========================================
    async detachModule(courseId, moduleId) {
        const cId = await this._requireCourse(courseId);
        const mId = Number(moduleId);

        // Use scalar where + deleteMany so we don't depend on the compound
        // unique accessor name that db pull may or may not have generated.
        const existing = await prisma.courseModuleAssignment.findFirst({
            where: { courseId: cId, moduleId: mId },
            select: { id: true }
        });

        if (!existing) {
            const error = new Error("This module is not linked to this course.");
            error.statusCode = 400;
            throw error;
        }

        await prisma.courseModuleAssignment.deleteMany({
            where: { courseId: cId, moduleId: mId }
        });

        return await this._courseModules(cId);
    }

    // ==========================================
    // UPDATE COURSE
    // ==========================================
    async update(id, data) {
        try {
            const existingCourse = await prisma.course.findUnique({
                where: { id: Number(id) }
            });

            if (!existingCourse) {
                throw new Error("Course not found.");
            }

            const updateData = {};

            if (data.title !== undefined && data.title !== null) {
                updateData.title = data.title.trim();
                updateData.slug = slugify(data.title.trim(), {
                    lower: true,
                    strict: true
                });
            }

            if (data.subtitle !== undefined) {
                updateData.subtitle = data.subtitle || null;
            }

            if (data.description !== undefined) {
                updateData.description = data.description || null;
            }

            if (data.thumbnail !== undefined) {
                updateData.thumbnail = data.thumbnail || null;
            }

            if (data.trailer !== undefined) {
                updateData.trailer = data.trailer || null;
            }

            if (data.language !== undefined) {
                updateData.language = data.language || "English";
            }

            if (data.level !== undefined) {
                updateData.level = data.level || "BEGINNER";
            }

            if (data.requirements !== undefined) {
                updateData.requirements = data.requirements || null;
            }

            if (data.outcomes !== undefined) {
                updateData.outcomes = data.outcomes || null;
            }

            if (data.audience !== undefined) {
                updateData.audience = data.audience || null;
            }

            if (data.isFeatured !== undefined) {
                updateData.isFeatured = data.isFeatured === true || data.isFeatured === "true";
            }

            if (data.isPublished !== undefined) {
                updateData.isPublished = data.isPublished === true || data.isPublished === "true";
                updateData.status = updateData.isPublished ? "PUBLISHED" : "DRAFT";
            }

            if (data.status !== undefined) {
                updateData.status = data.status;
            }

            if (data.categoryId !== undefined && data.categoryId !== null && data.categoryId !== "") {
                const category = await prisma.category.findUnique({
                    where: { id: Number(data.categoryId) }
                });
                if (!category) {
                    throw new Error("Category not found.");
                }
                updateData.category = {
                    connect: { id: Number(data.categoryId) }
                };
            }

            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                    delete updateData[key];
                }
            });

            if (Object.keys(updateData).length === 0) {
                return existingCourse;
            }

            const updatedCourse = await prisma.course.update({
                where: { id: Number(id) },
                data: updateData,
                include: {
                    category: true,
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            });

            return updatedCourse;
        } catch (error) {
            console.error("Update error:", error);
            throw error;
        }
    }

    // ==========================================
    // DELETE COURSE
    // ==========================================
    async delete(id) {
        const course = await prisma.course.findUnique({
            where: { id: Number(id) },
            include: {
                enrollments: true,
                payments: true,
                certificates: true,
                reviews: true,
            }
        });

        if (!course) {
            throw new Error("Course not found.");
        }

        const relatedRecords = [];

        if (course.enrollments.length > 0) {
            relatedRecords.push(`${course.enrollments.length} enrollment(s)`);
        }

        if (course.payments.length > 0) {
            relatedRecords.push(`${course.payments.length} payment(s)`);
        }

        if (course.certificates.length > 0) {
            relatedRecords.push(`${course.certificates.length} certificate(s)`);
        }

        if (course.reviews.length > 0) {
            relatedRecords.push(`${course.reviews.length} review(s)`);
        }

        if (relatedRecords.length > 0) {
            const errorMessage = 
                `Cannot delete course "${course.title}" because it has the following related records:\n\n` +
                relatedRecords.map((item, index) => `  ${index + 1}. ${item}`).join('\n') +
                `\n\nPlease delete these related records first.`;
            
            const error = new Error(errorMessage);
            error.statusCode = 400;
            error.relatedRecords = relatedRecords;
            throw error;
        }

        try {
            await prisma.course.delete({
                where: { id: Number(id) }
            });

            return {
                success: true,
                message: `Course "${course.title}" deleted successfully.`
            };
        } catch (error) {
            console.error("Delete error:", error);
            if (error.code === 'P2003') {
                throw new Error(
                    "Cannot delete course due to foreign key constraints. " +
                    "Please delete all related records first."
                );
            }
            throw error;
        }
    }

    // ==========================================
    // TOGGLE COURSE STATUS
    // ==========================================
    async toggleStatus(id) {
        const course = await prisma.course.findUnique({
            where: { id: Number(id) }
        });

        if (!course) {
            throw new Error("Course not found.");
        }

        const newStatus = course.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

        return await prisma.course.update({
            where: { id: Number(id) },
            data: {
                status: newStatus,
                isPublished: newStatus === "PUBLISHED"
            },
            include: {
                category: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
    }

    // ==========================================
    // TOGGLE FEATURED
    // ==========================================
    async toggleFeatured(id) {
        const course = await prisma.course.findUnique({
            where: { id: Number(id) }
        });

        if (!course) {
            throw new Error("Course not found.");
        }

        return await prisma.course.update({
            where: { id: Number(id) },
            data: {
                isFeatured: !course.isFeatured
            },
            include: {
                category: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
    }

    // ==========================================
    // GET COURSE STATS
    // ==========================================
    async getStats() {
        const [total, published, draft, archived, featured] = await Promise.all([
            prisma.course.count(),
            prisma.course.count({ where: { status: "PUBLISHED" } }),
            prisma.course.count({ where: { status: "DRAFT" } }),
            prisma.course.count({ where: { status: "ARCHIVED" } }),
            prisma.course.count({ where: { isFeatured: true } })
        ]);

        const enrollments = await prisma.enrollment.count();

        return {
            total,
            published,
            draft,
            archived,
            featured,
            enrollments
        };
    }
}

module.exports = new CourseService();