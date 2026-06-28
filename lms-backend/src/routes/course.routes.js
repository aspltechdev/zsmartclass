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

