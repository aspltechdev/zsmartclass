const assignmentService = require("../services/assignment.service");

// Create
exports.create = async (req, res) => {

    try {

        const assignment = await assignmentService.create(
            req.body,
            req.user.id
        );

        res.status(201).json({
            success: true,
            data: assignment
        });

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message
        });

    }

};

// Get All
exports.getAll = async (req, res) => {

    try {

        const data = await assignmentService.getAll();

        res.json({
            success: true,
            data
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// Get By Id
exports.getById = async (req, res) => {

    try {

        const data = await assignmentService.getById(req.params.id);

        res.json({
            success: true,
            data
        });

    } catch (err) {

        res.status(404).json({
            success: false,
            message: err.message
        });

    }

};

// Update
exports.update = async (req, res) => {

    try {

        const assignment = await assignmentService.update(
            req.params.id,
            req.body
        );

        res.json({
            success: true,
            data: assignment
        });

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message
        });

    }

};

// Delete
exports.delete = async (req, res) => {

    try {

        const result = await assignmentService.delete(
            req.params.id
        );

        res.json(result);

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message
        });

    }

};

// Submit Assignment
exports.submitAssignment = async (req, res) => {

    try {

        const result = await assignmentService.submitAssignment(

            req.params.id,

            req.user.id,

            req.body

        );

        res.status(201).json({
            success: true,
            data: result
        });

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message
        });

    }

};

// Get Submissions
exports.getSubmissions = async (req, res) => {

    try {

        const result = await assignmentService.getSubmissions(
            req.params.id
        );

        res.json({
            success: true,
            data: result
        });

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message
        });

    }

};