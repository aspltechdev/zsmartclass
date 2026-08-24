import {
  BookOpen,
  PlayCircle,
  ArrowRight,
} from "lucide-react";

import "./ProgressCard.css";

function ProgressCard({
  course,
  onContinue,
}) {
  if (!course) {
    return null;
  }

  const progress = Math.min(
    100,
    Math.max(
      0,
      Number(course.progress || 0)
    )
  );

  const completedLessons =
    Number(
      course.completedLessons || 0
    );

  const totalLessons =
    Number(
      course.totalLessons || 0
    );

  return (
    <div className="progress-card">

      {/* =================================================
          THUMBNAIL
      ================================================= */}

      <div className="progress-thumbnail">

        <img
          src={
            course.thumbnail ||
            "/default-course.jpg"
          }
          alt={
            course.title ||
            "Course"
          }
          onError={(event) => {
            event.currentTarget.src =
              "/default-course.jpg";
          }}
        />

      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="progress-content">

        <div className="progress-header">
          <span className="progress-tag">
            Continue Learning
          </span>
        </div>

        <h3 className="progress-title">
          {course.title}
        </h3>

        <div className="progress-instructor">
          <BookOpen size={15} />

          <span>
            {course.instructor?.name ||
              "Instructor"}
          </span>
        </div>

        {/* =================================================
            COURSE PROGRESS
        ================================================= */}

        <div className="progress-card-progress">

          <div className="progress-card-progress-top">

            <span>
              Course Progress
            </span>

            <strong>
              {progress}%
            </strong>

          </div>

          <div className="progress-card-track">

            <div
              className="progress-card-fill"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

          <div className="progress-card-meta">

            <span>
              {completedLessons} of{" "}
              {totalLessons} lessons
            </span>

            {progress >= 100 && (
              <span className="progress-completed">
                Completed
              </span>
            )}

          </div>

        </div>

        {/* =================================================
            CONTINUE
        ================================================= */}

        <button
          type="button"
          className="continue-btn"
          onClick={onContinue}
        >
          <PlayCircle size={17} />

          {progress > 0
            ? "Continue"
            : "Start Learning"}

          <ArrowRight size={16} />
        </button>

      </div>

    </div>
  );
}

export default ProgressCard;