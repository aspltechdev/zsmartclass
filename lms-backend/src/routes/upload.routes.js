const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload.middleware");
const uploadController = require("../controllers/upload.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

router.post(
    "/thumbnail",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    upload.single("thumbnail"),
    uploadController.uploadThumbnail
);

router.post(
    "/resource",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    upload.single("resource"),
    uploadController.uploadResource
);

module.exports = router;