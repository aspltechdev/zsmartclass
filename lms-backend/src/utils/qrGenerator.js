// src/utils/qrGenerator.js
const QRCode = require('qrcode');

const generateQRCode = async (data) => {
  try {
    if (!data) {
      console.error('No data provided for QR code generation');
      return { qrUrl: null };
    }

    // Generate QR code as data URL (base64)
    const qrDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 200,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff'
      }
    });

    return { qrUrl: qrDataUrl };
  } catch (error) {
    console.error('Error generating QR code:', error.message);
    return { qrUrl: null };
  }
};

module.exports = generateQRCode;