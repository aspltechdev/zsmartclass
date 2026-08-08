
const express = require("express");
const router = express.Router();

const categoryController = require("../controllers/category.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// Public Routes
router.get("/", categoryController.getAll);

router.get("/:id", categoryController.getById);

// Protected Routes (Admin & Mentor Only)
router.post(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN","MENTOR"),
    categoryController.create
);

router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN","MENTOR"),
    categoryController.update
);

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    categoryController.delete
);

module.exports = router;
