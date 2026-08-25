import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  LoaderCircle,
  Menu,
  PlayCircle,
  Video,
  X,
  AlertCircle,
  HelpCircle,
  ShieldQuestion, // used as the "locked" glyph (avoids a Lucide Lock crash seen earlier)
} from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";

import api from "../../services/api";
import "./CoursePlayer.css";
import "./StudentShared.css";

/*
 * Student Course Player.
 *
 * All structure, gating and progress come from the server-enforced player API:
 *   - GET /player/course/:courseId          → gated module/lesson tree + progress
 *   - GET /player/lesson/:lessonId?courseId  → the ONLY path to a playable videoUrl
 *   - POST /player/lesson/:lessonId/watch-time → persists watch time; server marks
 *                                                a lesson complete at >=95% watched
 *
 * Module locks, quiz-unlock and quiz pass/fail all read from the gating flags on
 * each module (unlocked / lessonsComplete / quizRequired / quizPassed /
 * moduleComplete) — never computed client-side. Course progress is whatever the
 * server reports (completed lessons / total lessons), so it matches the admin,
 * dashboard and My Learning views exactly.
 */
function CoursePlayer() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  // Per-lesson live progress (for the smooth in-progress bars). Seeded from the
  // structure payload, updated from each watch-time save.
  const [progressMap, setProgressMap] = useState({});

  // Server-reported overall course progress (completed lessons / total lessons).
  const [courseProgress, setCourseProgress] = useState(0);

  const [loading, setLoading] = useState(true);
  const [savingProgress, setSavingProgress] = useState(false);
  const [error, setError] = useState("");
  const [lessonError, setLessonError] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  /* =====================================================
     REFS
  ===================================================== */
  const nativeVideoRef = useRef(null);
  const youtubeContainerRef = useRef(null);
  const playerRef = useRef(null);
  const progressMapRef = useRef({});
  const modulesRef = useRef([]);
  const currentLessonRef = useRef(null);
  const watchedSecondsRef = useRef(0);
  const lastPositionRef = useRef(0);
  const durationSecondsRef = useRef(0);
  const lastTickRef = useRef(null);
  const progressTimerRef = useRef(null);
  const isPlayingRef = useRef(false);
  const savingRef = useRef(false);

  /* =====================================================
     YOUTUBE IFRAME API
  ===================================================== */
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      if (currentLessonRef.current) createYoutubePlayer(currentLessonRef.current);
      return;
    }

    if (document.getElementById("youtube-iframe-api")) return;

    const script = document.createElement("script");
    script.id = "youtube-iframe-api";
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.body.appendChild(script);

    window.onYouTubeIframeAPIReady = () => {
      if (currentLessonRef.current) createYoutubePlayer(currentLessonRef.current);
    };

    return () => {
      stopProgressTimer();
      destroyYoutubePlayer();
    };
  }, []);

  /* =====================================================
     LOAD COURSE (gated structure + progress)
  ===================================================== */
  useEffect(() => {
    if (!courseId) {
      setError("Course ID is missing.");
      setLoading(false);
      return;
    }
    loadCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const normalizeModules = (list) => {
    const arr = Array.isArray(list) ? [...list] : [];
    arr.sort((a, b) => Number(a?.position || 0) - Number(b?.position || 0));
    return arr.map((m) => ({
      ...m,
      lessons: Array.isArray(m?.lessons)
        ? [...m.lessons].sort(
            (a, b) => Number(a?.position || 0) - Number(b?.position || 0)
          )
        : [],
    }));
  };

  const seedProgressMap = (moduleList, previous = {}) => {
    const map = {};
    moduleList.forEach((m) => {
      (m.lessons || []).forEach((l) => {
        const id = Number(l.id);
        const server = {
          watchedSeconds: Number(l.watchedSeconds) || 0,
          lastPosition: Number(l.lastPosition) || 0,
          durationSeconds: Number(l.durationSeconds) || 0,
          completed: Boolean(l.completed),
        };
        // For the lesson currently playing, don't let a structure refresh
        // pull its live watched time backwards.
        if (
          currentLessonRef.current &&
          Number(currentLessonRef.current.id) === id &&
          previous[id]
        ) {
          server.watchedSeconds = Math.max(
            server.watchedSeconds,
            Number(previous[id].watchedSeconds) || 0
          );
          server.durationSeconds =
            server.durationSeconds || Number(previous[id].durationSeconds) || 0;
        }
        map[id] = server;
      });
    });
    return map;
  };

  const loadCourse = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/player/course/${courseId}`);
      const data = response?.data?.data || response?.data || null;
      if (!data) throw new Error("Course data not found.");

      setCourse(data.course || null);

      const courseModules = normalizeModules(data.modules);
      modulesRef.current = courseModules;
      setModules(courseModules);

      const map = seedProgressMap(courseModules);
      progressMapRef.current = map;
      setProgressMap(map);

      setCourseProgress(Number(data.progress) || 0);

      // Auto-open + select the first lesson of the first unlocked, non-empty module.
      const firstPlayable = courseModules.find(
        (m) => m.unlocked && (m.lessons || []).length > 0
      );
      if (firstPlayable) {
        setExpandedModules({ [firstPlayable.id]: true });
        await selectLesson(firstPlayable.lessons[0]);
      } else if (courseModules.length > 0) {
        setExpandedModules({ [courseModules[0].id]: true });
      }
    } catch (err) {
      console.error("Course loading error:", err);
      setError(
        err?.response?.data?.message || err?.message || "Unable to load course."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Re-pull the gated structure. Called after a lesson completes so the next
   * module unlocks (and quiz-unlock / pass flags update) without a page reload.
   */
  const refreshStructure = async () => {
    try {
      const response = await api.get(`/player/course/${courseId}`);
      const data = response?.data?.data || response?.data || null;
      if (!data) return;

      const courseModules = normalizeModules(data.modules);
      modulesRef.current = courseModules;
      setModules(courseModules);

      const map = seedProgressMap(courseModules, progressMapRef.current);
      progressMapRef.current = map;
      setProgressMap(map);

      setCourseProgress(Number(data.progress) || 0);
    } catch (err) {
      console.error("Structure refresh failed:", err?.message);
    }
  };

  /* =====================================================
     MODULE TOGGLE (locked modules can't expand)
  ===================================================== */
  const toggleModule = (module) => {
    if (!module?.unlocked) return;
    setExpandedModules((previous) => ({
      ...previous,
      [module.id]: !previous[module.id],
    }));
  };

  /* =====================================================
     VIDEO HELPERS
  ===================================================== */
  const getYoutubeId = (url) => {
    if (!url) return null;
    const watch = url.match(/[?&]v=([^&#]+)/);
    if (watch?.[1]) return watch[1];
    const short = url.match(/youtu\.be\/([^?&#]+)/);
    if (short?.[1]) return short[1];
    const embed = url.match(/youtube\.com\/embed\/([^?&#]+)/);
    if (embed?.[1]) return embed[1];
    const shorts = url.match(/youtube\.com\/shorts\/([^?&#]+)/);
    if (shorts?.[1]) return shorts[1];
    return null;
  };

  const isDirectVideo = (url) =>
    !!url && /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(String(url).trim());

  const makeNativeAdapter = (el) => ({
    getCurrentTime: () => Number(el?.currentTime) || 0,
    getDuration: () => Number(el?.duration) || 0,
    destroy: () => {},
    isNative: true,
  });

  /* =====================================================
     SELECT LESSON
     Fetches the playable URL through the gated lesson endpoint — the only
     place a student ever receives a real videoUrl.
  ===================================================== */
  const selectLesson = async (lesson) => {
    if (!lesson) return;

    await saveCurrentProgress();
    stopProgressTimer();
    destroyYoutubePlayer();
    isPlayingRef.current = false;
    setLessonError("");

    let full = null;
    try {
      const response = await api.get(
        `/player/lesson/${lesson.id}?courseId=${courseId}`
      );
      full = response?.data?.data || response?.data || null;
    } catch (err) {
      // 403 => module locked (defensive; the UI already hides locked lessons).
      console.error("Lesson open failed:", err?.response?.data || err);
      setLessonError(
        err?.response?.data?.message ||
          "This lesson is locked. Complete the previous module first."
      );
      setSelectedLesson({ ...lesson, videoUrl: null });
      currentLessonRef.current = null;
      return;
    }

    if (!full) {
      setLessonError("Unable to open this lesson.");
      return;
    }

    const stored = progressMapRef.current[Number(full.id)] || {};
    const watched = Number(full.watchedSeconds ?? stored.watchedSeconds ?? 0);
    const lastPosition = Number(full.lastPosition ?? stored.lastPosition ?? 0);
    const duration = Number(
      full.durationSeconds ?? stored.durationSeconds ?? 0
    );

    currentLessonRef.current = full;
    watchedSecondsRef.current = watched;
    lastPositionRef.current = lastPosition;
    durationSecondsRef.current = duration;
    lastTickRef.current = null;

    setSelectedLesson(full);
    setMobileSidebarOpen(false);

    // Let React paint the container before mounting the YT player.
    setTimeout(() => createYoutubePlayer(full), 50);
  };

  /* =====================================================
     CREATE YOUTUBE PLAYER
  ===================================================== */
  const createYoutubePlayer = (lesson) => {
    if (!lesson || !youtubeContainerRef.current || !window.YT || !window.YT.Player)
      return;
    if (isDirectVideo(lesson.videoUrl)) return; // native <video> handles these
    if (!lesson.videoUrl) return;

    const videoId = getYoutubeId(lesson.videoUrl);
    if (!videoId) return;

    destroyYoutubePlayer();
    const element = document.createElement("div");
    youtubeContainerRef.current.appendChild(element);

    playerRef.current = new window.YT.Player(element, {
      width: "100%",
      height: "100%",
      videoId,
      playerVars: { controls: 1, rel: 0, modestbranding: 1, playsinline: 1, fs: 1 },
      events: {
        onReady: (event) => {
          const duration = Number(event.target.getDuration()) || 0;
          durationSecondsRef.current = duration;
          setProgressMap((previous) => ({
            ...previous,
            [lesson.id]: {
              ...(previous[lesson.id] || {}),
              durationSeconds: duration,
            },
          }));
          const resumeAt = Math.max(0, lastPositionRef.current);
          if (resumeAt > 0 && resumeAt < duration) event.target.seekTo(resumeAt, true);
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            isPlayingRef.current = true;
            lastTickRef.current = Date.now();
            startProgressTimer();
          }
          if (event.data === window.YT.PlayerState.PAUSED) {
            accumulateWatchTime(true);
            isPlayingRef.current = false;
            stopProgressTimer();
            saveCurrentProgress();
          }
          if (event.data === window.YT.PlayerState.ENDED) {
            accumulateWatchTime(true);
            isPlayingRef.current = false;
            stopProgressTimer();
            // No /complete call — the watch-time save marks completion at >=95%.
            saveCurrentProgress();
          }
        },
      },
    });
  };

  /* =====================================================
     TIMER & WATCH-TIME
  ===================================================== */
  const startProgressTimer = () => {
    stopProgressTimer();
    progressTimerRef.current = setInterval(() => accumulateWatchTime(false), 5000);
  };

  const stopProgressTimer = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const accumulateWatchTime = async (forceSave) => {
    if (!isPlayingRef.current || !playerRef.current || !currentLessonRef.current)
      return;
    const now = Date.now();
    if (!lastTickRef.current) {
      lastTickRef.current = now;
      return;
    }
    const elapsed = Math.min(6, Math.max(0, (now - lastTickRef.current) / 1000));
    if (elapsed > 0) watchedSecondsRef.current += elapsed;
    lastTickRef.current = now;
    try {
      lastPositionRef.current = Number(playerRef.current.getCurrentTime()) || 0;
    } catch {}
    if (forceSave || elapsed > 0) await saveCurrentProgress();
  };

  const saveCurrentProgress = async () => {
    const lesson = currentLessonRef.current;
    if (!lesson || savingRef.current) return;

    const watched = Math.max(0, Math.floor(watchedSecondsRef.current));
    let position = Math.max(0, Number(lastPositionRef.current) || 0);
    let duration = Math.max(0, Math.floor(durationSecondsRef.current || 0));

    try {
      if (playerRef.current) {
        position = Number(playerRef.current.getCurrentTime()) || position;
        duration = Number(playerRef.current.getDuration()) || duration;
      }
    } catch {}

    try {
      savingRef.current = true;
      setSavingProgress(true);

      const response = await api.post(`/player/lesson/${lesson.id}/watch-time`, {
        watchedSeconds: watched,
        lastPosition: position,
        durationSeconds: duration,
      });

      const returned = response?.data?.data;
      const saved = returned?.lessonProgress || returned || {};

      const wasCompleted = Boolean(
        progressMapRef.current[Number(lesson.id)]?.completed
      );

      const updated = {
        watchedSeconds: Number(saved?.watchedSeconds ?? watched),
        lastPosition: Number(saved?.lastPosition ?? position),
        durationSeconds: Number(saved?.durationSeconds ?? duration),
        completed: Boolean(saved?.completed),
      };

      const nextMap = { ...progressMapRef.current, [Number(lesson.id)]: updated };
      progressMapRef.current = nextMap;
      setProgressMap(nextMap);

      if (typeof returned?.overallProgress === "number") {
        setCourseProgress(returned.overallProgress);
      }

      // A freshly-completed lesson can unlock the module's quiz / the next
      // module — refresh the gated structure so the sidebar reflects it live.
      if (updated.completed && !wasCompleted) {
        await refreshStructure();
      }
    } catch (err) {
      console.error("Progress save failed:", err?.response?.data || err);
    } finally {
      savingRef.current = false;
      setSavingProgress(false);
    }
  };

  /* =====================================================
     DERIVED DISPLAY HELPERS
  ===================================================== */
  const getLessonPercentage = (lesson) => {
    const item = progressMap[Number(lesson.id)];
    if (!item) return lesson?.completed ? 100 : 0;
    if (item.completed) return 100;
    const watched = Number(item.watchedSeconds || 0);
    const duration = Number(item.durationSeconds || 0);
    if (duration <= 0) return 0; // guard: no duration => 0%, never "complete"
    if (watched >= duration * 0.95 || duration - watched <= 3) return 100;
    return Math.min(
      99,
      Math.max(0, Math.round((Math.min(watched, duration) / duration) * 100))
    );
  };

  const isLessonComplete = (lesson) =>
    Boolean(progressMap[Number(lesson.id)]?.completed) || Boolean(lesson?.completed);

  const getModuleCompletionCount = (module) => {
    const lessons = module?.lessons || [];
    const completed = lessons.filter((l) => isLessonComplete(l)).length;
    return { completed, total: lessons.length };
  };

  const formatTime = (seconds) => {
    const value = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const secs = value % 60;
    if (hours > 0)
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    return `${minutes}:${String(secs).padStart(2, "0")}`;
  };

  /* =====================================================
     CLEANUP
  ===================================================== */
  const destroyYoutubePlayer = () => {
    if (playerRef.current && !playerRef.current.isNative) {
      try {
        playerRef.current.destroy();
      } catch {}
    }
    playerRef.current = null;
    if (youtubeContainerRef.current) youtubeContainerRef.current.innerHTML = "";
  };

  useEffect(() => {
    return () => {
      stopProgressTimer();
      destroyYoutubePlayer();
    };
  }, []);

  /* =====================================================
     LOADING & ERROR STATES
  ===================================================== */
  if (loading) {
    return (
      <div className="course-player-loading">
        <LoaderCircle size={34} className="player-spinner" />
        <p>Loading course...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="course-player-error">
        <AlertCircle size={42} />
        <h2>Unable to load course</h2>
        <p>{error}</p>
        <button type="button" onClick={() => navigate("/student/my-courses")}>
          <ArrowLeft size={17} /> Back to My Courses
        </button>
      </div>
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */
  return (
    <div className="course-player-page">
      <header className="course-player-header">
        <div className="course-player-header-left">
          <button
            type="button"
            className="player-back-btn"
            onClick={() => navigate("/student/my-courses")}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div>
            <span>MY COURSE</span>
            <h1>{course?.title || "Course"}</h1>
          </div>
        </div>

        {/* Real, server-reported course progress. */}
        <div className="header-course-progress">
          <div className="header-progress-label">
            <span>Course Progress</span>
            <strong>{courseProgress}%</strong>
          </div>
          <div className="header-progress-track">
            <div
              className="header-progress-fill"
              style={{ width: `${courseProgress}%` }}
            />
          </div>
        </div>
      </header>

      {mobileSidebarOpen && (
        <div
          className="course-sidebar-overlay"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className="course-player-layout">
        <aside
          className={`course-player-sidebar ${mobileSidebarOpen ? "mobile-open" : ""}`}
        >
          <div className="course-sidebar-header">
            <div>
              <span>COURSE CONTENT</span>
              <strong>
                {modules.length} {modules.length === 1 ? "Module" : "Modules"}
              </strong>
            </div>
            <button
              type="button"
              className="mobile-close-btn"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <div className="course-sidebar-content">
            {modules.map((module, index) => {
              const open = Boolean(expandedModules[module.id]);
              const lessons = module?.lessons || [];
              const unlocked = Boolean(module.unlocked);
              const hasQuiz = Boolean(module.hasQuiz);
              const { completed, total } = getModuleCompletionCount(module);

              return (
                <div key={module.id} className="sidebar-module">
                  <button
                    type="button"
                    className="sidebar-module-header"
                    onClick={() => toggleModule(module)}
                    style={{
                      opacity: unlocked ? 1 : 0.6,
                      cursor: unlocked ? "pointer" : "not-allowed",
                    }}
                    aria-disabled={!unlocked}
                    title={!unlocked ? module.reason || "Locked" : undefined}
                  >
                    <div className="module-index">
                      {!unlocked && <ShieldQuestion size={14} />}
                      {index + 1}
                    </div>
                    <div className="module-details">
                      <strong>{module.title || `Module ${index + 1}`}</strong>
                      <span>
                        {unlocked
                          ? `${completed}/${total} completed`
                          : module.reason || "Complete the previous module to unlock"}
                      </span>
                    </div>
                    <div className="module-header-right">
                      {unlocked && module.moduleComplete && (
                        <span className="module-complete-badge">
                          <CheckCircle2 size={14} /> Complete
                        </span>
                      )}
                      {!unlocked ? (
                        <ShieldQuestion size={16} className="quiz-locked-icon" />
                      ) : open ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </div>
                  </button>

                  {open && unlocked && (
                    <div className="sidebar-lessons">
                      {lessons.length === 0 ? (
                        <div className="no-lessons">No lessons available</div>
                      ) : (
                        <>
                          {lessons.map((lesson) => {
                            const percentage = getLessonPercentage(lesson);
                            const active =
                              Number(selectedLesson?.id) === Number(lesson.id);
                            const done = percentage >= 100;
                            return (
                              <button
                                key={lesson.id}
                                type="button"
                                className={`sidebar-lesson ${active ? "active" : ""} ${
                                  done ? "completed" : ""
                                }`}
                                onClick={() => selectLesson(lesson)}
                              >
                                <div className="lesson-icon">
                                  {done ? (
                                    <CheckCircle2 size={16} />
                                  ) : (
                                    <PlayCircle size={16} />
                                  )}
                                </div>
                                <div className="sidebar-lesson-info">
                                  <div className="lesson-title-line">
                                    <span>{lesson.title || "Untitled Lesson"}</span>
                                    <strong>{percentage}%</strong>
                                  </div>
                                  <div className="lesson-progress-row">
                                    <small>
                                      {formatTime(
                                        progressMap[Number(lesson.id)]?.watchedSeconds || 0
                                      )}{" "}
                                      /{" "}
                                      {formatTime(
                                        progressMap[Number(lesson.id)]?.durationSeconds || 0
                                      )}
                                    </small>
                                  </div>
                                  <div className="lesson-progress-track">
                                    <div
                                      className="lesson-progress-fill"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              </button>
                            );
                          })}

                          {/* QUIZ: unlocks when all lessons are complete. */}
                          {hasQuiz && (
                            <div className="sidebar-quiz-section">
                              {module.lessonsComplete ? (
                                <Link
                                  to={`/student/quiz?moduleId=${module.id}&courseId=${courseId}`}
                                  className="sidebar-quiz-link"
                                >
                                  <HelpCircle size={16} />
                                  <span>
                                    {module.quizPassed
                                      ? "Quiz Passed — Review"
                                      : "Take Module Quiz"}
                                  </span>
                                  {module.quizPassed ? (
                                    <CheckCircle2 size={14} />
                                  ) : (
                                    <ChevronRight size={14} />
                                  )}
                                </Link>
                              ) : (
                                <div className="sidebar-quiz-progress">
                                  <HelpCircle size={16} className="quiz-locked-icon" />
                                  <span>
                                    Complete all lessons to unlock quiz ({completed}/
                                    {total})
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <main className="course-player-content">
          <div className="lesson-video-container">
            {!selectedLesson ? (
              <div className="course-player-no-selection">
                <PlayCircle size={50} />
                <h2>Select a lesson</h2>
                <p>Select a lesson from the sidebar to start learning.</p>
              </div>
            ) : lessonError ? (
              <div className="course-player-no-selection">
                <ShieldQuestion size={50} />
                <h2>Lesson locked</h2>
                <p>{lessonError}</p>
              </div>
            ) : isDirectVideo(selectedLesson?.videoUrl) ? (
              <video
                ref={nativeVideoRef}
                key={selectedLesson?.id}
                src={selectedLesson?.videoUrl}
                className="youtube-player-wrapper native-video-player"
                controls
                controlsList="nodownload"
                playsInline
                preload="metadata"
                onLoadedMetadata={(e) => {
                  playerRef.current = makeNativeAdapter(e.currentTarget);
                  durationSecondsRef.current = Number(e.currentTarget.duration) || 0;
                  // Resume where the student left off.
                  const resumeAt = Math.max(0, lastPositionRef.current);
                  if (resumeAt > 0 && resumeAt < e.currentTarget.duration) {
                    try {
                      e.currentTarget.currentTime = resumeAt;
                    } catch {}
                  }
                }}
                onPlay={() => {
                  // CRITICAL: native video must flag "playing" or watch time
                  // never accumulates (accumulateWatchTime early-returns).
                  isPlayingRef.current = true;
                  lastTickRef.current = Date.now();
                  startProgressTimer();
                }}
                onPause={() => {
                  accumulateWatchTime(true);
                  isPlayingRef.current = false;
                  stopProgressTimer();
                  saveCurrentProgress();
                }}
                onEnded={() => {
                  accumulateWatchTime(true);
                  isPlayingRef.current = false;
                  stopProgressTimer();
                  saveCurrentProgress();
                }}
              />
            ) : selectedLesson?.videoUrl ? (
              <div ref={youtubeContainerRef} className="youtube-player-wrapper" />
            ) : (
              <div className="course-player-no-selection">
                <Video size={50} />
                <h2>No video</h2>
                <p>This lesson has no video yet.</p>
              </div>
            )}
          </div>

          {selectedLesson && !lessonError && (
            <section className="lesson-information">
              <div className="lesson-information-top">
                <div>
                  <span className="lesson-label">CURRENT LESSON</span>
                  <h2>{selectedLesson.title}</h2>
                </div>
                {savingProgress && (
                  <span className="progress-saving">Saving progress...</span>
                )}
              </div>

              {selectedLesson.description && <p>{selectedLesson.description}</p>}

              <div className="lesson-information-meta">
                <div>
                  <Clock size={15} />
                  <span>
                    Watched{" "}
                    {formatTime(
                      progressMap[Number(selectedLesson.id)]?.watchedSeconds || 0
                    )}
                  </span>
                </div>
                <div>
                  <Video size={15} />
                  <span>
                    {isDirectVideo(selectedLesson?.videoUrl) ? "Video" : "YouTube"}
                  </span>
                </div>
              </div>

              <div className="lesson-overall-progress">
                <div className="lesson-progress-header">
                  <span>Lesson Progress</span>
                  <strong>{getLessonPercentage(selectedLesson)}%</strong>
                </div>
                <div className="lesson-progress-main-track">
                  <div
                    className="lesson-progress-main-fill"
                    style={{ width: `${getLessonPercentage(selectedLesson)}%` }}
                  />
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default CoursePlayer;
