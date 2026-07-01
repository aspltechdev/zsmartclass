const certificateService = require("../services/certificate.service");

// ==========================================
// Generate Certificate
// ==========================================
exports.generateCertificate = async (req, res) => {

    try {

        const studentId = req.user.id;
        const { courseId } = req.params;

        const result = await certificateService.generateCertificate(
            studentId,
            courseId
        );

        return res.status(201).json({
            success: true,
            data: result
        });

    } catch (err) {

        return res.status(400).json({
            success: false,
            message: err.message
        });

    }

};

// ==========================================
// Get My Certificate
// ==========================================
exports.getCertificate = async (req, res) => {

    try {

        const studentId = req.user.id;
        const { courseId } = req.params;

        const result = await certificateService.getCertificate(
            studentId,
            courseId
        );

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (err) {

        return res.status(404).json({
            success: false,
            message: err.message
        });

    }

};

// ==========================================
// Download Certificate
// ==========================================
exports.downloadCertificate = async (req, res) => {

    try {

        const { certificateNo } = req.params;

        const result = await certificateService.downloadCertificate(
            certificateNo
        );

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (err) {

        return res.status(404).json({
            success: false,
            message: err.message
        });

    }

};

// ==========================================
// Verify Certificate
// ==========================================
exports.verifyCertificate = async (req, res) => {

    try {

        const { certificateNo } = req.params;

        const result = await certificateService.verifyCertificate(
            certificateNo
        );

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (err) {

        return res.status(404).json({
            success: false,
            message: err.message
        });

    }

};