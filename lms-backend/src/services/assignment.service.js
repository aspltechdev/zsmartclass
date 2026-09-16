const prisma = require("../config/prisma");
const { computeCourseGating } = require("./gating.service");

const fail = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const positiveId = (value, label) => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    fail(`Invalid ${label}.`);
  }

  return id;
};

const totalMarksValue = (value) => {
  const marks = Number(value);

  if (!Number.isInteger(marks) || marks <= 0) {
    fail("Total marks must be a whole number greater than zero.");
  }

  return marks;
};

const shape = (assignment) => {
  if (!assignment) return assignment;

  const {
    Course,
    User,
    AssignmentSubmission,
    ...rest
  } = assignment;

  return {
    ...rest,
    course: Course ?? null,
    mentor: User ?? null,
    submissions: AssignmentSubmission ?? [],
  };
};

class AssignmentService {
  async create(data, mentorId) {
    const title = String(data.title || "").trim();

    if (!title) fail("Assignment title is required.");

    const created = await prisma.assignment.create({
      data: {
        title,
        description: String(data.description || ""),
        dueDate: null,
        totalMarks: totalMarksValue(data.totalMarks),
        courseId: positiveId(data.courseId, "course"),
        mentorId: positiveId(mentorId, "mentor"),
        updatedAt: new Date(),
      },
      include: {
        Course: true,
      },
    });

    return shape(created);
  }

