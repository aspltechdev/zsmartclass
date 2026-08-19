// src/routes/quiz.routes.js
const express = require("express");
const router = express.Router();

const quizController = require("../controllers/quiz.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// ==========================================
// WRITE ROUTES — MENTOR & ADMIN only
// (ownership is enforced again in the service)
// ==========================================

router.post(
  "/",
  authMiddleware,
  roleMiddleware("MENTOR", "ADMIN"),
  quizController.createQuiz
);

router.put(
  "/:quizId",
  authMiddleware,
  roleMiddleware("MENTOR", "ADMIN"),
  quizController.updateQuiz
);

router.delete(
  "/:quizId",
  authMiddleware,
  roleMiddleware("MENTOR", "ADMIN"),
  quizController.deleteQuiz
);

// ==========================================
// READ ROUTES
// Specific paths BEFORE /:quizId so they aren't swallowed by it.
// ==========================================

router.get(
  "/module/:moduleId",
  authMiddleware,
  quizController.getModuleQuizzes
);

router.get(
  "/:quizId/marks",
  authMiddleware,
  roleMiddleware("MENTOR", "ADMIN"),
  quizController.getQuizMarks
);

router.get("/:quizId", authMiddleware, quizController.getQuizById);

module.exports = router;