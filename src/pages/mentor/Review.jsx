import { useEffect, useState } from "react";
import {
  Star,
  Search,
  RefreshCw,
  MessageSquare,
  Check,
  X,
  Send,
  User,
  BookOpen,
  Clock,
  CheckCircle,
  MessageCircle,
  Trash2,
} from "lucide-react";

import api from "../../services/api";
import "./Review.css";

function MentorReviews() {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [selectedReview, setSelectedReview] = useState(null);

  const [showReplyModal, setShowReplyModal] = useState(false);
  const [reply, setReply] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // =====================================================
  // FETCH REVIEWS
  // GET /api/reviews
  // =====================================================

  const fetchReviews = async () => {
    try {
      setLoading(true);

      const response = await api.get("/reviews");

      const data =
        response.data?.data ||
        response.data?.reviews ||
        response.data ||
        [];

      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);

      setReviews([]);

      alert(
        error.response?.data?.message ||
          "Failed to load reviews"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      const response = await api.get("/reviews");

      const data =
        response.data?.data ||
        response.data?.reviews ||
        response.data ||
        [];

      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Refresh failed:", error);

      alert(
        error.response?.data?.message ||
          "Failed to refresh reviews"
      );
    } finally {
      setRefreshing(false);
    }
  };

  // =====================================================
  // FILTER REVIEWS
  // =====================================================

  useEffect(() => {
    let result = [...reviews];

    // -------------------------
    // SEARCH
    // -------------------------

    if (search.trim()) {
      const keyword = search.toLowerCase();

      result = result.filter((review) => {
        const studentName =
          review.user?.name ||
          review.user?.username ||
          "";

        const studentEmail =
          review.user?.email ||
          "";

        const courseName =
          review.course?.title ||
          "";

        const comment =
          review.comment ||
          "";

        return (
          studentName
            .toLowerCase()
            .includes(keyword) ||
          studentEmail
            .toLowerCase()
            .includes(keyword) ||
          courseName
            .toLowerCase()
            .includes(keyword) ||
          comment
            .toLowerCase()
            .includes(keyword)
        );
      });
    }

    // -------------------------
    // READ FILTER
    // -------------------------

    if (filter === "UNREAD") {
      result = result.filter(
        (review) => !review.isRead
      );
    }

    if (filter === "READ") {
      result = result.filter(
        (review) => review.isRead
      );
    }

    // -------------------------
    // RATING FILTERS
    // -------------------------

    if (["1", "2", "3", "4", "5"].includes(filter)) {
      result = result.filter(
        (review) =>
          Number(review.rating) === Number(filter)
      );
    }

    setFilteredReviews(result);
  }, [reviews, search, filter]);

  // =====================================================
  // MARK REVIEW AS READ
  //
  // IMPORTANT:
  // Backend uses PATCH /reviews/:id/read
  // =====================================================

  const markAsRead = async (review) => {
    if (review.isRead) return;

    try {
      await api.patch(
        `/reviews/${review.id}/read`
      );

      setReviews((prev) =>
        prev.map((item) =>
          item.id === review.id
            ? {
                ...item,
                isRead: true,
              }
            : item
        )
      );

      setSelectedReview((prev) =>
        prev && prev.id === review.id
          ? {
              ...prev,
              isRead: true,
            }
          : prev
      );
    } catch (error) {
      console.error(
        "Failed to mark review as read:",
        error
      );
    }
  };

  // =====================================================
  // OPEN REVIEW
  // =====================================================

  const handleOpenReview = async (review) => {
    setSelectedReview(review);

    if (!review.isRead) {
      await markAsRead(review);
    }
  };

  // =====================================================
  // OPEN REPLY MODAL
  // =====================================================

  const handleOpenReply = (review) => {
    setSelectedReview(review);
    setReply(review.reply || "");
    setShowReplyModal(true);
  };

  // =====================================================
  // CLOSE REPLY MODAL
  // =====================================================

  const closeReplyModal = () => {
    if (submittingReply) return;

    setShowReplyModal(false);
    setReply("");
    setSelectedReview(null);
  };

  // =====================================================
  // SEND / UPDATE REPLY
  //
  // IMPORTANT:
  // Backend uses PATCH /reviews/:id/reply
  // NOT PUT
  // =====================================================

  const handleSendReply = async () => {
    const trimmedReply = reply.trim();

    if (!trimmedReply) {
      alert("Please enter a reply.");
      return;
    }

    if (!selectedReview) {
      return;
    }

    try {
      setSubmittingReply(true);

      console.log(
        "Sending reply for review:",
        selectedReview.id
      );

      const response = await api.patch(
        `/reviews/${selectedReview.id}/reply`,
        {
          reply: trimmedReply,
        }
      );

      console.log(
        "Reply response:",
        response.data
      );

      const updatedReview =
        response.data?.data ||
        response.data?.review ||
        response.data;

      const newReplyDate =
        updatedReview?.repliedAt ||
        new Date().toISOString();

      // Update list
      setReviews((prev) =>
        prev.map((review) =>
          review.id === selectedReview.id
            ? {
                ...review,
                ...(updatedReview || {}),
                reply: trimmedReply,
                repliedAt: newReplyDate,
                isRead: true,
              }
            : review
        )
      );

      // Update selected review
      setSelectedReview((prev) =>
        prev
          ? {
              ...prev,
              ...(updatedReview || {}),
              reply: trimmedReply,
              repliedAt: newReplyDate,
              isRead: true,
            }
          : prev
      );

      setShowReplyModal(false);
      setReply("");

      alert("Reply sent successfully!");
    } catch (error) {
      console.error(
        "Failed to send reply:",
        error
      );

      console.error(
        "Response:",
        error.response?.data
      );

      alert(
        error.response?.data?.message ||
          "Failed to send reply"
      );
    } finally {
      setSubmittingReply(false);
    }
  };

  // =====================================================
  // DELETE REVIEW
  // =====================================================

  const handleDeleteReview = async (reviewId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this review?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await api.delete(
        `/reviews/${reviewId}`
      );

      setReviews((prev) =>
        prev.filter(
          (review) => review.id !== reviewId
        )
      );

      if (
        selectedReview &&
        selectedReview.id === reviewId
      ) {
        setSelectedReview(null);
      }

      alert(
        "Review deleted successfully."
      );
    } catch (error) {
      console.error(
        "Failed to delete review:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to delete review"
      );
    }
  };

  // =====================================================
  // STATISTICS
  // =====================================================

  const totalReviews = reviews.length;

  const unreadReviews = reviews.filter(
    (review) => !review.isRead
  ).length;

  const repliedReviews = reviews.filter(
    (review) =>
      review.reply &&
      review.reply.trim() !== ""
  ).length;

  const averageRating =
    totalReviews > 0
      ? (
          reviews.reduce(
            (sum, review) =>
              sum + Number(review.rating || 0),
            0
          ) / totalReviews
        ).toFixed(1)
      : "0.0";

  // =====================================================
  // RENDER STARS
  // =====================================================

  const renderStars = (rating) => {
    const numericRating = Number(rating || 0);

    return (
      <div className="review-stars">
        {[1, 2, 3, 4, 5].map(
          (star) => (
            <Star
              key={star}
              size={16}
              fill={
                star <= numericRating
                  ? "currentColor"
                  : "none"
              }
            />
          )
        )}
      </div>
    );
  };

  // =====================================================
  // DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatDateTime = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="reviews-page">
        <div className="reviews-loading">
          <div className="reviews-spinner"></div>
          <p>Loading reviews...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="reviews-page">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="reviews-header">

        <div>
          <h1>Reviews</h1>

          <p>
            View and respond to student reviews.
          </p>
        </div>

        <button
          className="review-refresh-btn"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? "refresh-spinning"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>

      {/* ================================================= */}
      {/* STATISTICS */}
      {/* ================================================= */}

      <div className="review-stats">

        <div className="review-stat-card">

          <div className="review-stat-icon purple">
            <MessageSquare size={21} />
          </div>

          <div>
            <h3>{totalReviews}</h3>
            <p>Total Reviews</p>
          </div>

        </div>

        <div className="review-stat-card">

          <div className="review-stat-icon orange">
            <Clock size={21} />
          </div>

          <div>
            <h3>{unreadReviews}</h3>
            <p>Unread</p>
          </div>

        </div>

        <div className="review-stat-card">

          <div className="review-stat-icon green">
            <CheckCircle size={21} />
          </div>

          <div>
            <h3>{repliedReviews}</h3>
            <p>Replied</p>
          </div>

        </div>

        <div className="review-stat-card">

          <div className="review-stat-icon blue">
            <Star size={21} />
          </div>

          <div>
            <h3>{averageRating}</h3>
            <p>Average Rating</p>
          </div>

        </div>

      </div>

      {/* ================================================= */}
      {/* TOOLBAR */}
      {/* ================================================= */}

      <div className="reviews-toolbar">

        <div className="review-search">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search student, course or review..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        <select
          className="review-filter"
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value)
          }
        >
          <option value="ALL">
            All Reviews
          </option>

          <option value="UNREAD">
            Unread
          </option>

          <option value="READ">
            Read
          </option>

          <option value="5">
            5 Star
          </option>

          <option value="4">
            4 Star
          </option>

          <option value="3">
            3 Star
          </option>

          <option value="2">
            2 Star
          </option>

          <option value="1">
            1 Star
          </option>
        </select>

      </div>

      {/* ================================================= */}
      {/* REVIEW LIST */}
      {/* ================================================= */}

      <div className="reviews-container">

        {filteredReviews.length === 0 ? (

          <div className="reviews-empty">

            <MessageCircle size={48} />

            <h3>
              No Reviews Found
            </h3>

            <p>
              There are no reviews matching
              your current filters.
            </p>

          </div>

        ) : (

          <div className="reviews-list">

            {filteredReviews.map(
              (review) => {

                const studentName =
                  review.user?.name ||
                  review.user?.username ||
                  "Student";

                const studentEmail =
                  review.user?.email ||
                  "No email";

                const courseName =
                  review.course?.title ||
                  "Course";

                return (
                  <div
                    key={review.id}
                    className={`review-card ${
                      !review.isRead
                        ? "unread-review"
                        : ""
                    }`}
                    onClick={() =>
                      handleOpenReview(
                        review
                      )
                    }
                  >

                    {/* UNREAD DOT */}

                    {!review.isRead && (
                      <span className="unread-dot"></span>
                    )}

                    {/* STUDENT */}

                    <div className="review-student">

                      <div className="student-avatar">
                        {studentName
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="student-info">

                        <h3>
                          {studentName}
                        </h3>

                        <span>
                          {studentEmail}
                        </span>

                      </div>

                    </div>

                    {/* COURSE */}

                    <div className="review-course">

                      <BookOpen size={17} />

                      <span>
                        {courseName}
                      </span>

                    </div>

                    {/* RATING */}

                    <div className="review-rating">

                      {renderStars(
                        review.rating
                      )}

                      <strong>
                        {review.rating}/5
                      </strong>

                    </div>

                    {/* COMMENT */}

                    <div className="review-comment">

                      <p>
                        {review.comment ||
                          "No comment provided."}
                      </p>

                    </div>

                    {/* DATE */}

                    <div className="review-date">

                      <Clock size={14} />

                      {formatDate(
                        review.createdAt
                      )}

                    </div>

                    {/* STATUS */}

                    <div className="review-status">

                      {review.reply ? (

                        <span className="replied-badge">
                          <Check size={13} />
                          Replied
                        </span>

                      ) : (

                        <span className="pending-badge">
                          <MessageSquare
                            size={13}
                          />
                          Pending Reply
                        </span>

                      )}

                    </div>

                    {/* ACTIONS */}

                    <div
                      className="review-actions"
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                    >

                      <button
                        className="review-view-btn"
                        onClick={() =>
                          handleOpenReview(
                            review
                          )
                        }
                      >
                        View
                      </button>

                      <button
                        className="review-reply-btn"
                        onClick={() =>
                          handleOpenReply(
                            review
                          )
                        }
                      >
                        <MessageSquare
                          size={14}
                        />

                        {review.reply
                          ? "Edit Reply"
                          : "Reply"}
                      </button>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </div>

      {/* ================================================= */}
      {/* REVIEW DETAILS MODAL */}
      {/* ================================================= */}

      {selectedReview &&
        !showReplyModal && (

          <div
            className="review-modal-overlay"
            onClick={() =>
              setSelectedReview(null)
            }
          >

            <div
              className="review-detail-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* HEADER */}

              <div className="review-modal-header">

                <div>

                  <h2>
                    Review Details
                  </h2>

                  <p>
                    Review #{selectedReview.id}
                  </p>

                </div>

                <button
                  onClick={() =>
                    setSelectedReview(null)
                  }
                  className="modal-close-btn"
                >
                  <X size={20} />
                </button>

              </div>

              {/* BODY */}

              <div className="review-detail-body">

                {/* STUDENT */}

                <div className="detail-section">

                  <h4>
                    <User size={17} />
                    Student
                  </h4>

                  <div className="detail-student">

                    <div className="student-avatar large">

                      {(
                        selectedReview.user?.name ||
                        selectedReview.user?.username ||
                        "S"
                      )
                        .charAt(0)
                        .toUpperCase()}

                    </div>

                    <div>

                      <strong>
                        {selectedReview.user?.name ||
                          selectedReview.user?.username ||
                          "Student"}
                      </strong>

                      <span>
                        {selectedReview.user?.email ||
                          "No email"}
                      </span>

                    </div>

                  </div>

                </div>

                {/* COURSE */}

                <div className="detail-section">

                  <h4>
                    <BookOpen size={17} />
                    Course
                  </h4>

                  <div className="course-detail-box">

                    {selectedReview.course
                      ?.title ||
                      "Course"}

                  </div>

                </div>

                {/* RATING */}

                <div className="detail-section">

                  <h4>
                    Rating
                  </h4>

                  <div className="detail-rating">

                    {renderStars(
                      selectedReview.rating
                    )}

                    <strong>
                      {selectedReview.rating} / 5
                    </strong>

                  </div>

                </div>

                {/* STUDENT REVIEW */}

                <div className="detail-section">

                  <h4>
                    Student Review
                  </h4>

                  <div className="student-review-text">

                    {selectedReview.comment ||
                      "No comment provided."}

                  </div>

                  <small>
                    Posted{" "}
                    {formatDateTime(
                      selectedReview.createdAt
                    )}
                  </small>

                </div>

                {/* MENTOR REPLY */}

                {selectedReview.reply && (

                  <div className="mentor-reply-section">

                    <div className="mentor-reply-header">

                      <h4>

                        <MessageSquare
                          size={17}
                        />

                        Your Reply

                      </h4>

                      <span>
                        {formatDateTime(
                          selectedReview.repliedAt
                        )}
                      </span>

                    </div>

                    <div className="mentor-reply-text">

                      {selectedReview.reply}

                    </div>

                  </div>

                )}

              </div>

              {/* FOOTER */}

              <div className="review-modal-footer">

                <button
                  className="detail-delete-btn"
                  onClick={() =>
                    handleDeleteReview(
                      selectedReview.id
                    )
                  }
                >
                  <Trash2 size={16} />
                  Delete
                </button>

                <div className="modal-footer-right">

                  <button
                    className="detail-close-btn"
                    onClick={() =>
                      setSelectedReview(null)
                    }
                  >
                    Close
                  </button>

                  <button
                    className="detail-reply-btn"
                    onClick={() =>
                      handleOpenReply(
                        selectedReview
                      )
                    }
                  >
                    <MessageSquare
                      size={17}
                    />

                    {selectedReview.reply
                      ? "Edit Reply"
                      : "Reply to Student"}

                  </button>

                </div>

              </div>

            </div>

          </div>

        )}

      {/* ================================================= */}
      {/* REPLY MODAL */}
      {/* ================================================= */}

      {showReplyModal &&
        selectedReview && (

          <div
            className="review-modal-overlay"
            onClick={closeReplyModal}
          >

            <div
              className="reply-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* HEADER */}

              <div className="review-modal-header">

                <div>

                  <h2>
                    {selectedReview.reply
                      ? "Edit Reply"
                      : "Reply to Review"}
                  </h2>

                  <p>
                    Replying to{" "}
                    {selectedReview.user?.name ||
                      selectedReview.user?.username ||
                      "Student"}
                  </p>

                </div>

                <button
                  onClick={closeReplyModal}
                  className="modal-close-btn"
                  disabled={
                    submittingReply
                  }
                >
                  <X size={20} />
                </button>

              </div>

              {/* BODY */}

              <div className="reply-modal-body">

                {/* REVIEW PREVIEW */}

                <div className="reply-review-preview">

                  <div className="reply-preview-top">

                    <strong>
                      Student Review
                    </strong>

                    <div className="detail-rating">

                      {renderStars(
                        selectedReview.rating
                      )}

                    </div>

                  </div>

                  <p>
                    {selectedReview.comment ||
                      "No comment provided."}
                  </p>

                </div>

                {/* REPLY FORM */}

                <div className="reply-form-group">

                  <label>
                    Your Reply
                  </label>

                  <textarea
                    rows={6}
                    placeholder="Write your reply to the student..."
                    value={reply}
                    onChange={(e) =>
                      setReply(
                        e.target.value
                      )
                    }
                    disabled={
                      submittingReply
                    }
                    maxLength={1000}
                  />

                  <span>
                    {reply.length} / 1000 characters
                  </span>

                </div>

              </div>

              {/* FOOTER */}

              <div className="review-modal-footer">

                <button
                  className="detail-close-btn"
                  onClick={closeReplyModal}
                  disabled={
                    submittingReply
                  }
                >
                  Cancel
                </button>

                <button
                  className="detail-reply-btn"
                  onClick={
                    handleSendReply
                  }
                  disabled={
                    submittingReply ||
                    !reply.trim()
                  }
                >

                  {submittingReply ? (
                    <>
                      <div className="button-spinner"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={17} />
                      {selectedReview.reply
                        ? "Update Reply"
                        : "Send Reply"}
                    </>
                  )}

                </button>

              </div>

            </div>

          </div>

        )}

    </div>
  );
}

export default MentorReviews;