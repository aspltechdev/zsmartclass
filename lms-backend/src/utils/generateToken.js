// src/utils/qrGenerator.js
const QRCode = require('qrcode');

/**
 * Generate a QR code as a base64 data URL.
 *
 * The QR stays BLACK ON WHITE on purpose — scanners rely on high contrast,
 * and tinting it to match a certificate template is a common cause of codes
 * that won't scan on paper or in low light. Template colours are applied to
 * the certificate around it, not to the code itself.
 *
 * @param {string} data      The text/URL to encode (e.g. the verify URL)
 * @param {object} [options]
 * @param {number} [options.width=200]  Pixel size of the generated image
 * @param {number} [options.margin=2]   Quiet-zone modules around the code
 * @returns {Promise<{ qrUrl: string|null }>}
 */
const generateQRCode = async (data, options = {}) => {
  try {
    const value = typeof data === 'string' ? data.trim() : '';

    if (!value) {
      console.error('QR generation skipped: no data provided');
      return { qrUrl: null };
    }

    const width = Number(options.width) > 0 ? Number(options.width) : 200;
    const margin = Number.isFinite(Number(options.margin)) ? Number(options.margin) : 2;

    const qrDataUrl = await QRCode.toDataURL(value, {
      // 'H' tolerates ~30% damage — important for printed certificates
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin,
      width,
      color: {
        dark: '#000000',   // pure black: best contrast for scanners
        light: '#ffffff'
      }
    });

    return { qrUrl: qrDataUrl };
  } catch (error) {
    console.error('Error generating QR code:', error.message);
    // Non-fatal: the certificate should still issue without a QR code.
    return { qrUrl: null };
  }
};

module.exports = generateQRCode;
module.exports.generateQRCode = generateQRCode;