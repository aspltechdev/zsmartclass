// const express = require("express");
// const router = express.Router();

// const lessonController = require("../controllers/lesson.controller");

// router.post("/", lessonController.create);

// router.get("/", lessonController.getAll);

// router.get("/module/:moduleId", lessonController.getByModule);

// router.get("/:id", lessonController.getById);

// router.put("/:id", lessonController.update);

// router.delete("/:id", lessonController.delete);

// module.exports = router;


const express = require("express");
const router = express.Router();

const lessonController = require("../controllers/lesson.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// Public Routes
router.get("/", lessonController.getAll);

router.get("/module/:moduleId", lessonController.getByModule);

router.get("/:id", lessonController.getById);

// Protected Routes
router.post(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    lessonController.create
);

router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    lessonController.update
);

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    lessonController.delete
);

module.exports = router;
