// src/services/quiz.service.js
const prisma = require("../config/prisma");
const { getModuleGating, PASS_MARK } = require("./gating.service");

const QUESTION_TYPES = ["RADIO", "CHECKBOX"];

class QuizService {
  // ============================================================
  // Helpers
  // ============================================================

  /**
   * Resolve which course a quiz belongs to.
   * Modules are shared across courses (CourseModuleAssignment), but Quiz.courseId
   * is a single required column — so if the caller doesn't specify one, fall back
   * to the module's first assigned course.
   */
  async _resolveCourseId(moduleId, courseId) {
    if (courseId) {
      const assignment = await prisma.courseModuleAssignment.findFirst({
        where: { courseId: Number(courseId), moduleId: Number(moduleId) },
        select: { id: true },
      });
      if (!assignment) {
        const err = new Error("This module is not part of the selected course.");
        err.statusCode = 400;
        throw err;
      }
      return Number(courseId);
    }

    const first = await prisma.courseModuleAssignment.findFirst({
      where: { moduleId: Number(moduleId) },
      orderBy: { courseId: "asc" },
      select: { courseId: true },
    });

    if (!first) {
      const err = new Error(
        "This module isn't attached to any course yet. Attach it to a course before adding a quiz."
      );
      err.statusCode = 400;
      throw err;
    }
    return first.courseId;
  }

  /**
   * Validate and normalise the question payload.
   * RADIO    -> exactly one correct option
   * CHECKBOX -> one or more correct options
   */
  _normaliseQuestions(questions) {
    if (!Array.isArray(questions) || questions.length === 0) {
      const err = new Error("At least one question is required.");
      err.statusCode = 400;
      throw err;
    }

    return questions.map((q, i) => {
      const label = `Question ${i + 1}`;

      if (!q.question || !String(q.question).trim()) {
        const err = new Error(`${label}: text is required.`);
        err.statusCode = 400;
        throw err;
      }

      const type = String(q.type || "RADIO").toUpperCase();
      if (!QUESTION_TYPES.includes(type)) {
        const err = new Error(`${label}: type must be RADIO or CHECKBOX.`);
        err.statusCode = 400;
        throw err;
      }

      const marks = Number(q.marks);
      if (!Number.isFinite(marks) || marks <= 0) {
        const err = new Error(`${label}: marks must be greater than 0.`);
        err.statusCode = 400;
        throw err;
      }

      const options = (Array.isArray(q.options) ? q.options : [])
        .filter((o) => o && o.text && String(o.text).trim())
        .map((o) => ({
          text: String(o.text).trim(),
          isCorrect: o.isCorrect === true,
        }));

      if (options.length < 2) {
        const err = new Error(`${label}: needs at least 2 options.`);
        err.statusCode = 400;
        throw err;
      }

      const correct = options.filter((o) => o.isCorrect);

      if (type === "RADIO" && correct.length !== 1) {
        const err = new Error(
          `${label}: a single-choice question needs exactly one correct option.`
        );
        err.statusCode = 400;
        throw err;
      }

      if (type === "CHECKBOX" && correct.length < 1) {
        const err = new Error(
          `${label}: a multiple-choice question needs at least one correct option.`
        );
        err.statusCode = 400;
        throw err;
      }

      return {
        question: String(q.question).trim(),
        type,
        marks: Math.round(marks),
        position: i + 1,
        options,
      };
    });
  }

