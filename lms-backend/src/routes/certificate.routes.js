const express = require("express");
const router = express.Router();

const certificateController = require("../controllers/certificate.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// ==========================================
// Generate Certificate
// ==========================================
router.post(
    "/generate/:courseId",
    authMiddleware,
    roleMiddleware("STUDENT"),
    certificateController.generateCertificate
);

// ==========================================
// Get My Certificate
// ==========================================
router.get(
    "/:courseId",
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