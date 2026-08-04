// src/utils/certificatePdf.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// pdfkit ships 14 standard fonts only — map a template's freeform
// fontFamily string (e.g. "Georgia, serif") onto the closest built-in.
function resolveFont(fontFamily, bold) {
  const f = (fontFamily || '').toLowerCase();
  if (f.includes('times') || f.includes('georgia') || f.includes('serif')) {
    return bold ? 'Times-Bold' : 'Times-Roman';
  }
  if (f.includes('courier') || f.includes('monospace')) {
    return bold ? 'Courier-Bold' : 'Courier';
  }
  return bold ? 'Helvetica-Bold' : 'Helvetica';
}

class CertificatePdfGenerator {
  
  constructor() {
    // UPDATED: Store badge.png in the SAME directory as this file (src/utils/)
    this.badgeImagePath = path.join(__dirname, 'badge.png');
  }

  /**
   * Custom helper to draw the Logo EXACTLY like the uploaded image.
   * No external images needed.
   */
  drawLogoWithText(doc, x, y, size = 50) {
    const radius = size * 0.22; 

    // 1. Draw the background square with rounded corners
    doc.save();
    doc.path(`M ${x + radius} ${y} 
             L ${x + size - radius} ${y} 
             A ${radius} ${radius} 0 0 1 ${x + size} ${y + radius} 
             L ${x + size} ${y + size - radius} 
             A ${radius} ${radius} 0 0 1 ${x + size - radius} ${y + size} 
             L ${x + radius} ${y + size} 
             A ${radius} ${radius} 0 0 1 ${x} ${y + size - radius} 
             L ${x} ${y + radius} 
             A ${radius} ${radius} 0 0 1 ${x + radius} ${y} 
             Z`);

    // 2. Apply the exact purple-blue gradient background
    const gradient = doc.linearGradient(x, y, x + size, y + size);
    gradient.stop(0, '#7A8BF5'); // Top-left light blue-purple
    gradient.stop(1, '#7048C6'); // Bottom-right deep purple
    doc.fill(gradient);

    // 3. Draw the white Serif "Z" using Times-Roman to look exactly like the image
    const cx = x + (size / 2);
    const cy = y + (size / 2);
    const charSize = size * 0.55;
    
    doc.fillColor('#ffffff')
       .font('Times-Roman') 
       .fontSize(charSize)
       .text('Z', cx - (charSize / 3), cy - (charSize / 2.2), {
         width: size,
         align: 'left'
       });

    doc.restore();

    // 4. Add "ZSmartClass" to the RIGHT of the logo
    const textX = x + size + 12; 
    const textY = y + (size / 2) - 9; 

    doc.fillColor('#1a1a2e')
       .font('Helvetica-Bold')
       .fontSize(18)
       .text('ZSmartClass', textX, textY, {
         align: 'left'
       });
  }