  /** Ownership guard: the quiz's mentor, or any admin. */
  async _requireOwnership(quizId, user) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: Number(quizId) },
      select: { id: true, mentorId: true },
    });

    if (!quiz) {
      const err = new Error("Quiz not found.");
      err.statusCode = 404;
      throw err;
    }

    const isAdmin = user?.role === "ADMIN";
    if (!isAdmin && Number(quiz.mentorId) !== Number(user?.id)) {
      const err = new Error("You are not authorized to modify this quiz.");
      err.statusCode = 403;
      throw err;
    }

    return quiz;
  }

  // ============================================================
  // CREATE
  // ============================================================
  async createQuiz(mentorId, data = {}) {
    const { title, description, courseId, moduleId, questions } = data;

    if (!title || !String(title).trim()) {
      const err = new Error("Quiz title is required.");
      err.statusCode = 400;
      throw err;
    }
    if (!moduleId) {
      const err = new Error("Module is required.");
      err.statusCode = 400;
      throw err;
    }

    const module = await prisma.courseModule.findUnique({
      where: { id: Number(moduleId) },
      select: { id: true },
    });
    if (!module) {
      const err = new Error("Module not found.");
      err.statusCode = 404;
      throw err;
    }

    const resolvedCourseId = await this._resolveCourseId(moduleId, courseId);
    const normalised = this._normaliseQuestions(questions);
    const totalMarks = normalised.reduce((s, q) => s + q.marks, 0);

    return await prisma.quiz.create({
      data: {
        title: String(title).trim(),
        description: description ? String(description).trim() : null,
        totalMarks,
        courseId: resolvedCourseId,
        moduleId: Number(moduleId),
        mentorId: Number(mentorId),
        QuizQuestion: {
          create: normalised.map((q) => ({
            question: q.question,
            type: q.type,
            marks: q.marks,
            position: q.position,
            QuizOption: {
              create: q.options.map((o) => ({
                text: o.text,
                isCorrect: o.isCorrect,
              })),
            },
          })),
        },
      },
      include: {
        QuizQuestion: {
          orderBy: { position: "asc" },
          include: { QuizOption: true },
        },
      },
    });
  }

  // ============================================================
  // UPDATE  (replaces the question set)
  // ============================================================
  async updateQuiz(quizId, user, data = {}) {
    await this._requireOwnership(quizId, user);

    const { title, description, questions } = data;

    if (title !== undefined && !String(title).trim()) {
      const err = new Error("Quiz title cannot be empty.");
      err.statusCode = 400;
      throw err;
    }

    const payload = {};
    if (title !== undefined) payload.title = String(title).trim();
    if (description !== undefined) {
      payload.description = description ? String(description).trim() : null;
    }
    payload.updatedAt = new Date();

    // If questions are supplied, swap the whole set atomically.
    if (questions !== undefined) {
      const normalised = this._normaliseQuestions(questions);
      payload.totalMarks = normalised.reduce((s, q) => s + q.marks, 0);

      return await prisma.$transaction(async (tx) => {
        // Cascades remove the old options.
        await tx.quizQuestion.deleteMany({ where: { quizId: Number(quizId) } });

        return await tx.quiz.update({
          where: { id: Number(quizId) },
          data: {
            ...payload,
            QuizQuestion: {
              create: normalised.map((q) => ({
                question: q.question,
                type: q.type,
                marks: q.marks,
                position: q.position,
                QuizOption: {
                  create: q.options.map((o) => ({
                    text: o.text,
                    isCorrect: o.isCorrect,
                  })),
                },
              })),
            },
          },
          include: {
            QuizQuestion: {
              orderBy: { position: "asc" },
              include: { QuizOption: true },
            },
          },
        });
      });
    }

    return await prisma.quiz.update({
      where: { id: Number(quizId) },
      data: payload,
      include: {
        QuizQuestion: {
          orderBy: { position: "asc" },
          include: { QuizOption: true },
        },
      },
    });
  }

  // ============================================================
  // DELETE
  // ============================================================
  async deleteQuiz(quizId, user) {
    await this._requireOwnership(quizId, user);
    // QuizQuestion / QuizOption / QuizMark all cascade from Quiz.
    await prisma.quiz.delete({ where: { id: Number(quizId) } });
    return { success: true, message: "Quiz deleted successfully." };
  }

  // ============================================================
  // READ
  // ============================================================
  //
  // `isCorrect` is a protected answer key. It is returned ONLY to the quiz's
  // authoring audience (MENTOR / ADMIN) so the editing UI can pre-select the
  // correct options. Students (and anonymous callers) get options without it —
  // grading happens server-side in submitQuizAttempt.
  async getModuleQuizzes(moduleId, user) {
    const privileged = user?.role === "MENTOR" || user?.role === "ADMIN";

    const quizzes = await prisma.quiz.findMany({
      where: { moduleId: Number(moduleId) },
      orderBy: { createdAt: "desc" },
      include: {
        QuizQuestion: {
          orderBy: { position: "asc" },
          include: { QuizOption: true },
        },
        _count: { select: { QuizMark: true } },
      },
    });

    return quizzes.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      totalMarks: q.totalMarks,
      courseId: q.courseId,
      moduleId: q.moduleId,
      mentorId: q.mentorId,
      createdAt: q.createdAt,
      questionCount: q.QuizQuestion.length,
      submissionCount: q._count.QuizMark,
      questions: q.QuizQuestion.map((qq) => ({
        id: qq.id,
        question: qq.question,
        type: qq.type,
        marks: qq.marks,
        position: qq.position,
        options: qq.QuizOption.map((o) => ({
          id: o.id,
          text: o.text,
          ...(privileged ? { isCorrect: o.isCorrect } : {}),
        })),
      })),
    }));
  }

  async getQuizById(quizId, user) {
    const privileged = user?.role === "MENTOR" || user?.role === "ADMIN";

    const quiz = await prisma.quiz.findUnique({
      where: { id: Number(quizId) },
      include: {
        QuizQuestion: {
          orderBy: { position: "asc" },
          include: { QuizOption: true },
        },
      },
    });

    if (!quiz) {
      const err = new Error("Quiz not found.");
      err.statusCode = 404;
      throw err;
    }

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      totalMarks: quiz.totalMarks,
      courseId: quiz.courseId,
      moduleId: quiz.moduleId,
      mentorId: quiz.mentorId,
      questions: quiz.QuizQuestion.map((qq) => ({
        id: qq.id,
        question: qq.question,
        type: qq.type,
        marks: qq.marks,
        position: qq.position,
        options: qq.QuizOption.map((o) => ({
          id: o.id,
          text: o.text,
          ...(privileged ? { isCorrect: o.isCorrect } : {}),
        })),
      })),
    };
  }

  // ============================================================
  // SUBMIT ATTEMPT  (server-graded)
  // ============================================================
  //
  // Security model: the client sends ONLY which options it picked
  //   data.answers = [{ questionId, selectedOptionIds: [id, ...] }, ...]
  // The server never trusts a client-supplied score. It re-grades against the
  // stored answer key, enforces the gating rules (must be enrolled AND the
  // module's lessons must be complete), and persists the result.
  //
  // A question is awarded its full marks only when the chosen option-id set is
  // exactly the correct set (no partial credit; works for RADIO and CHECKBOX).
  //
  // Persistence: one QuizMark per (quiz, student). Attempts are unlimited and
  // "best wins" — a lower re-take never downgrades a previously-earned score
  // (which would otherwise re-lock a module the student already unlocked). The
  // student always sees THIS attempt's result in the return value.
  async submitQuizAttempt(quizId, userId, data = {}) {
    const studentId = Number(userId);

    const quiz = await prisma.quiz.findUnique({
      where: { id: Number(quizId) },
      include: {
        QuizQuestion: {
          orderBy: { position: "asc" },
          include: { QuizOption: true },
        },
      },
    });

    if (!quiz) {
      const err = new Error("Quiz not found.");
      err.statusCode = 404;
      throw err;
    }

    // 1. Resolve the course this attempt belongs to. Prefer the course the
    //    student is viewing (data.courseId); fall back to the quiz's own course.
    //    _resolveCourseId also asserts the module is actually part of that course.
    const courseId = await this._resolveCourseId(
      quiz.moduleId,
      data.courseId || quiz.courseId
    );

    // 2. Enrollment gate — a quiz attempt writes a mark, so the caller must own
    //    a seat in the course.
    const enrollment = await prisma.enrollment.findFirst({
      where: { userId: studentId, courseId: Number(courseId) },
      select: { id: true },
    });
    if (!enrollment) {
      const err = new Error("You are not enrolled in this course.");
      err.statusCode = 403;
      throw err;
    }

    // 3. Gating gate — the module must be unlocked and its lessons complete
    //    before the quiz can be taken. Mirrors the unlock rules exactly.
    const moduleGating = await getModuleGating(studentId, courseId, quiz.moduleId);
    if (!moduleGating) {
      const err = new Error("This quiz's module is not part of the course.");
      err.statusCode = 400;
      throw err;
    }
    if (!moduleGating.unlocked) {
      const err = new Error(
        moduleGating.reason || "This module is locked. Complete the previous module first."
      );
      err.statusCode = 403;
      throw err;
    }
    if (!moduleGating.lessonsComplete) {
      const err = new Error(
        "Finish all lessons in this module before taking the quiz."
      );
      err.statusCode = 403;
      throw err;
    }

    // 4. Normalise the submitted picks into questionId -> Set(optionId).
    const chosenByQuestion = new Map();
    if (Array.isArray(data.answers)) {
      for (const a of data.answers) {
        const qId = Number(a?.questionId);
        if (!qId) continue;
        const ids = Array.isArray(a?.selectedOptionIds)
          ? a.selectedOptionIds.map(Number).filter((n) => Number.isFinite(n))
          : [];
        chosenByQuestion.set(qId, new Set(ids));
      }
    }

    // 5. Grade server-side against the stored answer key.
    let obtainedMarks = 0;
    let totalPossible = 0;
    let correctCount = 0;
    const answerRows = [];

    for (const q of quiz.QuizQuestion) {
      totalPossible += q.marks;

      const correctSet = new Set(
        q.QuizOption.filter((o) => o.isCorrect).map((o) => o.id)
      );
      const chosen = chosenByQuestion.get(q.id) || new Set();

      // Record the picks (only option ids that really belong to this question).
      for (const optId of chosen) {
        const opt = q.QuizOption.find((o) => o.id === optId);
        if (opt) {
          answerRows.push({
            questionId: q.id,
            optionId: opt.id,
            isCorrect: opt.isCorrect,
          });
        }
      }

      const fullyCorrect =
        correctSet.size > 0 &&
        chosen.size === correctSet.size &&
        [...chosen].every((id) => correctSet.has(id));

      if (fullyCorrect) {
        obtainedMarks += q.marks;
        correctCount += 1;
      }
    }

    const totalQuestions = quiz.QuizQuestion.length;
    const percentage =
      totalPossible > 0 ? Math.round((obtainedMarks / totalPossible) * 100) : 0;
    const passed = percentage >= PASS_MARK;

    // 6. Persist — one row per (quiz, student), best-attempt wins. No `passed`
    //    column exists (derived at read time); no compound-unique exists, so we
    //    findFirst then update/create rather than upsert.
    const existing = await prisma.quizMark.findFirst({
      where: { quizId: Number(quizId), studentId },
      select: { id: true, percentage: true },
    });

    if (!existing) {
      await prisma.quizMark.create({
        data: {
          quizId: Number(quizId),
          studentId,
          obtainedMarks,
          totalMarks: totalPossible,
          percentage,
          QuizAnswer: { create: answerRows },
        },
      });
    } else if (percentage > existing.percentage) {
      // New personal best → replace the mark and its recorded answers atomically.
      await prisma.$transaction([
        prisma.quizAnswer.deleteMany({ where: { quizMarkId: existing.id } }),
        prisma.quizMark.update({
          where: { id: existing.id },
          data: {
            obtainedMarks,
            totalMarks: totalPossible,
            percentage,
            submittedAt: new Date(),
            QuizAnswer: { create: answerRows },
          },
        }),
      ]);
    }
    // else: existing best is >= this attempt → keep it untouched.

    return {
      obtainedMarks,
      totalMarks: totalPossible,
      percentage,
      passed,
      correctCount,
      totalQuestions,
    };
  }


  async getQuizMarks(quizId, user) {
    await this._requireOwnership(quizId, user);

    const [quiz, marks] = await Promise.all([
      prisma.quiz.findUnique({
        where: { id: Number(quizId) },
        select: { id: true, title: true, totalMarks: true },
      }),
      prisma.quizMark.findMany({
        where: { quizId: Number(quizId) },
        orderBy: { submittedAt: "desc" },
        include: {
          User: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return {
      quiz,
      completedCount: marks.length,
      marks: marks.map((m) => ({
        id: m.id,
        student: m.User,
        obtainedMarks: m.obtainedMarks,
        totalMarks: m.totalMarks,
        percentage: m.percentage,
        submittedAt: m.submittedAt,
      })),
    };
  }
}

module.exports = new QuizService();