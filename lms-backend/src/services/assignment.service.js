// src/services/assignment.service.js
const prisma = require("../config/prisma");

/**
 * NOTE ON NAMING: the Prisma schema names these relations `Course`, `User`
 * (the mentor) and `AssignmentSubmission`. We query with those names and then
 * expose them to the API as `course`, `mentor` and `submissions`, which is what
 * the frontend already reads.
 */
const shape = (a) => {
  if (!a) return a;
  const { Course, User, AssignmentSubmission, ...rest } = a;
  return {
    ...rest,
    course: Course ?? null,
    mentor: User ?? null,
    submissions: AssignmentSubmission ?? [],
  };
};

class AssignmentService {
  async create(data, mentorId) {
    if (!data.title || !String(data.title).trim()) {
      const e = new Error("Assignment title is required."); e.statusCode = 400; throw e;
    }
    if (!data.courseId) {
      const e = new Error("Course is required."); e.statusCode = 400; throw e;
    }
    if (!data.dueDate) {
      const e = new Error("Due date is required."); e.statusCode = 400; throw e;
    }
    const marks = Number(data.totalMarks);
    if (!marks || marks <= 0) {
      const e = new Error("Total marks must be greater than 0."); e.statusCode = 400; throw e;
    }

    const created = await prisma.assignment.create({
      data: {
        title: String(data.title).trim(),
        description: data.description || "",
        dueDate: new Date(data.dueDate),
        totalMarks: marks,
        courseId: Number(data.courseId),
        mentorId: Number(mentorId),
        // `updatedAt` has no @default / @updatedAt in the schema, so it must be set.
        updatedAt: new Date(),
      },
      include: { Course: true },
    });
    return shape(created);
  }

  async getAll() {
    const list = await prisma.assignment.findMany({
      include: {
        Course: true,
        User: { select: { id: true, name: true, email: true } },
        AssignmentSubmission: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return list.map(shape);
  }

  async getById(id) {
    const found = await prisma.assignment.findUnique({
      where: { id: Number(id) },
      include: {
        Course: true,
        User: { select: { id: true, name: true, email: true } },
        AssignmentSubmission: true,
      },
    });
    if (!found) {
      const e = new Error("Assignment not found."); e.statusCode = 404; throw e;
    }
    return shape(found);
  }

  async update(id, data) {
    const exists = await prisma.assignment.findUnique({
      where: { id: Number(id) }, select: { id: true },
    });
    if (!exists) {
      const e = new Error("Assignment not found."); e.statusCode = 404; throw e;
    }

    // Whitelist: spreading req.body straight into Prisma lets stray fields
    // (id, course, submissions…) through and throws.
    const payload = { updatedAt: new Date() };
    if (data.title !== undefined) payload.title = String(data.title).trim();
    if (data.description !== undefined) payload.description = data.description;
    if (data.dueDate) payload.dueDate = new Date(data.dueDate);
    if (data.totalMarks !== undefined) payload.totalMarks = Number(data.totalMarks);
    if (data.courseId) payload.courseId = Number(data.courseId);

    const updated = await prisma.assignment.update({
      where: { id: Number(id) },
      data: payload,
      include: { Course: true },
    });
    return shape(updated);
  }

  async remove(id) {
    const exists = await prisma.assignment.findUnique({
      where: { id: Number(id) }, select: { id: true },
    });
    if (!exists) {
      const e = new Error("Assignment not found."); e.statusCode = 404; throw e;
    }
    // Submissions have no cascade — remove them first, atomically.
    await prisma.$transaction([
      prisma.assignmentSubmission.deleteMany({ where: { assignmentId: Number(id) } }),
      prisma.assignment.delete({ where: { id: Number(id) } }),
    ]);
    return { success: true, message: "Assignment deleted successfully." };
  }

  async submit(assignmentId, studentId, data) {
    return await prisma.assignmentSubmission.create({
      data: {
        assignmentId: Number(assignmentId),
        studentId: Number(studentId),
        submissionText: data.submissionText || null,
        attachment: data.attachment || null,
      },
    });
  }

  async getSubmissions(id) {
    const subs = await prisma.assignmentSubmission.findMany({
      where: { assignmentId: Number(id) },
      include: { User: { select: { id: true, name: true, email: true } } },
      orderBy: { submittedAt: "desc" },
    });
    return subs.map(({ User, ...rest }) => ({ ...rest, student: User ?? null }));
  }

  /* =====================================================
     ASSIGNMENTS VISIBLE TO A STUDENT
     Only courses they're enrolled in, with their own
     submission attached so the UI can show status/marks.
  ===================================================== */
  async getForStudent(studentId) {
    const sId = Number(studentId);

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: sId },
      select: { courseId: true }
    });

    const courseIds = [...new Set(enrollments.map((e) => e.courseId))];
    if (courseIds.length === 0) return [];

    const assignments = await prisma.assignment.findMany({
      where: { courseId: { in: courseIds } },
      orderBy: { dueDate: "asc" },
      include: {
        Course: { select: { id: true, title: true } }
      }
    });

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { studentId: sId }
    });

    const byAssignment = {};
    submissions.forEach((sub) => {
      byAssignment[sub.assignmentId] = sub;
    });

    const now = new Date();

    return assignments.map((a) => {
      const mySubmission = byAssignment[a.id] || null;
      return {
        ...a,
        mySubmission,
        submitted: !!mySubmission,
        status: mySubmission ? mySubmission.status : "PENDING",
        marks: mySubmission?.marks ?? null,
        feedback: mySubmission?.feedback ?? null,
        overdue: !mySubmission && new Date(a.dueDate) < now
      };
    });
  }

  /* =====================================================
     A STUDENT'S SUBMISSIONS
  ===================================================== */
  async getMySubmissions(studentId) {
    return await prisma.assignmentSubmission.findMany({
      where: { studentId: Number(studentId) },
      orderBy: { submittedAt: "desc" },
      include: {
        Assignment: {
          select: {
            id: true,
            title: true,
            dueDate: true,
            totalMarks: true,
            Course: { select: { id: true, title: true } }
          }
        }
      }
    });
  }

  /* =====================================================
     GRADE A SUBMISSION  (mentor / admin)
  ===================================================== */
  async gradeSubmission(submissionId, data = {}) {
    const id = Number(submissionId);

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id },
      include: { Assignment: { select: { totalMarks: true } } }
    });

    if (!submission) {
      const e = new Error("Submission not found.");
      e.statusCode = 404;
      throw e;
    }

    const marks = Number(data.marks);
    const total = Number(submission.Assignment?.totalMarks) || 0;

    if (Number.isNaN(marks) || marks < 0) {
      const e = new Error("Marks must be zero or more.");
      e.statusCode = 400;
      throw e;
    }

    if (total > 0 && marks > total) {
      const e = new Error(`Marks cannot exceed the total of ${total}.`);
      e.statusCode = 400;
      throw e;
    }

    return await prisma.assignmentSubmission.update({
      where: { id },
      data: {
        marks,
        feedback: data.feedback ? String(data.feedback).trim() : null,
        status: "GRADED"
      }
    });
  }

}

module.exports = new AssignmentService();