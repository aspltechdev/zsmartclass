// src/controllers/quiz.controller.js
const quizService = require("../services/quiz.service");

const fail = (res, err, fallback = 400) =>
  res.status(err.statusCode || fallback).json({
    success: false,
    message: err.message || "Something went wrong",
  });

// MENTOR/ADMIN: create a quiz inside a module
exports.createQuiz = async (req, res) => {
  try {
    const quiz = await quizService.createQuiz(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: "Quiz created successfully.",
      data: quiz,
    });
  } catch (err) {
    fail(res, err);
  }
};

// MENTOR/ADMIN: update a quiz (owner or admin)
exports.updateQuiz = async (req, res) => {
  try {
    const quiz = await quizService.updateQuiz(
      req.params.quizId,
      req.user,
      req.body
    );
    res.json({
      success: true,
      message: "Quiz updated successfully.",
      data: quiz,
    });
  } catch (err) {
    fail(res, err);
  }
};

// MENTOR/ADMIN: delete a quiz (owner or admin)
exports.deleteQuiz = async (req, res) => {
  try {
    const result = await quizService.deleteQuiz(req.params.quizId, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    fail(res, err);
  }
};

// Quizzes inside a module
exports.getModuleQuizzes = async (req, res) => {
  try {
    const quizzes = await quizService.getModuleQuizzes(req.params.moduleId);
    res.json({ success: true, data: quizzes });
  } catch (err) {
    fail(res, err, 500);
  }
};

// Single quiz (with questions + options)
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await quizService.getQuizById(req.params.quizId);
    res.json({ success: true, data: quiz });
  } catch (err) {
    fail(res, err, 500);
  }
};

// Student results for a quiz (owner or admin)
exports.getQuizMarks = async (req, res) => {
  try {
    const result = await quizService.getQuizMarks(req.params.quizId, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    fail(res, err, 500);
  }
};

// Student submits a quiz attempt
exports.submitQuizAttempt = async (req, res) => {
  try {
    const attempt = await quizService.submitQuizAttempt(req.params.quizId, req.user.id, req.body);
    res.status(201).json({ success: true, message: "Quiz submitted successfully.", data: attempt });
  } catch (err) {
    fail(res, err);
  }
};
