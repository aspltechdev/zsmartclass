// lms-backend/src/services/course.service.js

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

        return await prisma.course.create({
            data: {
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
            },
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

        const modules = await this._courseModules(Number(id));

        return {
            ...course,
            modules
        };
    }

    // ==========================================
    // GET MODULES LINKED TO A COURSE
    // ==========================================
    async _courseModules(courseId) {
        const cId = Number(courseId);

        const assignments = await prisma.courseModuleAssignment.findMany({
            where: { courseId: cId },
            orderBy: { position: "asc" },
            select: {
                id: true,
                moduleId: true,
                position: true
            }
        });

        if (assignments.length === 0) {
            return [];
        }

        const moduleIds = assignments.map((item) => item.moduleId);

        const modules = await prisma.courseModule.findMany({
            where: {
                id: { in: moduleIds }
            },
            include: {
                _count: {
                    select: {
                        lessons: true
                    }
                }
            }
        });

        const moduleById = new Map(
            modules.map((module) => [module.id, module])
        );

        return assignments
            .map((assignment) => {
                const module = moduleById.get(assignment.moduleId);

                if (!module) {
                    return null;
                }

                return {
                    ...module,
                    position: assignment.position,
                    assignmentId: assignment.id
                };
            })
            .filter(Boolean);
    }

    // ==========================================
    // ENSURE COURSE EXISTS
    // ==========================================
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
    // ==========================================
    async getAvailableModules(courseId) {
        const cId = await this._requireCourse(courseId);

        const linked = await prisma.courseModuleAssignment.findMany({
            where: { courseId: cId },
            select: { moduleId: true }
        });

        const linkedIds = linked.map((item) => item.moduleId);

        return await prisma.courseModule.findMany({
            where: linkedIds.length
                ? {
                    id: { notIn: linkedIds }
                }
                : {},
            orderBy: {
                createdAt: "desc"
            },
            include: {
                _count: {
                    select: {
                        lessons: true
                    }
                }
            }
        });
    }

    // ==========================================
    // ATTACH EXISTING MODULES
    // ==========================================
    async attachModules(courseId, moduleInput) {
        const cId = await this._requireCourse(courseId);

        const ids = (
            Array.isArray(moduleInput) ? moduleInput : [moduleInput]
        )
            .map(Number)
            .filter((number) => Number.isInteger(number));

        if (ids.length === 0) {
            const error = new Error(
                "At least one valid moduleId is required."
            );
            error.statusCode = 400;
            throw error;
        }

        const modules = await prisma.courseModule.findMany({
            where: {
                id: { in: ids }
            },
            select: {
                id: true
            }
        });

        if (modules.length !== ids.length) {
            const found = new Set(modules.map((module) => module.id));
            const missing = ids.filter((id) => !found.has(id));

            const error = new Error(
                `Module(s) not found: ${missing.join(", ")}`
            );
            error.statusCode = 404;
            throw error;
        }

        const existing = await prisma.courseModuleAssignment.findMany({
            where: {
                courseId: cId,
                moduleId: { in: ids }
            },
            select: {
                moduleId: true
            }
        });

        const alreadyLinked = new Set(
            existing.map((item) => item.moduleId)
        );

        const toAttach = ids.filter((id) => !alreadyLinked.has(id));

        if (toAttach.length > 0) {
            const aggregate = await prisma.courseModuleAssignment.aggregate({
                where: {
                    courseId: cId
                },
                _max: {
                    position: true
                }
            });

            let nextPosition = (aggregate._max.position ?? -1) + 1;

            await prisma.$transaction(
                toAttach.map((moduleId) =>
                    prisma.courseModuleAssignment.create({
                        data: {
                            courseId: cId,
                            moduleId,
                            position: nextPosition++
                        }
                    })
                )
            );
        }

        return await this._courseModules(cId);
    }

    // ==========================================
    // DETACH MODULE FROM COURSE
    // ==========================================
    async detachModule(courseId, moduleId) {
        const cId = await this._requireCourse(courseId);
        const mId = Number(moduleId);

        const existing = await prisma.courseModuleAssignment.findFirst({
            where: {
                courseId: cId,
                moduleId: mId
            },
            select: {
                id: true
            }
        });

        if (!existing) {
            const error = new Error(
                "This module is not linked to this course."
            );
            error.statusCode = 400;
            throw error;
        }

        await prisma.courseModuleAssignment.deleteMany({
            where: {
                courseId: cId,
                moduleId: mId
            }
        });

        return await this._courseModules(cId);
    }

    // ==========================================
    // UPDATE COURSE
    // ==========================================
    async update(id, data) {
        try {
            const existingCourse = await prisma.course.findUnique({
                where: {
                    id: Number(id)
                }
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
                updateData.isFeatured =
                    data.isFeatured === true ||
                    data.isFeatured === "true";
            }

            if (data.isPublished !== undefined) {
                updateData.isPublished =
                    data.isPublished === true ||
                    data.isPublished === "true";

                updateData.status = updateData.isPublished
                    ? "PUBLISHED"
                    : "DRAFT";
            }

            if (data.status !== undefined) {
                updateData.status = data.status;
            }

            if (
                data.categoryId !== undefined &&
                data.categoryId !== null &&
                data.categoryId !== ""
            ) {
                const category = await prisma.category.findUnique({
                    where: {
                        id: Number(data.categoryId)
                    }
                });

                if (!category) {
                    throw new Error("Category not found.");
                }

                updateData.category = {
                    connect: {
                        id: Number(data.categoryId)
                    }
                };
            }

            Object.keys(updateData).forEach((key) => {
                if (updateData[key] === undefined) {
                    delete updateData[key];
                }
            });

            if (Object.keys(updateData).length === 0) {
                return existingCourse;
            }

            return await prisma.course.update({
                where: {
                    id: Number(id)
                },
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
        } catch (error) {
            console.error("Update error:", error);
            throw error;
        }
    }

    // ==========================================
    // DELETE COURSE
    // ==========================================
    async delete(id) {
        const courseId = Number(id);

        const createError = (message, statusCode) => {
            const error = new Error(message);
            error.statusCode = statusCode;
            return error;
        };

        if (!Number.isSafeInteger(courseId) || courseId <= 0) {
            throw createError("Invalid course ID.", 400);
        }

        try {
            return await prisma.$transaction(async (tx) => {
                const course = await tx.course.findUnique({
                    where: {
                        id: courseId
                    },
                    select: {
                        id: true,
                        title: true,
                        _count: {
                            select: {
                                enrollments: true,
                                payments: true,
                                certificates: true,
                                reviews: true
                            }
                        }
                    }
                });

                if (!course) {
                    throw createError("Course not found.", 404);
                }

                const assignments = await tx.assignment.findMany({
                    where: {
                        courseId
                    },
                    select: {
                        id: true
                    }
                });

                const quizzes = await tx.quiz.findMany({
                    where: {
                        courseId
                    },
                    select: {
                        id: true
                    }
                });

                const assignmentIds = assignments.map(
                    (assignment) => assignment.id
                );

                const quizIds = quizzes.map((quiz) => quiz.id);

                const submissionCount = assignmentIds.length
                    ? await tx.assignmentSubmission.count({
                        where: {
                            assignmentId: {
                                in: assignmentIds
                            }
                        }
                    })
                    : 0;

                const quizResultCount = quizIds.length
                    ? await tx.quizMark.count({
                        where: {
                            quizId: {
                                in: quizIds
                            }
                        }
                    })
                    : 0;

                const relatedRecords = [];

                for (const [name, count] of Object.entries(course._count)) {
                    if (count > 0) {
                        relatedRecords.push(`${count} ${name}`);
                    }
                }

                if (submissionCount > 0) {
                    relatedRecords.push(
                        `${submissionCount} assignment submission(s)`
                    );
                }

                if (quizResultCount > 0) {
                    relatedRecords.push(
                        `${quizResultCount} quiz result(s)`
                    );
                }

                if (relatedRecords.length > 0) {
                    throw createError(
                        `Cannot delete "${course.title}" because it has ` +
                        relatedRecords.join(", ") +
                        ". Archive the course to preserve these records.",
                        409
                    );
                }

                // Remove assignments after confirming no submissions exist.
                await tx.assignment.deleteMany({
                    where: {
                        courseId
                    }
                });

                // Questions and options cascade under the existing schema.
                await tx.quiz.deleteMany({
                    where: {
                        courseId
                    }
                });

                await tx.certificateTemplate.deleteMany({
                    where: {
                        courseId
                    }
                });

                // Remove links while preserving shared modules and lessons.
                await tx.courseModuleAssignment.deleteMany({
                    where: {
                        courseId
                    }
                });

                // Clear the older optional course link on modules.
                await tx.courseModule.updateMany({
                    where: {
                        courseId
                    },
                    data: {
                        courseId: null
                    }
                });

                await tx.course.delete({
                    where: {
                        id: courseId
                    }
                });

                return {
                    success: true,
                    message: `Course "${course.title}" deleted successfully.`
                };
            });
        } catch (error) {
            if (error.statusCode) {
                throw error;
            }

            console.error("Delete course error:", error);

            if (
                error.code === "P2003" ||
                /foreign key|violates.*constraint/i.test(error.message || "")
            ) {
                throw createError(
                    "This course still has linked records. " +
                    "Nothing was deleted. Refresh the page and check its related records.",
                    409
                );
            }

            throw createError(
                "Unable to delete the course. Please check the backend terminal for details.",
                500
            );
        }
    }

    // ==========================================
    // TOGGLE COURSE STATUS
    // ==========================================
    async toggleStatus(id) {
        const course = await prisma.course.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!course) {
            throw new Error("Course not found.");
        }

        const newStatus =
            course.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

        return await prisma.course.update({
            where: {
                id: Number(id)
            },
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
            where: {
                id: Number(id)
            }
        });

        if (!course) {
            throw new Error("Course not found.");
        }

        return await prisma.course.update({
            where: {
                id: Number(id)
            },
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
        const [total, published, draft, archived, featured] =
            await Promise.all([
                prisma.course.count(),
                prisma.course.count({
                    where: {
                        status: "PUBLISHED"
                    }
                }),
                prisma.course.count({
                    where: {
                        status: "DRAFT"
                    }
                }),
                prisma.course.count({
                    where: {
                        status: "ARCHIVED"
                    }
                }),
                prisma.course.count({
                    where: {
                        isFeatured: true
                    }
                })
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