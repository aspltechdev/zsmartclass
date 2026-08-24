// src/pages/student/MyLearning.jsx

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Filter,
  BookOpen,
  X,
  AlertCircle,
  PlayCircle,
  Clock,
  CheckCircle,
  ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./MyLearning.css";
import "./StudentShared.css";

function MyLearning() {
  const navigate = useNavigate();
  
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [error, setError] = useState("");
  const [courseProgress, setCourseProgress] = useState({});

  // =====================================================
  // FETCH STUDENT'S ENROLLED COURSES
  // =====================================================

  const fetchMyCourses = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      // Get enrolled courses
      const response = await api.get("/enrollments/my-courses");
      const data = response?.data?.data || [];
      
      const enrolledList = Array.isArray(data) ? data : [];
      setEnrollments(enrolledList);

      // Fetch progress for each course
      if (enrolledList.length > 0) {
        const progressMap = {};
        
        await Promise.all(
          enrolledList.map(async (enrollment) => {
            const courseId = Number(enrollment?.courseId || enrollment?.course?.id);
            if (!courseId) return;

            try {
              const progressResponse = await api.get(
                `/player/course/${courseId}/progress`
              );
              const payload = progressResponse?.data?.data || progressResponse?.data || {};
              
              progressMap[courseId] = {
                progress: Number(payload.overallProgress || 0),
                completedLessons: Number(payload.completedLessons || 0),
                totalLessons: Number(payload.totalLessons || 0),
              };
            } catch (err) {
              // If progress fails, use enrollment progress
              progressMap[courseId] = {
                progress: Number(enrollment?.progress || 0),
                completedLessons: 0,
                totalLessons: Number(enrollment?.course?.totalLessons || 0),
              };
            }
          })
        );
        
        setCourseProgress(progressMap);
      }
    } catch (err) {
      console.error("Error fetching my courses:", err);
      setEnrollments([]);
      setError(err?.response?.data?.message || "Unable to load your enrolled courses.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyCourses();
  }, []);

  // =====================================================
  // GET STATUS
  // =====================================================

  const getStatus = (enrollment) => {
    const courseId = Number(enrollment?.courseId || enrollment?.course?.id);
    const progressData = courseProgress[courseId];
    const progress = progressData?.progress ?? Number(enrollment?.progress || 0);

    if (enrollment?.completed || progress >= 100) {
      return "COMPLETED";
    }
    if (progress > 0) {
      return "IN_PROGRESS";
    }
    return "NOT_STARTED";
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case "COMPLETED": return "Completed";
      case "IN_PROGRESS": return "In Progress";
      case "NOT_STARTED": return "Not Started";
      default: return "Unknown";
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "COMPLETED": return <CheckCircle size={14} />;
      case "IN_PROGRESS": return <PlayCircle size={14} />;
      case "NOT_STARTED": return <Clock size={14} />;
      default: return null;
    }
  };

  // =====================================================
  // GET CATEGORIES
  // =====================================================

  const categories = useMemo(() => {
    const categoryMap = new Map();
    enrollments.forEach((enrollment) => {
      const category = enrollment?.course?.category?.name;
      if (category) {
        categoryMap.set(category.toLowerCase(), category);
      }
    });
    return Array.from(categoryMap.values()).sort((a, b) => a.localeCompare(b));
  }, [enrollments]);

  // =====================================================
  // FILTER
  // =====================================================

  const filteredEnrollments = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return enrollments.filter((enrollment) => {
      const course = enrollment?.course || {};
      const title = course?.title?.toLowerCase() || "";
      const description = course?.description?.toLowerCase() || "";
      const category = course?.category?.name?.toLowerCase() || "";
      
      const matchesSearch = !searchText || 
        title.includes(searchText) || 
        description.includes(searchText) ||
        category.includes(searchText);

      const matchesCategory = selectedCategory === "ALL" || 
        category === selectedCategory.toLowerCase();

      const status = getStatus(enrollment);
      const matchesStatus = selectedStatus === "ALL" || status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [enrollments, search, selectedCategory, selectedStatus]);

  // =====================================================
  // GET PROGRESS PERCENTAGE
  // =====================================================

  const getCourseProgress = (enrollment) => {
    const courseId = Number(enrollment?.courseId || enrollment?.course?.id);
    const progressData = courseProgress[courseId];
    const progress = progressData?.progress ?? Number(enrollment?.progress || 0);
    return Math.min(100, Math.max(0, Math.round(progress)));
  };

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("ALL");
    setSelectedStatus("ALL");
  };

  // =====================================================
  // CONTINUE LEARNING
  // =====================================================

  const handleContinue = (enrollment) => {
    const courseId = Number(enrollment?.courseId || enrollment?.course?.id);
    if (courseId) {
      navigate(`/student/player/${courseId}`);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="my-learning-page">
        <div className="my-learning-loading">
          <div className="my-learning-spinner" />
          <p>Loading your courses...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <div className="my-learning-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="my-learning-header">
        <div>
          <div className="my-learning-title-row">
            <BookOpen size={24} />
            <h1>My Courses</h1>
          </div>
          <p>Access and continue learning from your assigned courses.</p>
        </div>

        <button
          type="button"
          className="my-learning-refresh-btn"
          onClick={() => fetchMyCourses(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={16}
            className={refreshing ? "refresh-spin" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="my-learning-error">
          <AlertCircle size={17} />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* =================================================
          STATS
      ================================================= */}

      <div className="my-learning-stats">
        <div className="stat-item">
          <BookOpen size={16} />
          <span>Total: <strong>{enrollments.length}</strong></span>
        </div>
        <div className="stat-item">
          <PlayCircle size={16} />
          <span>In Progress: <strong>
            {enrollments.filter(e => getStatus(e) === "IN_PROGRESS").length}
          </strong></span>
        </div>
        <div className="stat-item">
          <CheckCircle size={16} />
          <span>Completed: <strong>
            {enrollments.filter(e => getStatus(e) === "COMPLETED").length}
          </strong></span>
        </div>
      </div>

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="my-learning-filters">
        {/* SEARCH */}
        <div className="course-search">
          <Search size={18} />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search your courses..."
          />
          {search && (
            <button 
              type="button" 
              className="clear-search-btn"
              onClick={() => setSearch("")} 
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* CATEGORY */}
        <div className="course-filter">
          <Filter size={15} />
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            <option value="ALL">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* STATUS */}
        <div className="course-filter">
          <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {(search || selectedCategory !== "ALL" || selectedStatus !== "ALL") && (
          <button type="button" className="clear-filters-btn" onClick={clearFilters}>
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      {enrollments.length === 0 ? (
        // No enrolled courses
        <div className="my-learning-empty">
          <div className="empty-icon">
            <BookOpen size={40} />
          </div>
          <h2>No Courses Assigned</h2>
          <p>
            You don't have any courses assigned yet. 
            Please contact your administrator to get enrolled.
          </p>
        </div>
      ) : filteredEnrollments.length === 0 ? (
        // No results after filtering
        <div className="my-learning-empty">
          <div className="empty-icon">
            <Search size={35} />
          </div>
          <h2>No courses found</h2>
          <p>No courses match your current search or filters.</p>
          <button type="button" className="clear-filters-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      ) : (
        // Course grid
        <div className="my-learning-grid">
          {filteredEnrollments.map((enrollment) => {
            const course = enrollment?.course || {};
            const status = getStatus(enrollment);
            const progress = getCourseProgress(enrollment);
            const category = course?.category?.name || "General";
            const thumbnail = course?.thumbnail || course?.image || "";

            return (
              <div key={enrollment?.id || enrollment?.courseId} className="my-learning-course-card">
                
                {/* Course Image */}
                <div className="course-card-image">
                  {thumbnail ? (
                    <img src={thumbnail} alt={course?.title || "Course"} />
                  ) : (
                    <div className="course-placeholder">
                      <BookOpen size={32} />
                    </div>
                  )}
                  <span className={`course-status-badge ${status.toLowerCase()}`}>
                    {getStatusIcon(status)}
                    {getStatusLabel(status)}
                  </span>
                </div>

                {/* Course Content */}
                <div className="course-card-content">
                  <div className="course-card-top">
                    <div className="course-category">{category}</div>
                    <h3>{course?.title || "Untitled Course"}</h3>
                    {course?.description && (
                      <p className="course-description">{course.description}</p>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="course-card-progress">
                    <div className="progress-header">
                      <span>Your Progress</span>
                      <strong>{progress}%</strong>
                    </div>
                    <div className="progress-track">
                      <div 
                        className={`progress-fill ${progress >= 100 ? "completed" : ""}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="progress-meta">
                      <span>
                        {progress >= 100 ? "🎉 Completed!" : "Keep going!"}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    className="continue-course-btn"
                    onClick={() => handleContinue(enrollment)}
                  >
                    {progress >= 100 ? (
                      <>
                        <CheckCircle size={16} />
                        Review Course
                      </>
                    ) : progress > 0 ? (
                      <>
                        <PlayCircle size={16} />
                        Continue Learning
                      </>
                    ) : (
                      <>
                        <PlayCircle size={16} />
                        Start Learning
                      </>
                    )}
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

export default MyLearning;