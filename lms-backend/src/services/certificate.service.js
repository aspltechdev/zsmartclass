// src/services/certificate.service.js
const prisma = require("../config/prisma");
const emailService = require("./email.service");
const generateQRCode = require("../utils/qrGenerator");

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
   * Generate Certificate (student self-service)
   */
  async generateCertificate(studentId, courseId) {
    // 1. Check enrollment and completion
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: studentId,
        courseId,
        completed: true
      },
      include: {
        user: {
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

    if (!enrollment) {
      const error = new Error(
        "You must complete the course before generating a certificate"
      );
      error.statusCode = 400;
      throw error;
    }

    if (enrollment.progress < 100) {
      const error = new Error(
        "Course progress must be 100% to generate certificate"
      );
      error.statusCode = 400;
      throw error;
    }

    // 2. Check if certificate already exists
    const existingCertificate = await prisma.certificate.findFirst({
      where: {
        studentId,
        courseId
      }
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
          pdfUrl: existingCertificate.pdfUrl
        },
        message:
          existingCertificate.status === "PENDING"
            ? "Certificate already submitted and is awaiting admin review"
            : "Certificate already generated",
        alreadyExists: true
      };
    }

    // 3. Generate unique certificate number
    const certificateNo = await this.generateCertificateNumber();

    // 4. Generate QR code
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/verify-certificate/${certificateNo}`;
    const qr = await generateQRCode(verificationUrl);

    // 5. Get the course template if exists
    const template = await this.getTemplate(courseId);

    // 6. FIXED: Create a proper issue date (current date)
    const issueDate = new Date();
    console.log("📅 New certificate issue date:", issueDate);

    // 7. Generate a draft PDF with the template if available
    try {
      await generateCertificatePDF({
        studentName: enrollment.user.name,
        courseTitle: enrollment.course.title,
        instructorName: enrollment.course.createdBy.name,
        certificateNo: certificateNo,
        issueDate: issueDate,
        qrCodeDataUrl: qr.qrUrl || null,
        template: template && template.isActive ? template : null
      });
      console.log("✅ Draft PDF generated successfully");
    } catch (pdfError) {
      console.error("❌ Error generating draft PDF:", pdfError.message);
    }

    // 8. Create certificate record as PENDING with the correct date
    const certificate = await prisma.certificate.create({
      data: {
        certificateNo,
        studentId,
        courseId,
        studentName: enrollment.user.name,
        courseTitle: enrollment.course.title,
        instructorName: enrollment.course.createdBy.name,
        issueDate: issueDate,
        status: "PENDING",
        qrCodeUrl: qr.qrUrl || verificationUrl,
        pdfUrl: `/certificates/${certificateNo}.pdf`
      }
    });

    // 9. Update enrollment with certificate reference
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        certificateId: certificate.id,
        certificateNo: certificate.certificateNo
      }
    });

    // 10. Notify the student
    await prisma.notification.create({
      data: {
        studentId,
        title: "Certificate Submitted for Review",
        message: `Your certificate for "${enrollment.course.title}" has been generated and is awaiting admin verification. Certificate No: ${certificateNo}`,
        type: "CERTIFICATE"
      }
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
        pdfUrl: certificate.pdfUrl
      },
      message: "Certificate generated and submitted for admin review",
      alreadyExists: false
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
   * Get All Certificates for Student
   */
  async getStudentCertificates(studentId) {
    const certificates = await prisma.certificate.findMany({
      where: {
        studentId,
        status: "ACTIVE"
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