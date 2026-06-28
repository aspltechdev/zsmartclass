const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload folders exist
const createFolder = (folder) => {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
};

createFolder("uploads/thumbnails");
createFolder("uploads/resources");
createFolder("uploads/documents");

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        if (file.fieldname === "thumbnail") {
            cb(null, "uploads/thumbnails");
        }
        else if (file.fieldname === "resource") {
            cb(null, "uploads/resources");
        }
        else {
            cb(null, "uploads/documents");
        }

    },

    filename: (req, file, cb) => {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9) +
            path.extname(file.originalname);

        cb(null, uniqueName);

    }

});

const fileFilter = (req, file, cb) => {

    const imageTypes = /jpg|jpeg|png|webp/;

    const documentTypes =
        /pdf|doc|docx|ppt|pptx|xls|xlsx|zip|rar/;

    const ext = path.extname(file.originalname).toLowerCase();

    if (
        file.fieldname === "thumbnail" &&
        imageTypes.test(ext)
    ) {
        return cb(null, true);
    }

    if (
        file.fieldname === "resource" &&
        documentTypes.test(ext)
    ) {
        return cb(null, true);
    }

    cb(new Error("Invalid file type"));

};

const upload = multer({

    storage,

    limits: {
        fileSize: 50 * 1024 * 1024
    },

    fileFilter

});

module.exports = upload;