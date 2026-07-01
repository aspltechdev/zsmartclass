// // src/services/certificate.service.js
// const prisma = require("../config/prisma");
// const { v4: uuidv4 } = require("uuid");
// const emailService = require("./email.service");
// const certificatePdf = require("../utils/certificatePdf");
// const qrGenerator = require("../utils/qrGenerator");

// class CertificateService {
//   /**
//    * Generate Certificate
//    */
//   async generateCertificate(studentId, courseId) {
//     // 1. Check enrollment and completion
//     const enrollment = await prisma.enrollment.findFirst({
//       where: {
//         studentId,
//         courseId,
//         completed: true
//       },
//       include: {
//         student: {
//           select: {
//             id: true,
//             name: true,
//             email: true
//           }
//         },
//         course: {
//           select: {
//             id: true,
//             title: true,
//             description: true,
//             createdBy: {
//               select: {
//                 id: true,
//                 name: true
//               }
//             }
//           }
//         }
//       }
//     });

//     if (!enrollment) {
//       const error = new Error(
//         "You must complete the course before generating a certificate"
//       );
//       error.statusCode = 400;
//       throw error;
//     }

//     // Verify progress is 100%
//     if (enrollment.progress < 100) {
//       const error = new Error(
//         "Course progress must be 100% to generate certificate"
//       );
//       error.statusCode = 400;
//       throw error;
//     }

//     // 2. Check if certificate already exists
//     const existingCertificate = await prisma.certificate.findFirst({
//       where: {
//         studentId,
//         courseId
//       }
//     });

//     if (existingCertificate) {
//       return {
//         certificate: {
//           id: existingCertificate.id,
//           certificateNo: existingCertificate.certificateNo,
//           studentName: existingCertificate.studentName,
//           courseTitle: existingCertificate.courseTitle,
//           issueDate: existingCertificate.issueDate,
//           status: existingCertificate.status
//         },
//         message: "Certificate already generated",
//         alreadyExists: true
//       };
//     }

//     // 3. Generate unique certificate number
//     const certificateNo = await this.generateCertificateNumber();

//     // 4. Generate QR code for verification
//     const verificationUrl = `${process.env.FRONTEND_URL}/verify-certificate/${certificateNo}`;
//     const qrCodeDataUrl = await qrGenerator.generateQRCode(verificationUrl);

//     // 5. Generate PDF
//     const pdfBuffer = await certificatePdf.generateCertificatePDF({
//       studentName: enrollment.student.name,
//       courseTitle: enrollment.course.title,
//       instructorName: enrollment.course.createdBy.name,
//       certificateNo: certificateNo,
//       issueDate: new Date(),
//       qrCodeDataUrl: qrCodeDataUrl
//     });

//     // 6. Create certificate record
//     const certificate = await prisma.certificate.create({
//       data: {
//         certificateNo,
//         studentId,
//         courseId,
//         studentName: enrollment.student.name,
//         courseTitle: enrollment.course.title,
//         instructorName: enrollment.course.createdBy.name,
//         issueDate: new Date(),
//         status: "ACTIVE",
//         qrCodeUrl: verificationUrl,
//         pdfUrl: `/certificates/${certificateNo}.pdf`
//       }
//     });

//     // 7. Update enrollment with certificate reference
//     await prisma.enrollment.update({
//       where: { id: enrollment.id },
//       data: {
//         certificateId: certificate.id,
//         certificateNo: certificate.certificateNo
//       }
//     });

//     // 8. Create notification
//     await prisma.notification.create({
//       data: {
//         studentId,
//         title: "Certificate Generated",
//         message: `Your certificate for "${enrollment.course.title}" has been generated successfully. Certificate No: ${certificateNo}`,
//         type: "CERTIFICATE"
//       }
//     });

//     // 9. Send certificate email (non-blocking)
//     try {
//       await emailService.sendCertificateEmail(
//         enrollment.student.email,
//         enrollment.student.name,
//         enrollment.course.title,
//         certificateNo,
//         pdfBuffer
//       );
//     } catch (emailError) {
//       console.error("Failed to send certificate email:", emailError.message);
//     }

