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

/**
 * The certificate shows the heading on two lines: a small accent "eyebrow"
 * above a large title (e.g. "CERTIFICATE OF" / "COMPLETION").
 *
 * The admin template stores ONE header string, so split it sensibly:
 *   "Certificate of Completion" -> eyebrow "CERTIFICATE OF", title "COMPLETION"
 *   "Achievement Award"         -> title only (no eyebrow)
 * This keeps the designer's Header Text meaningful without a schema change.
 */
function splitHeader(header) {
  const raw = (header || '').trim();

  if (!raw) {
    return { eyebrow: 'CERTIFICATE OF', title: 'COMPLETION' };
  }

  // Split on the last standalone "of" / "for" / "in"
  const m = raw.match(/^(.*\b(?:of|for|in))\s+(.+)$/i);
  if (m) {
    return {
      eyebrow: m[1].toUpperCase(),
      title: m[2].toUpperCase()
    };
  }

  // No natural split — render it all as the title.
  return { eyebrow: '', title: raw.toUpperCase() };
}

class CertificatePdfGenerator {

  constructor() {
    // Store badge.png in the SAME directory as this file (src/utils/)
    this.badgeImagePath = path.join(__dirname, 'badge.png');
  }

  /**
   * Draw the brand logo (gradient rounded square + "Z") with the wordmark.
   */
  drawLogoWithText(doc, x, y, size = 50) {
    const radius = size * 0.22;

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

    const gradient = doc.linearGradient(x, y, x + size, y + size);
    gradient.stop(0, '#7A8BF5');
    gradient.stop(1, '#7048C6');
    doc.fill(gradient);

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

    const textX = x + size + 12;
    const textY = y + (size / 2) - 9;

    doc.fillColor('#1a1a2e')
       .font('Helvetica-Bold')
       .fontSize(18)
       .text('ZSmartClass', textX, textY, { align: 'left' });
  }

