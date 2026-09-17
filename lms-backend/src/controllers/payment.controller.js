// lms-backend/src/controllers/payment.controller.js

const crypto = require("crypto");
const prisma = require("../config/prisma");
const notificationService = require("../services/notification.service");
const emailService = require("../services/email.service");
const enrollmentService = require("../services/enrollment.service");

const paymentInclude = {
  student: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  course: {
    select: {
      id: true,
      title: true,
    },
  },
};

const studentPaymentInclude = {
  course: {
    select: {
      id: true,
      title: true,
      thumbnail: true,
    },
  },
};

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

const sendError = (res, error) => {
  console.error("Payment error:", error.message);

  return res.status(
    error.code === "P2002"
      ? 409
      : error.statusCode || 400
  ).json({
    success: false,
    message:
      error.code === "P2002"
        ? "A payment with this reference already exists. Refresh payment records before retrying."
        : error.message,
  });
};

const requireAdmin = (req) => {
  if (
    String(req.user?.role || "").toUpperCase() !== "ADMIN"
  ) {
    fail("Only administrators can perform this action.", 403);
  }
};

const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[character]));

/**
 * Add the complete course list to payment records.
 * Falls back to the primary course when PaymentCourse
 * is unavailable in an older database.
 */
const attachCourses = async (payments) => {
  const coursesByPayment = new Map();

  if (payments.length && prisma.paymentCourse) {
    try {
      const links = await prisma.paymentCourse.findMany({
        where: {
          paymentId: {
            in: payments.map((payment) => payment.id),
          },
        },
        select: {
          paymentId: true,
          courseId: true,
        },
      });

      const courseIds = [
        ...new Set(links.map((link) => link.courseId)),
      ];

      const courses = courseIds.length
        ? await prisma.course.findMany({
            where: {
              id: { in: courseIds },
            },
            select: {
              id: true,
              title: true,
            },
          })
        : [];

      const courseById = new Map(
        courses.map((course) => [course.id, course])
      );

      for (const link of links) {
        const course = courseById.get(link.courseId);

        if (!course) continue;

        if (!coursesByPayment.has(link.paymentId)) {
          coursesByPayment.set(link.paymentId, []);
        }

        coursesByPayment.get(link.paymentId).push(course);
      }
    } catch (error) {
      console.error(
        "Unable to load payment course links:",
        error.message
      );
    }
  }

  return payments.map((payment) => ({
    ...payment,
    courses:
      coursesByPayment.get(payment.id) ||
      (payment.course ? [payment.course] : []),
  }));
};

/**
 * Shared receipt HTML.
 * All manually entered values are escaped.
 */
