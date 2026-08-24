import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import ProgressCard from "./ProgressCard";

import "./Progress.css";
import "./StudentShared.css";

function Progress() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [courseProgress, setCourseProgress] =
    useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * =========================================================
   * LOAD PROGRESS
   * =========================================================
   */

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      setError("");

      /*
       * Get courses that are still being learned.
       *
       * GET /api/progress/continue-learning
       */
      const response = await api.get(
        "/progress/continue-learning"
      );

      const data =
        response?.data?.data ||
        response?.data ||
        [];

      const enrolledCourses = Array.isArray(
        data
      )
        ? data
        : [];

      /*
       * Save the courses first.
       */
      setCourses(enrolledCourses);

      /*
       * Get actual progress for every course.
       *
       * GET /api/progress/course/:courseId
       */
      const progressRequests =
        await Promise.all(
          enrolledCourses.map(
            async (enrollment) => {
              const courseId = Number(
                enrollment?.courseId ||
                  enrollment?.course?.id
              );

              if (
                !Number.isInteger(
                  courseId
                )
              ) {
                return null;
              }

              try {
                const progressResponse =
                  await api.get(
                    `/progress/course/${courseId}`
                  );

                const progressData =
                  progressResponse?.data
                    ?.data ||
                  progressResponse?.data ||
                  {};

                return {
                  courseId,
                  data: progressData,
                };
              } catch (err) {
                console.error(
                  `Failed to load progress for course ${courseId}:`,
                  err
                );

                return {
                  courseId,
                  data: {
                    progress:
                      Number(
                        enrollment?.progress ||
                          0
                      ),
                    completedLessons: 0,
                    totalLessons: 0,
                    watchedSeconds: 0,
                    totalDurationSeconds: 0,
                    lessons: [],
                  },
                };
              }
            }
          )
        );

      /*
       * Convert results to:
       *
       * {
       *   22: {...},
       *   25: {...}
       * }
       */
      const progressMap = {};

      progressRequests.forEach(
        (result) => {
          if (!result) return;

          progressMap[
            result.courseId
          ] = result.data;
        }
      );

      setCourseProgress(
        progressMap
      );
    } catch (err) {
      console.error(
        "Progress page error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to load your progress."
      );

      setCourses([]);
      setCourseProgress({});
    } finally {
      setLoading(false);
    }
  };

  /*
   * =========================================================
   * COMBINE COURSE + PROGRESS
   * =========================================================
   */

  const progressCourses = useMemo(() => {
    return courses.map(
      (enrollment) => {
        const course =
          enrollment?.course ||
          {};

        const courseId = Number(
          enrollment?.courseId ||
            course?.id
        );

        const savedProgress =
          courseProgress[
            courseId
          ] || {};

        const progress = Math.min(
          100,
          Math.max(
            0,
            Math.round(
              Number(
                savedProgress?.progress ??
                  enrollment?.progress ??
                  0
              )
            )
          )
        );

        return {
          ...course,

          id: courseId,

          title:
            course?.title ||
            "Untitled Course",

          thumbnail:
            course?.thumbnail ||
            course?.image ||
            "/default-course.jpg",

          instructor:
            course?.createdBy ||
            course?.instructor ||
            course?.mentor ||
            null,

          progress,

          completedLessons:
            Number(
              savedProgress?.completedLessons ||
                0
            ),

          totalLessons:
            Number(
              savedProgress?.totalLessons ||
                course?.totalLessons ||
                0
            ),

          watchedSeconds:
            Number(
              savedProgress?.watchedSeconds ||
                0
            ),

          totalDurationSeconds:
            Number(
              savedProgress?.totalDurationSeconds ||
                0
            ),

          lessons:
            Array.isArray(
              savedProgress?.lessons
            )
              ? savedProgress.lessons
              : [],
        };
      }
    );
  }, [
    courses,
    courseProgress,
  ]);

  /*
   * =========================================================
   * SUMMARY
   * =========================================================
   */

  const overallProgress = useMemo(() => {
    if (
      progressCourses.length === 0
    ) {
      return 0;
    }

    const total = progressCourses.reduce(
      (sum, course) =>
        sum +
        Number(
          course.progress || 0
        ),
      0
    );

    return Math.round(
      total /
        progressCourses.length
    );
  }, [progressCourses]);

  const completedCourses =
    progressCourses.filter(
      (course) =>
        Number(course.progress) >=
        100
    ).length;

  /*
   * =========================================================
   * CONTINUE COURSE
   * =========================================================
   */

  const handleContinue = (
    courseId
  ) => {
    if (!courseId) return;

    navigate(
      `/student/player/${courseId}`
    );
  };

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <div className="progress-page">
        <div className="progress-loading">
          <Loader2
            size={38}
            className="progress-spinner"
          />

          <p>
            Loading your progress...
          </p>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * MAIN
   * =========================================================
   */

  return (
    <div className="progress-page">
      <div className="progress-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="progress-page-header">

          <div>
            <span className="progress-eyebrow">
              LEARNING JOURNEY
            </span>

            <h1>
              Your Progress
            </h1>

            <p>
              Track your course progress and
              continue learning from where you
              stopped.
            </p>
          </div>

          <div className="progress-header-icon">
            <TrendingUp size={28} />
          </div>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="progress-error">
            <AlertCircle size={19} />

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={loadProgress}
            >
              Retry
            </button>
          </div>
        )}

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="progress-summary-grid">

          <div className="progress-summary-card">
            <div className="progress-summary-icon">
              <BookOpen size={21} />
            </div>

            <div>
              <span>
                Courses in Progress
              </span>

              <strong>
                {progressCourses.length}
              </strong>
            </div>
          </div>

          <div className="progress-summary-card">
            <div className="progress-summary-icon">
              <TrendingUp size={21} />
            </div>

            <div>
              <span>
                Overall Progress
              </span>

              <strong>
                {overallProgress}%
              </strong>
            </div>
          </div>

          <div className="progress-summary-card">
            <div className="progress-summary-icon">
              <BookOpen size={21} />
            </div>

            <div>
              <span>
                Completed Courses
              </span>

              <strong>
                {completedCourses}
              </strong>
            </div>
          </div>

        </div>

        {/* =================================================
            COURSES
        ================================================= */}

        <div className="progress-section">

          <div className="progress-section-header">

            <div>
              <h2>
                Continue Learning
              </h2>

              <p>
                Continue your courses from
                where you left off.
              </p>
            </div>

          </div>

          {progressCourses.length === 0 ? (
            <div className="progress-empty">

              <div className="progress-empty-icon">
                <BookOpen size={30} />
              </div>

              <h3>
                No active courses
              </h3>

              <p>
                You do not have any courses
                currently in progress.
              </p>

            </div>
          ) : (
            <div className="progress-list">

              {progressCourses.map(
                (course) => (
                  <ProgressCard
                    key={course.id}
                    course={course}
                    onContinue={() =>
                      handleContinue(
                        course.id
                      )
                    }
                  />
                )
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default Progress;