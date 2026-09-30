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

  return res
    .status(error.code === "P2002" ? 409 : error.statusCode || 400)
    .json({
      success: false,
      message:
        error.code === "P2002"
          ? "A payment with this reference already exists. Refresh payment records before retrying."
          : error.message,
    });
};

const requireAdmin = (req) => {
  if (String(req.user?.role || "").toUpperCase() !== "ADMIN") {
    fail("Only administrators can perform this action.", 403);
  }
};

const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]
  );

const receiptAmount = (payment) =>
  `${payment.currency || "INR"} ${Number(
    payment.amount || 0
  ).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const receiptDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }) + " IST";
};

/**
 * Attach the complete course list where PaymentCourse is available.
 * Otherwise retain the primary course.
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

      const courseIds = [...new Set(links.map((link) => link.courseId))];

      const courses = courseIds.length
        ? await prisma.course.findMany({
            where: { id: { in: courseIds } },
            select: { id: true, title: true },
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
 * Branded receipt email.
 * Used by both manual payment creation and receipt resending.
 * ZC is rendered using HTML, so no external logo image is required.
 * All dynamic values are escaped.
 */
const receiptHTML = (payment, courses = [], note = "") => {
  const method = String(payment.method || "").toUpperCase();
  const status = String(payment.status || "").toUpperCase();
  const receiptNo = payment.orderId || payment.id || "—";
  const amount = receiptAmount(payment);

  const rows = [
    ["Receipt No", receiptNo],
    ["Student", payment.student?.name || "—"],
    ["Email", payment.student?.email || "—"],
    ["Payment date", receiptDate(payment.createdAt)],
    ["Status", status || "—"],
    ["Payment method", method || "—"],
    ["Recorded by", payment.recordedByName || "Not recorded"],
    ...(method === "UPI"
      ? [
          ["UPI account name", payment.upiAccountName || "Not recorded"],
          ["UTR / Reference", payment.paymentId || "—"],
        ]
      : []),
  ];

  const detailsHTML = rows
    .map(
      ([label, value]) => `
        <tr>
          <td
            width="38%"
            style="padding:11px 14px;border-bottom:1px solid #e8edf3;color:#64748b;font-size:13px;vertical-align:top;"
          >
            ${escapeHTML(label)}
          </td>
          <td
            style="padding:11px 14px;border-bottom:1px solid #e8edf3;color:#172033;font-size:13px;vertical-align:top;word-break:break-word;"
          >
            ${escapeHTML(value)}
          </td>
        </tr>
      `
    )
    .join("");

  const coursesHTML = courses.length
    ? courses
        .map(
          (course) => `
            <div style="margin-top:6px;color:#475569;font-size:13px;line-height:20px;">
              ${escapeHTML(course.title || "Course")}
            </div>
          `
        )
        .join("")
    : `
        <div style="margin-top:6px;color:#64748b;font-size:13px;">
          Course details unavailable
        </div>
      `;

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Payment Receipt - ZmartClass</title>
      </head>

      <body style="margin:0;padding:0;background:#f3f5f9;font-family:Arial,Helvetica,sans-serif;color:#172033;">
        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="background:#f3f5f9;"
        >
          <tr>
            <td align="center" style="padding:24px 12px;">
              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="max-width:640px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;"
              >
                <tr>
                  <td style="padding:26px 24px 22px;border-bottom:3px solid #6455ed;">
                    <table
                      role="presentation"
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                    >
                      <tr>
                        <td width="70" style="vertical-align:middle;">
                          <table
                            role="presentation"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                          >
                            <tr>
                              <td
                                width="56"
                                height="56"
                                align="center"
                                valign="middle"
                                bgcolor="#ffbf19"
                                style="width:56px;height:56px;border-radius:14px;color:#111827;font-family:Georgia,serif;font-size:23px;"
                              >
                                ZC
                              </td>
                            </tr>
                          </table>
                        </td>

                        <td style="vertical-align:middle;">
                          <div style="color:#172033;font-size:25px;font-weight:700;line-height:30px;">
                            ZmartClass
                          </div>
                          <div style="margin-top:4px;color:#64748b;font-size:12px;line-height:18px;">
                            Learning Management System
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:24px;">
                    <h2 style="margin:0 0 8px;color:#5145ce;font-size:22px;line-height:30px;">
                      Payment Receipt
                    </h2>

                    <p style="margin:0 0 22px;color:#64748b;font-size:13px;">
                      Receipt No: <strong>${escapeHTML(receiptNo)}</strong>
                    </p>

                    <p style="margin:0 0 10px;font-size:14px;line-height:22px;">
                      Hi ${escapeHTML(payment.student?.name || "Student")},
                    </p>

                    <p style="margin:0 0 20px;font-size:14px;line-height:22px;color:#475569;">
                      Here are your payment details:
                    </p>

                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                      style="border:1px solid #e2e8f0;border-collapse:collapse;"
                    >
                      <tbody>
                        ${detailsHTML}
                      </tbody>
                    </table>

                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                      style="margin-top:24px;border:1px solid #e2e8f0;border-collapse:collapse;"
                    >
                      <thead>
                        <tr>
                          <th
                            align="left"
                            style="padding:12px 14px;background:#f1f3fc;border-bottom:1px solid #e2e8f0;color:#475569;font-size:12px;"
                          >
                            DESCRIPTION / COURSE(S)
                          </th>
                          <th
                            align="right"
                            style="padding:12px 14px;background:#f1f3fc;border-bottom:1px solid #e2e8f0;color:#475569;font-size:12px;"
                          >
                            AMOUNT
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        <tr>
                          <td style="padding:16px 14px;vertical-align:top;">
                            <strong style="font-size:14px;color:#172033;">
                              Course payment
                            </strong>
                            ${coursesHTML}
                          </td>
                          <td
                            align="right"
                            style="padding:16px 14px;vertical-align:top;font-size:14px;font-weight:700;white-space:nowrap;"
                          >
                            ${escapeHTML(amount)}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <table
                      role="presentation"
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                      style="margin-top:16px;background:#f5f3ff;border:1px solid #ded8ff;border-radius:8px;"
                    >
                      <tr>
                        <td style="padding:16px;color:#33268e;font-size:16px;font-weight:700;">
                          Total amount
                        </td>
                        <td align="right" style="padding:16px;color:#33268e;font-size:18px;font-weight:700;">
                          ${escapeHTML(amount)}
                        </td>
                      </tr>
                    </table>

                    ${
                      note
                        ? `
                          <p style="margin:22px 0 0;font-size:14px;line-height:22px;color:#475569;">
                            ${escapeHTML(note)}
                          </p>
                        `
                        : ""
                    }

                    <p style="margin:20px 0 0;color:#64748b;font-size:12px;line-height:20px;">
                      Please quote receipt number
                      <strong>${escapeHTML(receiptNo)}</strong>
                      for any payment enquiries.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td
                    align="center"
                    style="padding:20px 24px;border-top:1px solid #e2e8f0;background:#fafbfe;"
                  >
                    <div style="color:#172033;font-size:14px;font-weight:700;">
                      Thank you for choosing ZmartClass.
                    </div>
                    <div style="margin-top:5px;color:#64748b;font-size:12px;">
                      ZmartClass LMS
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

// STUDENT: CREATE A PENDING PAYMENT

exports.createPayment = async (req, res) => {
  try {
    const studentId = positiveId(req.user.id, "student");
    const { courseId, amount, method, currency, orderId } = req.body;

    const cId = positiveId(courseId, "course");
    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      fail("Enter a valid payment amount greater than zero.");
    }

    const course = await prisma.course.findUnique({
      where: { id: cId },
    });

    if (!course) fail("Course not found.", 404);

    const existingEnrollment = await prisma.enrollment.findFirst({
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
        orderId: orderId || `ORD-${crypto.randomUUID()}`,
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

// STUDENT: PAYMENT HISTORY

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

// STUDENT: PAYMENT DETAILS

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

    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
};

// STUDENT: CANCEL A PENDING PAYMENT

exports.updateMyPaymentStatus = async (req, res) => {
  try {
    const studentId = positiveId(req.user.id, "student");
    const paymentId = positiveId(req.params.id, "payment");
    const status = String(req.body.status || "").toUpperCase();

    if (status !== "CANCELLED") {
      fail(
        "Students can only cancel pending payments. Payment confirmation must be completed by an administrator or the payment gateway.",
        403
      );
    }

    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, studentId },
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
      data: { status: "CANCELLED" },
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

// ADMIN: ALL PAYMENTS

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

// ADMIN: PAYMENT DETAILS

exports.getPaymentById = async (req, res) => {
  try {
    requireAdmin(req);

    const payment = await prisma.payment.findUnique({
      where: { id: positiveId(req.params.id, "payment") },
      include: paymentInclude,
    });

    if (!payment) fail("Payment not found.", 404);

    const [data] = await attachCourses([payment]);
    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
};

// ADMIN: PAYMENT STATISTICS

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
      prisma.payment.count({ where: { status: "COMPLETED" } }),
      prisma.payment.count({ where: { status: "PENDING" } }),
      prisma.payment.count({ where: { status: "FAILED" } }),
      prisma.payment.count({ where: { status: "REFUNDED" } }),
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
          createdAt: { gte: start, lt: end },
        },
        _sum: { amount: true },
      });

      monthlyRevenue.push({
        month: start.toLocaleString("default", { month: "short" }),
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

// ADMIN: UPDATE PAYMENT STATUS

exports.updatePaymentStatus = async (req, res) => {
  try {
    requireAdmin(req);

    const paymentId = positiveId(req.params.id, "payment");
    const status = String(req.body.status || "").toUpperCase();

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

    const updatedPayment = await prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id: paymentId },
        data: { status },
        include: paymentInclude,
      });

      if (status === "COMPLETED") {
        const existingEnrollment = await tx.enrollment.findFirst({
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
    });

    return res.json({
      success: true,
      data: updatedPayment,
      message: "Payment status updated successfully.",
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// ADMIN: DELETE PAYMENT

exports.deletePayment = async (req, res) => {
  try {
    requireAdmin(req);

    const paymentId = positiveId(req.params.id, "payment");

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { id: true },
    });

    if (!payment) fail("Payment not found.", 404);

    await prisma.payment.delete({ where: { id: paymentId } });

    return res.json({
      success: true,
      message: "Payment deleted successfully.",
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// ADMIN: SEND EMAIL RECEIPT

exports.sendReceipt = async (req, res) => {
  try {
    requireAdmin(req);

    const payment = await prisma.payment.findUnique({
      where: { id: positiveId(req.params.id, "payment") },
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

// ADMIN: INVOICE DATA
// Printing is handled by the frontend.

exports.downloadInvoice = async (req, res) => {
  try {
    requireAdmin(req);

    const payment = await prisma.payment.findUnique({
      where: { id: positiveId(req.params.id, "payment") },
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

// ADMIN: RECORD MANUAL CASH / UPI PAYMENT

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
      fail("Enter the name of the person recording this payment.");
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
        fail("Enter the UPI account name that received the payment.");
      }

      if (accountName.length > 120) {
        fail("UPI account name must not exceed 120 characters.");
      }

      reference = typeof utr === "string" ? utr.trim() : "";

      if (!reference) {
        fail("UTR / reference is required for UPI payments.");
      }
    }

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      fail("Select at least one course.");
    }

    const ids = [...new Set(courseIds.map(Number))];

    if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
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
        fail("Access duration must be a valid positive number of days.");
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

    if (String(student.role).toUpperCase() !== "STUDENT") {
      fail("Please select a student account.");
    }

    const courses = await prisma.course.findMany({
      where: { id: { in: ids } },
      select: { id: true, title: true },
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
        fail("A payment with this UTR / reference already exists.", 409);
      }
    }

    // Save the payment and final receipt number atomically.
    const payment = await prisma.$transaction(async (tx) => {
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
          orderId: `PAY-${String(created.id).padStart(6, "0")}`,
        },
      });
    });

    const warnings = [];
    const accessWarnings = [];

    // Preserve the existing course access behavior.
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
        console.error("Payment course linking failed:", error.message);

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
      console.error("Payment notification failed:", error.message);
    }

    try {
      await emailService.sendMail(
        student.email,
        `Payment Receipt ${payment.orderId} - ZmartClass`,
        receiptHTML({ ...payment, student }, courses, accessNote)
      );
    } catch (error) {
      console.error("Payment receipt email failed:", error.message);

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