  /**
   * Generate the certificate PDF, honouring the course's template.
   */
  async generateCertificatePDF(data) {
    const {
      studentName,
      courseTitle,
      certificateNo,
      issueDate,
      qrCodeDataUrl,
      template
    } = data;

    // ---- Template values (fall back to the defaults) --------------------
    const textColor = template?.textColor || '#1a1a2e';
    const accentColor = template?.borderColor || '#667eea';
    const backgroundColor = template?.backgroundColor || '#ffffff';
    const footerText = template?.footer || 'Issued by ZSmartClass';
    const fontBold = resolveFont(template?.fontFamily, true);
    const fontRegular = resolveFont(template?.fontFamily, false);

    // Header Text from the designer now actually prints (previously hardcoded)
    const { eyebrow, title } = splitHeader(template?.header);

    return new Promise((resolve, reject) => {
      try {
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

        // A4 landscape: 842 x 595 points
        const pageWidth = 842;
        const pageHeight = 595;

        // ---- Background ----
        doc.rect(0, 0, pageWidth, pageHeight).fill(backgroundColor);

        // ---- Border ----
        doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
           .lineWidth(2)
           .stroke(accentColor);

        // ---- Top-left logo ----
        this.drawLogoWithText(doc, 50, 45, 50);

        // ---- Top-right badge ----
        const badgeX = pageWidth - 70 - 100;
        const badgeY = 35;
        const badgeWidth = 100;

        try {
          if (fs.existsSync(this.badgeImagePath)) {
            doc.image(this.badgeImagePath, badgeX, badgeY, { width: badgeWidth });
          } else {
            console.warn(`⚠️  Badge not found at: ${this.badgeImagePath}. Put your badge.png next to certificatePdf.js`);
          }
        } catch (error) {
          console.error('Error placing badge image:', error.message);
        }

        // ---- Heading (from the template's Header Text) ----
        if (eyebrow) {
          doc.fontSize(18)
             .fillColor(accentColor)
             .font(fontBold)
             .text(eyebrow, 0, 65, {
               width: pageWidth,
               align: 'center',
               letterSpacing: 3
             });
        }

        doc.fontSize(42)
           .fillColor(textColor)
           .font(fontBold)
           .text(title, 0, eyebrow ? 90 : 78, {
             width: pageWidth,
             align: 'center',
             letterSpacing: 2
           });

        // ---- Subtitle ----
        doc.fontSize(18)
           .fillColor('#64748b')
           .font(fontRegular)
           .text('This Certificate is proudly Presented to', 0, 150, {
             width: pageWidth,
             align: 'center'
           });

        // ---- Student name ----
        doc.fontSize(32)
           .fillColor(textColor)
           .font(fontBold)
           .text(studentName || 'Student', 0, 185, {
             width: pageWidth,
             align: 'center'
           });

        // ---- Completion line ----
        doc.fontSize(18)
           .fillColor('#64748b')
           .font(fontRegular)
           .text('has successfully completed the online Course:', 0, 235, {
             width: pageWidth,
             align: 'center'
           });

        // ---- Course name ----
        doc.fontSize(26)
           .fillColor(accentColor)
           .font(fontBold)
           .text(courseTitle || 'Course', 0, 265, {
             width: pageWidth,
             align: 'center'
           });

        // ---- Description ----
        // (the second line previously repeated "and a commitment to")
        doc.fontSize(14)
           .fillColor('#94a3b8')
           .font(fontRegular)
           .text(
             'This professional has demonstrated initiative and a commitment to',
             0, 310, { width: pageWidth, align: 'center' }
           )
           .text(
             'deepening their skills and advancing their career. Well done!',
             0, 328, { width: pageWidth, align: 'center' }
           );

        // ---- Divider ----
        doc.moveTo(100, 395)
           .lineTo(742, 395)
           .lineWidth(1)
           .stroke('#e2e8f0');

        // ---- Date + certificate id ----
        const formattedDate = issueDate
          ? new Date(issueDate).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric'
            })
          : 'N/A';

        doc.fontSize(11).fillColor('#64748b').font(fontRegular)
           .text('Date of issue:', 100, 415, { width: 150, align: 'left' });

        doc.fontSize(11).fillColor(textColor).font(fontBold)
           .text(formattedDate, 180, 415, { width: 200, align: 'left' });

        doc.fontSize(11).fillColor('#64748b').font(fontRegular)
           .text('Certificate id:', 100, 435, { width: 150, align: 'left' });

        doc.fontSize(11).fillColor(textColor).font(fontBold)
           .text(certificateNo || 'N/A', 180, 435, { width: 200, align: 'left' });

        // ---- QR code (kept black for reliable scanning) ----
        if (qrCodeDataUrl) {
          try {
            if (qrCodeDataUrl.startsWith('data:image')) {
              const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
              doc.image(qrCodeBuffer, 630, 410, { width: 80, height: 80 });
            }
            doc.fontSize(7)
               .fillColor('#94a3b8')
               .font(fontRegular)
               .text('Scan to verify', 630, 495, { width: 80, align: 'center' });
          } catch (qrError) {
            console.error('Error adding QR code to PDF:', qrError);
          }
        }

        // ---- Seal ----
        const sealX = 550;
        const sealY = 450;
        const sealRadius = 40;

        doc.circle(sealX, sealY, sealRadius).lineWidth(2).stroke(accentColor);
        doc.circle(sealX, sealY, sealRadius - 5).lineWidth(1).stroke(accentColor);

        doc.fontSize(7)
           .fillColor(textColor)
           .font(fontBold)
           .text('ZSMARTCLASS', sealX - 30, sealY - 12, {
             width: 60, align: 'center', letterSpacing: 1
           });

        doc.fontSize(6)
           .fillColor('#020202')
           .font(fontBold)
           .text('COMPLETED', sealX - 22, sealY + 8, { width: 44, align: 'center' });

        doc.circle(sealX, sealY - 20, 4).fill(accentColor);

        // ---- Footer (from the template) ----
        doc.fontSize(9)
           .fillColor('#94a3b8')
           .font(fontRegular)
           .text(footerText, 0, 540, { width: pageWidth, align: 'center' });

        doc.fontSize(7)
           .fillColor('#cbd5e1')
           .font(fontRegular)
           .text(
             `Verify at: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-certificate/${certificateNo}`,
             0, 558, { width: pageWidth, align: 'center' }
           );

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

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

  getCertificatePath(certificateNo) {
    const filePath = path.join(
      __dirname, '../../public/certificates', `${certificateNo}.pdf`
    );
    return fs.existsSync(filePath) ? filePath : null;
  }

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

const generator = new CertificatePdfGenerator();
module.exports = function (data) {
  return generator.generateCertificatePDF(data);
};
module.exports.CertificatePdfGenerator = CertificatePdfGenerator;
module.exports.generateCertificatePDF = function (data) {
  return generator.generateCertificatePDF(data);
};