//     return {
//       certificate: {
//         id: certificate.id,
//         certificateNo: certificate.certificateNo,
//         studentName: certificate.studentName,
//         courseTitle: certificate.courseTitle,
//         instructorName: certificate.instructorName,
//         issueDate: certificate.issueDate,
//         status: certificate.status,
//         qrCodeUrl: certificate.qrCodeUrl,
//         pdfUrl: certificate.pdfUrl
//       },
//       message: "Certificate generated successfully",
//       alreadyExists: false
//     };
//   }

//   /**
//    * Get Certificate Details
//    */
//   async getCertificate(studentId, courseId) {
//     const certificate = await prisma.certificate.findFirst({
//       where: {
//         studentId,
//         courseId,
//         status: "ACTIVE"
//       },
//       include: {
//         student: {
//           select: {
//             id: true,
//             name: true,
//             email: true
//           }
//         },
//         course: {
//           select: {
//             id: true,
//             title: true,
//             description: true,
//             createdBy: {
//               select: {
//                 id: true,
//                 name: true
//               }
//             }
//           }
//         }
//       }
//     });

//     if (!certificate) {
//       const error = new Error("Certificate not found");
//       error.statusCode = 404;
//       throw error;
//     }

//     return {
//       certificate: {
//         id: certificate.id,
//         certificateNo: certificate.certificateNo,
//         studentName: certificate.studentName,
//         studentEmail: certificate.student.email,
//         courseTitle: certificate.courseTitle,
//         courseDescription: certificate.course.description,
//         instructorName: certificate.instructorName,
//         issueDate: certificate.issueDate,
//         status: certificate.status,
//         qrCodeUrl: certificate.qrCodeUrl,
//         pdfUrl: certificate.pdfUrl,
//         createdAt: certificate.createdAt
//       }
//     };
//   }

//   /**
//    * Download Certificate PDF
//    */
//   async downloadCertificate(certificateNo) {
//     // Find certificate
//     const certificate = await prisma.certificate.findFirst({
//       where: {
//         certificateNo,
//         status: "ACTIVE"
//       },
//       include: {
//         student: {
//           select: {
//             name: true
//           }
//         },
//         course: {
//           select: {
//             title: true,
//             createdBy: {
//               select: {
//                 name: true
//               }
//             }
//           }
//         }
//       }
//     });

//     if (!certificate) {
//       const error = new Error("Certificate not found");
//       error.statusCode = 404;
//       throw error;
//     }

//     // Generate QR code for verification
//     const verificationUrl = `${process.env.FRONTEND_URL}/verify-certificate/${certificate.certificateNo}`;
//     const qrCodeDataUrl = await qrGenerator.generateQRCode(verificationUrl);

//     // Generate PDF
//     const pdfBuffer = await certificatePdf.generateCertificatePDF({
//       studentName: certificate.studentName,
//       courseTitle: certificate.courseTitle,
//       instructorName: certificate.instructorName,
//       certificateNo: certificate.certificateNo,
//       issueDate: certificate.issueDate,
//       qrCodeDataUrl: qrCodeDataUrl
//     });

//     return {
//       certificate: {
//         certificateNo: certificate.certificateNo,
//         studentName: certificate.studentName,
//         courseTitle: certificate.courseTitle,
//         issueDate: certificate.issueDate
//       },
//       pdfBuffer: pdfBuffer.toString('base64'),
//       filename: `Certificate_${certificate.certificateNo}.pdf`
//     };
//   }

//   /**
//    * Verify Certificate
//    */
//   async verifyCertificate(certificateNo) {
//     const certificate = await prisma.certificate.findFirst({
//       where: {
//         certificateNo,
//         status: "ACTIVE"
//       },
//       include: {
//         student: {
//           select: {
//             id: true,
//             name: true,
//             email: true
//           }
//         },
//         course: {
//           select: {
//             id: true,
//             title: true,
//             description: true,
//             createdBy: {
//               select: {
//                 id: true,
//                 name: true
//               }
//             }
//           }
//         }
//       }
//     });

