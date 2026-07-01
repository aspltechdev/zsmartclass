const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

async function generateQRCode(certificateNo) {

    // Create QR folder if it doesn't exist
    const qrDirectory = path.join(
        __dirname,
        "../uploads/certificates/qr"
    );

    if (!fs.existsSync(qrDirectory)) {

        fs.mkdirSync(qrDirectory, {
            recursive: true
        });

    }

    // Verification URL
    const verifyUrl =
        `${process.env.FRONTEND_URL}/verify-certificate/${certificateNo}`;

    // QR Image Path
    const qrFileName = `${certificateNo}.png`;

    const qrPath = path.join(
        qrDirectory,
        qrFileName
    );

    // Generate QR
    await QRCode.toFile(
        qrPath,
        verifyUrl,
        {
            width: 300,
            margin: 2,
            errorCorrectionLevel: "H"
        }
    );

    return {

        qrPath,

        qrUrl: `/uploads/certificates/qr/${qrFileName}`,

        verifyUrl

    };

}

module.exports = generateQRCode;