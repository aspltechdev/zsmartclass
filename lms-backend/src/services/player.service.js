// src/services/player.service.js
const prisma = require("../config/prisma");
const AppError = require("../utils/appError");

class PlayerService {
  /**
   * Get full course player data including modules, lessons, and progress
   */
  async getCoursePlayer(userId, courseId) {
    // 1. Validate enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId,
        status: { in: ['active', 'completed'] }
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            instructorId: true,
            instructor: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            },
            price: true,
            level: true,
            category: true,
            duration: true,
            totalLessons: true,
            totalModules: true
          }
        }
      }
    });

    if (!enrollment) {
      // Check if course exists and has preview lessons
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          status: true,
          previewLessons: true
        }
      });

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      if (course.status !== 'published') {
        throw new AppError('Course is not available', 403);
      }

      // Return preview-only access
      return this.getPreviewPlayer(courseId);
    }

    const course = enrollment.course;

    // 2. Get all modules with lessons
    const modules = await prisma.module.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            duration: true,
            videoUrl: true,
            content: true,
            order: true,
            isPreview: true
          }
        }
      }
    });

    // 3. Get user progress
    const progress = await prisma.progress.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      include: {
        completedLessons: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    });

    const completedLessonIds = progress?.completedLessons?.map(cl => cl.lessonId) || [];
    const lastAccessedLessonId = progress?.lastAccessedLessonId;
    const overallProgress = 0;

    // 4. Build lesson tree with lock status and completion status
    const moduleTree = modules.map(module => {
      const lessons = module.lessons.map((lesson, index) => {
        const isCompleted = completedLessonIds.includes(lesson.id);
        
        const isLocked = this.isLessonLocked(
          module.lessons,
          index,
          completedLessonIds,
          lesson.isPreview
        );

        return {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          type: lesson.type,
          duration: lesson.duration,
          order: lesson.order,
          isCompleted,
          isLocked,
          isPreview: lesson.isPreview || false,
          isCurrent: lastAccessedLessonId === lesson.id
        };
      });

      const moduleCompletedLessons = lessons.filter(l => l.isCompleted).length;
      const moduleProgress = lessons.length > 0 
        ? Math.round((moduleCompletedLessons / lessons.length) * 100) 
        : 0;

      return {
        id: module.id,
        title: module.title,
        description: module.description,
        order: module.order,
        lessons,
        progress: moduleProgress,
        isCompleted: moduleCompletedLessons === lessons.length,
        totalLessons: lessons.length,
        completedLessons: moduleCompletedLessons
      };
    });

    // 5. Find continue learning lesson
    const continueLearning = this.findContinueLearning(
      moduleTree,
      lastAccessedLessonId,
      completedLessonIds
    );

    // 6. Calculate next lesson for auto-advance
    const nextLesson = this.findNextLesson(moduleTree, lastAccessedLessonId, completedLessonIds);

    // 7. Response shaping
    return {
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        instructor: course.instructor,
        level: course.level,
        category: course.category,
        duration: course.duration,
        totalLessons: course.totalLessons,
        totalModules: course.totalModules
      },
      enrollment: {
        id: enrollment.id,
        enrolledAt: enrollment.createdAt,
        status: enrollment.status,
        completedAt: enrollment.completedAt
      },
      modules: moduleTree,
      progress: {
        overall: overallProgress,
        completedLessons: completedLessonIds.length,
        totalLessons: course.totalLessons,
        lastAccessedLessonId,
        lastAccessedAt: progress?.lastAccessedAt
      },
      continueLearning,
      nextLesson,
      certificate: enrollment.certificate || null
    };
  }

  /**
   * Get preview-only player for non-enrolled users
   */
  async getPreviewPlayer(courseId) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        instructor: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        level: true,
        category: true,
        previewLessons: true
      }
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    const modules = await prisma.module.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            duration: true,
            order: true,
            isPreview: true
          }
        }
      }
    });

    const previewLessonIds = course.previewLessons || [];
    
    const moduleTree = modules.map(module => ({
      id: module.id,
      title: module.title,
      order: module.order,
      lessons: module.lessons.map(lesson => {
        const isPreviewLesson = previewLessonIds.includes(lesson.id);
        return {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          type: lesson.type,
          duration: lesson.duration,
          order: lesson.order,
          isPreview: isPreviewLesson,
          isLocked: !isPreviewLesson,
          isCompleted: false
        };
      })
    }));

    return {
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        instructor: course.instructor,
        level: course.level,
        category: course.category
      },
      modules: moduleTree,
      isPreview: true,
      totalPreviewLessons: previewLessonIds.length
    };
  }

  /**
   * Get single lesson with content
   */
  async getLesson(userId, courseId, lessonId) {
    // Verify enrollment or preview access
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId,
        status: { in: ['active', 'completed'] }
      }
    });

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            courseId: true,
            order: true
          }
        }
      }
    });

    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    // Check if lesson belongs to course
    if (lesson.module.courseId !== courseId) {
      throw new AppError('Lesson does not belong to this course', 400);
    }

    // Check access
    if (!enrollment && !lesson.isPreview) {
      throw new AppError('Please enroll to access this lesson', 403);
    }

    // If enrolled, check if lesson is locked
    let isLocked = false;
    if (enrollment) {
      const moduleLessons = await prisma.lesson.findMany({
        where: { moduleId: lesson.moduleId },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          isPreview: true
        }
      });

      const lessonIndex = moduleLessons.findIndex(l => l.id === lessonId);

      const progress = await prisma.progress.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        },
        include: {
          completedLessons: true
        }
      });

      const completedLessonIds = progress?.completedLessons?.map(cl => cl.lessonId) || [];
      
      isLocked = this.isLessonLocked(
        moduleLessons,
        lessonIndex,
        completedLessonIds,
        lesson.isPreview
      );

      if (isLocked) {
        throw new AppError('Please complete previous lessons first', 403);
      }

      // Update last accessed lesson
      await prisma.progress.upsert({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        },
        create: {
          userId,
          courseId,
          lastAccessedLessonId: lessonId,
          lastAccessedAt: new Date(),
          overallProgress: 0
        },
        update: {
          lastAccessedLessonId: lessonId,
          lastAccessedAt: new Date()
        }
      });
    }

    // Get previous and next lessons
    const { previousLesson, nextLesson } = await this.getAdjacentLessons(
      courseId,
      lesson.moduleId,
      lesson.order
    );

    // Check if completed
    let isCompleted = false;
    if (enrollment) {
      isCompleted = await this.isLessonCompleted(userId, courseId, lessonId);
    }

    return {
      lesson: {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        type: lesson.type,
        duration: lesson.duration,
        videoUrl: lesson.videoUrl,
        content: lesson.content,
        order: lesson.order,
        isPreview: lesson.isPreview,
        module: {
          id: lesson.module.id,
          title: lesson.module.title,
          order: lesson.module.order
        }
      },
      isCompleted,
      previousLesson,
      nextLesson,
      isEnrolled: !!enrollment
    };
  }

  /**
   * Mark lesson as completed
   */
  async markCompleted(userId, courseId, lessonId) {
    // Verify enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId,
        status: 'active'
      }
    });

    if (!enrollment) {
      throw new AppError('Not enrolled in this course', 403);
    }

    // Verify lesson exists and belongs to course
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          select: { courseId: true }
        }
      }
    });

    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    if (lesson.module.courseId !== courseId) {
      throw new AppError('Lesson does not belong to this course', 400);
    }

    // Check if already completed
    const existingCompleted = await prisma.completedLesson.findUnique({
      where: {
        progressId_lessonId: {
          progressId: `${userId}_${courseId}`,
          lessonId
        }
      }
    });

    if (existingCompleted) {
      const progress = await prisma.progress.findUnique({
        where: {
          userId_courseId: { userId, courseId }
        }
      });

      return {
        message: 'Lesson already completed',
        progress: progress?.overallProgress || 0,
        isAlreadyCompleted: true
      };
    }

    // Get or create progress
    let progress = await prisma.progress.findUnique({
      where: {
        userId_courseId: { userId, courseId }
      }
    });

    if (!progress) {
      progress = await prisma.progress.create({
        data: {
          userId,
          courseId,
          lastAccessedLessonId: lessonId,
          lastAccessedAt: new Date(),
          overallProgress: 0
        }
      });
    }

    // Create completed lesson record
    await prisma.completedLesson.create({
      data: {
        progressId: progress.id,
        lessonId,
        completedAt: new Date()
      }
    });

    // Update progress
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { totalLessons: true }
    });

    const completedCount = await prisma.completedLesson.count({
      where: { progressId: progress.id }
    });

    const overallProgress = Math.round(
      (completedCount / course.totalLessons) * 100
    );

    const updateData = {
      overallProgress,
      lastAccessedLessonId: lessonId,
      lastAccessedAt: new Date()
    };

    // Check if course is completed
    if (overallProgress === 100) {
      updateData.completedAt = new Date();

      // Update enrollment status
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      });
    }

    await prisma.progress.update({
      where: { id: progress.id },
      data: updateData
    });

    // Get next lesson
    const nextLesson = await this.findNextLessonForProgress(
      courseId,
      lessonId,
      userId
    );

    return {
      message: 'Lesson marked as completed',
      progress: {
        overall: overallProgress,
        completedLessons: completedCount,
        totalLessons: course.totalLessons
      },
      nextLesson,
      isCourseCompleted: overallProgress === 100,
      earnedCertificate: overallProgress === 100
    };
  }

  /**
   * Find continue learning lesson
   */
  async getContinueLearning(userId) {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        status: 'active'
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true
          }
        }
      }
    });

    const continueLearningData = [];

    for (const enrollment of enrollments) {
      const progress = await prisma.progress.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: enrollment.courseId
          }
        }
      });

      if (!progress || !progress.lastAccessedLessonId) continue;

      const lesson = await prisma.lesson.findUnique({
        where: { id: progress.lastAccessedLessonId },
        select: {
          id: true,
          title: true,
          duration: true,
          module: {
            select: {
              id: true,
              title: true,
              order: true
            }
          }
        }
      });

      if (lesson) {
        continueLearningData.push({
          course: {
            id: enrollment.course.id,
            title: enrollment.course.title,
            thumbnail: enrollment.course.thumbnail
          },
          lastLesson: {
            id: lesson.id,
            title: lesson.title,
            duration: lesson.duration,
            module: lesson.module
          },
          progress: progress.overallProgress,
          lastAccessedAt: progress.lastAccessedAt
        });
      }
    }

    // Sort by most recently accessed
    continueLearningData.sort((a, b) => 
      new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt)
    );

    return continueLearningData;
  }

  /**
   * Helper: Check if lesson is locked
   */
  isLessonLocked(moduleLessons, currentIndex, completedLessonIds, isPreview) {
    if (isPreview) return false;
    if (currentIndex === 0) return false;

    // Check if all previous lessons in module are completed
    for (let i = 0; i < currentIndex; i++) {
      const prevLesson = moduleLessons[i];
      if (prevLesson.isPreview) continue;
      
      if (!completedLessonIds.includes(prevLesson.id)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Helper: Find next lesson for progress
   */
  async findNextLessonForProgress(courseId, currentLessonId, userId) {
    const currentLesson = await prisma.lesson.findUnique({
      where: { id: currentLessonId },
      select: {
        moduleId: true,
        order: true
      }
    });

    if (!currentLesson) return null;

    // Try next lesson in same module
    const nextInModule = await prisma.lesson.findFirst({
      where: {
        moduleId: currentLesson.moduleId,
        order: { gt: currentLesson.order }
      },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        moduleId: true
      }
    });

    if (nextInModule) {
      return {
        id: nextInModule.id,
        title: nextInModule.title,
        moduleId: nextInModule.moduleId
      };
    }

    // Try first lesson of next module
    const currentModule = await prisma.module.findUnique({
      where: { id: currentLesson.moduleId },
      select: { order: true }
    });

    const nextModule = await prisma.module.findFirst({
      where: {
        courseId,
        order: { gt: currentModule.order }
      },
      orderBy: { order: 'asc' },
      select: { id: true }
    });

    if (nextModule) {
      const firstLesson = await prisma.lesson.findFirst({
        where: { moduleId: nextModule.id },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          moduleId: true
        }
      });

      if (firstLesson) {
        return {
          id: firstLesson.id,
          title: firstLesson.title,
          moduleId: firstLesson.moduleId
        };
      }
    }

    return null; // No next lesson (course completed)
  }

  /**
   * Helper: Get adjacent lessons
   */
  async getAdjacentLessons(courseId, moduleId, currentOrder) {
    const result = { previousLesson: null, nextLesson: null };

    // Previous lesson
    const prevLesson = await prisma.lesson.findFirst({
      where: {
        moduleId,
        order: currentOrder - 1
      },
      select: {
        id: true,
        title: true,
        moduleId: true
      }
    });

    if (prevLesson) {
      result.previousLesson = {
        id: prevLesson.id,
        title: prevLesson.title,
        moduleId: prevLesson.moduleId
      };
    } else {
      // Check previous module
      const currentModule = await prisma.module.findUnique({
        where: { id: moduleId },
        select: { order: true }
      });

      const prevModule = await prisma.module.findFirst({
        where: {
          courseId,
          order: currentModule.order - 1
        },
        select: { id: true }
      });

      if (prevModule) {
        const lastLesson = await prisma.lesson.findFirst({
          where: { moduleId: prevModule.id },
          orderBy: { order: 'desc' },
          select: {
            id: true,
            title: true,
            moduleId: true
          }
        });

        if (lastLesson) {
          result.previousLesson = {
            id: lastLesson.id,
            title: lastLesson.title,
            moduleId: lastLesson.moduleId
          };
        }
      }
    }

    // Next lesson
    const nextLesson = await prisma.lesson.findFirst({
      where: {
        moduleId,
        order: currentOrder + 1
      },
      select: {
        id: true,
        title: true,
        moduleId: true
      }
    });

    if (nextLesson) {
      result.nextLesson = {
        id: nextLesson.id,
        title: nextLesson.title,
        moduleId: nextLesson.moduleId
      };
    } else {
      // Check next module
      const currentModule = await prisma.module.findUnique({
        where: { id: moduleId },
        select: { order: true }
      });

      const nextModule = await prisma.module.findFirst({
        where: {
          courseId,
          order: currentModule.order + 1
        },
        select: { id: true }
      });

      if (nextModule) {
        const firstLesson = await prisma.lesson.findFirst({
          where: { moduleId: nextModule.id },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            moduleId: true
          }
        });

        if (firstLesson) {
          result.nextLesson = {
            id: firstLesson.id,
            title: firstLesson.title,
            moduleId: firstLesson.moduleId
          };
        }
      }
    }

    return result;
  }

  /**
   * Helper: Find continue learning lesson in module tree
   */
  findContinueLearning(moduleTree, lastAccessedLessonId, completedLessonIds) {
    if (!lastAccessedLessonId) {
      // Find first incomplete lesson
      for (const module of moduleTree) {
        for (const lesson of module.lessons) {
          if (!lesson.isCompleted && !lesson.isLocked) {
            return {
              lessonId: lesson.id,
              moduleId: module.id,
              title: lesson.title,
              moduleTitle: module.title
            };
          }
        }
      }
      return null;
    }

    // Find the last accessed lesson
    for (const module of moduleTree) {
      const lesson = module.lessons.find(l => l.id === lastAccessedLessonId);
      if (lesson) {
        return {
          lessonId: lesson.id,
          moduleId: module.id,
          title: lesson.title,
          moduleTitle: module.title
        };
      }
    }

    return null;
  }

  /**
   * Helper: Find next lesson for navigation
   */
  findNextLesson(moduleTree, lastAccessedLessonId, completedLessonIds) {
    if (!lastAccessedLessonId) return null;

    let foundCurrent = false;

    for (const module of moduleTree) {
      for (const lesson of module.lessons) {
        if (foundCurrent && !lesson.isLocked && !lesson.isCompleted) {
          return {
            lessonId: lesson.id,
            moduleId: module.id,
            title: lesson.title
          };
        }
        if (lesson.id === lastAccessedLessonId) {
          foundCurrent = true;
        }
      }
    }

    return null;
  }

  /**
   * Helper: Check if lesson is completed
   */
  async isLessonCompleted(userId, courseId, lessonId) {
    const progress = await prisma.progress.findUnique({
      where: {
        userId_courseId: { userId, courseId }
      },
      include: {
        completedLessons: {
          where: { lessonId }
        }
      }
    });

    return progress?.completedLessons?.length > 0 || false;
  }

  /**
   * Get course progress statistics
   */
  async getCourseProgress(userId, courseId) {
    const progress = await prisma.progress.findUnique({
      where: {
        userId_courseId: { userId, courseId }
      },
      include: {
        completedLessons: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                duration: true
              }
            }
          }
        }
      }
    });

    if (!progress) {
      return {
        overall: 0,
        completedLessons: 0,
        totalLessons: 0,
        lastAccessedAt: null,
        startedAt: null
      };
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { totalLessons: true }
    });

    return {
      overall: progress.overallProgress,
      completedLessons: progress.completedLessons.length,
      totalLessons: course.totalLessons,
      completedLessonsList: progress.completedLessons.map(cl => ({
        id: cl.lesson.id,
        title: cl.lesson.title,
        duration: cl.lesson.duration,
        completedAt: cl.completedAt
      })),
      lastAccessedLessonId: progress.lastAccessedLessonId,
      lastAccessedAt: progress.lastAccessedAt,
      startedAt: progress.createdAt,
      completedAt: progress.completedAt
    };
  }

  /* =======================================================
     SAVE WATCH TIME
     Called by the student CoursePlayer every few seconds.
     Uses LessonProgress + Enrollment (the models that exist);
     a lesson counts as completed at >= 90% watched.
  ======================================================= */
  async saveWatchTime(userId, lessonId, payload = {}) {

    const studentId = Number(userId);
    const lId = Number(lessonId);

    const watchedSeconds = Math.max(0, Math.floor(Number(payload.watchedSeconds) || 0));
    const durationSeconds = Math.max(0, Math.floor(Number(payload.durationSeconds) || 0));
    const lastPosition = Math.max(0, Math.floor(Number(payload.lastPosition) || 0));

    const lesson = await prisma.lesson.findUnique({
      where: { id: lId },
      select: { id: true, moduleId: true }
    });

    if (!lesson) {
      const err = new Error("Lesson not found.");
      err.statusCode = 404;
      throw err;
    }

    /*
     * Treat a lesson as finished at >= 95%, or within 3 seconds of the end.
     * A video that plays to 2:32 of 2:33 is finished in every practical
     * sense — without this it sticks at 98% and never completes.
     */
    const nearEnd =
      durationSeconds > 0 &&
      (watchedSeconds >= durationSeconds * 0.95 ||
        durationSeconds - watchedSeconds <= 3);

    const existing = await prisma.lessonProgress.findFirst({
      where: { studentId, lessonId: lId },
      // no explicit select — avoids failing when durationSeconds is absent
    });

    const completed = nearEnd || existing?.completed || false;

    // Core fields — these columns always exist.
    const core = {
      // a resume must never lower the recorded total
      watchedSeconds: Math.max(existing?.watchedSeconds || 0, watchedSeconds),
      completed,
      watchedAt: new Date()
    };

    // Optional fields — present only after the lastPosition/durationSeconds
    // migration. If those columns are missing Prisma rejects the WHOLE write,
    // so retry with the core fields rather than losing every bit of progress.
    const extended = {
      ...core,
      lastPosition,
      durationSeconds: durationSeconds || existing?.durationSeconds || 0
    };

    const write = async (payloadData) => {
      if (existing) {
        return prisma.lessonProgress.update({
          where: { id: existing.id },
          data: payloadData
        });
      }
      return prisma.lessonProgress.create({
        data: { studentId, lessonId: lId, ...payloadData }
      });
    };

    let data = extended;

    try {
      await write(extended);
    } catch (err) {
      const missingColumn =
        err?.name === "PrismaClientValidationError" ||
        /Unknown arg|lastPosition|durationSeconds/i.test(err?.message || "");

      if (!missingColumn) throw err;

      console.warn(
        "[player] lastPosition/durationSeconds columns are missing — saving " +
          "core progress only. Run the LessonProgress migration for resume."
      );

      data = core;
      await write(core);
    }

    /* ---- recalculate the course's overall progress ---- */

    const assignments = await prisma.courseModuleAssignment.findMany({
      where: { moduleId: lesson.moduleId },
      select: { courseId: true }
    });

    const courseIds = [...new Set(assignments.map((a) => a.courseId))];
    let overallProgress = 0;

    for (const courseId of courseIds) {
      const courseAssignments = await prisma.courseModuleAssignment.findMany({
        where: { courseId },
        select: { moduleId: true }
      });

      const moduleIds = [...new Set(courseAssignments.map((a) => a.moduleId))];

      const lessons = moduleIds.length
        ? await prisma.lesson.findMany({
            where: { moduleId: { in: moduleIds } },
            select: { id: true }
          })
        : [];

      const lessonIds = lessons.map((l) => l.id);
      const total = lessonIds.length;

      const done = total
        ? await prisma.lessonProgress.count({
            where: { studentId, lessonId: { in: lessonIds }, completed: true }
          })
        : 0;

      const percent = total ? Math.round((done / total) * 100) : 0;
      overallProgress = percent;

      await prisma.enrollment.updateMany({
        where: { userId: studentId, courseId },
        data: { progress: percent, completed: percent === 100 }
      });
    }

    return {
      lessonProgress: {
        lessonId: lId,
        watchedSeconds: data.watchedSeconds,
        lastPosition: data.lastPosition ?? lastPosition,
        durationSeconds: data.durationSeconds ?? durationSeconds,
        completed: data.completed,
        // snap the reported percentage to 100 once complete
        percentage: data.completed
          ? 100
          : durationSeconds
          ? Math.min(99, Math.round((data.watchedSeconds / durationSeconds) * 100))
          : 0
      },
      overallProgress
    };
  }


    /* =======================================================
     BULK COURSE PROGRESS
     Returns progress for EVERY lesson in a course in one call.
  ======================================================= */
  async getCourseLessonProgress(userId, courseId) {
    const studentId = Number(userId);
    const cId = Number(courseId);

    const result = { lessons: {}, overallProgress: 0 };

    if (!studentId || !cId) return result;

    try {
      const assignments = await prisma.courseModuleAssignment.findMany({
        where: { courseId: cId },
        select: { moduleId: true }
      });

      const moduleIds = [...new Set(assignments.map((a) => a.moduleId))];
      if (moduleIds.length === 0) return result;

      const lessons = await prisma.lesson.findMany({
        where: { moduleId: { in: moduleIds } },
        select: { id: true }
      });

      const lessonIds = lessons.map((l) => l.id);
      if (lessonIds.length === 0) return result;

      // No `select` — tolerates lastPosition/durationSeconds not existing yet.
      const rows = await prisma.lessonProgress.findMany({
        where: { studentId, lessonId: { in: lessonIds } }
      });

      let completedCount = 0;

      rows.forEach((row) => {
        const watched = Number(row.watchedSeconds) || 0;
        const duration = Number(row.durationSeconds) || 0;
        const completed = !!row.completed;

        if (completed) completedCount += 1;

        result.lessons[row.lessonId] = {
          lessonId: row.lessonId,
          watchedSeconds: watched,
          lastPosition: Number(row.lastPosition) || 0,
          durationSeconds: duration,
          completed,
          percentage: completed
            ? 100
            : duration
            ? Math.min(99, Math.round((watched / duration) * 100))
            : 0
        };
      });

      // Progress = completed lessons / total lessons in the course.
      // `lessonIds` is every lesson under this course's modules (resolved via
      // CourseModuleAssignment above), so this is the true denominator — not
      // just the lessons the student has already touched.
      const totalLessons = lessonIds.length;

      result.totalLessons = totalLessons;
      result.completedLessons = completedCount;
      result.overallProgress =
        totalLessons > 0
          ? Math.round((completedCount / totalLessons) * 100)
          : 0;

    } catch (err) {
      console.error("getCourseLessonProgress failed:", err.message);
    }

    return result;
  }

}

module.exports = new PlayerService();