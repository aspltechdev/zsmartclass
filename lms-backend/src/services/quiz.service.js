// src/services/quiz.service.js
const prisma = require("../config/prisma");

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
  async getModuleQuizzes(moduleId) {
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
          isCorrect: o.isCorrect,
        })),
      })),
    }));
  }

  async getQuizById(quizId) {
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
          isCorrect: o.isCorrect,
        })),
      })),
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