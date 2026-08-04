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


// exports.create = async (req, res) => {

//     try {

//         req.body.createdById = req.user.id;

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

        const data = {
            ...req.body,
            createdById: req.user.id
        };

        if (req.file) {

            data.thumbnail =
                "/uploads/thumbnails/" + req.file.filename;

        }

        const result = await courseService.create(data);

        res.status(201).json({
            success: true,
            data: result
        });

    } catch (err) {

        console.log(err);

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

// exports.update = async (req, res) => {

//     try {

//         const result = await courseService.update(
//             req.params.id,
//             req.body
//         );

//         res.json({
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

// controllers/course.controller.js
exports.update = async (req, res) => {
    try {
        console.log("📥 Incoming update request for ID:", req.params.id);
        console.log("📥 Body:", JSON.stringify(req.body, null, 2));

        // Clean the data before sending to service
        const cleanData = { ...req.body };

        // Remove any undefined values
        Object.keys(cleanData).forEach(key => {
            if (cleanData[key] === undefined) {
                delete cleanData[key];
            }
        });

        // Handle discountPrice - if it's "0", send as null
        if (cleanData.discountPrice !== undefined) {
            if (cleanData.discountPrice === "" || 
                cleanData.discountPrice === "0" || 
                cleanData.discountPrice === 0) {
                cleanData.discountPrice = null;
            }
        }

        if (req.file) {
            cleanData.thumbnail = "/uploads/thumbnails/" + req.file.filename;
        }

        const result = await courseService.update(
            req.params.id,
            cleanData
        );

        res.json({
            success: true,
            data: result
        });

    } catch (err) {
        console.error("❌ Update error details:");
        console.error("Error:", err);
        console.error("Stack:", err.stack);
        
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