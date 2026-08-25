// src/routes/assignment.routes.js
//
// This router did not exist, so every call to /api/assignments returned 404
// and the student + mentor Assignment pages could never load data.
//
// MOUNT IT in app.js alongside the others:
//     const assignmentRoutes = require("./routes/assignment.routes");
//     app.use("/api/assignments", assignmentRoutes);

const express = require("express");
const router = express.Router();

const assignmentController = require("../controllers/assignment.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const upload = require("../middleware/upload.middleware");

// The global error handler isn't mounted in app.js, so translate any multer
// error (bad file type, size limit) into the same JSON envelope the rest of
// the API uses instead of letting Express emit an HTML 500.
const uploadSubmission = (req, res, next) => {
    upload.single("submission")(req, res, (err) => {
        if (err) {
            const message =
                err.code === "LIMIT_FILE_SIZE"
                    ? "That file is too large."
                    : err.message || "Upload failed.";
            return res.status(400).json({ success: false, message });
        }
        next();
    });
};

/* =========================================================
   STUDENT + MENTOR + ADMIN
   List assignments. Students see the ones for courses they
   are enrolled in, along with their own submission.
========================================================= */
router.get(
    "/",
    authMiddleware,
    assignmentController.getAll
);

/* =========================================================
   MY SUBMISSIONS  (student)
   Declared BEFORE "/:id" so "my-submissions" isn't captured
   as an id parameter.
========================================================= */
router.get(
    "/my-submissions",
    authMiddleware,
    roleMiddleware("STUDENT"),
    assignmentController.getMySubmissions
);

/* =========================================================
   SINGLE ASSIGNMENT
========================================================= */
router.get(
    "/:id",
    authMiddleware,
    assignmentController.getById
);

/* =========================================================
   CREATE  (mentor / admin)
========================================================= */
router.post(
    "/",
    authMiddleware,
    roleMiddleware("MENTOR", "ADMIN"),
    assignmentController.create
);

/* =========================================================
   UPDATE  (mentor / admin)
========================================================= */
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("MENTOR", "ADMIN"),
    assignmentController.update
);

/* =========================================================
   DELETE  (mentor / admin)
========================================================= */
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("MENTOR", "ADMIN"),
    assignmentController.remove
);

/* =========================================================
   SUBMIT  (student)
========================================================= */
router.post(
    "/:id/submit",
    authMiddleware,
    roleMiddleware("STUDENT"),
    uploadSubmission,
    assignmentController.submit
);

/* =========================================================
   SUBMISSIONS FOR AN ASSIGNMENT  (mentor / admin)
========================================================= */
router.get(
    "/:id/submissions",
    authMiddleware,
    roleMiddleware("MENTOR", "ADMIN"),
    assignmentController.getSubmissions
);

/* =========================================================
   GRADE A SUBMISSION  (mentor / admin)
========================================================= */
router.put(
    "/submissions/:submissionId/grade",
    authMiddleware,
    roleMiddleware("MENTOR", "ADMIN"),
    assignmentController.gradeSubmission
);

module.exports = router;