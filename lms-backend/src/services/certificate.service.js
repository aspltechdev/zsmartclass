// lms-backend/src/services/certificate.service.js

const prisma = require("../config/prisma");
const emailService = require("./email.service");
const generateQRCode = require("../utils/qrGenerator");
const { computeCourseGating } = require("./gating.service");

// Load the existing certificate PDF generator.
let generateCertificatePDF;

try {
  const pdfModule = require("../utils/certificatePdf");

  if (typeof pdfModule === "function") {
    generateCertificatePDF = pdfModule;
  } else if (
    typeof pdfModule.generateCertificatePDF === "function"
  ) {
    generateCertificatePDF =
      pdfModule.generateCertificatePDF;
  } else if (typeof pdfModule.default === "function") {
    generateCertificatePDF = pdfModule.default;
  } else if (
    typeof pdfModule.default?.generateCertificatePDF ===
    "function"
  ) {
    generateCertificatePDF =
      pdfModule.default.generateCertificatePDF;
  } else {
    throw new Error("Invalid certificate PDF generator export.");
  }
} catch (error) {
  console.error(
    "Error loading certificate PDF generator:",
    error.message
  );

  generateCertificatePDF = async () => {
    throw new Error(
      "PDF generation is not available. Please check certificatePdf.js."
    );
  };
}

class CertificateService {
  /**
   * Certificate requirements:
   * 1. Complete all lessons and module quizzes.
   * 2. If assignments exist, every assignment must be reviewed
   *    and graded by the mentor.
   *
   * SUBMITTED does not mean reviewed.
   * The existing mentor workflow stores reviewed work as GRADED.
   */
  async checkCertificateEligibility(userId, courseId) {
    const studentId = Number(userId);
    const selectedCourseId = Number(courseId);

    if (
      !Number.isInteger(studentId) ||
      studentId <= 0 ||
      !Number.isInteger(selectedCourseId) ||
      selectedCourseId <= 0
    ) {
      const error = new Error("Invalid student or course.");
      error.statusCode = 400;
      throw error;
    }

    const gating = await computeCourseGating(
      studentId,
      selectedCourseId
    );

    const modulesComplete =
      gating.allModulesComplete === true;

    const assignments = await prisma.assignment.findMany({
      where: {
        courseId: selectedCourseId,
      },
      select: {
        id: true,
        title: true,
      },
    });

    let submissions = [];

    if (assignments.length > 0) {
      submissions =
        await prisma.assignmentSubmission.findMany({
          where: {
            studentId,
            assignmentId: {
              in: assignments.map(
                (assignment) => assignment.id
              ),
            },
          },
          select: {
            id: true,
            assignmentId: true,
            status: true,
            marks: true,
            submittedAt: true,
          },
          orderBy: [
            { submittedAt: "desc" },
            { id: "desc" },
          ],
        });
    }

    // If old duplicate records exist, use the latest submission.
    const latestSubmissionByAssignment = new Map();

    for (const submission of submissions) {
      if (
        !latestSubmissionByAssignment.has(
          submission.assignmentId
        )
      ) {
        latestSubmissionByAssignment.set(
          submission.assignmentId,
          submission
        );
      }
    }

    const notSubmitted = [];
    const awaitingReview = [];
    const rejected = [];
    const otherIncomplete = [];

    let reviewedAssignments = 0;

    for (const assignment of assignments) {
      const submission =
        latestSubmissionByAssignment.get(assignment.id);

      const title =
        assignment.title || `Assignment ${assignment.id}`;

      if (!submission) {
        notSubmitted.push(title);
        continue;
      }

      const status = String(
        submission.status || ""
      ).toUpperCase();

      const mentorReviewed =
        status === "GRADED" &&
        submission.marks !== null &&
        submission.marks !== undefined &&
        Number.isFinite(Number(submission.marks));

      if (mentorReviewed) {
        reviewedAssignments += 1;
        continue;
      }

      if (status === "REJECTED") {
        rejected.push(title);
        continue;
      }

      if (
        status === "SUBMITTED" ||
        status === "PENDING" ||
        status === "GRADED"
      ) {
        awaitingReview.push(title);
        continue;
      }

      // Unknown statuses must not unlock the certificate.
      otherIncomplete.push(title);
    }

    // No assignments means this requirement is satisfied.
    const assignmentsComplete =
      reviewedAssignments === assignments.length;

    const reasons = [];

    if (!modulesComplete) {
      reasons.push(
        "Complete all course lessons and pass every module quiz."
      );
    }

    if (notSubmitted.length > 0) {
      reasons.push(
        `Submit these assignments: ${notSubmitted.join(", ")}.`
      );
    }

    if (awaitingReview.length > 0) {
      reasons.push(
        `Waiting for mentor review: ${awaitingReview.join(", ")}. ` +
          "Your certificate stays locked until the mentor reviews and grades every assignment."
      );
    }

    if (rejected.length > 0) {
      reasons.push(
        `These assignments were rejected: ${rejected.join(", ")}. ` +
          "Follow your mentor's feedback and submit them again for review."
      );
    }

    if (otherIncomplete.length > 0) {
      reasons.push(
        `Mentor review is still required for: ${otherIncomplete.join(", ")}.`
      );
    }

    return {
      eligible: modulesComplete && assignmentsComplete,
      modulesComplete,
      assignmentsComplete,
      hasAssignments: assignments.length > 0,
      totalAssignments: assignments.length,
      reviewedAssignments,
      reasons,
    };
  }

