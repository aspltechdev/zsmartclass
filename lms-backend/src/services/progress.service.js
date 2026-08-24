// src/services/progress.service.js
const prisma = require("../config/prisma");

class ProgressService {
  // ------------------------------------------------------------------
  // Helpers (module-sharing aware, scalar-only so they're robust to how
  // `prisma db pull` named the join-table relations)
  // ------------------------------------------------------------------

  /** All lesson ids that belong to a course, via the module link table. */
  async _courseLessonIds(courseId) {
    const assignments = await prisma.courseModuleAssignment.findMany({
      where: { courseId: Number(courseId) },
      select: { moduleId: true }
    });
    const moduleIds = [...new Set(assignments.map((a) => a.moduleId))];
    if (moduleIds.length === 0) return [];

    const lessons = await prisma.lesson.findMany({
      where: { moduleId: { in: moduleIds } },
      select: { id: true }
    });
    return lessons.map((l) => l.id);
  }

  /** The lesson row + every course it belongs to (a shared module = many courses). */
  async _lessonCourses(lessonId) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: Number(lessonId) },
      select: { id: true, moduleId: true }
    });
    if (!lesson) return { lesson: null, courseIds: [] };

    const assignments = await prisma.courseModuleAssignment.findMany({
      where: { moduleId: lesson.moduleId },
      select: { courseId: true }
    });
    return { lesson, courseIds: [...new Set(assignments.map((a) => a.courseId))] };
  }

  // ------------------------------------------------------------------
  // Mark a lesson completed
  // ------------------------------------------------------------------
  async markCompleted(data) {
    const studentId = Number(data.studentId);
    const lessonId = Number(data.lessonId);

    const { lesson, courseIds } = await this._lessonCourses(lessonId);
    if (!lesson) {
      throw new Error("Lesson not found.");
    }

    // Enrollment uses `userId`. Student must be enrolled in at least one course
    // that contains this lesson.
    const enrollment = courseIds.length
      ? await prisma.enrollment.findFirst({
          where: { userId: studentId, courseId: { in: courseIds } }
        })
      : null;

    if (!enrollment) {
      throw new Error("Student is not enrolled in a course containing this lesson.");
    }

    // LessonProgress uses `studentId`. Idempotent upsert.
    const existing = await prisma.lessonProgress.findFirst({
      where: { studentId, lessonId }
    });

    if (!existing) {
      await prisma.lessonProgress.create({
        data: { studentId, lessonId, completed: true, watchedAt: new Date() }
      });
    } else if (!existing.completed) {
      await prisma.lessonProgress.update({
        where: { id: existing.id },
        data: { completed: true, watchedAt: new Date() }
      });
    }

    // Recompute progress for every course this lesson feeds (shared modules).
    for (const cId of courseIds) {
      await this.updateCourseProgress(studentId, cId);
    }

    return { success: true, message: "Lesson marked as completed." };
  }

  // ------------------------------------------------------------------
  // Read a single lesson's progress
  // ------------------------------------------------------------------
  async getLessonProgress(studentId, lessonId) {
    const sId = Number(studentId);
    const lId = Number(lessonId);

    const empty = {
      lessonId: lId,
      watchedSeconds: 0,
      lastPosition: 0,
      durationSeconds: 0,
      completed: false,
      percentage: 0
    };

    if (!sId || !lId) return empty;

    let row = null;

    try {
      /*
       * No `select` here on purpose. Selecting lastPosition/durationSeconds
       * throws PrismaClientValidationError if those columns haven't been
       * added yet — which surfaced as a 400 on every read and wiped the
       * player's progress display.
       */
      row = await prisma.lessonProgress.findFirst({
        where: { studentId: sId, lessonId: lId }
      });
    } catch (err) {
      console.error("getLessonProgress query failed:", err.message);
      return empty;
    }

    if (!row) return empty;

    const watched = Number(row.watchedSeconds) || 0;
    // these two may be undefined until the migration is run
    const duration = Number(row.durationSeconds) || 0;
    const lastPosition = Number(row.lastPosition) || 0;
    const completed = !!row.completed;

    return {
      lessonId: lId,
      watchedSeconds: watched,
      lastPosition,
      durationSeconds: duration,
      completed,
      percentage: completed
        ? 100
        : duration
        ? Math.min(99, Math.round((watched / duration) * 100))
        : 0
    };
  }

  // ------------------------------------------------------------------
  // Compute a student's progress in a course
  // ------------------------------------------------------------------
  async getCourseProgress(studentId, courseId) {
    const lessonIds = await this._courseLessonIds(courseId);
    const totalLessons = lessonIds.length;

    const completedLessons = lessonIds.length
      ? await prisma.lessonProgress.count({
          where: {
            studentId: Number(studentId),
            completed: true,
            lessonId: { in: lessonIds }
          }
        })
      : 0;

    const progress =
      totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

    return { totalLessons, completedLessons, progress };
  }

  // ------------------------------------------------------------------
  // Persist progress onto the enrollment
  // ------------------------------------------------------------------
  async updateCourseProgress(studentId, courseId) {
    const { progress } = await this.getCourseProgress(studentId, courseId);

    // Enrollment keyed by userId; no `completedAt` column exists on Enrollment.
    await prisma.enrollment.updateMany({
      where: { userId: Number(studentId), courseId: Number(courseId) },
      data: {
        progress,
        completed: progress === 100
      }
    });

    return progress;
  }

  // ------------------------------------------------------------------
  // Courses the student is still working through
  // ------------------------------------------------------------------
  async continueLearning(studentId) {
    return await prisma.enrollment.findMany({
      where: {
        userId: Number(studentId),
        completed: false
      },
      include: {
        course: {
          include: {
            category: true,
            createdBy: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { enrolledAt: "desc" }
    });
  }
}

module.exports = new ProgressService();