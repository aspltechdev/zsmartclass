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
            duration,
            price,
            discountPrice,
            requirements,
            outcomes,
            audience,
            categoryId,
            createdById,
            isFeatured,
            isFree,
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
            duration: Number(duration) || 0,
            price: Number(price) || 0,
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

        if (discountPrice !== undefined && discountPrice !== null && discountPrice !== "") {
            const discountValue = Number(discountPrice);
            if (!isNaN(discountValue) && discountValue > 0) {
                courseData.discountPrice = discountValue;
            }
        }

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
    // GET ALL COURSES - WITH LESSONS
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
                modules: {
                    include: {
                        lessons: {
                            orderBy: { position: "asc" }
                        }
                    },
                    orderBy: { position: "asc" }
                },
                _count: {
                    select: {
                        enrollments: true,
                        modules: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });
    }

    // ==========================================
    // GET COURSE BY ID - WITH LESSONS
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
                modules: {
                    include: {
                        lessons: {
                            orderBy: { position: "asc" }
                        }
                    },
                    orderBy: { position: "asc" }
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

        return course;
    }

    // ==========================================
    // UPDATE COURSE
    // ==========================================
    async update(id, data) {
        try {
            console.log("🔍 Update called with ID:", id);

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

            if (data.duration !== undefined) {
                updateData.duration = Number(data.duration) || 0;
            }

            if (data.price !== undefined) {
                updateData.price = Number(data.price) || 0;
            }

            if (data.discountPrice !== undefined) {
                if (data.discountPrice === "" || 
                    data.discountPrice === null || 
                    data.discountPrice === undefined || 
                    data.discountPrice === "0" ||
                    Number(data.discountPrice) === 0) {
                    updateData.discountPrice = null;
                } else {
                    const discountValue = Number(data.discountPrice);
                    if (!isNaN(discountValue) && discountValue > 0) {
                        updateData.discountPrice = discountValue;
                    } else {
                        updateData.discountPrice = null;
                    }
                }
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
                    },
                    modules: {
                        include: {
                            lessons: {
                                orderBy: { position: "asc" }
                            }
                        },
                        orderBy: { position: "asc" }
                    }
                }
            });

            return updatedCourse;
        } catch (error) {
            console.error("❌ Update error:", error);
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
                modules: true,
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

        if (course.modules.length > 0) {
            relatedRecords.push(`${course.modules.length} module(s)`);
        }

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
                },
                modules: {
                    include: {
                        lessons: {
                            orderBy: { position: "asc" }
                        }
                    },
                    orderBy: { position: "asc" }
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
                },
                modules: {
                    include: {
                        lessons: {
                            orderBy: { position: "asc" }
                        }
                    },
                    orderBy: { position: "asc" }
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

    // ==========================================
    // FORCE DELETE COURSE - WITH CASCADE
    // ==========================================
    async forceDelete(id) {
        const course = await prisma.course.findUnique({
            where: { id: Number(id) }
        });

        if (!course) {
            throw new Error("Course not found.");
        }

        try {
            await prisma.$transaction([
                prisma.courseModule.deleteMany({
                    where: { courseId: Number(id) }
                }),
                prisma.enrollment.deleteMany({
                    where: { courseId: Number(id) }
                }),
                prisma.payment.deleteMany({
                    where: { courseId: Number(id) }
                }),
                prisma.certificate.deleteMany({
                    where: { courseId: Number(id) }
                }),
                prisma.review.deleteMany({
                    where: { courseId: Number(id) }
                }),
                prisma.course.delete({
                    where: { id: Number(id) }
                })
            ]);

            return {
                success: true,
                message: `Course "${course.title}" and all related data deleted successfully.`
            };
        } catch (error) {
            console.error("Force delete error:", error);
            throw new Error("Failed to delete course: " + error.message);
        }
    }
}

module.exports = new CourseService();