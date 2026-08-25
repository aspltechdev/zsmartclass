// src/services/player.service.js
//
// Student course player. All reads go through the real schema:
//   - modules are resolved via CourseModuleAssignment (NOT CourseModule.courseId)
//   - lesson progress lives in LessonProgress (FK: studentId)
//   - enrollment lives in Enrollment (FK: userId), progress is a Float 0-100
//   - module unlock/quiz gating comes from gating.service (single source of truth)
//
// Video URLs are only ever returned for UNLOCKED modules, so a student can't
// pull a locked lesson's URL by hitting the API directly.

const prisma = require("../config/prisma");
const AppError = require("../utils/appError");
const { computeCourseGating } = require("./gating.service");

class PlayerService {
  /** Throw 403 unless the student is enrolled in the course. */
  async _requireEnrollment(studentId, courseId) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { userId: studentId, courseId },
      select: { id: true, progress: true, completed: true },
    });
    if (!enrollment) {
      throw new AppError("You are not enrolled in this course.", 403);
    }
    return enrollment;
  }

  /**
   * Full player payload: course header, gated module/lesson tree, and progress.
   * Locked modules' lessons carry videoUrl:null.
   */
  async getCoursePlayer(userId, courseId) {
    const studentId = Number(userId);
    const cId = Number(courseId);

    await this._requireEnrollment(studentId, cId);

    const course = await prisma.course.findUnique({
      where: { id: cId },
      select: { id: true, title: true, description: true, thumbnail: true },
    });
    if (!course) throw new AppError("Course not found.", 404);

    // Gating decides unlock + lessonsComplete + quiz pass per module.
    const gating = await computeCourseGating(studentId, cId);

    // We still need the raw lesson rows (videoUrl / videoType / etc.) which the
    // gating record intentionally omits. Load them once, keyed by module.
    const moduleIds = gating.modules.map((m) => m.id);
    const lessonRows = moduleIds.length
      ? await prisma.lesson.findMany({
          where: { moduleId: { in: moduleIds } },
          orderBy: { position: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            position: true,
            moduleId: true,
            videoUrl: true,
            videoType: true,
            isPreview: true,
          },
        })
      : [];

    // Watch-time / completion detail for every lesson in this course.
    const lessonIds = lessonRows.map((l) => l.id);
    const progressRows = lessonIds.length
      ? await prisma.lessonProgress.findMany({
          where: { studentId, lessonId: { in: lessonIds } },
        })
      : [];
    const progressByLesson = new Map(progressRows.map((p) => [p.lessonId, p]));

    const lessonRowsByModule = new Map();
    for (const l of lessonRows) {
      if (!lessonRowsByModule.has(l.moduleId)) lessonRowsByModule.set(l.moduleId, []);
      lessonRowsByModule.get(l.moduleId).push(l);
    }

    const modules = gating.modules.map((m) => {
      const rows = lessonRowsByModule.get(m.id) || [];
      const lessons = rows.map((l) => {
        const p = progressByLesson.get(l.id);
        const durationSeconds = Number(p?.durationSeconds) || 0;
        const watchedSeconds = Number(p?.watchedSeconds) || 0;
        const completed = !!p?.completed;
        return {
          id: l.id,
          title: l.title,
          description: l.description,
          position: l.position,
          videoType: l.videoType,
          isPreview: l.isPreview,
          // The gate: never hand a student a locked module's video URL.
          videoUrl: m.unlocked ? l.videoUrl : null,
          completed,
          watchedSeconds,
          lastPosition: Number(p?.lastPosition) || 0,
          durationSeconds,
          percentage: completed
            ? 100
            : durationSeconds
            ? Math.min(99, Math.round((watchedSeconds / durationSeconds) * 100))
            : 0,
        };
      });

      return {
        id: m.id,
        title: m.title,
        position: m.position,
        unlocked: m.unlocked,
        locked: m.locked,
        reason: m.reason,
        lessonsComplete: m.lessonsComplete,
        hasQuiz: m.hasQuiz,
        quizRequired: m.quizRequired,
        quizPassed: m.quizPassed,
        moduleComplete: m.moduleComplete,
        totalLessons: m.totalLessons,
        completedLessons: m.completedLessons,
        quizzes: m.quizzes, // [{ id, title, passed, bestPercentage }]
        lessons,
      };
    });

    return {
      course,
      modules,
      progress: gating.overallProgress,
      totalLessons: gating.totalLessons,
      completedLessons: gating.completedLessons,
      allModulesComplete: gating.allModulesComplete,
    };
  }

  /**
   * Single lesson with a playable URL. This is the ONLY student path to a video
   * URL, so it enforces enrollment AND that the lesson's module is unlocked.
   */
  async getLesson(userId, lessonId, courseId) {
    const studentId = Number(userId);
    const lId = Number(lessonId);
    const cId = Number(courseId);

    if (!cId) throw new AppError("A courseId is required.", 400);

    await this._requireEnrollment(studentId, cId);

    const lesson = await prisma.lesson.findUnique({
      where: { id: lId },
      select: {
        id: true,
        title: true,
        description: true,
        position: true,
        moduleId: true,
        videoUrl: true,
        videoType: true,
        isPreview: true,
      },
    });
    if (!lesson) throw new AppError("Lesson not found.", 404);

    // Confirm the lesson's module belongs to this course (via the join table).
    const link = await prisma.courseModuleAssignment.findFirst({
      where: { courseId: cId, moduleId: lesson.moduleId },
      select: { id: true },
    });
    if (!link) {
      throw new AppError("This lesson does not belong to this course.", 400);
    }

    // Gating: the module must be unlocked.
    const gating = await computeCourseGating(studentId, cId);
    const module = gating.modules.find((m) => m.id === lesson.moduleId);
    if (!module || !module.unlocked) {
      throw new AppError(
        module?.reason || "This module is locked. Complete the previous module first.",
        403
      );
    }

    const p = await prisma.lessonProgress.findFirst({
      where: { studentId, lessonId: lId },
    });
    const durationSeconds = Number(p?.durationSeconds) || 0;
    const watchedSeconds = Number(p?.watchedSeconds) || 0;
    const completed = !!p?.completed;

    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      position: lesson.position,
      moduleId: lesson.moduleId,
      videoType: lesson.videoType,
      isPreview: lesson.isPreview,
      videoUrl: lesson.videoUrl, // unlocked module → real URL
      completed,
      watchedSeconds,
      lastPosition: Number(p?.lastPosition) || 0,
      durationSeconds,
    };
  }

  /**
   * Gating-only endpoint (module lock / quiz pass state) for the player and any
   * caller that needs unlock flags without the lesson payload.
   */
  async getCourseGating(userId, courseId) {
    const studentId = Number(userId);
    const cId = Number(courseId);
    await this._requireEnrollment(studentId, cId);
    return computeCourseGating(studentId, cId);
  }

  /* =======================================================
     SAVE WATCH TIME
     Called by the student CoursePlayer every few seconds.
     Uses LessonProgress + Enrollment (the models that exist);
     a lesson counts as completed at >= 95% watched.
  ======================================================= */
  async saveWatchTime(userId, lessonId, payload = {}) {
    const studentId = Number(userId);
    const lId = Number(lessonId);

    const watchedSeconds = Math.max(0, Math.floor(Number(payload.watchedSeconds) || 0));
    const durationSeconds = Math.max(0, Math.floor(Number(payload.durationSeconds) || 0));
    const lastPosition = Math.max(0, Math.floor(Number(payload.lastPosition) || 0));

    const lesson = await prisma.lesson.findUnique({
      where: { id: lId },
      select: { id: true, moduleId: true },
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
      watchedAt: new Date(),
    };

    // Optional fields — present only after the lastPosition/durationSeconds
    // migration. If those columns are missing Prisma rejects the WHOLE write,
    // so retry with the core fields rather than losing every bit of progress.
    const extended = {
      ...core,
      lastPosition,
      durationSeconds: durationSeconds || existing?.durationSeconds || 0,
    };

    const write = async (payloadData) => {
      if (existing) {
        return prisma.lessonProgress.update({
          where: { id: existing.id },
          data: payloadData,
        });
      }
      return prisma.lessonProgress.create({
        data: { studentId, lessonId: lId, ...payloadData },
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
      select: { courseId: true },
    });

    const courseIds = [...new Set(assignments.map((a) => a.courseId))];
    let overallProgress = 0;

    for (const courseId of courseIds) {
      const courseAssignments = await prisma.courseModuleAssignment.findMany({
        where: { courseId },
        select: { moduleId: true },
      });

      const moduleIds = [...new Set(courseAssignments.map((a) => a.moduleId))];

      const lessons = moduleIds.length
        ? await prisma.lesson.findMany({
            where: { moduleId: { in: moduleIds } },
            select: { id: true },
          })
        : [];

      const lessonIds = lessons.map((l) => l.id);
      const total = lessonIds.length;

      const done = total
        ? await prisma.lessonProgress.count({
            where: { studentId, lessonId: { in: lessonIds }, completed: true },
          })
        : 0;

      const percent = total ? Math.round((done / total) * 100) : 0;
      overallProgress = percent;

      await prisma.enrollment.updateMany({
        where: { userId: studentId, courseId },
        data: { progress: percent, completed: percent === 100 },
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
          : 0,
      },
      overallProgress,
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
        select: { moduleId: true },
      });

      const moduleIds = [...new Set(assignments.map((a) => a.moduleId))];
      if (moduleIds.length === 0) return result;

      const lessons = await prisma.lesson.findMany({
        where: { moduleId: { in: moduleIds } },
        select: { id: true },
      });

      const lessonIds = lessons.map((l) => l.id);
      if (lessonIds.length === 0) return result;

      // No `select` — tolerates lastPosition/durationSeconds not existing yet.
      const rows = await prisma.lessonProgress.findMany({
        where: { studentId, lessonId: { in: lessonIds } },
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
            : 0,
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
