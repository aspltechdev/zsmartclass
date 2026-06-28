// const express = require("express");
// const router = express.Router();

// const moduleController = require("../controllers/module.controller");

// router.post("/", moduleController.create);

// router.get("/", moduleController.getAll);

// router.get("/course/:courseId", moduleController.getByCourse);

// router.get("/:id", moduleController.getById);

// router.put("/:id", moduleController.update);

// router.delete("/:id", moduleController.delete);

// module.exports = router;


const express = require("express");
const router = express.Router();

const moduleController = require("../controllers/module.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// Public Routes
router.get("/", moduleController.getAll);

router.get("/course/:courseId", moduleController.getByCourse);

router.get("/:id", moduleController.getById);

// Protected Routes
router.post(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    moduleController.create
);

router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    moduleController.update
);

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    moduleController.delete
);

module.exports = router;