//     if (!certificate) {
//       const error = new Error("Invalid certificate number or certificate has been revoked");
//       error.statusCode = 404;
//       throw error;
//     }

//     // Check if enrollment is still valid
//     const enrollment = await prisma.enrollment.findFirst({
//       where: {
//         studentId: certificate.studentId,
//         courseId: certificate.courseId,
//         completed: true
//       }
//     });

//     return {
//       isValid: true,
//       certificate: {
//         certificateNo: certificate.certificateNo,
//         studentName: certificate.studentName,
//         courseTitle: certificate.courseTitle,
//         courseDescription: certificate.course.description,
//         instructorName: certificate.instructorName,
//         issueDate: certificate.issueDate,
//         status: certificate.status,
//         qrCodeUrl: certificate.qrCodeUrl
//       },
//       enrollment: enrollment ? {
//         status: "completed",
//         progress: enrollment.progress,
//         completedAt: enrollment.updatedAt
//       } : null,
//       verifiedAt: new Date()
//     };
//   }

//   /**
//    * Get All Certificates for Student
//    */
//   async getStudentCertificates(studentId) {
//     const certificates = await prisma.certificate.findMany({
//       where: {
//         studentId,
//         status: "ACTIVE"
//       },
//       orderBy: { issueDate: "desc" },
//       include: {
//         course: {
//           select: {
//             id: true,
//             title: true,
//             description: true
//           }
//         }
//       }
//     });

//     return certificates.map(cert => ({
//       id: cert.id,
//       certificateNo: cert.certificateNo,
//       courseTitle: cert.courseTitle,
//       courseId: cert.courseId,
//       instructorName: cert.instructorName,
//       issueDate: cert.issueDate,
//       status: cert.status,
//       qrCodeUrl: cert.qrCodeUrl,
//       pdfUrl: cert.pdfUrl
//     }));
//   }

//   /**
//    * Revoke Certificate (Admin)
//    */
//   async revokeCertificate(certificateNo, reason) {
//     const certificate = await prisma.certificate.findFirst({
//       where: { certificateNo }
//     });

//     if (!certificate) {
//       const error = new Error("Certificate not found");
//       error.statusCode = 404;
//       throw error;
//     }

//     const updatedCertificate = await prisma.certificate.update({
//       where: { id: certificate.id },
//       data: {
//         status: "REVOKED",
//         revokedAt: new Date(),
//         revokeReason: reason || "Revoked by admin"
//       }
//     });

//     // Notify student
//     await prisma.notification.create({
//       data: {
//         studentId: certificate.studentId,
//         title: "Certificate Revoked",
//         message: `Your certificate (${certificateNo}) for "${certificate.courseTitle}" has been revoked. Reason: ${reason || "Administrative action"}`,
//         type: "CERTIFICATE"
//       }
//     });

//     return {
//       certificate: {
//         certificateNo: updatedCertificate.certificateNo,
//         status: updatedCertificate.status,
//         revokedAt: updatedCertificate.revokedAt,
//         revokeReason: updatedCertificate.revokeReason
//       },
//       message: "Certificate revoked successfully"
//     };
//   }

//   /**
//    * Generate Unique Certificate Number
//    */
//   async generateCertificateNumber() {
//     const timestamp = Date.now().toString().slice(-6);
//     const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
//     const certNo = `CERT-${timestamp}-${random}`;

//     // Verify uniqueness
//     const existing = await prisma.certificate.findFirst({
//       where: { certificateNo: certNo }
//     });

//     if (existing) {
//       return this.generateCertificateNumber(); // Recursive retry
//     }

//     return certNo;
//   }
// }

// module.exports = new CertificateService();

// src/services/certificate.service.js
const prisma = require("../config/prisma");
const emailService = require("./email.service");
const generateCertificatePDF = require("../utils/certificatePdf");
const generateQRCode = require("../utils/qrGenerator");

