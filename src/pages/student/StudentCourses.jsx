// src/pages/student/StudentCourses.jsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Star,
  Clock,
  BarChart3,
  PlayCircle,
  CheckCircle,
} from "lucide-react";
import api from "../../services/api";
import "./StudentCourses.css";

function StudentCourses() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [enrolling, setEnrolling] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setLoadError("");
      const [coursesRes, catRes, enrollRes] = await Promise.all([
        api.get("/courses").catch(() => ({ data: { data: [] } })),
        api.get("/categories").catch(() => ({ data: { data: [] } })),
        api.get("/enrollments/my").catch(() => ({ data: { data: [] } })),
      ]);

      const allCourses = coursesRes.data?.data || coursesRes.data || [];
      // Only show courses the admin has actually published.
      const published = allCourses.filter(
        (c) => c.isPublished === true || c.status === "PUBLISHED"
      );

      setCourses(published);
      setCategories(catRes.data?.data || catRes.data || []);
      setEnrollments(enrollRes.data?.data || enrollRes.data || []);
    } catch (err) {
      console.error(err);
      setLoadError("Couldn't load courses. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const getEnrollment = (courseId) => enrollments.find((e) => e.courseId === courseId);

  const handleEnroll = async (course) => {
    try {
      setEnrolling(course.id);
      await api.post("/enrollments", { courseId: course.id });
      await fetchAll();
      navigate(`/student/courses/${course.id}`);
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Couldn't enroll in this course. If it's a paid course, checkout may be required first."
      );
    } finally {
      setEnrolling(null);
    }
  };

  const filtered = courses.filter((c) => {
    const matchesSearch =
      !search || c.title?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || c.categoryId === Number(categoryFilter);
    const matchesLevel = levelFilter === "all" || c.level === levelFilter;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const priceDisplay = (course) => {
    if (course.isFree) return <span className="price-free">Free</span>;
    if (course.discountPrice && course.discountPrice < course.price) {
      return (
        <span className="price-group">
          <span className="price-current">${course.discountPrice}</span>
          <span className="price-original">${course.price}</span>
        </span>
      );
    }
    return <span className="price-current">${course.price}</span>;
  };

  if (loading) {
    return (
      <div className="student-courses-page">
        <div className="loading-state">Loading courses…</div>
      </div>
    );
  }

  return (
    <div className="student-courses-page">
      <div className="dashboard-title">
        <h1>Browse courses</h1>
        <p>Find your next course and start learning.</p>
      </div>

      {loadError && <div className="error-banner">{loadError}</div>}

      <div className="filters-bar">
        <div className="search-input">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
          <option value="all">All levels</option>
          <option value="BEGINNER">Beginner</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Search size={32} />
          <p>No courses match your filters.</p>
        </div>
      ) : (
        <div className="course-grid">
          {filtered.map((course) => {
            const enrollment = getEnrollment(course.id);
            return (
              <div key={course.id} className="course-card">
                <div
                  className="course-thumb"
                  onClick={() => navigate(`/student/courses/${course.id}`)}
                >
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} />
                  ) : (
                    <PlayCircle size={32} />
                  )}
                  {course.level && <span className="level-badge">{course.level}</span>}
                </div>
                <div className="course-body">
                  <h3 onClick={() => navigate(`/student/courses/${course.id}`)}>
                    {course.title}
                  </h3>
                  <p className="course-subtitle">{course.subtitle || course.description}</p>

                  <div className="course-meta">
                    {course.duration && (
                      <span>
                        <Clock size={13} /> {course.duration}
                      </span>
                    )}
                    {course.level && (
                      <span>
                        <BarChart3 size={13} /> {course.level}
                      </span>
                    )}
                  </div>

                  <div className="course-footer">
                    {priceDisplay(course)}

                    {enrollment ? (
                      <button
                        className="btn-continue"
                        onClick={() => navigate(`/student/courses/${course.id}`)}
                      >
                        {enrollment.completed ? (
                          <>
                            <CheckCircle size={14} /> Completed
                          </>
                        ) : (
                          "Continue"
                        )}
                      </button>
                    ) : (
                      <button
                        className="btn-enroll"
                        onClick={() => handleEnroll(course)}
                        disabled={enrolling === course.id}
                      >
                        {enrolling === course.id ? "Enrolling…" : "Enroll"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StudentCourses;