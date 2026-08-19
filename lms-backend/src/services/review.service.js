const prisma = require("../config/prisma");

class ReviewService {

  // ==========================================
  // CREATE REVIEW
  // ==========================================
  async createReview(data) {
    const {
      userId,
      courseId,
      rating,
      comment
    } = data;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Check course exists
    const course = await prisma.course.findUnique({
      where: {
        id: Number(courseId)
      }
    });

    if (!course) {
      throw new Error("Course not found");
    }

    // Check whether user already reviewed this course
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: Number(userId),
        courseId: Number(courseId)
      }
    });

    if (existingReview) {
      throw new Error("You have already reviewed this course");
    }

    const review = await prisma.review.create({
      data: {
        userId: Number(userId),
        courseId: Number(courseId),
        rating: Number(rating),
        comment: comment || ""
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    return review;
  }


  // ==========================================
  // GET ALL REVIEWS
  // ==========================================
  async getAllReviews() {

    const reviews = await prisma.review.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    return reviews;
  }


  // ==========================================
  // GET REVIEWS FOR A COURSE
  // ==========================================
  async getCourseReviews(courseId) {

    const course = await prisma.course.findUnique({
      where: {
        id: Number(courseId)
      }
    });

    if (!course) {
      throw new Error("Course not found");
    }

    const reviews = await prisma.review.findMany({
      where: {
        courseId: Number(courseId)
      },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return reviews;
  }


  // ==========================================
  // GET ONE REVIEW
  // ==========================================
  async getReviewById(reviewId) {

    const review = await prisma.review.findUnique({
      where: {
        id: Number(reviewId)
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!review) {
      throw new Error("Review not found");
    }

    return review;
  }


  // ==========================================
  // UPDATE REVIEW
  // ==========================================
  async updateReview(reviewId, data, userId) {

    const review = await prisma.review.findUnique({
      where: {
        id: Number(reviewId)
      }
    });

    if (!review) {
      throw new Error("Review not found");
    }

    // Only review owner can update
    if (Number(review.userId) !== Number(userId)) {
      throw new Error("You are not allowed to update this review");
    }

    const updateData = {};

    if (data.rating !== undefined) {

      if (Number(data.rating) < 1 || Number(data.rating) > 5) {
        throw new Error("Rating must be between 1 and 5");
      }

      updateData.rating = Number(data.rating);
    }

    if (data.comment !== undefined) {
      updateData.comment = data.comment;
    }

    updateData.updatedAt = new Date();

    return await prisma.review.update({
      where: {
        id: Number(reviewId)
      },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });
  }


  // ==========================================
  // DELETE REVIEW
  // ==========================================
  async deleteReview(reviewId, userId) {

    const review = await prisma.review.findUnique({
      where: {
        id: Number(reviewId)
      }
    });

    if (!review) {
      throw new Error("Review not found");
    }

    if (Number(review.userId) !== Number(userId)) {
      throw new Error("You are not allowed to delete this review");
    }

    await prisma.review.delete({
      where: {
        id: Number(reviewId)
      }
    });

    return {
      message: "Review deleted successfully"
    };
  }


  // ==========================================
  // MARK REVIEW AS READ
  // ==========================================
  async markAsRead(reviewId) {

    const review = await prisma.review.findUnique({
      where: {
        id: Number(reviewId)
      }
    });

    if (!review) {
      throw new Error("Review not found");
    }

    return await prisma.review.update({
      where: {
        id: Number(reviewId)
      },
      data: {
        isRead: true,
        updatedAt: new Date()
      }
    });
  }


  // ==========================================
  // REPLY TO REVIEW
  // ==========================================
  async replyToReview(reviewId, reply) {

    if (!reply || !reply.trim()) {
      throw new Error("Reply is required");
    }

    const review = await prisma.review.findUnique({
      where: {
        id: Number(reviewId)
      }
    });

    if (!review) {
      throw new Error("Review not found");
    }

    return await prisma.review.update({
      where: {
        id: Number(reviewId)
      },
      data: {
        reply: reply.trim(),
        repliedAt: new Date(),
        isRead: true,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });
  }


  // ==========================================
  // DELETE REVIEW - ADMIN
  // ==========================================
  async adminDeleteReview(reviewId) {

    const review = await prisma.review.findUnique({
      where: {
        id: Number(reviewId)
      }
    });

    if (!review) {
      throw new Error("Review not found");
    }

    await prisma.review.delete({
      where: {
        id: Number(reviewId)
      }
    });

    return {
      message: "Review deleted successfully"
    };
  }


  // ==========================================
  // REVIEW STATISTICS
  // ==========================================
  async getReviewStats(courseId = null) {

    const where = courseId
      ? {
          courseId: Number(courseId)
        }
      : {};

    const reviews = await prisma.review.findMany({
      where,
      select: {
        rating: true
      }
    });

    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        fiveStar: 0,
        fourStar: 0,
        threeStar: 0,
        twoStar: 0,
        oneStar: 0
      };
    }

    const fiveStar = reviews.filter(r => r.rating === 5).length;
    const fourStar = reviews.filter(r => r.rating === 4).length;
    const threeStar = reviews.filter(r => r.rating === 3).length;
    const twoStar = reviews.filter(r => r.rating === 2).length;
    const oneStar = reviews.filter(r => r.rating === 1).length;

    const totalRating = reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );

    const averageRating = totalRating / totalReviews;

    return {
      totalReviews,
      averageRating: Number(averageRating.toFixed(1)),
      fiveStar,
      fourStar,
      threeStar,
      twoStar,
      oneStar
    };
  }
}

module.exports = new ReviewService();