class CertificateService {
  /**
   * Generate Certificate
   */
  async generateCertificate(studentId, courseId) {
    // 1. Check enrollment and completion
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        courseId,
        completed: true
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

    if (!enrollment) {
      const error = new Error(
        "You must complete the course before generating a certificate"
      );
      error.statusCode = 400;
      throw error;
    }

    // Verify progress is 100%
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
        message: "Certificate already generated",
        alreadyExists: true
      };
    }

    // 3. Generate unique certificate number
    const certificateNo = await this.generateCertificateNumber();

    // 4. Generate QR code
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-certificate/${certificateNo}`;
    const qr = await generateQRCode(verificationUrl);

    // 5. Generate PDF
    const pdf = await generateCertificatePDF({
      studentName: enrollment.student.name,
      courseTitle: enrollment.course.title,
      instructorName: enrollment.course.createdBy.name,
      certificateNo: certificateNo,
      issueDate: new Date(),
      qrCodeDataUrl: qr.qrUrl || qr.qrPath
    });

    // 6. Create certificate record
    const certificate = await prisma.certificate.create({
      data: {
        certificateNo,
        studentId,
        courseId,
        studentName: enrollment.student.name,
        courseTitle: enrollment.course.title,
        instructorName: enrollment.course.createdBy.name,
        issueDate: new Date(),
        status: "ACTIVE",
        qrCodeUrl: qr.qrUrl || verificationUrl,
        qrCodePath: qr.qrPath || null,
        pdfUrl: `/certificates/${certificateNo}.pdf`
      }
    });

    // 7. Update enrollment with certificate reference
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        certificateId: certificate.id,
        certificateNo: certificate.certificateNo
      }
    });

    // 8. Create notification
    await prisma.notification.create({
      data: {
        studentId,
        title: "Certificate Generated",
        message: `Your certificate for "${enrollment.course.title}" has been generated successfully. Certificate No: ${certificateNo}`,
        type: "CERTIFICATE"
      }
    });

    // 9. Send certificate email (non-blocking)
    try {
      await emailService.sendCertificate(
        enrollment.student.email,
        enrollment.student.name,
        enrollment.course.title,
        certificate.pdfUrl
      );
    } catch (emailError) {
      console.error("Failed to send certificate email:", emailError.message);
    }

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
      message: "Certificate generated successfully",
      alreadyExists: false
    };
  }

  /**
   * Get Certificate Details
   */
  async getCertificate(studentId, courseId) {
    const certificate = await prisma.certificate.findFirst({
      where: {
        studentId,
        courseId,
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
    // Find certificate
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
            title: true,
            createdBy: {
              select: {
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

    // Generate QR code for verification
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-certificate/${certificate.certificateNo}`;
    const qr = await generateQRCode(verificationUrl);

    // Generate PDF
    const pdfBuffer = await generateCertificatePDF({
      studentName: certificate.studentName,
      courseTitle: certificate.courseTitle,
      instructorName: certificate.instructorName,
      certificateNo: certificate.certificateNo,
      issueDate: certificate.issueDate,
      qrCodeDataUrl: qr.qrUrl || qr.qrPath
    });

    return {
      certificate: {
        certificateNo: certificate.certificateNo,
        studentName: certificate.studentName,
        courseTitle: certificate.courseTitle,
        issueDate: certificate.issueDate
      },
      pdfBuffer: pdfBuffer.toString('base64'),
      filename: `Certificate_${certificate.certificateNo}.pdf`
    };
  }

  /**
   * Verify Certificate
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

    // Check if enrollment is still valid
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: certificate.studentId,
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

    // Notify student
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

  /**
   * Generate Unique Certificate Number
   */
  async generateCertificateNumber() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const certNo = `CERT-${timestamp}-${random}`;

    // Verify uniqueness
    const existing = await prisma.certificate.findFirst({
      where: { certificateNo: certNo }
    });

    if (existing) {
      return this.generateCertificateNumber(); // Recursive retry
    }

    return certNo;
  }
}

module.exports = new CertificateService();