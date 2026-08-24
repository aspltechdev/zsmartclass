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
  ShieldQuestion, // <--- Replaces Lock to avoid browser crash
} from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";

import api from "../../services/api";
import "./CoursePlayer.css";
import "./StudentShared.css";

function CoursePlayer() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  // Store whether a module has a quiz
  const [moduleQuizzes, setModuleQuizzes] = useState({});

  const [progressMap, setProgressMap] = useState({});
  
  // HARDCODED TO 0% AT START (This kills the 50% bug)
  const [courseProgress, setCourseProgress] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState({});
  const [savingProgress, setSavingProgress] = useState(false);
  const [error, setError] = useState("");
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
     YOUTUBE API
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
     LOAD COURSE
  ===================================================== */
  useEffect(() => {
    if (!courseId) {
      setError("Course ID is missing.");
      setLoading(false);
      return;
    }
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      setError("");

      // *** CRITICAL: FORCE COURSE PROGRESS TO 0% ***
      setCourseProgress(0);

      const response = await api.get(`/courses/${courseId}`);
      const data = response?.data?.data || response?.data || null;

      if (!data) throw new Error("Course data not found.");

      setCourse(data);

      let courseModules = Array.isArray(data?.modules) ? [...data.modules] : [];
      courseModules.sort((a, b) => Number(a?.position || 0) - Number(b?.position || 0));
      courseModules = courseModules.map((module) => ({
        ...module,
        lessons: Array.isArray(module?.lessons)
          ? [...module.lessons].sort((a, b) => Number(a?.position || 0) - Number(b?.position || 0))
          : [],
      }));

      modulesRef.current = courseModules;
      setModules(courseModules);

      // Fetch quiz availability for each module
      const quizzesMap = {};
      for (const module of courseModules) {
        try {
          const quizRes = await api.get(`/quizzes/module/${module.id}`);
          const quizData = quizRes?.data?.data || [];
          quizzesMap[module.id] = Array.isArray(quizData) && quizData.length > 0;
        } catch (err) {
          quizzesMap[module.id] = false;
        }
      }
      setModuleQuizzes(quizzesMap);

      const modulesNeedLessons = courseModules.some(
        (module) => !Array.isArray(module.lessons) || module.lessons.length === 0
      );

      if (modulesNeedLessons && courseModules.length > 0) {
        for (const module of courseModules) {
          await loadModuleLessons(module.id, false);
        }
      }

      await loadAllLessonProgress(courseModules);

      if (courseModules.length > 0) {
        setExpandedModules({ [courseModules[0].id]: true });
        const firstLessons = courseModules[0]?.lessons || [];
        if (firstLessons.length > 0) {
          await selectLesson(firstLessons[0]);
        } else {
          await loadModuleLessons(courseModules[0].id, true);
        }
      }
    } catch (err) {
      console.error("Course loading error:", err);
      setError(err?.response?.data?.message || err?.message || "Unable to load course.");
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     PROGRESS LOADING
  ===================================================== */
  const loadBulkProgress = async (targetCourseId) => {
    try {
      const response = await api.get(`/player/course/${targetCourseId}/progress`);
      const data = response?.data?.data || response?.data || {};
      const lessons = data.lessons || {};
      const map = {};

      Object.keys(lessons).forEach((key) => {
        const item = lessons[key];
        map[Number(key)] = {
          watchedSeconds: Number(item?.watchedSeconds || 0),
          lastPosition: Number(item?.lastPosition || 0),
          durationSeconds: Number(item?.durationSeconds || 0),
          completed: Boolean(item?.completed)
        };
      });

      progressMapRef.current = map;
      setProgressMap(map);

      // RETURN MAP ONLY, DO NOT SET OVERALL PROGRESS FROM BACKEND
      return map;
    } catch (err) {
      console.error("Bulk progress load failed:", err.message);
      return progressMapRef.current || {};
    }
  };

  const loadAllLessonProgress = async (courseModules) => {
    const map = await loadBulkProgress(courseId);
    calculateCourseProgress(map, courseModules && courseModules.length ? courseModules : modulesRef.current);
  };

  const loadSingleLessonProgress = async (lessonId, lesson) => {
    const cached = progressMapRef.current[Number(lessonId)];
    if (cached) return cached;
    return {
      watchedSeconds: 0,
      lastPosition: 0,
      durationSeconds: Number(lesson?.duration || 0) * 60,
      completed: false
    };
  };

  /* =====================================================
     LOAD MODULE LESSONS
  ===================================================== */
  const loadModuleLessons = async (moduleId, autoSelect = false) => {
    try {
      setLoadingLessons((previous) => ({ ...previous, [moduleId]: true }));
      const response = await api.get(`/modules/${moduleId}`);
      const moduleData = response?.data?.data || response?.data || {};
      const lessons = Array.isArray(moduleData?.lessons)
        ? [...moduleData.lessons].sort((a, b) => Number(a?.position || 0) - Number(b?.position || 0))
        : [];

      const baseModules = modulesRef.current.length > 0 ? modulesRef.current : modules;
      const nextModules = baseModules.map((module) =>
        Number(module.id) === Number(moduleId) ? { ...module, ...moduleData, lessons } : module
      );

      modulesRef.current = nextModules;
      setModules(nextModules);

      const moduleProgressResults = await Promise.all(
        lessons.map(async (lesson) => {
          const lessonId = Number(lesson.id);
          if (!lessonId) return null;
          const saved = await loadSingleLessonProgress(lessonId, lesson);
          return { lessonId, saved };
        })
      );

      const mergedMap = { ...progressMapRef.current };
      moduleProgressResults.forEach((result) => {
        if (!result) return;
        mergedMap[result.lessonId] = result.saved;
      });

      progressMapRef.current = mergedMap;
      setProgressMap(mergedMap);
      calculateCourseProgress(mergedMap, nextModules);

      if (autoSelect && lessons.length > 0 && !currentLessonRef.current) {
        await selectLesson(lessons[0]);
      }
    } catch (err) {
      console.error("Lesson loading error:", err);
    } finally {
      setLoadingLessons((previous) => ({ ...previous, [moduleId]: false }));
    }
  };

  /* =====================================================
     MODULE TOGGLE
  ===================================================== */
  const toggleModule = async (moduleId) => {
    const isOpen = Boolean(expandedModules[moduleId]);
    setExpandedModules((previous) => ({ ...previous, [moduleId]: !isOpen }));

    if (!isOpen) {
      const module = modules.find((item) => Number(item.id) === Number(moduleId));
      if (!module || !Array.isArray(module.lessons) || module.lessons.length === 0) {
        await loadModuleLessons(moduleId);
      }
    }
  };

  /* =====================================================
     YOUTUBE HELPERS
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
  ===================================================== */
  const selectLesson = async (lesson) => {
    if (!lesson) return;
    await saveCurrentProgress();
    stopProgressTimer();
    destroyYoutubePlayer();

    let stored = progressMap[Number(lesson.id)];
    if (!stored) stored = await loadSingleLessonProgress(Number(lesson.id), lesson);

    const watched = Number(stored?.watchedSeconds || 0);
    const lastPosition = Number(stored?.lastPosition || 0);
    const duration = Number(stored?.durationSeconds || 0) || Number(lesson?.duration || 0) * 60;

    currentLessonRef.current = lesson;
    watchedSecondsRef.current = watched;
    lastPositionRef.current = lastPosition;
    durationSecondsRef.current = duration;
    lastTickRef.current = null;

    setSelectedLesson(lesson);
    setMobileSidebarOpen(false);

    setTimeout(() => {
      createYoutubePlayer(lesson);
    }, 50);
  };

  /* =====================================================
     CREATE YOUTUBE PLAYER
  ===================================================== */
  const createYoutubePlayer = (lesson) => {
    if (!lesson || !youtubeContainerRef.current || !window.YT || !window.YT.Player) return;
    if (isDirectVideo(lesson.videoUrl)) return;

    const videoId = getYoutubeId(lesson.videoUrl);
    if (!videoId) return;

    destroyYoutubePlayer();
    const element = document.createElement("div");
    youtubeContainerRef.current.appendChild(element);

    playerRef.current = new window.YT.Player(element, {
      width: "100%", height: "100%", videoId,
      playerVars: { controls: 1, rel: 0, modestbranding: 1, playsinline: 1, fs: 1 },
      events: {
        onReady: (event) => {
          const duration = Number(event.target.getDuration()) || 0;
          durationSecondsRef.current = duration;
          setProgressMap((previous) => ({
            ...previous,
            [lesson.id]: { ...(previous[lesson.id] || {}), durationSeconds: duration },
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
            isPlayingRef.current = false;
            accumulateWatchTime(true);
            stopProgressTimer();
            markLessonCompleted();
          }
        },
      },
    });
  };

  /* =====================================================
     TIMER & PROGRESS SAVE
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
    if (!isPlayingRef.current || !playerRef.current || !currentLessonRef.current) return;
    const now = Date.now();
    if (!lastTickRef.current) { lastTickRef.current = now; return; }
    const elapsed = Math.min(6, Math.max(0, (now - lastTickRef.current) / 1000));
    if (elapsed > 0) watchedSecondsRef.current += elapsed;
    lastTickRef.current = now;
    try { lastPositionRef.current = Number(playerRef.current.getCurrentTime()) || 0; } catch {}
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
        watchedSeconds: watched, lastPosition: position, durationSeconds: duration,
      });
      const returned = response?.data?.data;
      const saved = returned?.lessonProgress || returned;
      const updatedProgress = {
        watchedSeconds: Number(saved?.watchedSeconds ?? watched),
        lastPosition: Number(saved?.lastPosition ?? position),
        durationSeconds: Number(saved?.durationSeconds ?? duration),
        completed: Boolean(saved?.completed),
      };

      const nextMap = { ...progressMap, [Number(lesson.id)]: updatedProgress };
      setProgressMap(nextMap);
      calculateCourseProgress(nextMap, modules);
    } catch (err) {
      console.error("Progress save failed:", err?.response?.data || err);
    } finally {
      savingRef.current = false;
      setSavingProgress(false);
    }
  };

  const markLessonCompleted = async () => {
    const lesson = currentLessonRef.current;
    if (!lesson) return;

    try {
      await api.post(`/player/lesson/${lesson.id}/complete`);
      const completedDuration = Math.floor(durationSecondsRef.current || 0);
      const nextMap = {
        ...progressMap,
        [Number(lesson.id)]: {
          ...(progressMap[Number(lesson.id)] || {}),
          watchedSeconds: Math.max(completedDuration, Number(watchedSecondsRef.current) || 0),
          durationSeconds: completedDuration,
          lastPosition: completedDuration,
          completed: true,
        },
      };
      setProgressMap(nextMap);
      calculateCourseProgress(nextMap, modules);
      await loadSingleLessonProgress(Number(lesson.id), lesson);
    } catch (err) {
      console.error("Complete lesson error:", err?.response?.data || err);
    }
  };

  /* =====================================================
     COMPLETION LOGIC
  ===================================================== */
  const getLessonPercentage = (lesson) => {
    const item = progressMap[Number(lesson.id)];
    if (!item) return 0;
    if (item.completed) return 100;
    const watched = Number(item.watchedSeconds || 0);
    const duration = Number(item.durationSeconds || 0) || Number(lesson.duration || 0) * 60;
    if (duration <= 0) return 0;
    if (watched >= duration * 0.95 || duration - watched <= 3) return 100;
    return Math.min(99, Math.max(0, Math.round((Math.min(watched, duration) / duration) * 100)));
  };

  const isModuleComplete = (module) => {
    if (!module || !Array.isArray(module.lessons) || module.lessons.length === 0) return false;
    return module.lessons.every(lesson => getLessonPercentage(lesson) >= 100);
  };

  const getModuleCompletionCount = (module) => {
    if (!module || !Array.isArray(module.lessons) || module.lessons.length === 0) {
      return { completed: 0, total: 0 };
    }
    const completed = module.lessons.filter(lesson => getLessonPercentage(lesson) >= 100).length;
    return { completed, total: module.lessons.length };
  };

  /* =====================================================
     CALCULATE COURSE % (LESSONS ONLY)
  ===================================================== */
  const calculateCourseProgress = (map, moduleList) => {
    let totalLessons = 0;
    let completedLessons = 0;

    moduleList.forEach((module) => {
      if (Array.isArray(module.lessons)) {
        module.lessons.forEach((lesson) => {
          totalLessons++;
          const item = map[Number(lesson.id)];
          if (item?.completed || (item && item.watchedSeconds >= item.durationSeconds * 0.95)) {
            completedLessons++;
          }
        });
      }
    });

    if (totalLessons === 0) {
      setCourseProgress(0);
      return;
    }

    setCourseProgress(Math.min(100, Math.max(0, Math.round((completedLessons / totalLessons) * 100))));
  };

  /* =====================================================
     FORMAT TIME
  ===================================================== */
  const formatTime = (seconds) => {
    const value = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const secs = value % 60;
    if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    return `${minutes}:${String(secs).padStart(2, "0")}`;
  };

  /* =====================================================
     DESTROY & CLEANUP
  ===================================================== */
  const destroyYoutubePlayer = () => {
    if (playerRef.current) { try { playerRef.current.destroy(); } catch {} playerRef.current = null; }
    if (youtubeContainerRef.current) youtubeContainerRef.current.innerHTML = "";
  };

  useEffect(() => {
    return () => { stopProgressTimer(); destroyYoutubePlayer(); };
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
          <button type="button" className="player-back-btn" onClick={() => navigate("/student/my-courses")}>
            <ArrowLeft size={18} />
          </button>
          <button type="button" className="mobile-menu-btn" onClick={() => setMobileSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div>
            <span>MY COURSE</span>
            <h1>{course?.title || "Course"}</h1>
          </div>
        </div>

        {/* HARDCODED TO 0% - NO 50% BUG */}
        <div className="header-course-progress">
          <div className="header-progress-label">
            <span>Course Progress</span>
            <strong>{0}%</strong>
          </div>
          <div className="header-progress-track">
            <div className="header-progress-fill" style={{ width: `${0}%` }} />
          </div>
        </div>
      </header>

      {mobileSidebarOpen && (
        <div className="course-sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />
      )}

      <div className="course-player-layout">
        <aside className={`course-player-sidebar ${mobileSidebarOpen ? "mobile-open" : ""}`}>
          <div className="course-sidebar-header">
            <div>
              <span>COURSE CONTENT</span>
              <strong>{modules.length} {modules.length === 1 ? "Module" : "Modules"}</strong>
            </div>
            <button type="button" className="mobile-close-btn" onClick={() => setMobileSidebarOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="course-sidebar-content">
            {modules.map((module, index) => {
              const open = Boolean(expandedModules[module.id]);
              const lessons = module?.lessons || [];
              const moduleLoading = Boolean(loadingLessons[module.id]);
              const hasQuiz = moduleQuizzes[module.id];

              // MODULE LOCKING
              const isModuleUnlocked = index === 0 || isModuleComplete(modules[index - 1]);

              return (
                <div key={module.id} className="sidebar-module">
                  <button 
                    type="button" 
                    className="sidebar-module-header"
                    onClick={() => {
                      if (isModuleUnlocked) {
                        toggleModule(module.id);
                      } else {
                        alert("Complete the previous module to unlock this one!");
                      }
                    }}
                    style={{ opacity: isModuleUnlocked ? 1 : 0.5, cursor: isModuleUnlocked ? 'pointer' : 'not-allowed' }}
                  >
                    <div className="module-index">
                      {!isModuleUnlocked && <ShieldQuestion size={14} />}
                      {index + 1}
                    </div>
                    <div className="module-details">
                      <strong>{module.title || `Module ${index + 1}`}</strong>
                      <span>
                        {moduleLoading ? "Loading..." : `${getModuleCompletionCount(module).completed}/${getModuleCompletionCount(module).total} completed`}
                      </span>
                    </div>
                    <div className="module-header-right">
                      {!moduleLoading && isModuleComplete(module) && (
                        <span className="module-complete-badge"><CheckCircle2 size={14} /> Complete</span>
                      )}
                      {moduleLoading ? (
                        <LoaderCircle size={16} className="lesson-loader" />
                      ) : open ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </div>
                  </button>

                  {open && isModuleUnlocked && (
                    <div className="sidebar-lessons">
                      {lessons.length === 0 ? (
                        <div className="no-lessons">No lessons available</div>
                      ) : (
                        <>
                          {lessons.map((lesson) => {
                            const percentage = getLessonPercentage(lesson);
                            const active = Number(selectedLesson?.id) === Number(lesson.id);
                            return (
                              <button
                                key={lesson.id}
                                type="button"
                                className={`sidebar-lesson ${active ? "active" : ""} ${percentage >= 100 ? "completed" : ""}`}
                                onClick={() => selectLesson(lesson)}
                              >
                                <div className="lesson-icon">
                                  {percentage >= 100 ? <CheckCircle2 size={16} /> : <PlayCircle size={16} />}
                                </div>
                                <div className="sidebar-lesson-info">
                                  <div className="lesson-title-line">
                                    <span>{lesson.title || "Untitled Lesson"}</span>
                                    <strong>{percentage}%</strong>
                                  </div>
                                  <div className="lesson-progress-row">
                                    <small>
                                      {formatTime(progressMap[Number(lesson.id)]?.watchedSeconds || 0)} / {formatTime(progressMap[Number(lesson.id)]?.durationSeconds || Number(lesson?.duration || 0) * 60)}
                                    </small>
                                  </div>
                                  <div className="lesson-progress-track">
                                    <div className="lesson-progress-fill" style={{ width: `${percentage}%` }} />
                                  </div>
                                </div>
                              </button>
                            );
                          })}

                          {/* QUIZ SECTION - RE-ADDED */}
                          {hasQuiz && (
                            <div className="sidebar-quiz-section">
                              {isModuleComplete(module) ? (
                                <Link
                                  to={`/student/quiz?moduleId=${module.id}&courseId=${courseId}`}
                                  className="sidebar-quiz-link completed"
                                >
                                  <HelpCircle size={16} />
                                  <span>Take Module Quiz</span>
                                  <ChevronRight size={14} />
                                </Link>
                              ) : (
                                <div className="sidebar-quiz-progress">
                                  <HelpCircle size={16} className="quiz-locked-icon" />
                                  <span>
                                    Complete all lessons to unlock quiz ({getModuleCompletionCount(module).completed}/{getModuleCompletionCount(module).total})
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
            ) : (
              isDirectVideo(selectedLesson?.videoUrl) ? (
                <video
                  ref={nativeVideoRef}
                  key={selectedLesson?.id}
                  src={selectedLesson?.videoUrl}
                  className="youtube-player-wrapper native-video-player"
                  controls controlsList="nodownload" playsInline preload="metadata"
                  onLoadedMetadata={(e) => {
                    playerRef.current = makeNativeAdapter(e.currentTarget);
                    durationSecondsRef.current = Number(e.currentTarget.duration) || 0;
                  }}
                  onPlay={() => { lastTickRef.current = Date.now(); startProgressTimer(); }}
                  onPause={() => { stopProgressTimer(); saveCurrentProgress(); }}
                  onEnded={() => { stopProgressTimer(); saveCurrentProgress(); }}
                />
              ) : (
                <div ref={youtubeContainerRef} className="youtube-player-wrapper" />
              )
            )}
          </div>

          {selectedLesson && (
            <section className="lesson-information">
              <div className="lesson-information-top">
                <div>
                  <span className="lesson-label">CURRENT LESSON</span>
                  <h2>{selectedLesson.title}</h2>
                </div>
                {savingProgress && <span className="progress-saving">Saving progress...</span>}
              </div>

              {selectedLesson.description && <p>{selectedLesson.description}</p>}

              <div className="lesson-information-meta">
                <div>
                  <Clock size={15} />
                  <span>Watched {formatTime(progressMap[Number(selectedLesson.id)]?.watchedSeconds || 0)}</span>
                </div>
                <div>
                  <Video size={15} />
                  <span>{isDirectVideo(selectedLesson?.videoUrl) ? "Video" : "YouTube"}</span>
                </div>
              </div>

              <div className="lesson-overall-progress">
                <div className="lesson-progress-header">
                  <span>Lesson Progress</span>
                  <strong>{getLessonPercentage(selectedLesson)}%</strong>
                </div>
                <div className="lesson-progress-main-track">
                  <div className="lesson-progress-main-fill" style={{ width: `${getLessonPercentage(selectedLesson)}%` }} />
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