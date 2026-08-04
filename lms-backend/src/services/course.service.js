// src/services/course.service.js
const prisma = require("../config/prisma");
const slugify = require("slugify");

class CourseService {

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

        // Build clean data object
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

        // Only add discountPrice if it's a valid number > 0
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
                        lessons: true
                    }
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

    async update(id, data) {
        try {
            console.log("🔍 Update called with ID:", id);
            console.log("📥 Incoming data:", JSON.stringify(data, null, 2));

            // First check if course exists
            const existingCourse = await prisma.course.findUnique({
                where: { id: Number(id) }
            });

            if (!existingCourse) {
                throw new Error("Course not found.");
            }

            // Build update data - ONLY fields that exist in your schema
            const updateData = {};

            // REQUIRED: Always include these if they're provided
            if (data.title !== undefined && data.title !== null) {
                updateData.title = data.title.trim();
                updateData.slug = slugify(data.title.trim(), {
                    lower: true,
                    strict: true
                });
            }

            // Optional string fields
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

            // Number fields - REQUIRED
            if (data.duration !== undefined) {
                updateData.duration = Number(data.duration) || 0;
            }

            if (data.price !== undefined) {
                updateData.price = Number(data.price) || 0;
            }

            // Handle discountPrice - if not provided, keep existing
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

            // Boolean fields
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

            // Handle categoryId - REQUIRED if provided
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

            // CRITICAL: If price is missing, use existing price
            if (data.price === undefined && data.price === null) {
                // Don't update price, keep existing
            }

            // CRITICAL: If categoryId is missing, use existing category
            if (data.categoryId === undefined || data.categoryId === null || data.categoryId === "") {
                // Don't update category, keep existing
            }

            // Remove any undefined values
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                    delete updateData[key];
                }
            });

            // If no fields to update, return existing course
            if (Object.keys(updateData).length === 0) {
                console.log("⚠️ No fields to update, returning existing course");
                return existingCourse;
            }

            console.log("📤 Final update data being sent:", JSON.stringify(updateData, null, 2));

            // Perform the update
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

            console.log("✅ Course updated successfully!");
            return updatedCourse;

        } catch (error) {
            console.error("❌ Update error:", error);
            throw error;
        }
    }

    async delete(id) {
        const course = await prisma.course.findUnique({
            where: { id: Number(id) }
        });

        if (!course) {
            throw new Error("Course not found.");
        }

        await prisma.course.delete({
            where: { id: Number(id) }
        });

        return {
            success: true,
            message: "Course deleted successfully."
        };
    }
}

module.exports = new CourseService();