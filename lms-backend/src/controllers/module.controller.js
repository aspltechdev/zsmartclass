// src/controllers/module.controller.js
const moduleService = require("../services/module.service");
const prisma = require("../config/prisma");

// ==========================================
// CREATE MODULE
// ==========================================
exports.create = async (req, res) => {
    try {
        const result = await moduleService.create(req.body);
        res.status(201).json({
            success: true,
            data: result,
            message: "Module created successfully."
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// GET ALL MODULES
// ==========================================
exports.getAll = async (req, res) => {
    try {
        const result = await moduleService.getAll();
        res.json({
            success: true,
            data: result
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// GET MODULE BY ID
// ==========================================
exports.getById = async (req, res) => {
    try {
        const result = await moduleService.getById(req.params.id);
        res.json({
            success: true,
            data: result
        });
    } catch (err) {
        res.status(404).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// UPDATE MODULE
// ==========================================
exports.update = async (req, res) => {
    try {
        const result = await moduleService.update(req.params.id, req.body);
        res.json({
            success: true,
            data: result,
            message: "Module updated successfully."
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// DELETE MODULE
// ==========================================
exports.delete = async (req, res) => {
    try {
        const result = await moduleService.delete(req.params.id);
        res.json(result);
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// GET MODULE STATS
// ==========================================
exports.getStats = async (req, res) => {
    try {
        const result = await moduleService.getStats();
        res.json({
            success: true,
            data: result
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// ADD MODULE TO COURSE - WITHOUT DURATION
// ==========================================
exports.addModuleToCourse = async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;
        
        console.log(`📚 Adding module ${moduleId} to course ${courseId}`);

        // Check if course exists
        const course = await prisma.course.findUnique({
            where: { id: Number(courseId) }
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // Check if module exists with lessons
        const moduleToCopy = await prisma.courseModule.findUnique({
            where: { id: Number(moduleId) },
            include: { 
                lessons: {
                    orderBy: { position: "asc" }
                }
            }
        });

        if (!moduleToCopy) {
            return res.status(404).json({
                success: false,
                message: "Module not found"
            });
        }

        console.log(`📦 Found module: ${moduleToCopy.title} with ${moduleToCopy.lessons?.length || 0} lessons`);

        // Check if module already exists in this course
        const existing = await prisma.courseModule.findFirst({
            where: {
                courseId: Number(courseId),
                title: moduleToCopy.title
            }
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Module already added to this course"
            });
        }

        // Get max position for this course
        const maxPosition = await prisma.courseModule.aggregate({
            where: {
                courseId: Number(courseId)
            },
            _max: {
                position: true
            }
        });

        const newPosition = (maxPosition._max.position || 0) + 1;

        // Generate a unique slug for the course reference
        const uniqueSlug = `${moduleToCopy.moduleSlug}-${Date.now()}-${courseId}`;

        // Create a reference to the module in the course
        const courseModule = await prisma.courseModule.create({
            data: {
                title: moduleToCopy.title,
                description: moduleToCopy.description || "",
                position: newPosition,
                courseId: Number(courseId),
                moduleSlug: uniqueSlug,
                isShared: false,
                isPublished: true,
                category: moduleToCopy.category || "",
                tags: moduleToCopy.tags || [],
                thumbnail: moduleToCopy.thumbnail || "",
            }
        });

        console.log(`✅ Created course module with ID: ${courseModule.id}`);

        // ─── COPY LESSONS - NO DURATION ──────────────────────────────
        if (moduleToCopy.lessons && moduleToCopy.lessons.length > 0) {
            console.log(`📚 Copying ${moduleToCopy.lessons.length} lessons...`);
            
            for (const lesson of moduleToCopy.lessons) {
                console.log(`  📝 Creating lesson: ${lesson.title}`);
                
                // ─── NO duration field ──────────────────────────────────
                const lessonData = {
                    title: lesson.title || "Untitled Lesson",
                    description: lesson.description || "",
                    videoUrl: lesson.videoUrl || "",
                    position: typeof lesson.position === 'number' ? lesson.position : 0,
                    moduleId: courseModule.id,
                    attachment: lesson.attachment || "",
                    isPreview: lesson.isPreview || false,
                    videoType: lesson.videoType || "VIDEO",
                    lessonSlug: `${uniqueSlug}-${lesson.lessonSlug || lesson.id || Date.now()}`,
                    isShared: false,
                };

                console.log('📤 Lesson data:', JSON.stringify(lessonData, null, 2));

                const createdLesson = await prisma.lesson.create({
                    data: lessonData,
                });
                
                console.log(`  ✅ Created lesson: ${createdLesson.title} (ID: ${createdLesson.id})`);
            }
            console.log(`✅ Copied ${moduleToCopy.lessons.length} lessons`);
        } else {
            console.log(`ℹ️ No lessons to copy`);
        }

        // Fetch the updated course with lessons
        const updatedCourse = await prisma.course.findUnique({
            where: { id: Number(courseId) },
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

        console.log(`✅ Course has ${updatedCourse.modules.length} modules`);

        res.status(201).json({
            success: true,
            data: updatedCourse,
            message: "Module added to course successfully"
        });
    } catch (err) {
        console.error("❌ Error adding module to course:", err);
        console.error("❌ Error details:", err.message);
        console.error("❌ Error stack:", err.stack);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// REMOVE MODULE FROM COURSE
// ==========================================
exports.removeModuleFromCourse = async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;

        // Find the course module reference
        let targetModule = await prisma.courseModule.findFirst({
            where: {
                courseId: Number(courseId),
                id: Number(moduleId)
            }
        });

        // If not found by id, try by moduleSlug
        if (!targetModule) {
            const sourceModule = await prisma.courseModule.findUnique({
                where: { id: Number(moduleId) }
            });
            
            if (sourceModule && sourceModule.moduleSlug) {
                targetModule = await prisma.courseModule.findFirst({
                    where: {
                        courseId: Number(courseId),
                        moduleSlug: {
                            startsWith: sourceModule.moduleSlug
                        }
                    }
                });
            }
        }

        // If still not found, try by title
        if (!targetModule) {
            const sourceModule = await prisma.courseModule.findUnique({
                where: { id: Number(moduleId) }
            });
            
            if (sourceModule) {
                targetModule = await prisma.courseModule.findFirst({
                    where: {
                        courseId: Number(courseId),
                        title: sourceModule.title
                    }
                });
            }
        }

        if (!targetModule) {
            return res.status(404).json({
                success: false,
                message: "Module not found in this course"
            });
        }

        // Delete all lessons in this course module
        await prisma.lesson.deleteMany({
            where: {
                moduleId: targetModule.id
            }
        });

        // Delete the course module reference
        await prisma.courseModule.delete({
            where: {
                id: targetModule.id
            }
        });

        // Reorder remaining modules
        const remainingModules = await prisma.courseModule.findMany({
            where: {
                courseId: Number(courseId)
            },
            orderBy: {
                position: "asc"
            }
        });

        for (let i = 0; i < remainingModules.length; i++) {
            await prisma.courseModule.update({
                where: { id: remainingModules[i].id },
                data: { position: i + 1 }
            });
        }

        // Fetch updated course with lessons
        const updatedCourse = await prisma.course.findUnique({
            where: { id: Number(courseId) },
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

        res.json({
            success: true,
            data: updatedCourse,
            message: "Module removed from course successfully"
        });
    } catch (err) {
        console.error("Error removing module from course:", err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};