  /**
   * Generate Certificate PDF matching the template design exactly
   */
  async generateCertificatePDF(data) {
    const {
      studentName,
      courseTitle,
      instructorName,
      certificateNo,
      issueDate,
      qrCodeDataUrl,
      template
    } = data;

    // Use template values or defaults
    const textColor = template?.textColor || '#1a1a2e';
    const accentColor = template?.borderColor || '#667eea';
    const backgroundColor = template?.backgroundColor || '#ffffff';
    const footerText = template?.footer || 'Issued by ZSmartClass';
    const fontBold = resolveFont(template?.fontFamily, true);
    const fontRegular = resolveFont(template?.fontFamily, false);

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
           .fill(backgroundColor);

        // ==========================================
        // Border
        // ==========================================
        doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
           .lineWidth(2)
           .stroke(accentColor);

        // ==========================================
        // Top Left Corner Logo & Text
        // ==========================================
        this.drawLogoWithText(doc, 50, 45, 50);

        // ==========================================
        // Top Right Corner Badge (PNG) - Same directory as this file
        // ==========================================
        const badgeX = pageWidth - 70 - 100; // 30px padding from right, minus 100px badge width
        const badgeY = 35; // Align with top logo
        const badgeWidth = 100; // Adjust width of the badge as needed

        try {
          // Check if the badge file exists in the 'utils' folder before trying to place it
          if (fs.existsSync(this.badgeImagePath)) {
            doc.image(this.badgeImagePath, badgeX, badgeY, {
              width: badgeWidth,
              // height will auto-scale based on width
            });
          } else {
            // If the file doesn't exist, just log a warning. The PDF will still be generated!
            console.warn(`⚠️  Badge not found at: ${this.badgeImagePath}. Put your badge.png next to certificatePdf.js`);
          }
        } catch (error) {
          console.error('Error placing badge image:', error.message);
        }

        // ==========================================
        // Header: "CERTIFICATE OF"
        // ==========================================
        doc.fontSize(18)
           .fillColor(accentColor)
           .font(fontBold)
           .text('CERTIFICATE OF', 0, 65, {
             width: pageWidth,
             align: 'center',
             letterSpacing: 3
           });

        // ==========================================
        // Main Title: "COMPLETION"
        // ==========================================
        doc.fontSize(42)
           .fillColor(textColor)
           .font(fontBold)
           .text('COMPLETION', 0, 90, {
             width: pageWidth,
             align: 'center',
             letterSpacing: 2
           });

        // ==========================================
        // Subtitle
        // ==========================================
        doc.fontSize(18)
           .fillColor('#64748b')
           .font(fontRegular)
           .text('This Certificate is proudly Presented to', 0, 150, {
             width: pageWidth,
             align: 'center'
           });

        // ==========================================
        // Student Name
        // ==========================================
        doc.fontSize(32)
           .fillColor(textColor)
           .font(fontBold)
           .text(studentName || 'Student', 0, 185, {
             width: pageWidth,
             align: 'center'
           });

        // ==========================================
        // Completion Text
        // ==========================================
        doc.fontSize(18)
           .fillColor('#64748b')
           .font(fontRegular)
           .text('has successfully completed the online Course:', 0, 235, {
             width: pageWidth,
             align: 'center'
           });

        // ==========================================
        // Course Name
        // ==========================================
        doc.fontSize(26)
           .fillColor(accentColor)
           .font(fontBold)
           .text(courseTitle || 'Course', 0, 265, {
             width: pageWidth,
             align: 'center'
           });

        // ==========================================
        // Description
        // ==========================================
        doc.fontSize(14)
           .fillColor('#94a3b8')
           .font(fontRegular)
           .text(
             'This professional has demonstrated initiative and a commitment to',
             0, 310, {
               width: pageWidth,
               align: 'center'
             }
           )
           .text(
             'and a commitment to deepening their skills and advancing their career. Well done!',
             0, 325, {
               width: pageWidth,
               align: 'center'
             }
           );

        // ==========================================
        // Footer Section
        // ==========================================
        doc.moveTo(100, 395)
           .lineTo(742, 395)
           .lineWidth(1)
           .stroke('#e2e8f0');

        // Date and Certificate ID
        const formattedDate = new Date(issueDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        doc.fontSize(11)
           .fillColor('#64748b')
           .font(fontRegular)
           .text('Date of issue:', 100, 415, {
             width: 150,
             align: 'left'
           });

        doc.fontSize(11)
           .fillColor(textColor)
           .font(fontBold)
           .text(formattedDate || 'N/A', 180, 415, {
             width: 200,
             align: 'left'
           });

        doc.fontSize(11)
           .fillColor('#64748b')
           .font(fontRegular)
           .text('Certificate id:', 100, 435, {
             width: 150,
             align: 'left'
           });

        doc.fontSize(11)
           .fillColor(textColor)
           .font(fontBold)
           .text(certificateNo || 'N/A', 180, 435, {
             width: 200,
             align: 'left'
           });

        // ==========================================
        // QR Code and Seal - Side by side
        // ==========================================
        // QR Code
        if (qrCodeDataUrl) {
          try {
            if (qrCodeDataUrl.startsWith('data:image')) {
              const qrCodeBuffer = Buffer.from(
                qrCodeDataUrl.split(',')[1],
                'base64'
              );
              doc.image(qrCodeBuffer, 630, 410, {
                width: 80,
                height: 80
              });
            }
            doc.fontSize(7)
               .fillColor('#94a3b8')
               .font(fontRegular)
               .text('Scan to verify', 630, 495, {
                 width: 80,
                 align: 'center'
               });
          } catch (qrError) {
            console.error('Error adding QR code to PDF:', qrError);
          }
        }

        // ==========================================
        // Seal / Badge
        // ==========================================
        const sealX = 550;
        const sealY = 450;
        const sealRadius = 40;

        // Outer circle
        doc.circle(sealX, sealY, sealRadius)
           .lineWidth(2)
           .stroke(accentColor);

        // Inner circle
        doc.circle(sealX, sealY, sealRadius - 5)
           .lineWidth(1)
           .stroke(accentColor);

        // Seal text
        doc.fontSize(7)
           .fillColor(textColor)
           .font(fontBold)
           .text('ZSMARTCLASS', sealX - 30, sealY - 12, {
             width: 60,
             align: 'center',
             letterSpacing: 1
           });

        // "COMPLETED" badge inside seal
        doc.fontSize(6)
           .fillColor('#020202')
           .font(fontBold)
           .text('COMPLETED', sealX - 22, sealY + 8, {
             width: 44,
             align: 'center'
           });

        // Small award icon
        doc.circle(sealX, sealY - 20, 4)
           .fill(accentColor);

        // ==========================================
        // Footer Text
        // ==========================================
        doc.fontSize(9)
           .fillColor('#94a3b8')
           .font(fontRegular)
           .text(footerText, 0, 540, {
             width: pageWidth,
             align: 'center'
           });

        doc.fontSize(7)
           .fillColor('#cbd5e1')
           .font(fontRegular)
           .text(
             `Verify at: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-certificate/${certificateNo}`,
             0, 558, {
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
   * Save certificate to file system
   */
  saveCertificateToFile(certificateNo, pdfBuffer) {
    try {
      const certificatesDir = path.join(__dirname, '../../public/certificates');

      if (!fs.existsSync(certificatesDir)) {
        fs.mkdirSync(certificatesDir, { recursive: true });
      }

      const filePath = path.join(certificatesDir, `${certificateNo}.pdf`);
      fs.writeFileSync(filePath, pdfBuffer);

      console.log(`Certificate saved: ${filePath}`);
    } catch (error) {
      console.error('Error saving certificate file:', error.message);
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

// Export as a function
const generator = new CertificatePdfGenerator();
module.exports = function(data) {
  return generator.generateCertificatePDF(data);
};
module.exports.CertificatePdfGenerator = CertificatePdfGenerator;
module.exports.generateCertificatePDF = function(data) {
  return generator.generateCertificatePDF(data);
};