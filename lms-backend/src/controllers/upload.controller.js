class UploadController {

    uploadThumbnail(req, res) {

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message: "No file uploaded."

            });

        }

        res.json({

            success: true,

            fileName: req.file.filename,

            url: `/uploads/thumbnails/${req.file.filename}`

        });

    }

    uploadResource(req, res) {

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message: "No file uploaded."

            });

        }

        res.json({

            success: true,

            fileName: req.file.filename,

            url: `/uploads/resources/${req.file.filename}`

        });

    }

}

module.exports = new UploadController();