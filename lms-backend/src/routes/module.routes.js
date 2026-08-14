// src/routes/module.routes.js
const express = require("express");
const router = express.Router();

const moduleController = require("../controllers/module.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// ─── PUBLIC ROUTES ──────────────────────────────────────────────────
router.get("/", moduleController.getAll);
router.get("/:id", moduleController.getById);
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