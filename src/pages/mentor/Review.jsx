import { useEffect, useState } from "react";
import axios from "axios";
import { Star, MessageSquare } from "lucide-react";
import "./Review.css";

function Review() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================
  // Fetch Mentor Reviews
  // ==========================================
  const fetchReviews = async () => {
    try {
      setError(null);
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication required. Please login.");
        setLoading(false);
        return;
      }

      const res = await axios.get(
        "http://localhost:5000/api/review/mentor",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log("API Response:", res.data);

      // Handle different response formats
      const reviewData = res.data.data || res.data || [];
      console.log("Reviews:", reviewData);

      setReviews(reviewData);
    } catch (err) {
      console.error("Error fetching reviews:", err);

      if (err.response) {
        // Server responded with error
        setError(err.response.data.message || "Failed to load reviews");
      } else if (err.request) {
        // Request made but no response
        setError("Cannot connect to server. Please check your network.");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // ==========================================
  // Loading State
  // ==========================================
  if (loading) {
    return (
      <div className="review-loading">
        Loading Reviews...
      </div>
    );
  }

  // ==========================================
  // Error State
  // ==========================================
  if (error) {
    return (
      <div className="review-error">
        <h3>Error Loading Reviews</h3>
        <p>{error}</p>
        <button onClick={fetchReviews} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  // ==========================================
  // Main Render
  // ==========================================
  return (
    <div className="mentor-review-page">
      {/* ==============================
          HEADER
      ============================== */}
      <div className="review-header">
        <div>
          <h1>Student Reviews</h1>
          <p>Feedback received from students enrolled in your courses.</p>
        </div>
        {reviews.length > 0 && (
          <div className="review-count">
            Total Reviews: {reviews.length}
          </div>
        )}
      </div>

      {/* ==============================
          REVIEW LIST
      ============================== */}
      <div className="review-list">
        {reviews.length === 0 ? (
          <div className="no-reviews">
            <h3>No Reviews Found</h3>
            <p>No students have submitted reviews yet.</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div className="review-card" key={review.id}>
              {/* Top Section - Student Info */}
              <div className="review-top">
                <div>
                  <h3>{review.user?.name || `Student ID: ${review.userId}`}</h3>
                  <p>{review.user?.email || "No email provided"}</p>
                </div>
                <span className="review-date">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Course */}
              <div className="course-name">
                <MessageSquare size={18} />
                <span>{review.course?.title || "Unknown Course"}</span>
              </div>

              {/* Rating */}
              <div className="rating">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    size={18}
                    fill={index < review.rating ? "#fbbf24" : "none"}
                    stroke={index < review.rating ? "#fbbf24" : "#cbd5e1"}
                  />
                ))}
                <span className="rating-text">{review.rating}/5</span>
              </div>

              {/* Comment */}
              <div className="review-comment">
                <h4>Student Feedback</h4>
                <p>{review.comment}</p>
              </div>

         <div className="review-footer">
  <div className="review-info">

    <div className="info-card">
      <span className="info-label">Course</span>
      <h5>{review.course?.title || "Unknown Course"}</h5>
    </div>

    <div className="info-card">
      <span className="info-label">Rating</span>
      <div className="rating-badge">
        <Star
          size={18}
          fill="#fbbf24"
          stroke="#fbbf24"
        />
        <span>{review.rating} / 5</span>
      </div>
    </div>

  </div>
</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Review;