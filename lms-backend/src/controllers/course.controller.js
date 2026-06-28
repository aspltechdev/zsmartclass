const courseService = require("../services/course.service");

// exports.create = async (req, res) => {

//     try {

//         const result = await courseService.create(req.body);

//         res.status(201).json({
//             success: true,
//             data: result
//         });

//     } catch (err) {

//         res.status(400).json({
//             success: false,
//             message: err.message
//         });

//     }

// };


exports.create = async (req, res) => {

    try {

        req.body.createdById = req.user.id;

        const result = await courseService.create(req.body);

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

        const result = await courseService.getAll();

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

        const result = await courseService.getById(req.params.id);

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

exports.update = async (req, res) => {

    try {

        const result = await courseService.update(
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

        const result = await courseService.delete(req.params.id);

        res.json(result);

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message
        });

    }

};