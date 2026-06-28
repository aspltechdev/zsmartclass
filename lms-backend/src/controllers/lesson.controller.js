const lessonService = require("../services/lesson.service");

exports.create = async (req, res) => {
    try {

        const result = await lessonService.create(req.body);

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

exports.getAll = async (req, res) => {
    try {

        const result = await lessonService.getAll();

        res.json({
            success: true,
            data: result
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
};

exports.getById = async (req, res) => {
    try {

        const result = await lessonService.getById(req.params.id);

        res.json({
            success: true,
            data: result
        });

    } catch (err) {

        res.status(404).json({
            success: false,
            message: err.message
        });

    }
};

exports.getByModule = async (req, res) => {
    try {

        const result = await lessonService.getByModule(req.params.moduleId);

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

exports.update = async (req, res) => {
    try {

        const result = await lessonService.update(
            req.params.id,
            req.body
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

exports.delete = async (req, res) => {
    try {

        const result = await lessonService.delete(req.params.id);

        res.json(result);

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message
        });

    }
};