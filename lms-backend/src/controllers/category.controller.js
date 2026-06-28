const categoryService = require("../services/category.service");

exports.create = async (req, res) => {

    try {

        const result = await categoryService.create(req.body);

        res.status(201).json(result);

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message
        });

    }

};

exports.getAll = async (req, res) => {

    try {

        const result = await categoryService.getAll();

        res.json(result);

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

exports.getById = async (req, res) => {

    try {

        const result = await categoryService.getById(req.params.id);

        res.json(result);

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

exports.update = async (req, res) => {

    try {

        const result = await categoryService.update(
            req.params.id,
            req.body
        );

        res.json(result);

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message
        });

    }

};

exports.delete = async (req, res) => {

    try {

        const result = await categoryService.delete(req.params.id);

        res.json(result);

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message
        });

    }

};