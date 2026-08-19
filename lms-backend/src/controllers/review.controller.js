const reviewService = require("../services/review.service");

class ReviewController {

  // =====================================================
  // CREATE REVIEW
  // POST /api/reviews
  // =====================================================
  async createReview(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      const {
        courseId,
        rating,
        comment
      } = req.body;

      if (!courseId) {
        return res.status(400).json({
          success: false,
          message: "Course ID is required"
        });
      }

      if (rating === undefined || rating === null) {
        return res.status(400).json({
          success: false,
          message: "Rating is required"
        });
      }

      const review = await reviewService.createReview({
        userId,
        courseId,
        rating,
        comment
      });

      return res.status(201).json({
        success: true,
        message: "Review submitted successfully",
        data: review
      });

    } catch (error) {
      console.error("Create review error:", error);

      return res.status(400).json({
        success: false,
        message: error.message || "Failed to create review"
      });
    }
  }


  // =====================================================
  // GET MY REVIEWS
  // GET /api/reviews/my
  // =====================================================
  async getMyReviews(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      const reviews =
        await reviewService.getMyReviews(userId);

      return res.status(200).json({
        success: true,
        data: reviews
      });

    } catch (error) {
      console.error("Get my reviews error:", error);

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to fetch your reviews"
      });
    }
  }


  // =====================================================
  // GET MY COURSES WITH REVIEW STATUS
  // GET /api/reviews/my-courses
  // =====================================================
  async getMyCoursesWithReviews(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      const courses =
        await reviewService.getMyCoursesWithReviews(
          userId
        );

      return res.status(200).json({
        success: true,
        data: courses
      });

    } catch (error) {
      console.error(
        "Get my courses with reviews error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to fetch courses"
      });
    }
  }


  // =====================================================
  // GET MENTOR REVIEWS
  // GET /api/reviews/mentor
  // =====================================================
  async getMentorReviews(req, res) {
    try {
      const mentorId = req.user?.id;

      if (!mentorId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      const reviews =
        await reviewService.getMentorReviews(
          mentorId
        );

      return res.status(200).json({
        success: true,
        data: reviews
      });

    } catch (error) {
      console.error(
        "Get mentor reviews error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to fetch mentor reviews"
      });
    }
  }


  // =====================================================
  // GET MENTOR REVIEW STATISTICS
  // GET /api/reviews/mentor/stats
  // =====================================================
  async getMentorReviewStats(req, res) {
    try {
      const mentorId = req.user?.id;

      if (!mentorId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      const stats =
        await reviewService.getMentorReviewStats(
          mentorId
        );

      return res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error(
        "Get mentor review stats error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to fetch mentor review statistics"
      });
    }
  }


  // =====================================================
  // GET ALL REVIEWS
  // GET /api/reviews
  // =====================================================
  async getAllReviews(req, res) {
    try {
      const reviews =
        await reviewService.getAllReviews();

      return res.status(200).json({
        success: true,
        data: reviews
      });

    } catch (error) {
      console.error(
        "Get all reviews error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch reviews"
      });
    }
  }


  // =====================================================
  // GET COURSE REVIEWS
  // GET /api/reviews/course/:courseId
  // =====================================================
  async getCourseReviews(req, res) {
    try {
      const { courseId } = req.params;

      if (
        !courseId ||
        isNaN(Number(courseId))
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid course ID is required"
        });
      }

      const result =
        await reviewService.getCourseReviews(
          courseId
        );

      return res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error(
        "Get course reviews error:",
        error
      );

      return res.status(404).json({
        success: false,
        message:
          error.message ||
          "Failed to fetch course reviews"
      });
    }
  }


  // =====================================================
  // GET ONE REVIEW
  // GET /api/reviews/:id
  // =====================================================
  async getReview(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: "Valid review ID is required"
        });
      }

      const review =
        await reviewService.getReviewById(id);

      return res.status(200).json({
        success: true,
        data: review
      });

    } catch (error) {
      console.error(
        "Get review error:",
        error
      );

      return res.status(404).json({
        success: false,
        message:
          error.message ||
          "Review not found"
      });
    }
  }


  // =====================================================
  // UPDATE REVIEW
  // PUT /api/reviews/:id
  // =====================================================
  async updateReview(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: "Valid review ID is required"
        });
      }

      const review =
        await reviewService.updateReview(
          id,
          req.body,
          userId
        );

      return res.status(200).json({
        success: true,
        message: "Review updated successfully",
        data: review
      });

    } catch (error) {
      console.error(
        "Update review error:",
        error
      );

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to update review"
      });
    }
  }


  // =====================================================
  // DELETE OWN REVIEW
  // DELETE /api/reviews/:id
  // =====================================================
  async deleteReview(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: "Valid review ID is required"
        });
      }

      const result =
        await reviewService.deleteReview(
          id,
          userId
        );

      return res.status(200).json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error(
        "Delete review error:",
        error
      );

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to delete review"
      });
    }
  }


  // =====================================================
  // MARK REVIEW AS READ
  // PATCH /api/reviews/:id/read
  // =====================================================
  async markAsRead(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: "Valid review ID is required"
        });
      }

      const review =
        await reviewService.markAsRead(
          id,
          userId
        );

      return res.status(200).json({
        success: true,
        message: "Review marked as read",
        data: review
      });

    } catch (error) {
      console.error(
        "Mark review read error:",
        error
      );

      return res.status(404).json({
        success: false,
        message:
          error.message ||
          "Failed to mark review as read"
      });
    }
  }


  // =====================================================
  // REPLY TO REVIEW
  // PATCH /api/reviews/:id/reply
  // =====================================================
  async replyToReview(req, res) {
    try {
      const mentorId = req.user?.id;

      if (!mentorId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      const { id } = req.params;
      const { reply } = req.body;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: "Valid review ID is required"
        });
      }

      if (!reply || !reply.trim()) {
        return res.status(400).json({
          success: false,
          message: "Reply is required"
        });
      }

      const review =
        await reviewService.replyToReview(
          id,
          reply,
          mentorId
        );

      return res.status(200).json({
        success: true,
        message: "Reply added successfully",
        data: review
      });

    } catch (error) {
      console.error(
        "Reply review error:",
        error
      );

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to reply to review"
      });
    }
  }


  // =====================================================
  // REVIEW STATISTICS
  // GET /api/reviews/stats
  // GET /api/reviews/stats?courseId=1
  // =====================================================
  async getReviewStats(req, res) {
    try {
      const { courseId } = req.query;

      const stats =
        await reviewService.getReviewStats(
          courseId || null
        );

      return res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error(
        "Review stats error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to fetch review statistics"
      });
    }
  }


  // =====================================================
  // ADMIN DELETE REVIEW
  // DELETE /api/reviews/admin/:id
  // =====================================================
  async adminDeleteReview(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: "Valid review ID is required"
        });
      }

      const result =
        await reviewService.adminDeleteReview(
          id
        );

      return res.status(200).json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error(
        "Admin delete review error:",
        error
      );

      return res.status(404).json({
        success: false,
        message:
          error.message ||
          "Failed to delete review"
      });
    }
  }
}

module.exports = new ReviewController();