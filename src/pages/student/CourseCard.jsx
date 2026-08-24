import {
  BookOpen,
  PlayCircle,
  Award,
  ChevronRight,
  Layers,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./CourseCard.css";

function CourseCard({
  course,
  enrollment
}) {
  const navigate = useNavigate();

  if (!course) {
    return null;
  }

  const progress = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        Number(enrollment?.progress || 0)
      )
    )
  );

  const completed =
    enrollment?.completed ||
    progress >= 100;

  const category =
    course?.category?.name ||
    "General";

  const level =
    course?.level ||
    "All Levels";

  const thumbnail =
    course?.thumbnail ||
    course?.image ||
    course?.imageUrl ||
    "";

  const courseId =
    enrollment?.courseId ||
    course?.id;

  const handleOpenCourse = () => {
    if (!courseId) {
      return;
    }

    navigate(
      `/student/player/${courseId}`
    );
  };

  const getStatus = () => {
    if (completed) {
      return "Completed";
    }

    if (progress > 0) {
      return "In Progress";
    }

    return "Not Started";
  };

  const getStatusClass = () => {
    if (completed) {
      return "completed";
    }

    if (progress > 0) {
      return "in-progress";
    }

    return "not-started";
  };

  return (
    <article className="student-course-card">

      {/* =================================================
          IMAGE
      ================================================= */}

      <div className="student-course-image">

        {thumbnail ? (
          <img
            src={thumbnail}
            alt={
              course?.title ||
              "Course"
            }
          />
        ) : (
          <div className="student-course-placeholder">
            <BookOpen size={35} />
          </div>
        )}

        <span
          className={`student-course-status ${getStatusClass()}`}
        >
          {getStatus()}
        </span>

      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="student-course-content">

        <h3>
          {course?.title ||
            "Untitled Course"}
        </h3>

        <div className="student-course-category">

          <span>
            {category}
          </span>

          <span className="category-separator">
            •
          </span>

          <span>
            {level}
          </span>

        </div>

        {course?.description && (
          <p className="student-course-description">
            {course.description}
          </p>
        )}

        {/* =================================================
            META
        ================================================= */}

        <div className="student-course-meta">

          <div>
            <Layers size={15} />

            <span>
              Course
            </span>
          </div>

          <div>
            <Clock size={15} />

            <span>
              {course?.duration
                ? `${course.duration} mins`
                : "Self paced"}
            </span>
          </div>

        </div>

        {/* =================================================
            PROGRESS
        ================================================= */}

        <div className="student-course-progress">

          <div className="student-course-progress-top">

            <span>
              Your Progress
            </span>

            <strong>
              {progress}%
            </strong>

          </div>

          <div className="student-course-progress-bar">

            <div
              className="student-course-progress-fill"
              style={{
                width: `${progress}%`
              }}
            />

          </div>

        </div>

        {/* =================================================
            BUTTON
        ================================================= */}

        <button
          type="button"
          className="student-course-action"
          onClick={
            handleOpenCourse
          }
        >

          {completed ? (
            <>
              <Award size={17} />
              View Course
            </>
          ) : (
            <>
              <PlayCircle size={17} />

              {progress > 0
                ? "Continue Learning"
                : "Start Learning"}
            </>
          )}

          <ChevronRight size={16} />

        </button>

      </div>

    </article>
  );
}

export default CourseCard;