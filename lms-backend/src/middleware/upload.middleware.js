const multer = require("multer");
const path = require("path");
const fs = require("fs");
const os = require("os");

const UPLOAD_ROOT = process.env.VERCEL
  ? path.join(os.tmpdir(), "uploads")
  : path.join(process.cwd(), "uploads");

// Ensure upload folders exist
const createFolder = (folder) => {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
};

createFolder(path.join(UPLOAD_ROOT, "thumbnails"));
createFolder(path.join(UPLOAD_ROOT, "resources"));
createFolder(path.join(UPLOAD_ROOT, "documents"));
createFolder(path.join(UPLOAD_ROOT, "profile-images"));
createFolder(path.join(UPLOAD_ROOT, "videos"));
createFolder(path.join(UPLOAD_ROOT, "submissions"));

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        if (file.fieldname === "thumbnail") {
            cb(null, path.join(UPLOAD_ROOT, "thumbnails"));
        } else if (file.fieldname === "resource") {
            cb(null, path.join(UPLOAD_ROOT, "resources"));
        } else if (file.fieldname === "profileImage") {
            cb(null, path.join(UPLOAD_ROOT, "profile-images"));
        } else if (file.fieldname === "video") {
            cb(null, path.join(UPLOAD_ROOT, "videos"));
        } else if (file.fieldname === "submission") {
            cb(null, path.join(UPLOAD_ROOT, "submissions"));
        } else {
            cb(null, path.join(UPLOAD_ROOT, "documents"));
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