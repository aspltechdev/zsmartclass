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
createFolder("uploads/profile-images");
createFolder("uploads/videos");
createFolder("uploads/submissions");

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        if (file.fieldname === "thumbnail") {
            cb(null, "uploads/thumbnails");
        }
        else if (file.fieldname === "resource") {
            cb(null, "uploads/resources");
        }
        else if (file.fieldname === "profileImage") {
            cb(null, "uploads/profile-images");
        }
        else if (file.fieldname === "video") {
            cb(null, "uploads/videos");
        }
        else if (file.fieldname === "submission") {
            cb(null, "uploads/submissions");
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

    const documentTypes =
        /pdf|doc|docx|ppt|pptx|xls|xlsx|zip|rar/;

    const ext = path.extname(file.originalname).toLowerCase();

    // Images: trust the browser-reported MIME type rather than the
    // filename extension. Extension checks break on files with no
    // extension, an uppercase extension, or generic names like "blob"/
    // "image" (common with pasted or drag-dropped images) even though
    // the file is a perfectly valid image.
    if (
        (file.fieldname === "thumbnail" || file.fieldname === "profileImage") &&
        file.mimetype.startsWith("image/")
    ) {
        return cb(null, true);
    }

    if (
        file.fieldname === "resource" &&
        documentTypes.test(ext)
    ) {
        return cb(null, true);
    }

    if (
        file.fieldname === "video" &&
        file.mimetype.startsWith("video/")
    ) {
        return cb(null, true);
    }

    // Student assignment uploads: documents, archives and common image types.
    const submissionTypes = /pdf|doc|docx|ppt|pptx|xls|xlsx|zip|rar|txt|png|jpe?g/;
    if (
        file.fieldname === "submission" &&
        submissionTypes.test(ext)
    ) {
        return cb(null, true);
    }

    cb(new Error("Invalid file type."));

};

const upload = multer({

    storage,

    limits: {
        fileSize: 500 * 1024 * 1024
    },

    fileFilter

});

module.exports = upload;