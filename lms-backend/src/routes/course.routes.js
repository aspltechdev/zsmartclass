// // const express = require("express");
// // const router = express.Router();

// // const courseController = require("../controllers/course.controller");

// // router.post("/", courseController.create);

// // router.get("/", courseController.getAll);

// // router.get("/:id", courseController.getById);

// // router.put("/:id", courseController.update);

// // router.delete("/:id", courseController.delete);

// // module.exports = router;

// const express = require("express");
// const router = express.Router();

// const courseController = require("../controllers/course.controller");

// const authMiddleware = require("../middleware/auth.middleware");
// const roleMiddleware = require("../middleware/role.middleware");

// router.post(
//     "/",
//     authMiddleware,
//     roleMiddleware("ADMIN", "MENTOR"),
//     courseController.create
// );

// router.put(
//     "/:id",
//     authMiddleware,
//     roleMiddleware("ADMIN", "MENTOR"),
//     courseController.update
// );

// router.delete(
//     "/:id",
//     authMiddleware,
//     roleMiddleware("ADMIN"),
//     courseController.delete
// );

// router.get("/", courseController.getAll);

// router.get("/:id", courseController.getById);

// module.exports = router;



const express = require("express");
const router = express.Router();

const courseController = require("../controllers/course.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// Public Routes
router.get("/", courseController.getAll);

router.get("/:id", courseController.getById);

// ─── MODULE ATTACHMENT (ADMIN & MENTOR) ─────────────────────────────
// List modules that can be attached (not yet on any course)
router.get(
    "/:id/available-modules",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    courseController.getAvailableModules
);

// Attach existing module(s) to this course
router.post(
    "/:id/modules",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    courseController.attachModules
);

// Detach a module from this course
router.delete(
    "/:id/modules/:moduleId",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    courseController.detachModule
);

// Protected Routes
router.post(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    courseController.create
);

router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN", "MENTOR"),
    courseController.update
);

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    courseController.delete
);

module.exports = router;