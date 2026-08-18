// src/routes/certificate.routes.js
const express = require("express");
const router = express.Router();

const certificateController = require("../controllers/certificate.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// ==========================================
// ADMIN ROUTES
// ==========================================

router.get(
    "/admin/all",
    authMiddleware,
    roleMiddleware("ADMIN","MENTOR"),
    certificateController.getAllCertificatesAdmin
);

router.get(
    "/admin/pending",
    authMiddleware,
    roleMiddleware("ADMIN","MENTOR"),
    certificateController.getPendingCertificatesAdmin
);

// Trigger the auto-verify job immediately (Admin)
router.post(
    "/admin/verify-now",
    authMiddleware,
    roleMiddleware("ADMIN"),
    certificateController.verifyPendingNow
);

router.put(
    "/admin/:id/approve",
    authMiddleware,
    roleMiddleware("ADMIN","MENTOR"),
    certificateController.approveCertificate
);

router.put(
    "/admin/:id/reject",
    authMiddleware,
    roleMiddleware("ADMIN"),
    certificateController.rejectCertificate
);

router.delete(
    "/admin/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    certificateController.deleteCertificateAdmin
);

router.get(
    "/admin/templates/:courseId",
    authMiddleware,
    roleMiddleware("ADMIN"),
    certificateController.getTemplate
);

router.put(
    "/admin/templates/:courseId",
    authMiddleware,
    roleMiddleware("ADMIN"),
    certificateController.upsertTemplate
);

// ==========================================
// Generate Certificate (student)
// ==========================================
router.post(
    "/generate/:courseId",
    authMiddleware,
    roleMiddleware("STUDENT"),
    certificateController.generateCertificate
);

// ==========================================
// Get My Certificate (student)
// ==========================================
router.get(
    "/my-certificates",
    authMiddleware,
    roleMiddleware("STUDENT"),
    certificateController.getCertificate
);

// ==========================================
// Download Certificate PDF
// ==========================================
router.get(
    "/download/:certificateNo",
    authMiddleware,
    certificateController.downloadCertificate
);

// ==========================================
// Verify Certificate (Public)
// ==========================================
router.get(
    "/verify/:certificateNo",
    certificateController.verifyCertificate
);

module.exports = router;