const express = require("express");
const router = express.Router();

const categoryController = require("../controllers/category.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// Public Routes
router.get("/", categoryController.getAll);

router.get("/:id", categoryController.getById);

// Protected Routes (Admin Only — mentors may read categories but not manage them)
router.post(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN"),
    categoryController.create
);

router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    categoryController.update
);

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    categoryController.delete
);

module.exports = router;