// src/services/gating.service.js
//
// Single source of truth for a student's module-by-module progression in a
// course. Resolves modules through the CourseModuleAssignment join table (a
// module can belong to many courses, so we NEVER read CourseModule.courseId),
// then decides, per module, whether it is unlocked.
//
// Rules (all enforced server-side):
//   - Module 1 (lowest position) is always unlocked.
//   - A module's lessons are "complete" when every lesson has a LessonProgress
//     row with completed:true. A module with no lessons is trivially complete.
//   - A module quiz is "passed" when the student has at least one QuizMark for
//     it with percentage >= 50 (pass is derived at read time — there is no
//     `passed` column, and unlimited attempts mean best-attempt wins).
//   - A module is "complete" when its lessons are complete AND all its quizzes
//     are passed (a module with no quiz needs only its lessons).
//   - Module N unlocks only when module N-1 is complete.
//
// This mirrors the CourseModuleAssignment resolution in course.service._courseModules
// and the lessons-only progress formula in player.service.getCourseLessonProgress.

const prisma = require("../config/prisma");

const PASS_MARK = 50; // percentage; matches the spec and mentor QuizMarks view

/**
 * Compute the full gating picture for a student in a course.
 *
 * @param {number} userId    - the student's user id (LessonProgress.studentId / QuizMark.studentId)
 * @param {number} courseId
 * @returns {Promise<{
 *   modules: Array<{
 *     id, title, position, unlocked, locked, reason,
 *     lessonsComplete, quizRequired, quizPassed, moduleComplete, hasQuiz,
 *     totalLessons, completedLessons,
 *     lessons: Array<{ id, title, position, completed }>,
 *     quizzes: Array<{ id, title, passed, bestPercentage }>
 *   }>,
 *   overallProgress, totalLessons, completedLessons, allModulesComplete
 * }>}
 */
