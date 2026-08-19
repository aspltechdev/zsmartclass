const express = require("express");

const router = express.Router();

const reviewController =
  require("../controllers/review.controller");

const authMiddleware =
  require("../middleware/auth.middleware");


// =====================================================
// REVIEW ROUTES
// Base URL: /api/reviews
// =====================================================


// =====================================================
// CREATE REVIEW
// POST /api/reviews
// =====================================================

router.post(
  "/",
  authMiddleware,
  reviewController.createReview
);


// =====================================================
// STUDENT - MY REVIEWS
// GET /api/reviews/my
// =====================================================

router.get(
  "/my",
  authMiddleware,
  reviewController.getMyReviews
);


// =====================================================
// STUDENT - MY COURSES + REVIEW STATUS
// GET /api/reviews/my-courses
// =====================================================

router.get(
  "/my-courses",
  authMiddleware,
  reviewController.getMyCoursesWithReviews
);


// =====================================================
// MENTOR - REVIEWS
// GET /api/reviews/mentor
// =====================================================

router.get(
  "/mentor",
  authMiddleware,
  reviewController.getMentorReviews
);


// =====================================================
// MENTOR - REVIEW STATISTICS
// GET /api/reviews/mentor/stats
// =====================================================

router.get(
  "/mentor/stats",
  authMiddleware,
  reviewController.getMentorReviewStats
);


// =====================================================
// REVIEW STATISTICS
// GET /api/reviews/stats
// GET /api/reviews/stats?courseId=1
// =====================================================

router.get(
  "/stats",
  reviewController.getReviewStats
);


// =====================================================
// COURSE REVIEWS
// GET /api/reviews/course/:courseId
// =====================================================

router.get(
  "/course/:courseId",
  reviewController.getCourseReviews
);


// =====================================================
// ALL REVIEWS
// GET /api/reviews
// =====================================================

router.get(
  "/",
  reviewController.getAllReviews
);


// =====================================================
// GET ONE REVIEW
// GET /api/reviews/:id
//
// IMPORTANT:
// Keep this AFTER all static routes.
// =====================================================

router.get(
  "/:id",
  reviewController.getReview
);


// =====================================================
// UPDATE OWN REVIEW
// PUT /api/reviews/:id
// =====================================================

router.put(
  "/:id",
  authMiddleware,
  reviewController.updateReview
);


// =====================================================
// DELETE OWN REVIEW
// DELETE /api/reviews/:id
// =====================================================

router.delete(
  "/:id",
  authMiddleware,
  reviewController.deleteReview
);


// =====================================================
// MARK REVIEW AS READ
// PATCH /api/reviews/:id/read
// =====================================================

router.patch(
  "/:id/read",
  authMiddleware,
  reviewController.markAsRead
);


// =====================================================
// REPLY TO REVIEW
// PATCH /api/reviews/:id/reply
// =====================================================

router.patch(
  "/:id/reply",
  authMiddleware,
  reviewController.replyToReview
);


// =====================================================
// ADMIN DELETE REVIEW
// DELETE /api/reviews/admin/:id
// =====================================================

router.delete(
  "/admin/:id",
  authMiddleware,
  reviewController.adminDeleteReview
);


module.exports = router;