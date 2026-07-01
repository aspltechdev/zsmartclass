// src/utils/certificatePdf.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class CertificatePdfGenerator {
  /**
   * Generate Certificate PDF
   */
  async generateCertificatePDF(data) {
    const {
      studentName,
      courseTitle,
      instructorName,
      certificateNo,
      issueDate,
      qrCodeDataUrl
    } = data;

    return new Promise((resolve, reject) => {
      try {
        // Create a new PDF document (A4 Landscape)
        const doc = new PDFDocument({
          layout: 'landscape',
          size: 'A4',
          margin: 0
        });

        const buffers = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          
          // Save to file
          this.saveCertificateToFile(certificateNo, pdfBuffer);
          
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Page dimensions (A4 Landscape: 842 x 595 points)
        const pageWidth = 842;
        const pageHeight = 595;

        // ==========================================
        // Background
        // ==========================================
        doc.rect(0, 0, pageWidth, pageHeight)
           .fill('#f8f9fa');

        // ==========================================
        // Outer Border
        // ==========================================
        doc.rect(20, 20, pageWidth - 40, pageHeight - 40)
           .lineWidth(3)
           .stroke('#1a237e');

        // ==========================================
        // Inner Border
        // ==========================================
        doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
           .lineWidth(1)
           .stroke('#3f51b5');

        // ==========================================
        // Decorative corners
        // ==========================================
        this.drawCornerDecorations(doc, pageWidth, pageHeight);

        // ==========================================
        // Header Section
        // ==========================================
        
        // Logo placeholder (you can replace with actual logo)
        doc.circle(421, 80, 25)
           .fill('#1a237e');
        
        doc.fontSize(14)
           .fillColor('#ffffff')
           .font('Helvetica-Bold')
           .text('LMS', 396, 68, {
             width: 50,
             align: 'center'
           });

        // Institution Name
        doc.fontSize(24)
           .fillColor('#1a237e')
           .font('Helvetica-Bold')
           .text('YOUR LEARNING PLATFORM', 0, 130, {
             width: pageWidth,
             align: 'center'
           });

        // Subtitle
        doc.fontSize(12)
           .fillColor('#666666')
           .font('Helvetica')
           .text('Certificate of Completion', 0, 165, {
             width: pageWidth,
             align: 'center'
           });

        // ==========================================
        // Decorative Line
        // ==========================================
        doc.moveTo(200, 190)
           .lineTo(642, 190)
           .lineWidth(1)
           .stroke('#3f51b5');

        // ==========================================
        // Certificate Body
        // ==========================================
        
        // "This is to certify that"
        doc.fontSize(14)
           .fillColor('#333333')
           .font('Helvetica')
           .text('This is to certify that', 0, 220, {
             width: pageWidth,
             align: 'center'
           });

        // Student Name
        doc.fontSize(36)
           .fillColor('#1a237e')
           .font('Helvetica-Bold')
           .text(studentName, 0, 255, {
             width: pageWidth,
             align: 'center'
           });

        // "has successfully completed the course"
        doc.fontSize(14)
           .fillColor('#333333')
           .font('Helvetica')
           .text('has successfully completed the course', 0, 305, {
             width: pageWidth,
             align: 'center'
           });

        // Course Title
        doc.fontSize(24)
           .fillColor('#d32f2f')
           .font('Helvetica-Bold')
           .text(courseTitle, 0, 335, {
             width: pageWidth,
             align: 'center'
           });

        // ==========================================
        // Certificate Details
        // ==========================================
        
        // Certificate Number
        doc.fontSize(10)
           .fillColor('#666666')
           .font('Helvetica')
           .text(`Certificate No: ${certificateNo}`, 100, 400, {
             width: 200,
             align: 'left'
           });

        // Issue Date
        const formattedDate = new Date(issueDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        doc.fontSize(10)
           .fillColor('#666666')
           .font('Helvetica')
           .text(`Issue Date: ${formattedDate}`, 100, 420, {
             width: 200,
             align: 'left'
           });

        // ==========================================
        // Signatures Section
        // ==========================================
        
        // Instructor Signature
        doc.moveTo(150, 480)
           .lineTo(300, 480)
           .lineWidth(1)
           .stroke('#333333');

        doc.fontSize(11)
           .fillColor('#333333')
           .font('Helvetica-Bold')
           .text(instructorName, 150, 490, {
             width: 150,
             align: 'center'
           });

        doc.fontSize(9)
           .fillColor('#666666')
           .font('Helvetica')
           .text('Instructor', 150, 510, {
             width: 150,
             align: 'center'
           });

        // Platform Signature
        doc.moveTo(542, 480)
           .lineTo(692, 480)
           .lineWidth(1)
           .stroke('#333333');

        doc.fontSize(11)
           .fillColor('#333333')
           .font('Helvetica-Bold')
           .text('Platform Admin', 542, 490, {
             width: 150,
             align: 'center'
           });

        doc.fontSize(9)
           .fillColor('#666666')
           .font('Helvetica')
           .text('Learning Platform', 542, 510, {
             width: 150,
             align: 'center'
           });

        // ==========================================
        // QR Code
        // ==========================================
        if (qrCodeDataUrl) {
          const qrCodeBuffer = Buffer.from(
            qrCodeDataUrl.split(',')[1],
            'base64'
          );

          doc.image(qrCodeBuffer, 700, 395, {
            width: 70,
            height: 70
          });

          doc.fontSize(7)
             .fillColor('#999999')
             .font('Helvetica')
             .text('Scan to verify', 700, 470, {
               width: 70,
               align: 'center'
             });
        }

        // ==========================================
        // Footer
        // ==========================================
        doc.fontSize(8)
           .fillColor('#999999')
           .font('Helvetica')
           .text(
             'This certificate is electronically generated and verified by Your Learning Platform.',
             0, 550, {
               width: pageWidth,
               align: 'center'
             }
           );

        doc.fontSize(7)
           .fillColor('#999999')
           .font('Helvetica')
           .text(
             `Verify at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-certificate/${certificateNo}`,
             0, 563, {
               width: pageWidth,
               align: 'center'
             }
           );

        // Finalize PDF
        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Draw decorative corner elements
   */
  drawCornerDecorations(doc, pageWidth, pageHeight) {
    const cornerSize = 30;
    const margin = 35;

    // Top-left corner
    doc.moveTo(margin, margin + cornerSize)
       .lineTo(margin, margin)
       .lineTo(margin + cornerSize, margin)
       .lineWidth(2)
       .stroke('#3f51b5');

    // Top-right corner
    doc.moveTo(pageWidth - margin - cornerSize, margin)
       .lineTo(pageWidth - margin, margin)
       .lineTo(pageWidth - margin, margin + cornerSize)
       .lineWidth(2)
       .stroke('#3f51b5');

    // Bottom-left corner
    doc.moveTo(margin, pageHeight - margin - cornerSize)
       .lineTo(margin, pageHeight - margin)
       .lineTo(margin + cornerSize, pageHeight - margin)
       .lineWidth(2)
       .stroke('#3f51b5');

    // Bottom-right corner
    doc.moveTo(pageWidth - margin - cornerSize, pageHeight - margin)
       .lineTo(pageWidth - margin, pageHeight - margin)
       .lineTo(pageWidth - margin, pageHeight - margin - cornerSize)
       .lineWidth(2)
       .stroke('#3f51b5');
  }

  /**
   * Save certificate to file system
   */
  saveCertificateToFile(certificateNo, pdfBuffer) {
    try {
      const certificatesDir = path.join(__dirname, '../../public/certificates');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(certificatesDir)) {
        fs.mkdirSync(certificatesDir, { recursive: true });
      }

      const filePath = path.join(certificatesDir, `${certificateNo}.pdf`);
      fs.writeFileSync(filePath, pdfBuffer);
      
      console.log(`Certificate saved: ${filePath}`);
    } catch (error) {
      console.error('Error saving certificate file:', error.message);
      // Don't throw - file saving is non-critical
    }
  }

  /**
   * Get saved certificate file path
   */
  getCertificatePath(certificateNo) {
    const filePath = path.join(
      __dirname,
      '../../public/certificates',
      `${certificateNo}.pdf`
    );

    if (fs.existsSync(filePath)) {
      return filePath;
    }

    return null;
  }

  /**
   * Delete certificate file
   */
  deleteCertificateFile(certificateNo) {
    try {
      const filePath = this.getCertificatePath(certificateNo);
      
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Certificate deleted: ${filePath}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting certificate file:', error.message);
      return false;
    }
  }
}

module.exports = new CertificatePdfGenerator();