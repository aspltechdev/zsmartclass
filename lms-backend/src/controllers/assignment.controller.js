const assignmentService = require("../services/assignment.service");

const sendError = (res, error) => {
  return res.status(error.statusCode || 400).json({
    success: false,
    message: error.message,
  });
};

exports.create = async (req, res) => {
  try {
    const data = await assignmentService.create(
      req.body,
      req.user.id
    );

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.getAll = async (req, res) => {
  try {
    const role = String(req.user?.role || "").toUpperCase();

    const data =
      role === "STUDENT"
        ? await assignmentService.getForStudent(req.user.id)
        : await assignmentService.getAll();

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.getById = async (req, res) => {
  try {
    const data = await assignmentService.getById(
      req.params.id
    );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.update = async (req, res) => {
  try {
    const data = await assignmentService.update(
      req.params.id,
      req.body
    );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.remove = async (req, res) => {
  try {
    const result = await assignmentService.remove(
      req.params.id
    );

    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
};

exports.submit = async (req, res) => {
  try {
    const attachment = req.file
      ? `/uploads/submissions/${req.file.filename}`
      : null;

    const data = await assignmentService.submit(
      req.params.id,
      req.user.id,
      {
        submissionText: req.body.submissionText,
        attachment,
      }
    );

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const data = await assignmentService.getSubmissions(
      req.params.id
    );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.getMySubmissions = async (req, res) => {
  try {
    const data = await assignmentService.getMySubmissions(
      req.user.id
    );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.gradeSubmission = async (req, res) => {
  try {
    const data = await assignmentService.gradeSubmission(
      req.params.submissionId,
      req.body,
      req.user
    );

    return res.json({
      success: true,
      message:
        data.status === "GRADED"
          ? "Assignment accepted successfully."
          : "Assignment rejected. The student can resubmit.",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};