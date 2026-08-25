// src/controllers/certificate.controller.js
const certificateService = require("../services/certificate.service");

// ==========================================
// Generate Certificate (student)
// ==========================================
exports.generateCertificate = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { courseId } = req.params;
        const { studentName } = req.body;

        const result = await certificateService.generateCertificate(
            studentId,
            Number(courseId),
            studentName
        );

        return res.status(201).json({
            success: true,
            data: result
        });
    } catch (err) {
        return res.status(err.statusCode || 400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// Certificate eligibility (student)
// ==========================================
exports.checkEligibility = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { courseId } = req.params;

        const result = await certificateService.checkCertificateEligibility(
            studentId,
            Number(courseId)
        );

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        return res.status(err.statusCode || 400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// Get My Certificate (student)
// ==========================================
exports.getCertificate = async (req, res) => {
    try {
        const studentId = req.user.id;

        const result = await certificateService.getStudentCertificates(studentId);
        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (err) {
        return res.status(err.statusCode || 400).json({
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
        return res.status(err.statusCode || 404).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// Verify Certificate (Public)
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
        return res.status(err.statusCode || 404).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// ADMIN: list all certificates
// ==========================================
exports.getAllCertificatesAdmin = async (req, res) => {
    try {
        const result = await certificateService.getAllCertificatesAdmin();

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        return res.status(err.statusCode || 400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// ADMIN: list pending certificates
// ==========================================
exports.getPendingCertificatesAdmin = async (req, res) => {
    try {
        const result = await certificateService.getPendingCertificatesAdmin();

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        return res.status(err.statusCode || 400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// ADMIN: approve a pending certificate
// ==========================================
exports.approveCertificate = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await certificateService.approveCertificate(id);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        return res.status(err.statusCode || 400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// ADMIN: reject a pending certificate
// ==========================================
exports.rejectCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const result = await certificateService.rejectCertificate(id, reason);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        return res.status(err.statusCode || 400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// ADMIN: delete a certificate record
// ==========================================
exports.deleteCertificateAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await certificateService.deleteCertificateAdmin(id);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        return res.status(err.statusCode || 400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// ADMIN: get a course's certificate template
// ==========================================
exports.getTemplate = async (req, res) => {
    try {
        const { courseId } = req.params;
        
        // Convert to number and validate
        const numericCourseId = Number(courseId);
        if (isNaN(numericCourseId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid course ID"
            });
        }

        const result = await certificateService.getTemplate(numericCourseId);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        console.error("Error in getTemplate controller:", err);
        return res.status(err.statusCode || 400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// ADMIN: create/update a course's certificate template
// ==========================================
exports.upsertTemplate = async (req, res) => {
    try {
        const { courseId } = req.params;
        
        // Convert to number and validate
        const numericCourseId = Number(courseId);
        if (isNaN(numericCourseId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid course ID"
            });
        }

        // Validate required fields
        const { header, footer, textColor, backgroundColor, borderColor, fontFamily, isActive } = req.body;
        
        // Prepare data with defaults
        const templateData = {
            header: header || "Certificate of Completion",
            footer: footer || "Issued by ZSmartClass",
            textColor: textColor || "#1a1a2e",
            backgroundColor: backgroundColor || "#ffffff",
            borderColor: borderColor || "#667eea",
            fontFamily: fontFamily || "Helvetica",
            isActive: isActive !== undefined ? isActive : true
        };

        const result = await certificateService.upsertTemplate(numericCourseId, templateData);

        return res.status(200).json({
            success: true,
            data: result,
            message: "Template saved successfully"
        });
    } catch (err) {
        console.error("Error in upsertTemplate controller:", err);
        return res.status(err.statusCode || 400).json({
            success: false,
            message: err.message
        });
    }
};

// ==========================================
// ADMIN: bulk auto-verify — DISABLED
// Certificates require individual admin approval. This endpoint no longer
// auto-approves anything; it is kept only so any stale caller gets a clear
// message instead of a 404.
// ==========================================
exports.verifyPendingNow = async (req, res) => {
    return res.status(410).json({
        success: false,
        message:
            "Automatic verification has been disabled. Approve each certificate individually from the review queue."
    });
};