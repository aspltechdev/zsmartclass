// src/services/certificate.service.js
const prisma = require("../config/prisma");
const emailService = require("./email.service");
const generateQRCode = require("../utils/qrGenerator");
const { computeCourseGating } = require("./gating.service");

// Handle PDF import properly
let generateCertificatePDF;
try {
  const pdfModule = require("../utils/certificatePdf");
  if (typeof pdfModule === 'function') {
    generateCertificatePDF = pdfModule;
  } else if (pdfModule.generateCertificatePDF) {
    generateCertificatePDF = pdfModule.generateCertificatePDF;
  } else if (pdfModule.default && typeof pdfModule.default === 'function') {
    generateCertificatePDF = pdfModule.default;
  } else if (pdfModule.default && pdfModule.default.generateCertificatePDF) {
    generateCertificatePDF = pdfModule.default.generateCertificatePDF;
  } else {
    generateCertificatePDF = pdfModule;
  }
  console.log("✅ PDF Generator loaded successfully");
} catch (err) {
  console.error("❌ Error loading PDF generator:", err.message);
  generateCertificatePDF = async () => {
    throw new Error("PDF generation is not available. Please check certificatePdf.js");
  };
}

class CertificateService {
  /**
   * Certificate eligibility (single source of truth for "has this student
   * finished the course"). A student may request a certificate only when:
   *   - every module is complete (all lessons done AND every module quiz passed),
   *     as decided by the gating service, AND
   *   - every assignment in the course has a submission (status SUBMITTED or
   *     GRADED). A course with no assignments clears this automatically.
   */
  async checkCertificateEligibility(userId, courseId) {
    const sId = Number(userId);
    const cId = Number(courseId);

    const gating = await computeCourseGating(sId, cId);
    const modulesComplete = gating.allModulesComplete;

    // Assignments for this course + this student's submissions.
    const assignments = await prisma.assignment.findMany({
      where: { courseId: cId },
      select: { id: true, title: true },
    });

    let assignmentsComplete = true;
    const pendingAssignments = [];

    if (assignments.length > 0) {
      const submissions = await prisma.assignmentSubmission.findMany({
        where: {
          studentId: sId,
          assignmentId: { in: assignments.map((a) => a.id) },
        },
        select: { assignmentId: true, status: true },
      });

      const doneIds = new Set(
        submissions
          .filter((s) => s.status === "SUBMITTED" || s.status === "GRADED")
          .map((s) => s.assignmentId)
      );

      for (const a of assignments) {
        if (!doneIds.has(a.id)) {
          assignmentsComplete = false;
          pendingAssignments.push(a.title);
        }
      }
    }

    const reasons = [];
    if (!modulesComplete) {
      reasons.push(
        "Finish every module first — complete all lessons and pass each module quiz."
      );
    }
    if (!assignmentsComplete) {
      reasons.push(
        pendingAssignments.length
          ? `Submit all assignments (${pendingAssignments.length} still pending).`
          : "Submit all course assignments."
      );
    }

    return {
      eligible: modulesComplete && assignmentsComplete,
      modulesComplete,
      assignmentsComplete,
      reasons,
    };
  }

