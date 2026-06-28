const moduleService = require("../services/module.service");

exports.create = async (req, res) => {
    try {

        const result = await moduleService.create(req.body);

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

        const result = await moduleService.getAll();

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

        const result = await moduleService.getById(req.params.id);

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

exports.getByCourse = async (req, res) => {

    try {

        const result = await moduleService.getByCourse(req.params.courseId);

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

        const result = await moduleService.update(
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

        const result = await moduleService.delete(req.params.id);

        res.json(result);

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message
        });

    }

};