async function computeCourseGating(userId, courseId) {
  const studentId = Number(userId);
  const cId = Number(courseId);

  const empty = {
    modules: [],
    overallProgress: 0,
    totalLessons: 0,
    completedLessons: 0,
    allModulesComplete: false,
  };

  if (!studentId || !cId) return empty;

  // 1. Modules linked to this course, in this course's order (scalar-only read
  //    of the join table — same approach as course.service._courseModules).
  const assignments = await prisma.courseModuleAssignment.findMany({
    where: { courseId: cId },
    orderBy: { position: "asc" },
    select: { moduleId: true, position: true },
  });

  if (assignments.length === 0) return empty;

  const moduleIds = assignments.map((a) => a.moduleId);

  // 2. Batch-load everything else keyed by moduleId.
  const [moduleRows, lessons, quizzes] = await Promise.all([
    prisma.courseModule.findMany({
      where: { id: { in: moduleIds } },
      select: { id: true, title: true },
    }),
    prisma.lesson.findMany({
      where: { moduleId: { in: moduleIds } },
      orderBy: { position: "asc" },
      select: { id: true, title: true, position: true, moduleId: true },
    }),
    prisma.quiz.findMany({
      where: { moduleId: { in: moduleIds } },
      select: { id: true, title: true, moduleId: true },
    }),
  ]);

  const moduleTitleById = new Map(moduleRows.map((m) => [m.id, m.title]));

  const allLessonIds = lessons.map((l) => l.id);
  const allQuizIds = quizzes.map((q) => q.id);

  // 3. This student's completed lessons + passing quiz attempts.
  const [completedRows, quizMarks] = await Promise.all([
    allLessonIds.length
      ? prisma.lessonProgress.findMany({
          where: { studentId, lessonId: { in: allLessonIds }, completed: true },
          select: { lessonId: true },
        })
      : Promise.resolve([]),
    allQuizIds.length
      ? prisma.quizMark.findMany({
          where: { studentId, quizId: { in: allQuizIds } },
          select: { quizId: true, percentage: true },
        })
      : Promise.resolve([]),
  ]);

  const completedLessonIds = new Set(completedRows.map((r) => r.lessonId));

  // Best percentage per quiz (unlimited attempts → best wins).
  const bestPctByQuiz = new Map();
  for (const m of quizMarks) {
    const prev = bestPctByQuiz.get(m.quizId) ?? -1;
    if (m.percentage > prev) bestPctByQuiz.set(m.quizId, m.percentage);
  }

  // Group lessons/quizzes by module.
  const lessonsByModule = new Map();
  for (const l of lessons) {
    if (!lessonsByModule.has(l.moduleId)) lessonsByModule.set(l.moduleId, []);
    lessonsByModule.get(l.moduleId).push(l);
  }
  const quizzesByModule = new Map();
  for (const q of quizzes) {
    if (!quizzesByModule.has(q.moduleId)) quizzesByModule.set(q.moduleId, []);
    quizzesByModule.get(q.moduleId).push(q);
  }

  // 4. Walk modules in course order, carrying the previous module's completion
  //    forward to decide the next module's unlock.
  const modules = [];
  let previousComplete = true; // first module has no predecessor → unlocked
  let previousTitle = null;
  let totalLessons = 0;
  let completedLessons = 0;

  for (let i = 0; i < assignments.length; i++) {
    const moduleId = assignments[i].moduleId;
    const mLessons = lessonsByModule.get(moduleId) || [];
    const mQuizzes = quizzesByModule.get(moduleId) || [];

    const lessonDtos = mLessons.map((l) => ({
      id: l.id,
      title: l.title,
      position: l.position,
      completed: completedLessonIds.has(l.id),
    }));

    const moduleCompletedLessons = lessonDtos.filter((l) => l.completed).length;
    totalLessons += lessonDtos.length;
    completedLessons += moduleCompletedLessons;

    const lessonsComplete =
      lessonDtos.length === 0 || moduleCompletedLessons === lessonDtos.length;

    const quizDtos = mQuizzes.map((q) => {
      const best = bestPctByQuiz.get(q.id);
      return {
        id: q.id,
        title: q.title,
        bestPercentage: best ?? null,
        passed: (best ?? -1) >= PASS_MARK,
      };
    });

    const quizRequired = quizDtos.length > 0;
    const quizPassed = quizRequired ? quizDtos.every((q) => q.passed) : true;
    const moduleComplete = lessonsComplete && quizPassed;

    const unlocked = i === 0 ? true : previousComplete;

    let reason = null;
    if (!unlocked) {
      reason = previousTitle
        ? `Complete "${previousTitle}" (all lessons${
            // only mention the quiz if the previous module actually had one
            (quizzesByModule.get(assignments[i - 1].moduleId) || []).length
              ? " and its quiz"
              : ""
          }) to unlock this module.`
        : "Complete the previous module to unlock this module.";
    }

    modules.push({
      id: moduleId,
      title: moduleTitleById.get(moduleId) || "Untitled Module",
      position: assignments[i].position,
      unlocked,
      locked: !unlocked,
      reason,
      lessonsComplete,
      quizRequired,
      quizPassed,
      moduleComplete,
      hasQuiz: quizRequired,
      totalLessons: lessonDtos.length,
      completedLessons: moduleCompletedLessons,
      lessons: lessonDtos,
      quizzes: quizDtos,
    });

    previousComplete = moduleComplete;
    previousTitle = moduleTitleById.get(moduleId) || "the previous module";
  }

  const overallProgress =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const allModulesComplete = modules.every((m) => m.moduleComplete);

  return {
    modules,
    overallProgress,
    totalLessons,
    completedLessons,
    allModulesComplete,
  };
}

/**
 * Whether a single module is unlocked for a student (used by getLesson and the
 * quiz-submit guard). Returns the module's gating record, or null if the module
 * is not part of the course.
 */
async function getModuleGating(userId, courseId, moduleId) {
  const gating = await computeCourseGating(userId, courseId);
  return gating.modules.find((m) => m.id === Number(moduleId)) || null;
}

module.exports = { computeCourseGating, getModuleGating, PASS_MARK };