  /**
   * Generate Certificate (student self-service).
   * `studentName` is entered by the student and is what gets printed on the
   * certificate (not the account name). The certificate is created as PENDING
   * and only becomes downloadable once an admin approves it (status ACTIVE).
   */
  async generateCertificate(studentId, courseId, studentName) {
    const sId = Number(studentId);
    const cId = Number(courseId);

    // 0. The printed name is required and student-supplied.
    const name = (studentName || "").trim();
    if (!name) {
      const error = new Error(
        "Please enter your full name as it should appear on the certificate."
      );
      error.statusCode = 400;
      throw error;
    }

    // 1. Must be enrolled (also gives us course title + instructor name).
    const enrollment = await prisma.enrollment.findFirst({
      where: { userId: sId, courseId: cId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            createdBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!enrollment) {
      const error = new Error("You are not enrolled in this course.");
      error.statusCode = 400;
      throw error;
    }

    // 2. Return an existing request/issue as-is (before re-checking eligibility,
    //    so a previously-approved student isn't blocked by a later data change).
    const existingCertificate = await prisma.certificate.findFirst({
      where: { studentId: sId, courseId: cId },
    });

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

    // 3. Enforce full course completion (modules + quizzes + assignments).
    const eligibility = await this.checkCertificateEligibility(sId, cId);
    if (!eligibility.eligible) {
      const error = new Error(
        eligibility.reasons[0] ||
          "You have not completed all course requirements yet."
      );
      error.statusCode = 400;
      throw error;
    }

    const instructorName = enrollment.course.createdBy?.name || "Instructor";

    // 4. Generate unique certificate number.
    const certificateNo = await this.generateCertificateNumber();

    // 5. Generate QR code.
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verificationUrl = `${frontendUrl}/verify-certificate/${certificateNo}`;
    const qr = await generateQRCode(verificationUrl);

    // 6. Course template (if any) + issue date.
    const template = await this.getTemplate(cId);
    const issueDate = new Date();

    // 7. Draft PDF (best-effort — failure here doesn't block the request).
    try {
      await generateCertificatePDF({
        studentName: name,
        courseTitle: enrollment.course.title,
        instructorName,
        certificateNo,
        issueDate,
        qrCodeDataUrl: qr.qrUrl || null,
        template: template && template.isActive ? template : null,
      });
      console.log("✅ Draft PDF generated successfully");
    } catch (pdfError) {
      console.error("❌ Error generating draft PDF:", pdfError.message);
    }

    // 8. Create certificate record as PENDING with the student-entered name.
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

    // 9. Link the certificate to the enrollment.
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        certificateId: certificate.id,
        certificateNo: certificate.certificateNo,
      },
    });

