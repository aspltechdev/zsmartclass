// src/routes/module.routes.js
const express = require("express");
const router = express.Router();

const moduleController = require("../controllers/module.controller");

const authMiddleware = require("../middleware/auth.middleware");
const optionalAuthMiddleware = require("../middleware/optionalAuth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// ─── PUBLIC ROUTES ──────────────────────────────────────────────────
router.get("/", moduleController.getAll);
// Optional auth: reachable anonymously, but lesson videoUrls are only
// returned to authenticated MENTOR/ADMIN (students get video via /player/*).
router.get("/:id", optionalAuthMiddleware, moduleController.getById);
router.get("/stats/all", moduleController.getStats);

// ─── PROTECTED ROUTES ──────────────────────────────────────────────
router.post(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    moduleController.create
);

router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    moduleController.update
);

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    moduleController.delete
);

module.exports = router;