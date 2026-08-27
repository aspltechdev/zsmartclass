// src/pages/mentor/QuizMarks.jsx

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Trophy,
  BookOpen,
  ChevronDown,
  Users,
  Percent,
  CheckCircle,
  Layers,
  BadgeCheck,
  FileQuestion,
} from "lucide-react";

import api from "../../services/api";
import "./QuizMarks.css";
import "./MentorShared.css";

const PASS_MARK = 40; // percent

function QuizMarks() {
  const [courses, setCourses] = useState([]);
  const [allModules, setAllModules] = useState([]);
  const [filteredModules, setFilteredModules] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedModule, setSelectedModule] = useState("");

  const [moduleQuizzes, setModuleQuizzes] = useState([]);
  const [quizMarks, setQuizMarks] = useState([]);

  const [search, setSearch] = useState("");
  const [quizFilter, setQuizFilter] = useState("all");

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingMarks, setLoadingMarks] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  /* =========================================================
     FETCH COURSES
  ========================================================= */

  useEffect(() => {
    fetchCourses();
    fetchAllModules();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      setError("");

      const res = await api.get("/courses");

      setCourses(res.data?.data || res.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Couldn't load courses. Please refresh or check the server."
      );

      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  /* =========================================================
     FETCH ALL MODULES
  ========================================================= */

  const fetchAllModules = async () => {
    try {
      const res = await api.get("/modules");

      const modules = res.data?.data || res.data || [];

      console.log("All modules:", modules);

      setAllModules(modules);
    } catch (err) {
      console.error("Error fetching modules:", err);

      setAllModules([]);
    }
  };

  /* =========================================================
     FETCH MODULES FOR COURSE
  ========================================================= */

  const fetchModulesForCourse = async (courseId) => {
    if (!courseId) {
      setFilteredModules([]);
      return;
    }

    try {
      setLoadingModules(true);
      setError("");

      const res = await api.get(`/courses/${courseId}`);

      const courseData = res.data?.data || res.data;

      const modules = courseData.modules || [];

      console.log(`Modules for course ${courseId}:`, modules);

      setFilteredModules(modules);

      if (modules.length === 1) {
        setSelectedModule(String(modules[0].id));

        await loadModuleData(String(modules[0].id));
      } else if (modules.length === 0) {
        setError(
          `No modules found for "${courseData.title || "this course"}".`
        );
      }
    } catch (err) {
      console.error("Error fetching modules for course:", err);

      const fallbackModules = allModules.filter((m) => {
        if (m.courseId !== null && m.courseId !== undefined) {
          return String(m.courseId) === String(courseId);
        }

        return false;
      });

      if (fallbackModules.length > 0) {
        setFilteredModules(fallbackModules);

        if (fallbackModules.length === 1) {
          setSelectedModule(String(fallbackModules[0].id));

          await loadModuleData(String(fallbackModules[0].id));
        }
      } else {
        setError(
          err.response?.data?.message ||
            "Couldn't load modules for this course. Please ensure the course has modules assigned."
        );

        setFilteredModules([]);
      }
    } finally {
      setLoadingModules(false);
    }
  };

  /* =========================================================
     SELECTED COURSE
  ========================================================= */

  const selectedCourseData = useMemo(
    () =>
      courses.find(
        (c) => String(c.id) === String(selectedCourse)
      ),
    [courses, selectedCourse]
  );

  /* =========================================================
     SELECTED MODULE
  ========================================================= */

  const selectedModuleData = useMemo(
    () =>
      filteredModules.find(
        (m) => String(m.id) === String(selectedModule)
      ),
    [filteredModules, selectedModule]
  );

  /* =========================================================
     LOAD QUIZZES + MARKS
  ========================================================= */

  const loadModuleData = async (moduleId) => {
    if (!moduleId) {
      setModuleQuizzes([]);
      setQuizMarks([]);

      return;
    }

    try {
      setLoadingMarks(true);
      setError("");

      const quizRes = await api.get(
        `/quizzes/module/${moduleId}`
      );

      const quizzes = quizRes.data?.data || [];

      setModuleQuizzes(quizzes);

      if (quizzes.length === 0) {
        setQuizMarks([]);

        return;
      }

      const results = await Promise.all(
        quizzes.map(async (quiz) => {
          try {
            const res = await api.get(
              `/quizzes/${quiz.id}/marks`
            );

            const marks = res.data?.marks || [];

            return marks.map((m) => ({
              ...m,
              quizId: quiz.id,
              quizTitle: quiz.title,
              quizTotalMarks: quiz.totalMarks,
            }));
          } catch {
            return [];
          }
        })
      );

      setQuizMarks(results.flat());
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Couldn't load quiz marks for this module."
      );

      setModuleQuizzes([]);
      setQuizMarks([]);
    } finally {
      setLoadingMarks(false);
    }
  };

  /* =========================================================
     COURSE CHANGE
  ========================================================= */

  const handleCourseChange = async (e) => {
    const courseId = e.target.value;

    setSelectedCourse(courseId);
    setSelectedModule("");

    setSearch("");
    setQuizFilter("all");

    setQuizMarks([]);
    setModuleQuizzes([]);

    setError("");
    setFilteredModules([]);

    if (courseId) {
      await fetchModulesForCourse(courseId);
    }
  };

  /* =========================================================
     MODULE CHANGE
  ========================================================= */

  const handleModuleChange = async (e) => {
    const moduleId = e.target.value;

    setSelectedModule(moduleId);

    setSearch("");
    setQuizFilter("all");

    setQuizMarks([]);
    setModuleQuizzes([]);

    setError("");

    await loadModuleData(moduleId);
  };

  /* =========================================================
     REFRESH
  ========================================================= */

  const handleRefresh = async () => {
    if (refreshing) return;

    try {
      setRefreshing(true);
      setError("");

      /*
       * Remember current selections before refreshing.
       * This prevents the refresh from losing the
       * currently selected course/module.
       */
      const currentCourse = selectedCourse;
      const currentModule = selectedModule;

      await fetchCourses();
      await fetchAllModules();

      if (currentCourse) {
        await fetchModulesForCourse(currentCourse);

        if (currentModule) {
          await loadModuleData(currentModule);
        }
      }
    } catch (err) {
      console.error("Refresh failed:", err);

      setError(
        err.response?.data?.message ||
          "Failed to refresh quiz marks."
      );
    } finally {
      setRefreshing(false);
    }
  };

  /* =========================================================
     VALUE HELPERS
  ========================================================= */

  const studentName = (m) =>
    m.student?.name ||
    m.user?.name ||
    "Unknown Student";

  const studentEmail = (m) =>
    m.student?.email ||
    m.user?.email ||
    "—";

  const obtained = (m) =>
    Number(
      m.obtainedMarks ??
        m.marks ??
        0
    );

  const total = (m) =>
    Number(
      m.totalMarks ??
        m.quizTotalMarks ??
        0
    );

  const percent = (m) => {
    if (
      m.percentage !== undefined &&
      m.percentage !== null
    ) {
      return Number(m.percentage);
    }

    const t = total(m);

    return t
      ? (obtained(m) / t) * 100
      : 0;
  };

  /* =========================================================
     FILTER MARKS
  ========================================================= */

  const filteredMarks = useMemo(() => {
    const q = search.trim().toLowerCase();

    return quizMarks.filter((m) => {
      const matchesSearch =
        !q ||
        studentName(m)
          .toLowerCase()
          .includes(q) ||
        studentEmail(m)
          .toLowerCase()
          .includes(q) ||
        (m.quizTitle || "")
          .toLowerCase()
          .includes(q);

      const matchesQuiz =
        quizFilter === "all" ||
        String(m.quizId) ===
          String(quizFilter);

      return (
        matchesSearch &&
        matchesQuiz
      );
    });
  }, [
    quizMarks,
    search,
    quizFilter,
  ]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const stats = useMemo(() => {
    const attempts =
      filteredMarks.length;

    const uniqueStudents = new Set(
      filteredMarks.map(
        (m) =>
          m.student?.id ??
          m.user?.id ??
          studentName(m)
      )
    ).size;

    const avg = attempts
      ? filteredMarks.reduce(
          (s, m) =>
            s + percent(m),
          0
        ) / attempts
      : 0;

    const passed =
      filteredMarks.filter(
        (m) =>
          percent(m) >=
          PASS_MARK
      ).length;

    return {
      attempts,
      uniqueStudents,
      avg: Math.round(avg),
      passRate: attempts
        ? Math.round(
            (passed / attempts) *
              100
          )
        : 0,
    };
  }, [filteredMarks]);

  /* =========================================================
     DATE FORMAT
  ========================================================= */

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        )
      : "—";

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="quiz-marks-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="quiz-marks-header">

        <div>

          <div className="quizmarks-title">

            <FileQuestion
              className="quizmarks-title-icon"
            />

            <h1>
              Quiz Marks
            </h1>

          </div>

          <p>
            View students' quiz
            performance module by
            module.
          </p>

        </div>

        {/* HEADER REFRESH BUTTON */}
        <button
          type="button"
          className="quiz-header-refresh-btn"
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refresh quiz marks"
          aria-label="Refresh quiz marks"
        >
          <RefreshCw
            size={20}
            className={
              refreshing
                ? "quiz-refresh-spin"
                : ""
            }
          />
        </button>

      </div>

      {/* =====================================================
          COURSE & MODULE SELECTORS
      ===================================================== */}

      <div className="selector-group">

        <div className="module-selector-wrapper">

          <Layers size={20} />

          <select
            value={selectedCourse}
            onChange={
              handleCourseChange
            }
            disabled={
              loadingCourses
            }
          >

            <option value="">
              {loadingCourses
                ? "Loading Courses..."
                : "Select Course"}
            </option>

            {courses.map((c) => (
              <option
                key={c.id}
                value={c.id}
              >
                {c.title ||
                  `Course ${c.id}`}
              </option>
            ))}

          </select>

          <ChevronDown
            size={18}
          />

        </div>

        <div className="module-selector-wrapper">

          <BookOpen size={20} />

          <select
            value={selectedModule}
            onChange={
              handleModuleChange
            }
            disabled={
              !selectedCourse ||
              loadingModules
            }
          >

            <option value="">
              {loadingModules
                ? "Loading Modules..."
                : !selectedCourse
                ? "Select a course first"
                : filteredModules.length ===
                  0
                ? "No modules available"
                : "Select Module"}
            </option>

            {filteredModules.map(
              (m) => (
                <option
                  key={m.id}
                  value={m.id}
                >
                  {m.title ||
                    `Module ${m.id}`}
                </option>
              )
            )}

          </select>

          <ChevronDown
            size={18}
          />

        </div>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="quiz-marks-error">
          {error}
        </div>
      )}

      {/* =====================================================
          NO COURSES
      ===================================================== */}

      {!loadingCourses &&
        courses.length === 0 && (

        <div className="quiz-marks-empty">

          <Layers size={46} />

          <h2>
            No Courses Found
          </h2>

          <p>
            Create a course first,
            then add modules and
            quizzes to it.
          </p>

          <button
            type="button"
            className="refresh-button"
            onClick={
              handleRefresh
            }
            disabled={refreshing}
          >

            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "spin"
                  : ""
              }
            />

            Refresh Courses

          </button>

        </div>

      )}

      {/* =====================================================
          NO MODULES
      ===================================================== */}

      {selectedCourse &&
        !loadingModules &&
        !loadingCourses &&
        filteredModules.length ===
          0 &&
        !error && (

        <div className="quiz-marks-empty">

          <BookOpen size={44} />

          <h2>
            No Modules Found
          </h2>

          <p>
            No modules have been
            added to{" "}
            <strong>
              {selectedCourseData?.title}
            </strong>{" "}
            yet.
          </p>

        </div>

      )}

      {/* =====================================================
          MODULE NOT SELECTED
      ===================================================== */}

      {!loadingCourses &&
        courses.length > 0 &&
        !selectedModule &&
        selectedCourse &&
        filteredModules.length >
          0 && (

        <div className="quiz-marks-empty">

          <Trophy size={44} />

          <h2>
            Select a Module
          </h2>

          <p>
            Choose a module above
            to see how students
            performed on its
            quizzes.
          </p>

        </div>

      )}

      {/* =====================================================
          COURSE NOT SELECTED
      ===================================================== */}

      {!selectedCourse &&
        courses.length > 0 &&
        !loadingCourses && (

        <div className="quiz-marks-empty">

          <Trophy size={44} />

          <h2>
            Select a Course
          </h2>

          <p>
            Choose a course above
            to see its modules and
            quiz performance.
          </p>

        </div>

      )}

      {/* =====================================================
          SELECTED MODULE
      ===================================================== */}

      {selectedModule && (
        <>

          {/* =================================================
              SELECTED MODULE HEADER
          ================================================= */}

          <div className="selected-module-header">

            <div>

              <h2>
                {selectedModuleData?.title ||
                  "Selected Module"}
              </h2>

              <p>

                {selectedCourseData?.title && (
                  <>
                    Course:{" "}
                    <strong>
                      {
                        selectedCourseData.title
                      }
                    </strong>{" "}
                    ·{" "}
                  </>
                )}

                Students who attempted
                quizzes in this module.

              </p>

            </div>

            <div className="module-quiz-count">

              {moduleQuizzes.length}{" "}

              {moduleQuizzes.length ===
              1
                ? "Quiz"
                : "Quizzes"}

            </div>

          </div>

          {/* =================================================
              TOOLBAR
          ================================================= */}

          <div className="quiz-marks-toolbar">

            <div className="search-box">

              <Search size={18} />

              <input
                type="text"
                placeholder="Search student, email, or quiz..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />

            </div>

            {moduleQuizzes.length >
              1 && (

              <select
                className="quiz-filter-select"
                value={
                  quizFilter
                }
                onChange={(e) =>
                  setQuizFilter(
                    e.target.value
                  )
                }
              >

                <option value="all">
                  All Quizzes
                </option>

                {moduleQuizzes.map(
                  (q) => (

                    <option
                      key={q.id}
                      value={q.id}
                    >
                      {q.title}
                    </option>

                  )
                )}

              </select>

            )}

          </div>

          {/* =================================================
              STATISTICS
          ================================================= */}

          <div className="quiz-marks-stats">

            <div className="stat-card">

              <div className="stat-icon">
                <Trophy size={22} />
              </div>

              <div>

                <strong>
                  {stats.attempts}
                </strong>

                <span>
                  ATTEMPTS
                </span>

              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon blue">
                <Users size={22} />
              </div>

              <div>

                <strong>
                  {stats.uniqueStudents}
                </strong>

                <span>
                  STUDENTS
                </span>

              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon amber">
                <Percent size={22} />
              </div>

              <div>

                <strong>
                  {stats.avg}%
                </strong>

                <span>
                  AVERAGE SCORE
                </span>

              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon green">
                <CheckCircle size={22} />
              </div>

              <div>

                <strong>
                  {stats.passRate}%
                </strong>

                <span>
                  PASS RATE
                </span>

              </div>

            </div>

          </div>

          {/* =================================================
              NO QUIZZES
          ================================================= */}

          {!loadingMarks &&
            moduleQuizzes.length ===
              0 && (

            <div className="quiz-marks-empty">

              <BookOpen size={45} />

              <h2>
                No Quizzes Found
              </h2>

              <p>
                No quizzes have been
                added to this module
                yet.
              </p>

            </div>

          )}

          {/* =================================================
              MARKS TABLE
          ================================================= */}

          {moduleQuizzes.length >
            0 && (

            <div className="marks-table-container">

              {loadingMarks ? (

                <div className="quiz-marks-empty">

                  <RefreshCw
                    size={35}
                    className="spin"
                  />

                  <p>
                    Loading student
                    marks...
                  </p>

                </div>

              ) : filteredMarks.length ===
                0 ? (

                <div className="quiz-marks-empty">

                  <Trophy size={42} />

                  <h2>
                    No Marks Available
                  </h2>

                  <p>
                    No students have
                    attempted the
                    quizzes in this
                    module yet.
                  </p>

                </div>

              ) : (

                <table className="marks-table">

                  <thead>

                    <tr>

                      <th>
                        Student
                      </th>

                      <th>
                        Email
                      </th>

                      <th>
                        Quiz
                      </th>

                      <th>
                        Marks
                      </th>

                      <th>
                        Total
                      </th>

                      <th>
                        Percentage
                      </th>

                      <th>
                        Submitted
                      </th>

                      <th>
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredMarks.map(
                      (item, index) => {

                        const pct =
                          percent(item);

                        const passed =
                          pct >=
                          PASS_MARK;

                        return (

                          <tr
                            key={
                              item.id ||
                              `${item.quizId}-${index}`
                            }
                          >

                            <td>

                              <div className="student-name">
                                {studentName(
                                  item
                                )}
                              </div>

                            </td>

                            <td>
                              {studentEmail(
                                item
                              )}
                            </td>

                            <td>
                              {item.quizTitle ||
                                "—"}
                            </td>

                            <td>

                              <strong>
                                {obtained(
                                  item
                                )}
                              </strong>

                            </td>

                            <td>
                              {total(item)}
                            </td>

                            <td>

                              <div className="pct-cell">

                                <div className="pct-track">

                                  <div
                                    className={`pct-fill ${
                                      passed
                                        ? "pass"
                                        : "fail"
                                    }`}
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        pct
                                      )}%`,
                                    }}
                                  />

                                </div>

                                <span>
                                  {pct.toFixed(
                                    1
                                  )}
                                  %
                                </span>

                              </div>

                            </td>

                            <td>
                              {fmtDate(
                                item.submittedAt
                              )}
                            </td>

                            <td>

                              <span
                                className={
                                  passed
                                    ? "status-badge pass"
                                    : "status-badge fail"
                                }
                              >

                                {passed
                                  ? "Pass"
                                  : "Fail"}

                              </span>

                            </td>

                          </tr>

                        );
                      }
                    )}

                  </tbody>

                </table>

              )}

            </div>

          )}

        </>
      )}

    </div>
  );
}

export default QuizMarks;