    // 10. Notify the student.
    await prisma.notification.create({
      data: {
        studentId: sId,
        title: "Certificate Submitted for Review",
        message: `Your certificate for "${enrollment.course.title}" has been generated and is awaiting admin verification. Certificate No: ${certificateNo}`,
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
      message: "Certificate generated and submitted for admin review",
      alreadyExists: false,
    };
  }

  /**
   * Get Certificate Details (student self-service)
   */
  async getCertificate(studentId, courseId) {
    const certificate = await prisma.certificate.findFirst({
      where: {
        studentId,
        courseId
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            createdBy: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
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
        createdAt: certificate.createdAt
      }
    };
  }

  /**
   * Download Certificate PDF
   */
  async downloadCertificate(certificateNo) {
    const certificate = await prisma.certificate.findFirst({
      where: {
        certificateNo,
        status: "ACTIVE"
      },
      include: {
        student: {
          select: {
            name: true
          }
        },
        course: {
          select: {
            title: true
          }
        }
      }
    });

    if (!certificate) {
      const error = new Error(
        "Certificate not found or not yet approved by an admin"
      );
      error.statusCode = 404;
      throw error;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/verify-certificate/${certificate.certificateNo}`;
    const qr = await generateQRCode(verificationUrl);

    // FIXED: Check and fix invalid date
    let issueDate = certificate.issueDate;
    if (!issueDate || new Date(issueDate).getFullYear() === 1970) {
      issueDate = new Date();
      console.log("📅 Fixed invalid issue date in download");
    }

    const courseTitle = certificate.courseTitle || certificate.course?.title || 'Course';
    const template = await this.getTemplate(certificate.courseId);

    const pdfBuffer = await generateCertificatePDF({
      studentName: certificate.studentName || 'Student',
      courseTitle: courseTitle,
      instructorName: certificate.instructorName || 'Instructor',
      certificateNo: certificate.certificateNo || 'N/A',
      issueDate: issueDate,
      qrCodeDataUrl: qr.qrUrl || null,
      template: template && template.isActive ? template : null
    });

    return {
      certificate: {
        certificateNo: certificate.certificateNo,
        studentName: certificate.studentName,
        courseTitle: courseTitle,
        issueDate: issueDate
      },
      pdfBuffer: pdfBuffer.toString('base64'),
      filename: `Certificate_${certificate.certificateNo}.pdf`
    };
  }

  /**
   * Verify Certificate (public)
   */
  async verifyCertificate(certificateNo) {
    const certificate = await prisma.certificate.findFirst({
      where: {
        certificateNo,
        status: "ACTIVE"
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            createdBy: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!certificate) {
      const error = new Error("Invalid certificate number or certificate has been revoked");
      error.statusCode = 404;
      throw error;
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: certificate.studentId,
        courseId: certificate.courseId,
        completed: true
      }
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
        qrCodeUrl: certificate.qrCodeUrl
      },
      enrollment: enrollment ? {
        status: "completed",
        progress: enrollment.progress,
        completedAt: enrollment.updatedAt
      } : null,
      verifiedAt: new Date()
    };
  }

  /**
   * Get All Certificates for Student.
   * Includes PENDING (awaiting review) and REJECTED (declined) alongside ACTIVE
   * so the student can see the status of every request they've made. Download is
   * still gated to ACTIVE certificates (see downloadCertificate).
   */
  async getStudentCertificates(studentId) {
    const certificates = await prisma.certificate.findMany({
      where: {
        studentId,
        status: { in: ["PENDING", "ACTIVE", "REJECTED"] }
      },
      orderBy: { issueDate: "desc" },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true
          }
        }
      }
    });

    return certificates.map(cert => ({
      id: cert.id,
      certificateNo: cert.certificateNo,
      courseTitle: cert.courseTitle,
      courseId: cert.courseId,
      instructorName: cert.instructorName,
      issueDate: cert.issueDate,
      status: cert.status,
      revokeReason: cert.revokeReason,
      qrCodeUrl: cert.qrCodeUrl,
      pdfUrl: cert.pdfUrl
    }));
  }

  /**
   * Revoke Certificate (Admin)
   */
  async revokeCertificate(certificateNo, reason) {
    const certificate = await prisma.certificate.findFirst({
      where: { certificateNo }
    });

    if (!certificate) {
      const error = new Error("Certificate not found");
      error.statusCode = 404;
      throw error;
    }

    const updatedCertificate = await prisma.certificate.update({
      where: { id: certificate.id },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
        revokeReason: reason || "Revoked by admin"
      }
    });

    await prisma.notification.create({
      data: {
        studentId: certificate.studentId,
        title: "Certificate Revoked",
        message: `Your certificate (${certificateNo}) for "${certificate.courseTitle}" has been revoked. Reason: ${reason || "Administrative action"}`,
        type: "CERTIFICATE"
      }
    });

    return {
      certificate: {
        certificateNo: updatedCertificate.certificateNo,
        status: updatedCertificate.status,
        revokedAt: updatedCertificate.revokedAt,
        revokeReason: updatedCertificate.revokeReason
      },
      message: "Certificate revoked successfully"
    };
  }

  // ==========================================
  // ADMIN: review queue
  // ==========================================

  /**
   * List every certificate, any status
   */
  async getAllCertificatesAdmin() {
    return await prisma.certificate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        student: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } }
      }
    });
  }

  /**
   * List only certificates awaiting admin review
   */
  async getPendingCertificatesAdmin() {
    return await prisma.certificate.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: {
        student: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } }
      }
    });
  }

  /**
   * Approve a pending certificate - FIXED with proper date handling
   */
  async approveCertificate(certificateId) {
    const certificate = await prisma.certificate.findUnique({
      where: { id: Number(certificateId) },
      include: {
        student: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } }
      }
    });

    if (!certificate) {
      const error = new Error("Certificate not found");
      error.statusCode = 404;
      throw error;
    }

    if (certificate.status === "ACTIVE") {
      const error = new Error("Certificate is already approved");
      error.statusCode = 400;
      throw error;
    }

    // Get the template for this course
    const template = await this.getTemplate(certificate.courseId);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/verify-certificate/${certificate.certificateNo}`;
    const qr = await generateQRCode(verificationUrl);

    // Get course title
    const courseTitle = certificate.courseTitle || certificate.course?.title || 'Course';

    // FIXED: Check and fix invalid date
    let issueDate = certificate.issueDate;
    if (!issueDate || new Date(issueDate).getFullYear() === 1970) {
      issueDate = new Date();
      console.log("📅 Fixed invalid issue date in approval");
    }

    console.log("📋 Generating PDF with:", {
      studentName: certificate.studentName,
      courseTitle: courseTitle,
      issueDate: issueDate,
      certificateNo: certificate.certificateNo
    });

    // Generate the PDF with the template
    try {
      await generateCertificatePDF({
        studentName: certificate.studentName || 'Student',
        courseTitle: courseTitle,
        instructorName: certificate.instructorName || 'Instructor',
        certificateNo: certificate.certificateNo || 'N/A',
        issueDate: issueDate,
        qrCodeDataUrl: qr.qrUrl || null,
        template: template && template.isActive ? template : null
      });
      console.log("✅ Certificate PDF generated during approval");
    } catch (pdfError) {
      console.error("❌ Error generating PDF during approval:", pdfError.message);
    }

    // Update the certificate
    const updated = await prisma.certificate.update({
      where: { id: certificate.id },
      data: {
        status: "ACTIVE",
        qrCodeUrl: qr.qrUrl || verificationUrl,
        issueDate: issueDate // Update the issue date if it was fixed
      }
    });

    // Notify the student
    await prisma.notification.create({
      data: {
        studentId: certificate.studentId,
        title: "Certificate Approved",
        message: `Your certificate for "${courseTitle}" has been verified and is ready to download. Certificate No: ${certificate.certificateNo}`,
        type: "CERTIFICATE"
      }
    });

    // Send email notification
    try {
      await emailService.sendCertificate(
        certificate.student.email,
        certificate.studentName,
        courseTitle,
        certificate.pdfUrl
      );
    } catch (emailError) {
      console.error("Failed to send certificate email:", emailError.message);
    }

    return {
      certificate: {
        id: updated.id,
        certificateNo: updated.certificateNo,
        status: updated.status
      },
      message: "Certificate approved successfully"
    };
  }

  /**
   * Reject a pending certificate
   */
  async rejectCertificate(certificateId, reason) {
    const certificate = await prisma.certificate.findUnique({
      where: { id: Number(certificateId) }
    });

    if (!certificate) {
      const error = new Error("Certificate not found");
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.certificate.update({
      where: { id: certificate.id },
      data: {
        status: "REJECTED",
        revokeReason: reason || "Rejected by admin during review"
      }
    });

    await prisma.notification.create({
      data: {
        studentId: certificate.studentId,
        title: "Certificate Not Approved",
        message: `Your certificate request for "${certificate.courseTitle}" was not approved. Reason: ${reason || "Please contact support"}`,
        type: "CERTIFICATE"
      }
    });

    return {
      certificate: { id: updated.id, status: updated.status },
      message: "Certificate rejected"
    };
  }

  /**
   * Permanently delete a certificate record
   */
  async deleteCertificateAdmin(certificateId) {
    const certificate = await prisma.certificate.findUnique({
      where: { id: Number(certificateId) }
    });

    if (!certificate) {
      const error = new Error("Certificate not found");
      error.statusCode = 404;
      throw error;
    }

    await prisma.enrollment.updateMany({
      where: { userId: certificate.studentId, courseId: certificate.courseId },
      data: { certificateId: null, certificateNo: null }
    });

    await prisma.certificate.delete({ where: { id: certificate.id } });

    return { message: "Certificate deleted successfully" };
  }

  // ==========================================
  // ADMIN: per-course certificate template
  // ==========================================

  /**
   * Get a course's certificate template
   */
  async getTemplate(courseId) {
    try {
      const numericCourseId = Number(courseId);
      if (isNaN(numericCourseId)) {
        console.error("Invalid courseId for getTemplate:", courseId);
        return null;
      }
      
      const template = await prisma.certificateTemplate.findUnique({
        where: { courseId: numericCourseId }
      });
      
      return template;
    } catch (error) {
      console.error("Error in getTemplate:", error);
      return null;
    }
  }

  /**
   * Create or update a course's certificate template
   */
  async upsertTemplate(courseId, data) {
    try {
      const numericCourseId = Number(courseId);
      if (isNaN(numericCourseId)) {
        throw new Error("Invalid course ID");
      }

      const {
        header,
        footer,
        textColor,
        backgroundColor,
        borderColor,
        fontFamily,
        isActive
      } = data;

      // Ensure all required fields have values
      const templateData = {
        header: header || "Certificate of Completion",
        footer: footer || "Issued by ZSmartClass",
        textColor: textColor || "#1a1a2e",
        backgroundColor: backgroundColor || "#ffffff",
        borderColor: borderColor || "#667eea",
        fontFamily: fontFamily || "Helvetica",
        isActive: isActive !== undefined ? isActive : true
      };

      console.log("Upserting template for course:", numericCourseId);
      console.log("Template data:", templateData);

      const result = await prisma.certificateTemplate.upsert({
        where: { courseId: numericCourseId },
        update: templateData,
        create: {
          courseId: numericCourseId,
          ...templateData
        }
      });

      console.log("Template upsert result:", result);
      return result;
    } catch (error) {
      console.error("Error in upsertTemplate:", error);
      throw error;
    }
  }

  /**
   * Generate Unique Certificate Number
   */
  /**
   * AUTO-VERIFY JOB
   * Finds every PENDING certificate application, re-confirms the student has
   * genuinely completed the course (enrollment.progress >= 100), and issues it
   * by reusing approveCertificate (final PDF + QR + notification + email).
   * Runs on a timer (see scheduler at the bottom of this file) and can also be
   * triggered on demand by an admin.
   */
  async autoVerifyPendingCertificates() {
    const pending = await prisma.certificate.findMany({
      where: { status: "PENDING" },
      select: { id: true, studentId: true, courseId: true, certificateNo: true }
    });

    let issued = 0;
    let skipped = 0;

    for (const cert of pending) {
      try {
        // Re-verify real completion (Enrollment keyed by userId).
        const enrollment = await prisma.enrollment.findFirst({
          where: { userId: cert.studentId, courseId: cert.courseId },
          select: { progress: true, completed: true }
        });

        const done =
          enrollment && (enrollment.progress >= 100 || enrollment.completed);

        if (done) {
          await this.approveCertificate(cert.id);
          issued++;
        } else {
          skipped++;
        }
      } catch (e) {
        console.error(
          `Auto-verify failed for ${cert.certificateNo}:`,
          e.message
        );
      }
    }

    if (issued || skipped) {
      console.log(
        `🎓 Certificate auto-verify: issued ${issued}, pending/incomplete ${skipped}.`
      );
    }

    return { issued, skipped, checked: pending.length };
  }

  async generateCertificateNumber() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const certNo = `CERT-${timestamp}-${random}`;

    const existing = await prisma.certificate.findFirst({
      where: { certificateNo: certNo }
    });

    if (existing) {
      return this.generateCertificateNumber();
    }

    return certNo;
  }
}

module.exports = new CertificateService();

// ============================================================
// AUTO-VERIFY SCHEDULER — DISABLED
// Certificates now require explicit admin approval (per-certificate
// PUT /api/certificates/admin/:id/approve). The previous in-process timer that
// auto-approved every PENDING certificate with progress>=100 has been removed
// so that no certificate is ever issued without a human review. The
// autoVerifyPendingCertificates() method is left in place but is no longer
// scheduled or exposed via any route.
// ============================================================