const receiptHTML = (payment, courses, note = "") => {
  const method = String(payment.method || "").toUpperCase();

  const courseTitles =
    courses.map((course) => course.title).join(", ") || "—";

  const rows = [
    ["Receipt No", payment.orderId || "—"],
    [
      "Amount",
      `${payment.currency || "INR"} ${Number(
        payment.amount || 0
      ).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      })}`,
    ],
    ["Status", payment.status || "—"],
    ["Method", method || "—"],
    ["Recorded by", payment.recordedByName || "Not recorded"],
    ...(method === "UPI"
      ? [
          [
            "UPI account name",
            payment.upiAccountName || "Not recorded",
          ],
          ["UTR / Reference", payment.paymentId || "—"],
        ]
      : []),
    ["Course(s)", courseTitles],
    [
      "Date",
      new Date(payment.createdAt).toLocaleString("en-IN"),
    ],
  ];

  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
      <h2 style="color:#4f46e5">Payment Receipt</h2>
      <p>Hi ${escapeHTML(payment.student?.name || "Student")},</p>
      <p>Here are your payment details:</p>

      <table cellpadding="8" style="border-collapse:collapse;width:100%">
        ${rows.map(([label, value]) => `
          <tr>
            <td style="border:1px solid #eee">
              <b>${escapeHTML(label)}</b>
            </td>
            <td style="border:1px solid #eee">
              ${escapeHTML(value)}
            </td>
          </tr>
        `).join("")}
      </table>

      ${note ? `<p style="margin-top:16px">${escapeHTML(note)}</p>` : ""}

      <p style="color:#888;font-size:12px">
        ZmartClass LMS
      </p>
    </div>
  `;
};

// ============================================================
// STUDENT: CREATE A PENDING PAYMENT
// ============================================================

exports.createPayment = async (req, res) => {
  try {
    const studentId = positiveId(req.user.id, "student");

    const {
      courseId,
      amount,
      method,
      currency,
      orderId,
    } = req.body;

    const cId = positiveId(courseId, "course");
    const paymentAmount = Number(amount);

    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0
    ) {
      fail("Enter a valid payment amount greater than zero.");
    }

    const course = await prisma.course.findUnique({
      where: { id: cId },
    });

    if (!course) fail("Course not found.", 404);

    const existingEnrollment =
      await prisma.enrollment.findFirst({
        where: {
          userId: studentId,
          courseId: cId,
        },
      });

    if (existingEnrollment) {
      fail("Already enrolled in this course.");
    }

    const payment = await prisma.payment.create({
      data: {
        studentId,
        courseId: cId,
        amount: paymentAmount,
        currency: currency || "INR",
        method: method || "CARD",
        status: "PENDING",
        orderId:
          orderId || `ORD-${crypto.randomUUID()}`,
      },
      include: paymentInclude,
    });

    return res.status(201).json({
      success: true,
      data: payment,
      message: "Payment created successfully.",
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// ============================================================
// STUDENT: PAYMENT HISTORY
// ============================================================

exports.getMyPayments = async (req, res) => {
  try {
    const studentId = positiveId(req.user.id, "student");

    const payments = await prisma.payment.findMany({
      where: { studentId },
      include: studentPaymentInclude,
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      data: await attachCourses(payments),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// ============================================================
// STUDENT: PAYMENT DETAILS
// ============================================================

exports.getMyPaymentById = async (req, res) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: {
        id: positiveId(req.params.id, "payment"),
        studentId: positiveId(req.user.id, "student"),
      },
      include: studentPaymentInclude,
    });

    if (!payment) fail("Payment not found.", 404);

    const [data] = await attachCourses([payment]);

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// ============================================================
// STUDENT: CANCEL A PENDING PAYMENT
// Payment completion must come from an admin or verified gateway.
// ============================================================

exports.updateMyPaymentStatus = async (req, res) => {
  try {
    const studentId = positiveId(req.user.id, "student");
    const paymentId = positiveId(req.params.id, "payment");

    const status = String(
      req.body.status || ""
    ).toUpperCase();

    if (status !== "CANCELLED") {
      fail(
        "Students can only cancel pending payments. Payment confirmation must be completed by an administrator or the payment gateway.",
        403
      );
    }

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        studentId,
      },
    });

    if (!payment) fail("Payment not found.", 404);

    if (payment.status !== "PENDING") {
      fail("Only pending payments can be cancelled.", 409);
    }

    const result = await prisma.payment.updateMany({
      where: {
        id: paymentId,
        studentId,
        status: "PENDING",
      },
      data: {
        status: "CANCELLED",
      },
    });

    if (result.count !== 1) {
      fail("Payment status changed. Please refresh.", 409);
    }

    const updatedPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: studentPaymentInclude,
    });

    return res.json({
      success: true,
      data: updatedPayment,
      message: "Payment cancelled successfully.",
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// ============================================================
// ADMIN: ALL PAYMENTS
// ============================================================

exports.getAllPayments = async (req, res) => {
  try {
    requireAdmin(req);

    const payments = await prisma.payment.findMany({
      include: paymentInclude,
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      data: await attachCourses(payments),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// ============================================================
// ADMIN: PAYMENT DETAILS
// ============================================================

exports.getPaymentById = async (req, res) => {
  try {
    requireAdmin(req);

    const payment = await prisma.payment.findUnique({
      where: {
        id: positiveId(req.params.id, "payment"),
      },
      include: paymentInclude,
    });

    if (!payment) fail("Payment not found.", 404);

    const [data] = await attachCourses([payment]);

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// ============================================================
// ADMIN: PAYMENT STATISTICS
// ============================================================

exports.getPaymentStats = async (req, res) => {
  try {
    requireAdmin(req);

    const [
      total,
      completed,
      pending,
      failed,
      refunded,
      revenue,
    ] = await Promise.all([
      prisma.payment.count(),
      prisma.payment.count({
        where: { status: "COMPLETED" },
      }),
      prisma.payment.count({
        where: { status: "PENDING" },
      }),
      prisma.payment.count({
        where: { status: "FAILED" },
      }),
      prisma.payment.count({
        where: { status: "REFUNDED" },
      }),
      prisma.payment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
    ]);

    const now = new Date();
    const monthlyRevenue = [];

    for (let i = 5; i >= 0; i -= 1) {
      const start = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

      const end = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        1
      );

      const monthly = await prisma.payment.aggregate({
        where: {
          status: "COMPLETED",
          createdAt: {
            gte: start,
            lt: end,
          },
        },
        _sum: { amount: true },
      });

      monthlyRevenue.push({
        month: start.toLocaleString("default", {
          month: "short",
        }),
        revenue: monthly._sum.amount || 0,
      });
    }

    return res.json({
      success: true,
      data: {
        total,
        completed,
        pending,
        failed,
        refunded,
        totalRevenue: revenue._sum.amount || 0,
        monthlyRevenue,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// ============================================================
// ADMIN: UPDATE PAYMENT STATUS
// ============================================================

exports.updatePaymentStatus = async (req, res) => {
  try {
    requireAdmin(req);

    const paymentId = positiveId(req.params.id, "payment");

    const status = String(
      req.body.status || ""
    ).toUpperCase();

    const allowedStatuses = [
      "PENDING",
      "COMPLETED",
      "FAILED",
      "REFUNDED",
      "CANCELLED",
    ];

    if (!allowedStatuses.includes(status)) {
      fail("Invalid payment status.");
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) fail("Payment not found.", 404);

    const updatedPayment = await prisma.$transaction(
      async (tx) => {
        const updated = await tx.payment.update({
          where: { id: paymentId },
          data: { status },
          include: paymentInclude,
        });

        if (status === "COMPLETED") {
          const existingEnrollment =
            await tx.enrollment.findFirst({
              where: {
                userId: payment.studentId,
                courseId: payment.courseId,
              },
            });

          if (!existingEnrollment) {
            await tx.enrollment.create({
              data: {
                userId: payment.studentId,
                courseId: payment.courseId,
                progress: 0,
                completed: false,
              },
            });
          }
        }

        return updated;
      }
    );

    return res.json({
      success: true,
      data: updatedPayment,
      message: "Payment status updated successfully.",
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// ============================================================
// ADMIN: DELETE PAYMENT
// ============================================================

exports.deletePayment = async (req, res) => {
  try {
    requireAdmin(req);

    const paymentId = positiveId(req.params.id, "payment");

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { id: true },
    });

    if (!payment) fail("Payment not found.", 404);

    await prisma.payment.delete({
      where: { id: paymentId },
    });

    return res.json({
      success: true,
      message: "Payment deleted successfully.",
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// ============================================================
// ADMIN: SEND EMAIL RECEIPT
// ============================================================

exports.sendReceipt = async (req, res) => {
  try {
    requireAdmin(req);

    const payment = await prisma.payment.findUnique({
      where: {
        id: positiveId(req.params.id, "payment"),
      },
      include: paymentInclude,
    });

    if (!payment) fail("Payment not found.", 404);

    const [details] = await attachCourses([payment]);

    await emailService.sendMail(
      payment.student.email,
      `Payment Receipt ${payment.orderId} - ZmartClass`,
      receiptHTML(details, details.courses)
    );

    return res.json({
      success: true,
      message: `Receipt sent to ${payment.student.email}.`,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// ============================================================
// ADMIN: INVOICE DATA
// The existing frontend handles printing.
// ============================================================

exports.downloadInvoice = async (req, res) => {
  try {
    requireAdmin(req);

    const payment = await prisma.payment.findUnique({
      where: {
        id: positiveId(req.params.id, "payment"),
      },
      include: paymentInclude,
    });

    if (!payment) fail("Payment not found.", 404);

    const [details] = await attachCourses([payment]);

    return res.json({
      success: true,
      data: {
        paymentId: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        recordedByName: payment.recordedByName,
        upiAccountName: payment.upiAccountName,
        utr: payment.paymentId,
        studentName: payment.student.name,
        studentEmail: payment.student.email,
        courseTitle: payment.course.title,
        courses: details.courses,
        date: payment.createdAt,
        signature: payment.signature,
      },
      message: "Invoice data retrieved successfully.",
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// ============================================================
// ADMIN: RECORD MANUAL CASH / UPI PAYMENT
// ============================================================

exports.createManualPayment = async (req, res) => {
  try {
    requireAdmin(req);

    const {
      studentId,
      courseIds,
      amount,
      method,
      utr,
      durationDays,
      recordedByName,
      upiAccountName,
    } = req.body;

    const sId = positiveId(studentId, "student");
    const amt = Number(amount);

    if (!Number.isFinite(amt) || amt <= 0) {
      fail("Enter a valid payment amount greater than zero.");
    }

    const pm = String(method || "").toUpperCase();

    if (!["CASH", "UPI"].includes(pm)) {
      fail("Payment method must be CASH or UPI.");
    }

    const recorder =
      typeof recordedByName === "string"
        ? recordedByName.trim()
        : "";

    if (!recorder) {
      fail(
        "Enter the name of the person recording this payment."
      );
    }

    if (recorder.length > 120) {
      fail("Recorded by must not exceed 120 characters.");
    }

    let accountName = null;
    let reference = null;

    if (pm === "UPI") {
      accountName =
        typeof upiAccountName === "string"
          ? upiAccountName.trim()
          : "";

      if (!accountName) {
        fail(
          "Enter the UPI account name that received the payment."
        );
      }

      if (accountName.length > 120) {
        fail(
          "UPI account name must not exceed 120 characters."
        );
      }

      reference =
        typeof utr === "string" ? utr.trim() : "";

      if (!reference) {
        fail(
          "UTR / reference is required for UPI payments."
        );
      }
    }

    if (
      !Array.isArray(courseIds) ||
      courseIds.length === 0
    ) {
      fail("Select at least one course.");
    }

    const ids = [...new Set(courseIds.map(Number))];

    if (
      ids.some(
        (id) => !Number.isInteger(id) || id <= 0
      )
    ) {
      fail("One or more selected courses are invalid.");
    }

    let duration = null;

    if (
      durationDays !== undefined &&
      durationDays !== null &&
      String(durationDays).trim() !== ""
    ) {
      duration = Number(durationDays);

      const expiryTime = new Date(
        Date.now() + duration * 86400000
      ).getTime();

      if (
        !Number.isInteger(duration) ||
        duration <= 0 ||
        !Number.isFinite(expiryTime)
      ) {
        fail(
          "Access duration must be a valid positive number of days."
        );
      }
    }

    const student = await prisma.user.findUnique({
      where: { id: sId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!student) fail("Student not found.", 404);

    if (
      String(student.role).toUpperCase() !== "STUDENT"
    ) {
      fail("Please select a student account.");
    }

    const courses = await prisma.course.findMany({
      where: {
        id: { in: ids },
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (courses.length !== ids.length) {
      fail("One or more courses were not found.", 404);
    }

    if (reference) {
      const duplicate = await prisma.payment.findFirst({
        where: { paymentId: reference },
        select: { id: true },
      });

      if (duplicate) {
        fail(
          "A payment with this UTR / reference already exists.",
          409
        );
      }
    }

    // Save both receipt identifiers atomically.
    const payment = await prisma.$transaction(
      async (tx) => {
        const created = await tx.payment.create({
          data: {
            orderId: `TMP-${crypto.randomUUID()}`,
            paymentId: reference,
            studentId: sId,
            courseId: ids[0],
            amount: amt,
            currency: "INR",
            status: "COMPLETED",
            method: pm,
            recordedByName: recorder,
            upiAccountName: accountName,
          },
        });

        return tx.payment.update({
          where: { id: created.id },
          data: {
            orderId:
              `PAY-${String(created.id).padStart(6, "0")}`,
          },
        });
      }
    );

    const warnings = [];
    const accessWarnings = [];

    // Preserve existing course access behavior.
    // Already-active enrollments do not require another grant.
    for (const courseId of ids) {
      try {
        await enrollmentService.grantAccess(
          sId,
          courseId,
          duration,
          req.user.id
        );
      } catch (error) {
        if (
          error.message !==
          "Student already has active access to this course"
        ) {
          console.error(
            `Access grant failed for payment ${payment.id}, course ${courseId}:`,
            error.message
          );

          accessWarnings.push(courseId);
        }
      }
    }

    if (accessWarnings.length) {
      warnings.push(
        "Payment was saved, but access could not be granted for some courses. Check Enrollments; do not record the payment again."
      );
    }

    // Preserve optional multi-course payment linking.
    if (prisma.paymentCourse) {
      try {
        await prisma.$transaction(
          ids.map((courseId) =>
            prisma.paymentCourse.create({
              data: {
                paymentId: payment.id,
                courseId,
              },
            })
          )
        );
      } catch (error) {
        console.error(
          "Payment course linking failed:",
          error.message
        );

        warnings.push(
          "Payment was saved, but the complete course list could not be linked to the receipt."
        );
      }
    } else if (ids.length > 1) {
      warnings.push(
        "Payment was saved, but this backend cannot store the full multi-course receipt list."
      );
    }

    const courseTitles = courses
      .map((course) => course.title)
      .join(", ");

    const accessNote = accessWarnings.length
      ? "Please contact your administrator to confirm course access."
      : "You can access your courses from your dashboard.";

    try {
      await notificationService.create({
        studentId: sId,
        title: "Payment Received",
        message:
          `Your payment of ₹${amt} (${pm}) was recorded for: ` +
          `${courseTitles}. ${accessNote}`,
        type: "PAYMENT",
      });
    } catch (error) {
      console.error(
        "Payment notification failed:",
        error.message
      );
    }

    try {
      await emailService.sendMail(
        student.email,
        `Payment Receipt ${payment.orderId} - ZmartClass`,
        receiptHTML(
          { ...payment, student },
          courses,
          accessNote
        )
      );
    } catch (error) {
      console.error(
        "Payment receipt email failed:",
        error.message
      );

      warnings.push(
        "Payment was saved, but the email receipt could not be sent."
      );
    }

    return res.status(201).json({
      success: true,
      message: warnings.length
        ? warnings.join(" ")
        : "Payment recorded and course access confirmed.",
      warnings,
      data: {
        ...payment,
        student,
        courses,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};