  /**
   * Student certificate application.
   * Eligible applications are created as PENDING.
   * Admin approval is still required before downloading.
   */
  async generateCertificate(
    studentId,
    courseId,
    studentName
  ) {
    const sId = Number(studentId);
    const cId = Number(courseId);

    const name = String(studentName || "").trim();

    if (!name) {
      const error = new Error(
        "Please enter your full name as it should appear on the certificate."
      );
      error.statusCode = 400;
      throw error;
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: sId,
        courseId: cId,
      },
      include: {
        user: {
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
            description: true,
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      const error = new Error(
        "You are not enrolled in this course."
      );
      error.statusCode = 400;
      throw error;
    }

    const existingCertificate =
      await prisma.certificate.findFirst({
        where: {
          studentId: sId,
          courseId: cId,
        },
      });

    // Preserve existing requests and issued certificates.
    if (existingCertificate) {
      return {
        certificate: {
          id: existingCertificate.id,
          certificateNo: existingCertificate.certificateNo,
          studentName: existingCertificate.studentName,
          courseTitle: existingCertificate.courseTitle,
          issueDate: existingCertificate.issueDate,
          status: existingCertificate.status,
          pdfUrl: existingCertificate.pdfUrl,
        },
        message:
          existingCertificate.status === "PENDING"
            ? "Certificate already submitted and is awaiting admin review"
            : "Certificate already generated",
        alreadyExists: true,
      };
    }

    // Enforce eligibility on the backend before creating a request.
    const eligibility =
      await this.checkCertificateEligibility(sId, cId);

    if (!eligibility.eligible) {
      const error = new Error(
        eligibility.reasons.join(" ") ||
          "You have not completed all course requirements yet."
      );
      error.statusCode = 400;
      throw error;
    }

    const instructorName =
      enrollment.course.createdBy?.name || "Instructor";

    const certificateNo =
      await this.generateCertificateNumber();

    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:5173";

    const verificationUrl =
      `${frontendUrl}/verify-certificate/${certificateNo}`;

    const qr = await generateQRCode(verificationUrl);
    const template = await this.getTemplate(cId);
    const issueDate = new Date();

    try {
      await generateCertificatePDF({
        studentName: name,
        courseTitle: enrollment.course.title,
        instructorName,
        certificateNo,
        issueDate,
        qrCodeDataUrl: qr.qrUrl || null,
        template:
          template && template.isActive ? template : null,
      });
    } catch (pdfError) {
      console.error(
        "Error generating draft PDF:",
        pdfError.message
      );
    }

    const certificate = await prisma.certificate.create({
      data: {
        certificateNo,
        studentId: sId,
        courseId: cId,
        studentName: name,
        courseTitle: enrollment.course.title,
        instructorName,
        issueDate,
        status: "PENDING",
        qrCodeUrl: qr.qrUrl || verificationUrl,
        pdfUrl: `/certificates/${certificateNo}.pdf`,
      },
    });

    await prisma.enrollment.update({
      where: {
        id: enrollment.id,
      },
      data: {
        certificateId: certificate.id,
        certificateNo: certificate.certificateNo,
      },
    });

    await prisma.notification.create({
      data: {
        studentId: sId,
        title: "Certificate Submitted for Review",
        message:
          `Your certificate for "${enrollment.course.title}" ` +
          "has been generated and is awaiting admin verification. " +
          `Certificate No: ${certificateNo}`,
        type: "CERTIFICATE",
      },
    });

    return {
      certificate: {
        id: certificate.id,
        certificateNo: certificate.certificateNo,
        studentName: certificate.studentName,
        courseTitle: certificate.courseTitle,
        instructorName: certificate.instructorName,
        issueDate: certificate.issueDate,
        status: certificate.status,
        qrCodeUrl: certificate.qrCodeUrl,
        pdfUrl: certificate.pdfUrl,
      },
      message:
        "Certificate generated and submitted for admin review",
      alreadyExists: false,
    };
  }

  /**
   * Get a student's certificate for a course.
   */
  async getCertificate(studentId, courseId) {
    const certificate = await prisma.certificate.findFirst({
      where: {
        studentId: Number(studentId),
        courseId: Number(courseId),
      },
      include: {
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
            description: true,
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!certificate) {
      const error = new Error("Certificate not found");
      error.statusCode = 404;
      throw error;
    }

    return {
      certificate: {
        id: certificate.id,
        certificateNo: certificate.certificateNo,
        studentName: certificate.studentName,
        studentEmail: certificate.student.email,
        courseTitle: certificate.courseTitle,
        courseDescription: certificate.course.description,
        instructorName: certificate.instructorName,
        issueDate: certificate.issueDate,
        status: certificate.status,
        qrCodeUrl: certificate.qrCodeUrl,
        pdfUrl: certificate.pdfUrl,
        createdAt: certificate.createdAt,
      },
    };
  }

  /**
   * Download an approved certificate.
   * Uses the current course template when generating the PDF.
   */
  async downloadCertificate(certificateNo) {
    const certificate = await prisma.certificate.findFirst({
      where: {
        certificateNo,
        status: "ACTIVE",
      },
      include: {
        student: {
          select: {
            name: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!certificate) {
      const error = new Error(
        "Certificate not found or not yet approved by an admin"
      );
      error.statusCode = 404;
      throw error;
    }

    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:5173";

    const verificationUrl =
      `${frontendUrl}/verify-certificate/${certificate.certificateNo}`;

    const qr = await generateQRCode(verificationUrl);

    let issueDate = certificate.issueDate;

    if (
      !issueDate ||
      new Date(issueDate).getFullYear() === 1970
    ) {
      issueDate = new Date();
    }

    const courseTitle =
      certificate.courseTitle ||
      certificate.course?.title ||
      "Course";

    const template = await this.getTemplate(
      certificate.courseId
    );

    const pdfBuffer = await generateCertificatePDF({
      studentName: certificate.studentName || "Student",
      courseTitle,
      instructorName:
        certificate.instructorName || "Instructor",
      certificateNo: certificate.certificateNo || "N/A",
      issueDate,
      qrCodeDataUrl: qr.qrUrl || null,
      template:
        template && template.isActive ? template : null,
    });

    return {
      certificate: {
        certificateNo: certificate.certificateNo,
        studentName: certificate.studentName,
        courseTitle,
        issueDate,
      },
      pdfBuffer: pdfBuffer.toString("base64"),
      filename: `Certificate_${certificate.certificateNo}.pdf`,
    };
  }

  /**
   * Public certificate verification.
   */
  async verifyCertificate(certificateNo) {
    const certificate = await prisma.certificate.findFirst({
      where: {
        certificateNo,
        status: "ACTIVE",
      },
      include: {
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
            description: true,
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!certificate) {
      const error = new Error(
        "Invalid certificate number or certificate has been revoked"
      );
      error.statusCode = 404;
      throw error;
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: certificate.studentId,
        courseId: certificate.courseId,
        completed: true,
      },
    });

    return {
      isValid: true,
      certificate: {
        certificateNo: certificate.certificateNo,
        studentName: certificate.studentName,
        courseTitle: certificate.courseTitle,
        courseDescription: certificate.course.description,
        instructorName: certificate.instructorName,
        issueDate: certificate.issueDate,
        status: certificate.status,
        qrCodeUrl: certificate.qrCodeUrl,
      },
      enrollment: enrollment
        ? {
            status: "completed",
            progress: enrollment.progress,
            completedAt: enrollment.updatedAt,
          }
        : null,
      verifiedAt: new Date(),
    };
  }

  /**
   * List the student's certificate requests and issued certificates.
   */
  async getStudentCertificates(studentId) {
    const certificates = await prisma.certificate.findMany({
      where: {
        studentId: Number(studentId),
        status: {
          in: ["PENDING", "ACTIVE", "REJECTED"],
        },
      },
      orderBy: {
        issueDate: "desc",
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    });

    return certificates.map((certificate) => ({
      id: certificate.id,
      certificateNo: certificate.certificateNo,
      courseTitle: certificate.courseTitle,
      courseId: certificate.courseId,
      instructorName: certificate.instructorName,
      issueDate: certificate.issueDate,
      status: certificate.status,
      revokeReason: certificate.revokeReason,
      qrCodeUrl: certificate.qrCodeUrl,
      pdfUrl: certificate.pdfUrl,
    }));
  }

  /**
   * Revoke a certificate.
   */
  async revokeCertificate(certificateNo, reason) {
    const certificate = await prisma.certificate.findFirst({
      where: {
        certificateNo,
      },
    });

    if (!certificate) {
      const error = new Error("Certificate not found");
      error.statusCode = 404;
      throw error;
    }

    const updatedCertificate =
      await prisma.certificate.update({
        where: {
          id: certificate.id,
        },
        data: {
          status: "REVOKED",
          revokedAt: new Date(),
          revokeReason: reason || "Revoked by admin",
        },
      });

    await prisma.notification.create({
      data: {
        studentId: certificate.studentId,
        title: "Certificate Revoked",
        message:
          `Your certificate (${certificateNo}) for ` +
          `"${certificate.courseTitle}" has been revoked. ` +
          `Reason: ${reason || "Administrative action"}`,
        type: "CERTIFICATE",
      },
    });

    return {
      certificate: {
        certificateNo: updatedCertificate.certificateNo,
        status: updatedCertificate.status,
        revokedAt: updatedCertificate.revokedAt,
        revokeReason: updatedCertificate.revokeReason,
      },
      message: "Certificate revoked successfully",
    };
  }

  /**
   * Admin: list all certificates.
   */
  async getAllCertificatesAdmin() {
    return await prisma.certificate.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
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
      },
    });
  }

  /**
   * Admin: list pending certificate requests.
   */
  async getPendingCertificatesAdmin() {
    return await prisma.certificate.findMany({
      where: {
        status: "PENDING",
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
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
      },
    });
  }

  /**
   * Admin: approve a certificate.
   * Recheck eligibility so older premature applications
   * cannot bypass assignment review.
   */
  async approveCertificate(certificateId) {
    const certificate = await prisma.certificate.findUnique({
      where: {
        id: Number(certificateId),
      },
      include: {
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
      },
    });

    if (!certificate) {
      const error = new Error("Certificate not found");
      error.statusCode = 404;
      throw error;
    }

    if (certificate.status === "ACTIVE") {
      const error = new Error(
        "Certificate is already approved"
      );
      error.statusCode = 400;
      throw error;
    }

    const eligibility =
      await this.checkCertificateEligibility(
        certificate.studentId,
        certificate.courseId
      );

    if (!eligibility.eligible) {
      const error = new Error(
        "Cannot approve this certificate. " +
          eligibility.reasons.join(" ")
      );
      error.statusCode = 400;
      throw error;
    }

    const template = await this.getTemplate(
      certificate.courseId
    );

    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:5173";

    const verificationUrl =
      `${frontendUrl}/verify-certificate/${certificate.certificateNo}`;

    const qr = await generateQRCode(verificationUrl);

    const courseTitle =
      certificate.courseTitle ||
      certificate.course?.title ||
      "Course";

    let issueDate = certificate.issueDate;

    if (
      !issueDate ||
      new Date(issueDate).getFullYear() === 1970
    ) {
      issueDate = new Date();
    }

    try {
      await generateCertificatePDF({
        studentName: certificate.studentName || "Student",
        courseTitle,
        instructorName:
          certificate.instructorName || "Instructor",
        certificateNo: certificate.certificateNo || "N/A",
        issueDate,
        qrCodeDataUrl: qr.qrUrl || null,
        template:
          template && template.isActive ? template : null,
      });
    } catch (pdfError) {
      console.error(
        "Error generating PDF during approval:",
        pdfError.message
      );
    }

    const updated = await prisma.certificate.update({
      where: {
        id: certificate.id,
      },
      data: {
        status: "ACTIVE",
        qrCodeUrl: qr.qrUrl || verificationUrl,
        issueDate,
      },
    });

    await prisma.notification.create({
      data: {
        studentId: certificate.studentId,
        title: "Certificate Approved",
        message:
          `Your certificate for "${courseTitle}" has been ` +
          "verified and is ready to download. " +
          `Certificate No: ${certificate.certificateNo}`,
        type: "CERTIFICATE",
      },
    });

    try {
      await emailService.sendCertificate(
        certificate.student.email,
        certificate.studentName,
        courseTitle,
        certificate.pdfUrl
      );
    } catch (emailError) {
      console.error(
        "Failed to send certificate email:",
        emailError.message
      );
    }

    return {
      certificate: {
        id: updated.id,
        certificateNo: updated.certificateNo,
        status: updated.status,
      },
      message: "Certificate approved successfully",
    };
  }

  /**
   * Admin: reject a certificate request.
   */
  async rejectCertificate(certificateId, reason) {
    const certificate = await prisma.certificate.findUnique({
      where: {
        id: Number(certificateId),
      },
    });

    if (!certificate) {
      const error = new Error("Certificate not found");
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.certificate.update({
      where: {
        id: certificate.id,
      },
      data: {
        status: "REJECTED",
        revokeReason:
          reason || "Rejected by admin during review",
      },
    });

    await prisma.notification.create({
      data: {
        studentId: certificate.studentId,
        title: "Certificate Not Approved",
        message:
          `Your certificate request for "${certificate.courseTitle}" ` +
          "was not approved. " +
          `Reason: ${reason || "Please contact support"}`,
        type: "CERTIFICATE",
      },
    });

    return {
      certificate: {
        id: updated.id,
        status: updated.status,
      },
      message: "Certificate rejected",
    };
  }

  /**
   * Admin: permanently delete a certificate record.
   */
  async deleteCertificateAdmin(certificateId) {
    const certificate = await prisma.certificate.findUnique({
      where: {
        id: Number(certificateId),
      },
    });

    if (!certificate) {
      const error = new Error("Certificate not found");
      error.statusCode = 404;
      throw error;
    }

    await prisma.enrollment.updateMany({
      where: {
        userId: certificate.studentId,
        courseId: certificate.courseId,
      },
      data: {
        certificateId: null,
        certificateNo: null,
      },
    });

    await prisma.certificate.delete({
      where: {
        id: certificate.id,
      },
    });

    return {
      message: "Certificate deleted successfully",
    };
  }

  /**
   * Get the current certificate template for a course.
   */
  async getTemplate(courseId) {
    try {
      const numericCourseId = Number(courseId);

      if (Number.isNaN(numericCourseId)) {
        console.error(
          "Invalid courseId for getTemplate:",
          courseId
        );
        return null;
      }

      return await prisma.certificateTemplate.findUnique({
        where: {
          courseId: numericCourseId,
        },
      });
    } catch (error) {
      console.error("Error in getTemplate:", error);
      return null;
    }
  }

  /**
   * Create or update a course certificate template.
   */
  async upsertTemplate(courseId, data) {
    try {
      const numericCourseId = Number(courseId);

      if (Number.isNaN(numericCourseId)) {
        throw new Error("Invalid course ID");
      }

      const {
        header,
        footer,
        textColor,
        backgroundColor,
        borderColor,
        fontFamily,
        isActive,
      } = data;

      const templateData = {
        header: header || "Certificate of Completion",
        footer: footer || "Issued by ZmartClass",
        textColor: textColor || "#1a1a2e",
        backgroundColor: backgroundColor || "#ffffff",
        borderColor: borderColor || "#667eea",
        fontFamily: fontFamily || "Helvetica",
        isActive: isActive !== undefined ? isActive : true,
      };

      return await prisma.certificateTemplate.upsert({
        where: {
          courseId: numericCourseId,
        },
        update: templateData,
        create: {
          courseId: numericCourseId,
          ...templateData,
        },
      });
    } catch (error) {
      console.error("Error in upsertTemplate:", error);
      throw error;
    }
  }

  /**
   * Legacy helper, retained for compatibility.
   * No timer or scheduler invokes this method.
   * Uses the same assignment-review eligibility rules.
   */
  async autoVerifyPendingCertificates() {
    const pending = await prisma.certificate.findMany({
      where: {
        status: "PENDING",
      },
      select: {
        id: true,
        studentId: true,
        courseId: true,
        certificateNo: true,
      },
    });

    let issued = 0;
    let skipped = 0;

    for (const certificate of pending) {
      try {
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            userId: certificate.studentId,
            courseId: certificate.courseId,
          },
          select: {
            id: true,
          },
        });

        if (!enrollment) {
          skipped += 1;
          continue;
        }

        const eligibility =
          await this.checkCertificateEligibility(
            certificate.studentId,
            certificate.courseId
          );

        if (!eligibility.eligible) {
          skipped += 1;
          continue;
        }

        await this.approveCertificate(certificate.id);
        issued += 1;
      } catch (error) {
        skipped += 1;

        console.error(
          `Auto-verify failed for ${certificate.certificateNo}:`,
          error.message
        );
      }
    }

    return {
      issued,
      skipped,
      checked: pending.length,
    };
  }

  /**
   * Generate a unique certificate number.
   */
  async generateCertificateNumber() {
    const timestamp = Date.now().toString().slice(-6);

    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");

    const certificateNo = `CERT-${timestamp}-${random}`;

    const existing = await prisma.certificate.findFirst({
      where: {
        certificateNo,
      },
    });

    if (existing) {
      return this.generateCertificateNumber();
    }

    return certificateNo;
  }
}

module.exports = new CertificateService();