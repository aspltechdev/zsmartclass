import { useEffect, useState } from "react";
import {
  Star,
  MessageSquare,
  BookOpen,
  Edit3,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Send,
  RefreshCw
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import "./Reviews.css";
import "./StudentShared.css";

function Reviews() {
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [filter, setFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // =====================================================
  // FETCH ENROLLED COURSES
  // =====================================================

  const fetchCourses = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      /*
       * This endpoint already exists in your backend.
       * It returns only courses where the logged-in
       * student is enrolled.
       */
      const response = await api.get(
        "/enrollments/my-courses"
      );

      const enrollments =
        response?.data?.data || [];

      if (!Array.isArray(enrollments)) {
        setCourses([]);
        return;
      }

      /*
       * For each enrolled course, fetch the reviews
       * for that course using the existing endpoint.
       *
       * Then find the current student's review.
       */
      const coursesWithReviews =
        await Promise.all(
          enrollments.map(async (enrollment) => {
            const course =
              enrollment?.course || {};

            const courseId =
              enrollment?.courseId ||
              course?.id;

            let myReview = null;

            if (courseId) {
              try {
                const reviewResponse =
                  await api.get(
                    `/reviews/course/${courseId}`
                  );

                const reviews =
                  reviewResponse?.data?.data || [];

                if (Array.isArray(reviews)) {
                  myReview =
                    reviews.find(
                      (review) =>
                        Number(
                          review?.userId
                        ) ===
                        Number(user?.id) ||
                        Number(
                          review?.user?.id
                        ) ===
                        Number(user?.id)
                    ) || null;
                }
              } catch (reviewError) {
                console.error(
                  `Failed to fetch reviews for course ${courseId}:`,
                  reviewError
                );
              }
            }

            return {
              enrollmentId: enrollment?.id,
              courseId: Number(courseId),
              progress:
                enrollment?.progress || 0,
              completed:
                enrollment?.completed || false,
              course,
              review: myReview
            };
          })
        );

      setCourses(coursesWithReviews);
    } catch (err) {
      console.error(
        "Error fetching enrolled courses:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to load your enrolled courses."
      );

      setCourses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchCourses();
    }
  }, [user?.id]);

  // =====================================================
  // OPEN WRITE REVIEW
  // =====================================================

  const openWriteReview = (courseItem) => {
    setSelectedCourse(courseItem);
    setSelectedReview(null);
    setRating(0);
    setComment("");
    setError("");
    setShowModal(true);
  };

  // =====================================================
  // OPEN EDIT REVIEW
  // =====================================================

  const openEditReview = (courseItem) => {
    if (!courseItem?.review) {
      return;
    }

    setSelectedCourse(courseItem);
    setSelectedReview(courseItem.review);
    setRating(
      Number(courseItem.review.rating || 0)
    );
    setComment(
      courseItem.review.comment || ""
    );
    setError("");
    setShowModal(true);
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setSelectedCourse(null);
    setSelectedReview(null);
    setRating(0);
    setComment("");
    setError("");
  };

  // =====================================================
  // SAVE REVIEW
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedCourse) {
      return;
    }

    if (!rating) {
      setError("Please select a rating.");
      return;
    }

    if (!comment.trim()) {
      setError("Please write your review.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      // EDIT EXISTING REVIEW
      if (selectedReview) {
        await api.put(
          `/reviews/${selectedReview.id}`,
          {
            rating: Number(rating),
            comment: comment.trim()
          }
        );

        setSuccess(
          "Review updated successfully."
        );
      }

      // CREATE NEW REVIEW
      else {
        await api.post(
          "/reviews",
          {
            courseId:
              selectedCourse.courseId,
            rating: Number(rating),
            comment: comment.trim()
          }
        );

        setSuccess(
          "Review submitted successfully."
        );
      }

      closeModal();

      await fetchCourses(true);
    } catch (err) {
      console.error(
        "Review submission error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to save your review."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE REVIEW
  // =====================================================

  const handleDelete = async (review) => {
    if (!review?.id) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this review?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await api.delete(
        `/reviews/${review.id}`
      );

      setSuccess(
        "Review deleted successfully."
      );

      await fetchCourses(true);
    } catch (err) {
      console.error(
        "Delete review error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to delete your review."
      );
    } finally {
      setDeleting(false);
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    try {
      return new Date(date).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric"
        }
      );
    } catch {
      return "";
    }
  };

  // =====================================================
  // STARS
  // =====================================================

  const renderStars = (value, size = 17) => {
    const currentRating =
      Number(value) || 0;

    return (
      <div className="review-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={
              star <= currentRating
                ? "star-filled"
                : "star-empty"
            }
            fill={
              star <= currentRating
                ? "currentColor"
                : "none"
            }
          />
        ))}
      </div>
    );
  };

  // =====================================================
  // FILTER
  // =====================================================

  const filteredCourses =
    courses.filter((item) => {
      if (filter === "reviewed") {
        return Boolean(item.review);
      }

      if (filter === "not-reviewed") {
        return !item.review;
      }

      return true;
    });

  const totalCourses = courses.length;

  const reviewedCount = courses.filter(
    (item) => item.review
  ).length;

  const notReviewedCount =
    totalCourses - reviewedCount;

  const averageRating =
    reviewedCount > 0
      ? (
          courses
            .filter((item) => item.review)
            .reduce(
              (sum, item) =>
                sum +
                Number(
                  item.review.rating || 0
                ),
              0
            ) / reviewedCount
        ).toFixed(1)
      : "0";

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="reviews-page">
        <div className="reviews-loading">
          <div className="reviews-spinner"></div>
          <p>Loading your enrolled courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reviews-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="reviews-header">

        <div className="reviews-heading">

          <div className="reviews-heading-icon">
            <MessageSquare size={27} />
          </div>

          <div>
            <h1>Reviews &amp; Feedback</h1>

            <p>
              Share your learning experience and
              help other students choose the right
              courses.
            </p>
          </div>

        </div>

        <button
          type="button"
          className="reviews-refresh-btn"
          onClick={() => fetchCourses(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? "refresh-spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>

      {/* =================================================
          ALERTS
      ================================================= */}

      {error && !showModal && (
        <div className="reviews-alert error">
          <div>
            <AlertCircle size={17} />
            <span>{error}</span>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="reviews-alert success">
          <div>
            <CheckCircle size={17} />
            <span>{success}</span>
          </div>

          <button
            type="button"
            onClick={() => setSuccess("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="reviews-summary">

        <div className="summary-card">
          <div className="summary-icon purple">
            <BookOpen size={21} />
          </div>

          <div>
            <strong>
              {totalCourses}
            </strong>

            <span>
              Enrolled Courses
            </span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon blue">
            <MessageSquare size={21} />
          </div>

          <div>
            <strong>
              {reviewedCount}
            </strong>

            <span>
              Reviews Given
            </span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon orange">
            <Star size={21} />
          </div>

          <div>
            <strong>
              {averageRating}
            </strong>

            <span>
              Average Rating
            </span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon green">
            <CheckCircle size={21} />
          </div>

          <div>
            <strong>
              {notReviewedCount}
            </strong>

            <span>
              Yet to Review
            </span>
          </div>
        </div>

      </div>

      {/* =================================================
          COURSES SECTION
      ================================================= */}

      <div className="courses-card">

        <div className="courses-card-header">

          <div className="courses-title">
            <BookOpen size={19} />
            <h2>
              My Enrolled Courses
            </h2>
          </div>

          <div className="review-tabs">

            <button
              type="button"
              className={
                filter === "all"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter("all")
              }
            >
              All
              <span>{totalCourses}</span>
            </button>

            <button
              type="button"
              className={
                filter === "reviewed"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter("reviewed")
              }
            >
              Reviewed
              <span>{reviewedCount}</span>
            </button>

            <button
              type="button"
              className={
                filter === "not-reviewed"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter("not-reviewed")
              }
            >
              Not Reviewed
              <span>{notReviewedCount}</span>
            </button>

          </div>

        </div>

        {/* =================================================
            NO COURSES
        ================================================= */}

        {filteredCourses.length === 0 ? (

          <div className="reviews-empty">

            <div className="empty-icon">
              <BookOpen size={29} />
            </div>

            <h3>
              {totalCourses === 0
                ? "No enrolled courses"
                : "No courses in this section"}
            </h3>

            <p>
              {totalCourses === 0
                ? "You need to enroll in a course before you can write a review."
                : "There are no courses matching this filter."}
            </p>

          </div>

        ) : (

          <div className="course-list">

            {filteredCourses.map(
              (item) => {

                const course =
                  item.course || {};

                const review =
                  item.review;

                return (
                  <div
                    className="course-review-card"
                    key={
                      item.enrollmentId ||
                      item.courseId
                    }
                  >

                    {/* COURSE IMAGE */}

                    <div className="course-thumbnail">

                      {course.thumbnail ? (
                        <img
                          src={
                            course.thumbnail
                          }
                          alt={
                            course.title ||
                            "Course"
                          }
                        />
                      ) : (
                        <div className="thumbnail-placeholder">
                          <BookOpen
                            size={31}
                          />
                        </div>
                      )}

                    </div>

                    {/* CONTENT */}

                    <div className="course-review-content">

                      <div className="course-review-top">

                        <div>
                          <h3>
                            {course.title ||
                              "Course"}
                          </h3>

                          {course.description && (
                            <p>
                              {
                                course.description
                              }
                            </p>
                          )}
                        </div>

                        <span
                          className={
                            review
                              ? "review-status reviewed"
                              : "review-status pending"
                          }
                        >
                          {review
                            ? "Reviewed"
                            : "Not Reviewed"}
                        </span>

                      </div>

                      {/* EXISTING REVIEW */}

                      {review ? (

                        <div className="existing-review">

                          <div className="existing-review-top">

                            <div className="rating-display">

                              {renderStars(
                                review.rating
                              )}

                              <span>
                                {
                                  review.rating
                                }/5
                              </span>

                            </div>

                            <span className="review-date">
                              {formatDate(
                                review.createdAt
                              )}
                            </span>

                          </div>

                          <p className="review-comment">
                            {review.comment ||
                              "No comment provided."}
                          </p>

                          {review.reply && (
                            <div className="mentor-reply">

                              <strong>
                                Mentor Response
                              </strong>

                              <p>
                                {review.reply}
                              </p>

                            </div>
                          )}

                          <div className="review-actions">

                            <button
                              type="button"
                              className="edit-review-btn"
                              onClick={() =>
                                openEditReview(
                                  item
                                )
                              }
                            >
                              <Edit3 size={15} />
                              Edit Review
                            </button>

                            <button
                              type="button"
                              className="delete-review-btn"
                              onClick={() =>
                                handleDelete(
                                  review
                                )
                              }
                              disabled={
                                deleting
                              }
                            >
                              <Trash2 size={15} />

                              {deleting
                                ? "Deleting..."
                                : "Delete"}
                            </button>

                          </div>

                        </div>

                      ) : (

                        /* WRITE REVIEW */

                        <div className="write-review-area">

                          <div className="write-review-info">

                            <div className="review-star-box">
                              <Star size={21} />
                            </div>

                            <div>
                              <h4>
                                Share your experience
                              </h4>

                              <p>
                                Give feedback about
                                this course.
                              </p>
                            </div>

                          </div>

                          <button
                            type="button"
                            className="write-review-btn"
                            onClick={() =>
                              openWriteReview(
                                item
                              )
                            }
                          >
                            <MessageSquare
                              size={16}
                            />
                            Write Review
                          </button>

                        </div>

                      )}

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </div>

      {/* =================================================
          REVIEW MODAL
      ================================================= */}

      {showModal &&
        selectedCourse && (

          <div
            className="review-modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeModal();
              }
            }}
          >

            <div className="review-modal">

              <div className="review-modal-header">

                <div>
                  <h2>
                    {selectedReview
                      ? "Edit Review"
                      : "Write a Review"}
                  </h2>

                  <p>
                    {
                      selectedCourse
                        .course?.title
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  <X size={19} />
                </button>

              </div>

              <form
                onSubmit={handleSubmit}
                className="review-form"
              >

                {error && (
                  <div className="modal-error">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {/* RATING */}

                <div className="form-group">

                  <label>
                    Your Rating
                  </label>

                  <div className="rating-selector">

                    {[1, 2, 3, 4, 5].map(
                      (star) => (
                        <button
                          key={star}
                          type="button"
                          className={
                            star <= rating
                              ? "rating-select active"
                              : "rating-select"
                          }
                          onClick={() =>
                            setRating(star)
                          }
                        >
                          <Star
                            size={30}
                            fill={
                              star <= rating
                                ? "currentColor"
                                : "none"
                          }
                        />
                        </button>
                      )
                    )}

                  </div>

                  <span className="rating-label">
                    {rating === 0
                      ? "Select a rating"
                      : `${rating} / 5`}
                  </span>

                </div>

                {/* COMMENT */}

                <div className="form-group">

                  <label htmlFor="review-comment">
                    Your Review
                  </label>

                  <textarea
                    id="review-comment"
                    value={comment}
                    onChange={(event) =>
                      setComment(
                        event.target.value
                      )
                    }
                    placeholder="Write your experience with this course..."
                    rows={6}
                    maxLength={1000}
                  />

                  <span className="character-count">
                    {comment.length}/1000
                  </span>

                </div>

                {/* ACTIONS */}

                <div className="modal-actions">

                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="button-spinner" />
                        Saving...
                      </>
                    ) : (
                      <>
                        {selectedReview ? (
                          <CheckCircle
                            size={16}
                          />
                        ) : (
                          <Send size={16} />
                        )}

                        {selectedReview
                          ? "Update Review"
                          : "Submit Review"}
                      </>
                    )}
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

    </div>
  );
}

export default Reviews;