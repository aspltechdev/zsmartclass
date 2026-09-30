// src/pages/student/CoursePlayer.jsx

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
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Video,
  X,
  AlertCircle,
  HelpCircle,
  ShieldQuestion,
} from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";

import api from "../../services/api";
import "./CoursePlayer.css";
import "./StudentShared.css";

const SAVE_INTERVAL_MS = 15000;
const WATCH_TICK_MS = 1000;

let youtubeApiPromise;

function loadYoutubeAPI() {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve, reject) => {
    const previousCallback = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      try {
        previousCallback?.();
      } finally {
        resolve(window.YT);
      }
    };

    let script = document.getElementById("youtube-iframe-api");

    if (!script) {
      script = document.createElement("script");
      script.id = "youtube-iframe-api";
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
    }

    script.addEventListener(
      "error",
      () => {
        youtubeApiPromise = null;
        script.remove();
        reject(new Error("Unable to load the YouTube player."));
      },
      { once: true }
    );
  });

  return youtubeApiPromise;
}

function getYoutubeId(value) {
  if (!value) return null;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      const queryId = url.searchParams.get("v");
      if (queryId) return queryId;

      const segments = url.pathname.split("/").filter(Boolean);

      if (["embed", "shorts", "live"].includes(segments[0])) {
        return segments[1] || null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

const isDirectVideo = (url) =>
  Boolean(url) &&
  /\.(mp4|webm|ogg|ogv|mov|m4v)(?:[?#].*)?$/i.test(
    String(url).trim()
  );

const formatTime = (seconds) => {
  const value = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = value % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      secs
    ).padStart(2, "0")}`;
  }

  return `${minutes}:${String(secs).padStart(2, "0")}`;
};

const normalizeModules = (list) =>
  (Array.isArray(list) ? [...list] : [])
    .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
    .map((module) => ({
      ...module,
      lessons: (Array.isArray(module.lessons) ? [...module.lessons] : [])
        .sort(
          (a, b) => Number(a.position || 0) - Number(b.position || 0)
        ),
    }));

const progressSignature = (payload) =>
  [
    payload.watchedSeconds,
    payload.lastPosition,
    payload.durationSeconds,
  ].join(":");

function CoursePlayer() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [progressMap, setProgressMap] = useState({});
  const [courseProgress, setCourseProgress] = useState(0);

  const [loading, setLoading] = useState(true);
  const [savingProgress, setSavingProgress] = useState(false);
  const [error, setError] = useState("");
  const [lessonError, setLessonError] = useState("");
  const [progressError, setProgressError] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoTime, setVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoVolume, setVideoVolume] = useState(100);
  const [videoMuted, setVideoMuted] = useState(false);
  const [videoFullscreen, setVideoFullscreen] = useState(false);

  const nativeVideoRef = useRef(null);
  const youtubeContainerRef = useRef(null);
  const videoShellRef = useRef(null);
  const playerRef = useRef(null);

  const mountedRef = useRef(false);
  const courseIdRef = useRef(String(courseId || ""));
  const courseRequestRef = useRef(0);
  const lessonRequestRef = useRef(0);
  const structureRequestRef = useRef(0);
  const playerGenerationRef = useRef(0);

  const progressMapRef = useRef({});
  const activeSessionRef = useRef(null);
  const sessionsRef = useRef(new Map());

  const watchTimerRef = useRef(null);
  const videoUiTimerRef = useRef(null);

  // One shared queue for this player component.
  // Each session can have only its latest snapshot queued.
  const pendingSavesRef = useRef(new Map());
  const saveWorkerRef = useRef(null);

  const volumeRef = useRef(100);
  const mutedRef = useRef(false);

  courseIdRef.current = String(courseId || "");
  volumeRef.current = videoVolume;
  mutedRef.current = videoMuted;

  const isCurrentCourse = (id) =>
    mountedRef.current && courseIdRef.current === String(id);

  const publishProgress = (session) => {
    if (!isCurrentCourse(session.courseId)) return;

    const next = {
      ...progressMapRef.current,
      [session.lessonId]: {
        watchedSeconds: session.watched,
        lastPosition: session.position,
        durationSeconds: session.duration,
        completed: session.completed,
      },
    };

    progressMapRef.current = next;
    setProgressMap(next);
  };

  const seedProgressMap = (moduleList, selectedCourseId) => {
    const map = {};

    moduleList.forEach((module) => {
      (module.lessons || []).forEach((lesson) => {
        const id = Number(lesson.id);
        const session = sessionsRef.current.get(
          `${selectedCourseId}:${id}`
        );

        const server = {
          watchedSeconds: Number(lesson.watchedSeconds) || 0,
          lastPosition: Number(lesson.lastPosition) || 0,
          durationSeconds: Number(lesson.durationSeconds) || 0,
          completed: Boolean(lesson.completed),
        };

        if (session) {
          session.watched = Math.max(
            session.watched,
            server.watchedSeconds
          );
          session.duration =
            server.durationSeconds || session.duration;
          session.completed = server.completed;

          map[id] = {
            watchedSeconds: session.watched,
            lastPosition: session.position,
            durationSeconds: session.duration,
            completed: session.completed,
          };
        } else {
          map[id] = server;
        }
      });
    });

    return map;
  };

  const refreshStructure = async (selectedCourseId) => {
    if (!isCurrentCourse(selectedCourseId)) return;

    const request = ++structureRequestRef.current;

    try {
      const response = await api.get(
        `/player/course/${selectedCourseId}`
      );

      if (
        !isCurrentCourse(selectedCourseId) ||
        request !== structureRequestRef.current
      ) {
        return;
      }

      const data = response?.data?.data || response?.data;
      if (!data) return;

      const nextModules = normalizeModules(data.modules);
      const nextMap = seedProgressMap(nextModules, selectedCourseId);

      setModules(nextModules);
      progressMapRef.current = nextMap;
      setProgressMap(nextMap);
      setCourseProgress(Number(data.progress) || 0);
    } catch (err) {
      console.error("Structure refresh failed:", err?.message);
    }
  };

  // ==========================================
  // Progress save queue
  // ==========================================

  const runSaveQueue = () => {
    if (saveWorkerRef.current) return saveWorkerRef.current;

    const worker = Promise.resolve().then(async () => {
      if (mountedRef.current) setSavingProgress(true);

      try {
        while (pendingSavesRef.current.size > 0) {
          const [session, snapshot] =
            pendingSavesRef.current.entries().next().value;

          pendingSavesRef.current.delete(session);

          if (snapshot.signature === session.confirmedSignature) {
            continue;
          }

          session.inFlightSignature = snapshot.signature;

          try {
            const response = await api.post(
              `/player/lesson/${session.lessonId}/watch-time`,
              snapshot.payload
            );

            if (response?.data?.success === false) {
              throw new Error(
                response.data.message || "Unable to save progress."
              );
            }

            const returned = response?.data?.data;
            const saved = returned?.lessonProgress || returned || {};

            const wasCompleted = session.completed;
            session.confirmedSignature = snapshot.signature;

            // Keep watch time accumulated while the request was running.
            session.watched = Math.max(
              session.watched,
              Number(saved.watchedSeconds ?? snapshot.payload.watchedSeconds)
            );

            if (Number(saved.durationSeconds) > 0) {
              session.duration = Number(saved.durationSeconds);
            }

            if (typeof saved.completed === "boolean") {
              session.completed = saved.completed;
            }

            publishProgress(session);

            if (isCurrentCourse(session.courseId)) {
              setProgressError("");

              if (typeof returned?.overallProgress === "number") {
                setCourseProgress(returned.overallProgress);
              }

              if (session.completed && !wasCompleted) {
                void refreshStructure(session.courseId);
              }
            }
          } catch (err) {
            // Do not mark failed data as saved.
            // It will be retried at the next interval or final save.
            session.nextSaveAt = Date.now() + SAVE_INTERVAL_MS;

            console.error(
              "Progress save failed:",
              err?.response?.data || err
            );

            if (isCurrentCourse(session.courseId)) {
              setProgressError(
                "Progress could not be saved. It will retry while you continue watching."
              );
            }
          } finally {
            session.inFlightSignature = null;
          }
        }
      } finally {
        saveWorkerRef.current = null;
        if (mountedRef.current) setSavingProgress(false);
      }
    });

    saveWorkerRef.current = worker;
    return worker;
  };

  const saveSession = (session) => {
    if (!session || !session.touched) {
      return saveWorkerRef.current || Promise.resolve();
    }

    const payload = {
      watchedSeconds: Math.max(0, Math.floor(session.watched)),
      lastPosition: Math.max(0, Math.floor(session.position)),
      durationSeconds: Math.max(0, Math.floor(session.duration)),
    };

    const signature = progressSignature(payload);
    session.nextSaveAt = Date.now() + SAVE_INTERVAL_MS;

    if (
      signature === session.confirmedSignature &&
      !session.inFlightSignature
    ) {
      pendingSavesRef.current.delete(session);
      return saveWorkerRef.current || Promise.resolve();
    }

    if (signature === session.inFlightSignature) {
      pendingSavesRef.current.delete(session);
      return saveWorkerRef.current || Promise.resolve();
    }

    pendingSavesRef.current.set(session, { payload, signature });
    return runSaveQueue();
  };

  // ==========================================
  // Local watch tracking
  // ==========================================

  const readPlayerPosition = (session) => {
    if (activeSessionRef.current !== session) return;

    const player = playerRef.current;
    if (!player) return;

    try {
      const position = Number(player.getCurrentTime());
      const duration = Number(player.getDuration());

      if (Number.isFinite(position) && position >= 0) {
        session.position = position;
      }

      if (Number.isFinite(duration) && duration > 0) {
        session.duration = duration;
      }
    } catch {
      // The player may be shutting down.
    }
  };

  const sampleWatchTime = (session) => {
    if (!session) return;

    const now = Date.now();
    const previousPosition = session.position;

    readPlayerPosition(session);

    if (session.playing && session.lastTick !== null) {
      const elapsed = Math.min(
        6,
        Math.max(0, (now - session.lastTick) / 1000)
      );

      if (elapsed > 0) {
        session.watched += elapsed;
        session.touched = true;
      }
    }

    session.lastTick = session.playing ? now : null;

    if (session.position !== previousPosition) {
      session.touched = true;
    }

    publishProgress(session);
  };

  const stopWatchTimer = () => {
    if (watchTimerRef.current) {
      clearInterval(watchTimerRef.current);
      watchTimerRef.current = null;
    }
  };

  const startWatchTimer = () => {
    stopWatchTimer();

    watchTimerRef.current = setInterval(() => {
      const session = activeSessionRef.current;
      if (!session?.playing) return;

      // Local tracking only: no API call every second.
      sampleWatchTime(session);

      if (Date.now() >= session.nextSaveAt) {
        void saveSession(session);
      }
    }, WATCH_TICK_MS);
  };

  const handlePlaybackStart = () => {
    const session = activeSessionRef.current;
    if (!session) return;

    if (!session.playing) {
      session.playing = true;
      session.lastTick = Date.now();
      session.nextSaveAt = Date.now() + SAVE_INTERVAL_MS;
    }

    setVideoPlaying(true);
    startWatchTimer();
  };

  const handlePlaybackStop = (save = true, ended = false) => {
    const session = activeSessionRef.current;
    if (!session) return;

    sampleWatchTime(session);
    session.playing = false;
    session.lastTick = null;

    stopWatchTimer();

    if (mountedRef.current) {
      setVideoPlaying(false);
      if (ended) setVideoTime(session.duration);
    }

    if (save) void saveSession(session);
  };

  const flushCurrentProgress = () => {
    const session = activeSessionRef.current;
    if (!session) return saveWorkerRef.current || Promise.resolve();

    sampleWatchTime(session);
    return saveSession(session);
  };

  const pauseAndSave = () => {
    const session = activeSessionRef.current;
    if (!session) return saveWorkerRef.current || Promise.resolve();

    sampleWatchTime(session);
    session.playing = false;
    session.lastTick = null;
    stopWatchTimer();

    try {
      if (playerRef.current?.isNative) {
        playerRef.current.pause();
      } else {
        playerRef.current?.pauseVideo?.();
      }
    } catch {
      // Preserve the snapshot even if pausing fails.
    }

    if (mountedRef.current) setVideoPlaying(false);
    return saveSession(session);
  };

  // ==========================================
  // Player lifecycle
  // ==========================================

  const destroyPlayer = () => {
    playerGenerationRef.current += 1;

    const player = playerRef.current;
    playerRef.current = null;

    try {
      if (player?.isNative) {
        player.pause();
      } else {
        player?.destroy?.();
      }
    } catch {
      // Already destroyed.
    }

    if (youtubeContainerRef.current) {
      youtubeContainerRef.current.innerHTML = "";
    }
  };

  const makeNativeAdapter = (element) => ({
    isNative: true,
    el: element,
    getCurrentTime: () => Number(element.currentTime) || 0,
    getDuration: () => Number(element.duration) || 0,
    play: () => element.play(),
    pause: () => element.pause(),
    seekTo: (seconds) => {
      element.currentTime = Number(seconds) || 0;
    },
    mute: () => {
      element.muted = true;
    },
    unMute: () => {
      element.muted = false;
    },
    setVolume: (value) => {
      element.volume = Math.max(0, Math.min(100, value)) / 100;
    },
  });

  const selectLesson = async (lesson, selectedCourseId = courseId) => {
    if (!lesson) return;

    const request = ++lessonRequestRef.current;

    await pauseAndSave();

    if (
      !isCurrentCourse(selectedCourseId) ||
      request !== lessonRequestRef.current
    ) {
      return;
    }

    activeSessionRef.current = null;
    destroyPlayer();
    setLessonError("");
    setSelectedLesson(null);

    try {
      const response = await api.get(`/player/lesson/${lesson.id}`, {
        params: { courseId: selectedCourseId },
      });

      if (
        !isCurrentCourse(selectedCourseId) ||
        request !== lessonRequestRef.current
      ) {
        return;
      }

      const full = response?.data?.data || response?.data;
      if (!full?.id) throw new Error("Unable to open this lesson.");

      const lessonId = Number(full.id);
      const key = `${selectedCourseId}:${lessonId}`;
      const stored = progressMapRef.current[lessonId] || {};
      const previousSession = sessionsRef.current.get(key);

      const watched = Number(
        full.watchedSeconds ?? stored.watchedSeconds ?? 0
      );
      const position = Number(
        full.lastPosition ?? stored.lastPosition ?? 0
      );
      const duration = Number(
        full.durationSeconds ?? stored.durationSeconds ?? 0
      );

      const session = previousSession || {
        key,
        courseId: String(selectedCourseId),
        lessonId,
        watched,
        position,
        duration,
        touched: false,
        confirmedSignature: progressSignature({
          watchedSeconds: Math.floor(watched),
          lastPosition: Math.floor(position),
          durationSeconds: Math.floor(duration),
        }),
        inFlightSignature: null,
      };

      session.watched = Math.max(session.watched, watched);
      session.duration = duration || session.duration;
      session.completed = Boolean(full.completed ?? stored.completed);
      session.playing = false;
      session.lastTick = null;
      session.nextSaveAt = Date.now() + SAVE_INTERVAL_MS;

      sessionsRef.current.set(key, session);
      activeSessionRef.current = session;

      setVideoPlaying(false);
      setVideoTime(session.position);
      setVideoDuration(session.duration);
      setSelectedLesson(full);
      setMobileSidebarOpen(false);
      publishProgress(session);
    } catch (err) {
      if (
        !isCurrentCourse(selectedCourseId) ||
        request !== lessonRequestRef.current
      ) {
        return;
      }

      setLessonError(
        err?.response?.data?.message ||
          err.message ||
          "This lesson is locked. Complete the previous module first."
      );
      setSelectedLesson({ ...lesson, videoUrl: null });
    }
  };

  const loadCourse = async () => {
    const selectedCourseId = String(courseId);
    const request = ++courseRequestRef.current;

    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/player/course/${selectedCourseId}`
      );

      if (
        !isCurrentCourse(selectedCourseId) ||
        request !== courseRequestRef.current
      ) {
        return;
      }

      const data = response?.data?.data || response?.data;
      if (!data) throw new Error("Course data not found.");

      const nextModules = normalizeModules(data.modules);
      const nextMap = seedProgressMap(nextModules, selectedCourseId);

      setCourse(data.course || null);
      setModules(nextModules);
      progressMapRef.current = nextMap;
      setProgressMap(nextMap);
      setCourseProgress(Number(data.progress) || 0);

      const firstPlayable = nextModules.find(
        (module) => module.unlocked && module.lessons.length > 0
      );

      if (firstPlayable) {
        setExpandedModules({ [firstPlayable.id]: true });
        await selectLesson(firstPlayable.lessons[0], selectedCourseId);
      } else if (nextModules.length) {
        setExpandedModules({ [nextModules[0].id]: true });
      }
    } catch (err) {
      if (
        isCurrentCourse(selectedCourseId) &&
        request === courseRequestRef.current
      ) {
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Unable to load course."
        );
      }
    } finally {
      if (
        isCurrentCourse(selectedCourseId) &&
        request === courseRequestRef.current
      ) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    const onPageHide = () => {
      // Best effort: browsers may cancel requests when a tab closes.
      void pauseAndSave();
    };

    window.addEventListener("pagehide", onPageHide);

    return () => {
      void pauseAndSave();
      mountedRef.current = false;
      lessonRequestRef.current += 1;
      courseRequestRef.current += 1;
      structureRequestRef.current += 1;
      activeSessionRef.current = null;
      stopWatchTimer();
      destroyPlayer();
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  useEffect(() => {
    if (!courseId) {
      setError("Course ID is missing.");
      setLoading(false);
      return;
    }

    void loadCourse();

    return () => {
      void pauseAndSave();
      activeSessionRef.current = null;
      lessonRequestRef.current += 1;
      courseRequestRef.current += 1;
      structureRequestRef.current += 1;
      destroyPlayer();
    };
  }, [courseId]);

  useEffect(() => {
    if (
      loading ||
      !selectedLesson?.videoUrl ||
      isDirectVideo(selectedLesson.videoUrl)
    ) {
      return;
    }

    const session = activeSessionRef.current;
    const videoId = getYoutubeId(selectedLesson.videoUrl);
    let cancelled = false;

    if (!videoId) {
      setLessonError("This lesson has an unsupported video URL.");
      return;
    }

    loadYoutubeAPI()
      .then((YT) => {
        if (
          cancelled ||
          !mountedRef.current ||
          activeSessionRef.current !== session ||
          !youtubeContainerRef.current
        ) {
          return;
        }

        destroyPlayer();
        const generation = playerGenerationRef.current;

        const element = document.createElement("div");
        youtubeContainerRef.current.appendChild(element);

        const isActive = () =>
          !cancelled &&
          mountedRef.current &&
          activeSessionRef.current === session &&
          playerGenerationRef.current === generation;

        playerRef.current = new YT.Player(element, {
          width: "100%",
          height: "100%",
          videoId,
          playerVars: {
            controls: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            fs: 0,
            disablekb: 1,
            iv_load_policy: 3,
          },
          events: {
            onReady: (event) => {
              if (!isActive()) return;

              session.duration =
                Number(event.target.getDuration()) || session.duration;

              setVideoDuration(session.duration);
              event.target.setVolume?.(volumeRef.current);

              if (mutedRef.current) event.target.mute?.();

              if (
                session.position > 0 &&
                session.position < session.duration
              ) {
                event.target.seekTo(session.position, true);
              }

              publishProgress(session);
            },
            onStateChange: (event) => {
              if (!isActive()) return;

              if (event.data === YT.PlayerState.PLAYING) {
                handlePlaybackStart();
              } else if (event.data === YT.PlayerState.PAUSED) {
                handlePlaybackStop(true);
              } else if (event.data === YT.PlayerState.ENDED) {
                handlePlaybackStop(true, true);
              } else if (event.data === YT.PlayerState.BUFFERING) {
                // Stop counting buffered time without making a save request.
                handlePlaybackStop(false);
              }
            },
          },
        });
      })
      .catch((err) => {
        if (!cancelled && mountedRef.current) {
          setLessonError(err.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedLesson?.id, loading]);

  // UI polling is local only. It never calls the API.
  useEffect(() => {
    if (!selectedLesson || loading) return;

    videoUiTimerRef.current = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;

      try {
        const current = Number(player.getCurrentTime());
        const duration = Number(player.getDuration());

        if (Number.isFinite(current)) setVideoTime(current);

        if (Number.isFinite(duration) && duration > 0) {
          setVideoDuration(duration);
          if (activeSessionRef.current) {
            activeSessionRef.current.duration = duration;
          }
        }
      } catch {
        // Player not ready.
      }
    }, 250);

    return () => {
      clearInterval(videoUiTimerRef.current);
      videoUiTimerRef.current = null;
    };
  }, [selectedLesson?.id, loading]);

  useEffect(() => {
    const handler = () =>
      setVideoFullscreen(Boolean(document.fullscreenElement));

    document.addEventListener("fullscreenchange", handler);
    return () =>
      document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ==========================================
  // Video controls
  // ==========================================

  const handleNativeLoaded = (event) => {
    const session = activeSessionRef.current;
    if (!session) return;

    const element = event.currentTarget;
    playerRef.current = makeNativeAdapter(element);

    session.duration = Number(element.duration) || session.duration;
    setVideoDuration(session.duration);

    if (
      session.position > 0 &&
      session.position < session.duration
    ) {
      element.currentTime = session.position;
    }

    setVideoTime(session.position);
    element.volume = volumeRef.current / 100;
    element.muted = mutedRef.current;
    publishProgress(session);
  };

  const toggleVideoPlay = async () => {
    const player = playerRef.current;
    if (!player) return;

    try {
      if (videoPlaying) {
        if (player.isNative) player.pause();
        else player.pauseVideo?.();
      } else {
        if (player.isNative) await player.play();
        else player.playVideo?.();
      }
    } catch (err) {
      console.error("Video playback failed:", err.message);
    }
  };

  const seekVideo = (event) => {
    const session = activeSessionRef.current;
    const player = playerRef.current;
    if (!session || !player || !videoDuration) return;

    sampleWatchTime(session);

    const next = Math.max(
      0,
      Math.min(videoDuration, Number(event.target.value) || 0)
    );

    session.position = next;
    session.touched = true;
    setVideoTime(next);

    try {
      player.seekTo(next, true);
    } catch {
      // Ignore a seek while the player is unavailable.
    }
  };

  const toggleVideoMute = () => {
    const player = playerRef.current;
    if (!player) return;

    try {
      if (videoMuted) {
        player.unMute?.();
        player.setVolume?.(videoVolume);
        setVideoMuted(false);
      } else {
        player.mute?.();
        setVideoMuted(true);
      }
    } catch {
      // Player not ready.
    }
  };

  const changeVideoVolume = (event) => {
    const value = Math.max(
      0,
      Math.min(100, Number(event.target.value) || 0)
    );

    setVideoVolume(value);

    try {
      playerRef.current?.setVolume?.(value);

      if (value === 0) {
        playerRef.current?.mute?.();
        setVideoMuted(true);
      } else {
        playerRef.current?.unMute?.();
        setVideoMuted(false);
      }
    } catch {
      // Player not ready.
    }
  };

  const toggleVideoFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await videoShellRef.current?.requestFullscreen?.();
      }
    } catch (err) {
      console.error("Fullscreen failed:", err);
    }
  };

  const leavePlayer = async (destination) => {
    await pauseAndSave();
    navigate(destination);
  };

  // ==========================================
  // Display helpers
  // ==========================================

  const toggleModule = (module) => {
    if (!module.unlocked) return;
    setExpandedModules((previous) => ({
      ...previous,
      [module.id]: !previous[module.id],
    }));
  };

  const isLessonComplete = (lesson) =>
    Boolean(progressMap[Number(lesson.id)]?.completed) ||
    Boolean(lesson.completed);

  const getLessonPercentage = (lesson) => {
    if (isLessonComplete(lesson)) return 100;

    const item = progressMap[Number(lesson.id)];
    if (!item) return 0;

    const watched = Number(item.watchedSeconds) || 0;
    const duration = Number(item.durationSeconds) || 0;
    if (duration <= 0) return 0;

    // Completion remains server-controlled.
    return Math.min(
      99,
      Math.max(0, Math.round((Math.min(watched, duration) / duration) * 100))
    );
  };

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
        <button
          type="button"
          onClick={() => leavePlayer("/student/my-courses")}
        >
          <ArrowLeft size={17} /> Back to My Courses
        </button>
      </div>
    );
  }

  return (
    <div className="course-player-page">
      <header className="course-player-header">
        <div className="course-player-header-left">
          <button
            type="button"
            className="player-back-btn"
            aria-label="Back to My Courses"
            onClick={() => leavePlayer("/student/my-courses")}
          >
            <ArrowLeft size={18} />
          </button>

          <button
            type="button"
            className="mobile-menu-btn"
            aria-label="Open course content"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div>
            <span>MY COURSE</span>
            <h1>{course?.title || "Course"}</h1>
          </div>
        </div>

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
          className={`course-player-sidebar ${
            mobileSidebarOpen ? "mobile-open" : ""
          }`}
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
              aria-label="Close course content"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <div className="course-sidebar-content">
            {modules.map((module, index) => {
              const open = Boolean(expandedModules[module.id]);
              const lessons = module.lessons || [];
              const unlocked = Boolean(module.unlocked);
              const completed = lessons.filter(isLessonComplete).length;
              const total = lessons.length;
              const quizPath =
                `/student/quiz?moduleId=${module.id}&courseId=${courseId}`;

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
                          : module.reason ||
                            "Complete the previous module to unlock"}
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
                            const done = isLessonComplete(lesson);

                            return (
                              <button
                                key={lesson.id}
                                type="button"
                                className={`sidebar-lesson ${
                                  active ? "active" : ""
                                } ${done ? "completed" : ""}`}
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
                                        progressMap[Number(lesson.id)]
                                          ?.watchedSeconds || 0
                                      )}{" "}
                                      /{" "}
                                      {formatTime(
                                        progressMap[Number(lesson.id)]
                                          ?.durationSeconds || 0
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

                          {module.hasQuiz && (
                            <div className="sidebar-quiz-section">
                              {module.lessonsComplete ? (
                                <Link
                                  to={quizPath}
                                  className="sidebar-quiz-link"
                                  onClick={(event) => {
                                    if (
                                      event.button === 0 &&
                                      !event.ctrlKey &&
                                      !event.metaKey &&
                                      !event.shiftKey &&
                                      !event.altKey
                                    ) {
                                      event.preventDefault();
                                      void leavePlayer(quizPath);
                                    } else {
                                      void flushCurrentProgress();
                                    }
                                  }}
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
                                  <HelpCircle
                                    size={16}
                                    className="quiz-locked-icon"
                                  />
                                  <span>
                                    Complete all lessons to unlock quiz (
                                    {completed}/{total})
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
          <div
            className="lesson-video-container lms-video-shell"
            ref={videoShellRef}
          >
            {!selectedLesson ? (
              <div className="course-player-no-selection">
                <PlayCircle size={50} />
                <h2>Select a lesson</h2>
                <p>Select a lesson from the sidebar to start learning.</p>
              </div>
            ) : lessonError ? (
              <div className="course-player-no-selection">
                <ShieldQuestion size={50} />
                <h2>Unable to play lesson</h2>
                <p>{lessonError}</p>
              </div>
            ) : isDirectVideo(selectedLesson.videoUrl) ? (
              <video
                ref={nativeVideoRef}
                key={selectedLesson.id}
                src={selectedLesson.videoUrl}
                className="youtube-player-wrapper native-video-player"
                controls={false}
                playsInline
                preload="metadata"
                onLoadedMetadata={handleNativeLoaded}
                onTimeUpdate={(event) =>
                  setVideoTime(Number(event.currentTarget.currentTime) || 0)
                }
                onPlaying={handlePlaybackStart}
                onWaiting={() => handlePlaybackStop(false)}
                onSeeking={() => handlePlaybackStop(false)}
                onSeeked={(event) => {
                  const session = activeSessionRef.current;
                  if (!session) return;

                  session.position = event.currentTarget.currentTime;
                  session.touched = true;

                  if (!event.currentTarget.paused) {
                    handlePlaybackStart();
                  }
                }}
                onPause={() => handlePlaybackStop(true)}
                onEnded={() => handlePlaybackStop(true, true)}
              />
            ) : selectedLesson.videoUrl ? (
              <div
                ref={youtubeContainerRef}
                className="youtube-player-wrapper"
              />
            ) : (
              <div className="course-player-no-selection">
                <Video size={50} />
                <h2>No video</h2>
                <p>This lesson has no video yet.</p>
              </div>
            )}

            {selectedLesson && !lessonError && selectedLesson.videoUrl && (
              <div className="student-video-controls" aria-label="Video controls">
                <button
                  type="button"
                  className="student-video-control-btn"
                  onClick={toggleVideoPlay}
                  aria-label={videoPlaying ? "Pause video" : "Play video"}
                  title={videoPlaying ? "Pause" : "Play"}
                >
                  {videoPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>

                <span className="student-video-time">
                  {formatTime(videoTime)}
                </span>

                <input
                  className="student-video-seek"
                  type="range"
                  min="0"
                  max={Math.max(0, videoDuration)}
                  step="0.1"
                  value={Math.min(videoTime, videoDuration || 0)}
                  onChange={seekVideo}
                  aria-label="Video progress"
                />

                <span className="student-video-time">
                  {formatTime(videoDuration)}
                </span>

                <button
                  type="button"
                  className="student-video-control-btn"
                  onClick={toggleVideoMute}
                  aria-label={videoMuted ? "Unmute video" : "Mute video"}
                  title={videoMuted ? "Unmute" : "Mute"}
                >
                  {videoMuted || videoVolume === 0 ? (
                    <VolumeX size={18} />
                  ) : (
                    <Volume2 size={18} />
                  )}
                </button>

                <input
                  className="student-video-volume"
                  type="range"
                  min="0"
                  max="100"
                  value={videoMuted ? 0 : videoVolume}
                  onChange={changeVideoVolume}
                  aria-label="Video volume"
                />

                <button
                  type="button"
                  className="student-video-control-btn"
                  onClick={toggleVideoFullscreen}
                  aria-label={
                    videoFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                  }
                  title={videoFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  {videoFullscreen ? (
                    <Minimize size={18} />
                  ) : (
                    <Maximize size={18} />
                  )}
                </button>
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

              {progressError && (
                <p role="status" style={{ color: "#b45309" }}>
                  {progressError}
                </p>
              )}

              {selectedLesson.description && (
                <p>{selectedLesson.description}</p>
              )}

              <div className="lesson-information-meta">
                <div className="lesson-meta-item">
                  <Clock size={15} />
                  <span>
                    Watched{" "}
                    {formatTime(
                      progressMap[Number(selectedLesson.id)]?.watchedSeconds || 0
                    )}
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
                    style={{
                      width: `${getLessonPercentage(selectedLesson)}%`,
                    }}
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