  async getAll() {
    const assignments = await prisma.assignment.findMany({
      include: {
        Course: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        AssignmentSubmission: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return assignments.map(shape);
  }

  async getById(id) {
    const assignment = await prisma.assignment.findUnique({
      where: {
        id: positiveId(id, "assignment"),
      },
      include: {
        Course: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        AssignmentSubmission: true,
      },
    });

    if (!assignment) fail("Assignment not found.", 404);

    return shape(assignment);
  }

  async update(id, data) {
    const assignmentId = positiveId(id, "assignment");

    const existing = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true },
    });

    if (!existing) fail("Assignment not found.", 404);

    const payload = {
      updatedAt: new Date(),
      dueDate: null,
    };

    if (data.title !== undefined) {
      payload.title = String(data.title || "").trim();

      if (!payload.title) {
        fail("Assignment title is required.");
      }
    }

    if (data.description !== undefined) {
      payload.description = String(data.description || "");
    }

    if (data.totalMarks !== undefined) {
      payload.totalMarks = totalMarksValue(data.totalMarks);
    }

    if (data.courseId !== undefined) {
      payload.courseId = positiveId(data.courseId, "course");
    }

    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data: payload,
      include: { Course: true },
    });

    return shape(updated);
  }

  async remove(id) {
    const assignmentId = positiveId(id, "assignment");

    const existing = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true },
    });

    if (!existing) fail("Assignment not found.", 404);

    await prisma.$transaction([
      prisma.assignmentSubmission.deleteMany({
        where: { assignmentId },
      }),
      prisma.assignment.delete({
        where: { id: assignmentId },
      }),
    ]);

    return {
      success: true,
      message: "Assignment deleted successfully.",
    };
  }

  async submit(assignmentId, studentId, data = {}) {
    const aId = positiveId(assignmentId, "assignment");
    const sId = positiveId(studentId, "student");

    const assignment = await prisma.assignment.findUnique({
      where: { id: aId },
      select: {
        id: true,
        courseId: true,
      },
    });

    if (!assignment) fail("Assignment not found.", 404);

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: sId,
        courseId: assignment.courseId,
      },
      select: { id: true },
    });

    if (!enrollment) {
      fail("You are not enrolled in this course.", 403);
    }

    const gating = await computeCourseGating(
      sId,
      assignment.courseId
    );

    if (
      gating.modules.length > 0 &&
      !gating.allModulesComplete
    ) {
      fail(
        "Finish all lessons and quizzes in this course before submitting the assignment.",
        403
      );
    }

    const attachment = data.attachment || null;

    if (!attachment) {
      fail("Please attach a file to submit your assignment.");
    }

    const submissionText =
      String(data.submissionText || "").trim() || null;

    const existing =
      await prisma.assignmentSubmission.findFirst({
        where: {
          assignmentId: aId,
          studentId: sId,
        },
        orderBy: [
          { submittedAt: "desc" },
          { id: "desc" },
        ],
      });

    if (existing) {
      if (existing.status === "GRADED") {
        fail(
          "This assignment has already been accepted and cannot be resubmitted.",
          409
        );
      }

      // Rejected work can be replaced and reviewed again.
      // Conditional update prevents overwriting a concurrent acceptance.
      const result =
        await prisma.assignmentSubmission.updateMany({
          where: {
            id: existing.id,
            status: existing.status,
            submittedAt: existing.submittedAt,
          },
          data: {
            attachment,
            submissionText,
            status: "SUBMITTED",
            marks: null,
            feedback: null,
            submittedAt: new Date(),
          },
        });

      if (result.count !== 1) {
        fail(
          "This submission changed. Refresh the page and try again.",
          409
        );
      }

      return prisma.assignmentSubmission.findUnique({
        where: { id: existing.id },
      });
    }

    return prisma.assignmentSubmission.create({
      data: {
        assignmentId: aId,
        studentId: sId,
        attachment,
        submissionText,
        status: "SUBMITTED",
      },
    });
  }

  async getSubmissions(id) {
    const submissions =
      await prisma.assignmentSubmission.findMany({
        where: {
          assignmentId: positiveId(id, "assignment"),
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [
          { submittedAt: "desc" },
          { id: "desc" },
        ],
      });

    return submissions.map(({ User, ...submission }) => ({
      ...submission,
      student: User ?? null,
    }));
  }

  async getForStudent(studentId) {
    const sId = positiveId(studentId, "student");

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: sId },
      select: { courseId: true },
    });

    const courseIds = [
      ...new Set(enrollments.map((item) => item.courseId)),
    ];

    if (!courseIds.length) return [];

    const assignments = await prisma.assignment.findMany({
      where: {
        courseId: { in: courseIds },
      },
      orderBy: { createdAt: "desc" },
      include: {
        Course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    const submissions =
      await prisma.assignmentSubmission.findMany({
        where: { studentId: sId },
        orderBy: [
          { submittedAt: "desc" },
          { id: "desc" },
        ],
      });

    const byAssignment = new Map();

    for (const submission of submissions) {
      if (!byAssignment.has(submission.assignmentId)) {
        byAssignment.set(
          submission.assignmentId,
          submission
        );
      }
    }

    const assignmentCourseIds = [
      ...new Set(assignments.map((item) => item.courseId)),
    ];

    const gatingByCourse = new Map();

    await Promise.all(
      assignmentCourseIds.map(async (courseId) => {
        const gating = await computeCourseGating(
          sId,
          courseId
        );

        gatingByCourse.set(courseId, gating);
      })
    );

    return assignments.map((assignment) => {
      const mySubmission =
        byAssignment.get(assignment.id) || null;

      const gating = gatingByCourse.get(
        assignment.courseId
      );

      const courseComplete =
        gating.modules.length === 0 ||
        gating.allModulesComplete;

      return {
        ...assignment,
        course: assignment.Course,
        dueDate: null,
        mySubmission,
        submitted: Boolean(mySubmission),
        status: mySubmission?.status || "PENDING",
        marks: mySubmission?.marks ?? null,
        feedback: mySubmission?.feedback ?? null,
        overdue: false,
        locked: !courseComplete,
        lockReason: !courseComplete
          ? "Finish all lessons and quizzes in this course to unlock this assignment."
          : null,
      };
    });
  }

  async getMySubmissions(studentId) {
    return prisma.assignmentSubmission.findMany({
      where: {
        studentId: positiveId(studentId, "student"),
      },
      orderBy: {
        submittedAt: "desc",
      },
      include: {
        Assignment: {
          select: {
            id: true,
            title: true,
            totalMarks: true,
            Course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * ACCEPT -> GRADED, preserving certificate compatibility.
   * REJECT -> REJECTED, allowing the student to resubmit.
   */
  async gradeSubmission(submissionId, data = {}, actor) {
    const id = positiveId(submissionId, "submission");

    const role = String(actor?.role || "").toUpperCase();

    if (!["MENTOR", "ADMIN"].includes(role)) {
      fail("You cannot review submissions.", 403);
    }

    const submission =
      await prisma.assignmentSubmission.findUnique({
        where: { id },
        include: {
          Assignment: {
            select: {
              mentorId: true,
              totalMarks: true,
            },
          },
        },
      });

    if (!submission) fail("Submission not found.", 404);

    if (
      role === "MENTOR" &&
      Number(submission.Assignment.mentorId) !==
        Number(actor.id)
    ) {
      fail(
        "Only the assigned mentor can review this submission.",
        403
      );
    }

    const decision = String(
      data.decision || ""
    ).toUpperCase();

    if (!["ACCEPT", "REJECT"].includes(decision)) {
      fail("Please choose Accept or Reject.");
    }

    // Do not review an older file after the student replaces it.
    const expectedDate = new Date(data.submittedAt);

    if (
      !data.submittedAt ||
      !Number.isFinite(expectedDate.getTime()) ||
      expectedDate.getTime() !==
        new Date(submission.submittedAt).getTime()
    ) {
      fail(
        "The submission changed. Refresh and review the latest file.",
        409
      );
    }

    if (data.previousStatus !== submission.status) {
      fail(
        "The review status changed. Refresh and try again.",
        409
      );
    }

    const feedback = String(data.feedback || "").trim();

    let marks = null;

    if (decision === "ACCEPT") {
      if (
        data.marks === null ||
        data.marks === undefined ||
        String(data.marks).trim() === ""
      ) {
        fail("Enter marks before accepting the assignment.");
      }

      marks = Number(data.marks);

      const total = Number(
        submission.Assignment.totalMarks
      );

      if (
        !Number.isFinite(marks) ||
        marks < 0 ||
        marks > total
      ) {
        fail(`Marks must be between 0 and ${total}.`);
      }
    } else if (!feedback) {
      fail(
        "Enter feedback explaining why the assignment is rejected."
      );
    }

    const result =
      await prisma.assignmentSubmission.updateMany({
        where: {
          id,
          status: submission.status,
          submittedAt: submission.submittedAt,
        },
        data: {
          status:
            decision === "ACCEPT" ? "GRADED" : "REJECTED",
          marks,
          feedback: feedback || null,
        },
      });

    if (result.count !== 1) {
      fail(
        "This submission changed. Refresh before reviewing it again.",
        409
      );
    }

    const updated =
      await prisma.assignmentSubmission.findUnique({
        where: { id },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

    const { User, ...rest } = updated;

    return {
      ...rest,
      student: User ?? null,
    };
  }
}

module.exports = new AssignmentService();