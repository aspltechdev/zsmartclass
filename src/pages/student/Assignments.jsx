import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Award,
  BookOpen,
  AlertCircle,
  RefreshCw,
  Upload,
  Paperclip,
  Download,
  Clock,
  Lock,
  CheckCircle2,
  XCircle,
  MessageSquare,
} from "lucide-react";

import api from "../../services/api";
import "./Assignments.css";
import "./StudentShared.css";

const ACCEPT =
  ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.txt,.png,.jpg,.jpeg";

const fileUrl = (path) => {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const base = (
    api.defaults?.baseURL || "http://localhost:5000/api"
  )
    .replace(/\/$/, "")
    .replace(/\/api$/, "");

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [drafts, setDrafts] = useState({});
  const [messages, setMessages] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [fileVersions, setFileVersions] = useState({});

  const mountedRef = useRef(false);
  const requestRef = useRef(0);
  const busyRef = useRef(false);

  const fetchAssignments = async () => {
    const requestId = ++requestRef.current;

    if (mountedRef.current) {
      setRefreshing(true);
      setError("");
    }

    try {
      const response = await api.get("/assignments", {
        params: { _refresh: Date.now() },
      });

      if (
        !response.data?.success ||
        !Array.isArray(response.data?.data)
      ) {
        throw new Error(
          response.data?.message || "Unable to load assignments."
        );
      }

      if (
        mountedRef.current &&
        requestId === requestRef.current
      ) {
        setAssignments(response.data.data);
      }
    } catch (err) {
      if (
        mountedRef.current &&
        requestId === requestRef.current
      ) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load assignments."
        );
      }
    } finally {
      if (
        mountedRef.current &&
        requestId === requestRef.current
      ) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchAssignments();

    // Refresh when the student returns from another tab.
    const handleFocus = () => {
      if (!busyRef.current) {
        fetchAssignments();
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const setDraft = (id, patch) => {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...(current[id] || {}),
        ...patch,
      },
    }));
  };

  const setMessage = (id, type, text) => {
    setMessages((current) => ({
      ...current,
      [id]: { type, text },
    }));
  };

  const submitWork = async (assignment) => {
    if (busyRef.current || refreshing) return;

    const submission = assignment.mySubmission;

    const status = String(
      submission?.status || assignment.status || "PENDING"
    ).toUpperCase();

    if (status === "GRADED") {
      setMessage(
        assignment.id,
        "error",
        "This assignment has already been accepted."
      );
      return;
    }

    if (assignment.locked) {
      setMessage(
        assignment.id,
        "error",
        assignment.lockReason ||
          "Complete all course lessons and quizzes first."
      );
      return;
    }

    const draft = drafts[assignment.id] || {};

    if (!draft.file) {
      setMessage(
        assignment.id,
        "error",
        "Please choose a file to upload."
      );
      return;
    }

    busyRef.current = true;
    setBusyId(assignment.id);
    setMessage(assignment.id, "", "");

    try {
      const formData = new FormData();

      formData.append("submission", draft.file);

      if (draft.note?.trim()) {
        formData.append("submissionText", draft.note.trim());
      }

      const response = await api.post(
        `/assignments/${assignment.id}/submit`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to submit assignment."
        );
      }

      if (!mountedRef.current) return;

      const savedSubmission = response.data.data;

      // Update the card immediately after a successful submission.
      if (savedSubmission?.id) {
        setAssignments((current) =>
          current.map((item) =>
            Number(item.id) === Number(assignment.id)
              ? {
                  ...item,
                  mySubmission: savedSubmission,
                  status: savedSubmission.status,
                  marks: savedSubmission.marks ?? null,
                  feedback: savedSubmission.feedback ?? null,
                  submitted: true,
                }
              : item
          )
        );
      }

      setDraft(assignment.id, {
        file: null,
        note: "",
      });

      setFileVersions((current) => ({
        ...current,
        [assignment.id]: (current[assignment.id] || 0) + 1,
      }));

      setMessage(
        assignment.id,
        "success",
        status === "REJECTED"
          ? "Assignment resubmitted. Your mentor will review your updated work."
          : "Assignment submitted. Your mentor will review it."
      );

      await fetchAssignments();
    } catch (err) {
      if (mountedRef.current) {
        setMessage(
          assignment.id,
          "error",
          err.response?.data?.message ||
            err.message ||
            "Submission failed. Please try again."
        );
      }
    } finally {
      busyRef.current = false;

      if (mountedRef.current) {
        setBusyId(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="assignments-loading">
        <div className="assignment-spinner" />
        <p>Loading assignments...</p>
      </div>
    );
  }

  if (error && assignments.length === 0) {
    return (
      <div className="assignments-error">
        <AlertCircle size={48} />
        <h2>Unable to load assignments</h2>
        <p>{error}</p>

        <button
          type="button"
          className="assignment-retry-btn"
          onClick={fetchAssignments}
          disabled={refreshing}
        >
          <RefreshCw size={17} />
          {refreshing ? "Loading..." : "Try Again"}
        </button>
      </div>
    );
  }

  return (
    <div className="assignments-container">
      <div className="assignments-header">
        <div>
          <h1 className="assignments-title">
            <FileText size={25} />
            Assignments
          </h1>

          <p className="assignments-subtitle">
            Submit your work and track marks &amp; feedback
          </p>
        </div>

        <div className="student-assignment-header-actions">
          <button
            type="button"
            className="student-assignment-refresh-btn"
            onClick={fetchAssignments}
            disabled={refreshing || busyId !== null}
            title="Refresh assignments"
            aria-label="Refresh assignments"
          >
            <RefreshCw
              size={17}
              className={
                refreshing ? "student-assignment-refreshing" : ""
              }
            />
          </button>

          <div className="assignments-count">
            <FileText size={18} />
            <span>
              {assignments.length}{" "}
              {assignments.length === 1
                ? "Assignment"
                : "Assignments"}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div
          className="submission-msg submission-msg-error"
          role="alert"
        >
          {error} Your displayed information may be outdated.
          Please refresh before submitting.
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="assignments-empty">
          <div className="assignments-empty-icon">
            <FileText size={42} />
          </div>
          <h2>No Assignments Available</h2>
          <p>There are currently no assignments available.</p>
        </div>
      ) : (
        <div className="assignments-list">
          {assignments.map((assignment) => {
            const submission = assignment.mySubmission;

            const status = String(
              submission?.status ||
                assignment.status ||
                "PENDING"
            ).toUpperCase();

            const accepted = status === "GRADED";
            const rejected = status === "REJECTED";

            const awaitingReview =
              !accepted &&
              !rejected &&
              (status === "SUBMITTED" ||
                (status === "PENDING" && Boolean(submission)));

            const courseLocked =
              Boolean(assignment.locked) && !accepted;

            const feedback = String(
              submission?.feedback ??
                assignment.feedback ??
                ""
            ).trim();

            const marks =
              submission?.marks ?? assignment.marks;

            const draft = drafts[assignment.id] || {};
            const message = messages[assignment.id];
            const busy = busyId === assignment.id;

            const uploadDisabled =
              busyId !== null || refreshing || Boolean(error);

            const canUpload =
              !accepted &&
              !courseLocked &&
              (
                status === "PENDING" ||
                status === "SUBMITTED" ||
                status === "REJECTED"
              );

            let badgeLabel = "Not submitted";
            let badgeClass = "pending";
            let StatusIcon = FileText;

            if (accepted) {
              badgeLabel = "Accepted";
              badgeClass = "graded";
              StatusIcon = CheckCircle2;
            } else if (rejected) {
              badgeLabel = "Rejected";
              badgeClass = "rejected";
              StatusIcon = XCircle;
            } else if (awaitingReview) {
              badgeLabel = "Submitted";
              badgeClass = "submitted";
              StatusIcon = Clock;
            } else if (courseLocked) {
              badgeLabel = "Locked";
              badgeClass = "locked";
              StatusIcon = Lock;
            }

            return (
              <div
                key={assignment.id}
                className="assignment-card"
              >
                <div className="assignment-header">
                  <div className="assignment-title-section">
                    <div className="assignment-icon">
                      <FileText size={24} />
                    </div>

                    <div>
                      <h2 className="assignment-title">
                        {assignment.title || "Untitled Assignment"}
                      </h2>

                      <div className="assignment-course">
                        <BookOpen size={15} />
                        <span>
                          {assignment.course?.title ||
                            assignment.Course?.title ||
                            "Course"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`assignment-status-badge ${badgeClass}`}
                  >
                    <StatusIcon size={13} />
                    {badgeLabel}
                  </span>
                </div>

                <div className="assignment-body">
                  <div className="assignment-description">
                    <h3>Assignment Details</h3>
                    <p>
                      {assignment.description?.trim()
                        ? assignment.description
                        : "No description provided for this assignment."}
                    </p>
                  </div>

                  <div className="assignment-meta-grid">
                    <div className="meta-item">
                      <div className="meta-icon">
                        <Award size={19} />
                      </div>
                      <div>
                        <span className="meta-label">
                          Total Marks
                        </span>
                        <span className="meta-value">
                          {assignment.totalMarks ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="assignment-submission">
                    {(submission || rejected || accepted) && (
                      <div
                        className={`submission-status submission-status-${badgeClass}`}
                      >
                        <StatusIcon size={17} />

                        <div className="submission-status-text">
                          {accepted ? (
                            <strong>
                              Accepted — {marks ?? "—"} /{" "}
                              {assignment.totalMarks ?? 0}
                            </strong>
                          ) : rejected ? (
                            <strong>
                              Rejected — please correct and resubmit
                            </strong>
                          ) : awaitingReview ? (
                            <strong>
                              Submitted — awaiting mentor review
                            </strong>
                          ) : (
                            <strong>
                              Review status unavailable. Please refresh.
                            </strong>
                          )}

                          {feedback && (
                            <div className="student-assignment-feedback">
                              <div className="student-assignment-feedback-label">
                                <MessageSquare size={14} />
                                {rejected
                                  ? "Reason for rejection"
                                  : "Mentor feedback"}
                              </div>

                              <p>{feedback}</p>
                            </div>
                          )}

                          {rejected && !feedback && (
                            <p className="student-assignment-status-note">
                              No feedback was provided. Please contact
                              your mentor for clarification.
                            </p>
                          )}

                          {rejected && (
                            <p className="student-assignment-status-note">
                              Follow your mentor’s feedback and upload
                              your corrected work. Your certificate
                              stays locked until all assignments are
                              accepted and the course is complete.
                            </p>
                          )}

                          <div className="submission-meta-row">
                            {submission?.attachment && (
                              <a
                                className="submission-file-link"
                                href={fileUrl(submission.attachment)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Download size={13} />
                                View submitted file
                              </a>
                            )}

                            {submission?.submittedAt && (
                              <span className="submission-date">
                                Submitted{" "}
                                {formatDate(submission.submittedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {courseLocked && (
                      <div className="submission-locked">
                        <Lock size={17} />
                        <div className="submission-locked-text">
                          <strong>Assignment locked</strong>
                          <span>
                            {assignment.lockReason ||
                              "Finish all lessons and quizzes in this course to unlock this assignment."}
                          </span>
                        </div>
                      </div>
                    )}

                    {canUpload && (
                      <div className="submission-upload">
                        <label
                          className="submission-upload-label"
                          htmlFor={`assignment-file-${assignment.id}`}
                        >
                          <Paperclip size={15} />
                          {rejected
                            ? "Upload your corrected work"
                            : submission
                              ? "Replace your file"
                              : "Upload your work"}
                        </label>

                        <input
                          key={`${assignment.id}-${fileVersions[assignment.id] || 0}`}
                          id={`assignment-file-${assignment.id}`}
                          type="file"
                          accept={ACCEPT}
                          className="submission-file-input"
                          disabled={uploadDisabled}
                          onChange={(event) =>
                            setDraft(assignment.id, {
                              file: event.target.files?.[0] || null,
                            })
                          }
                        />

                        <textarea
                          className="submission-note"
                          rows={2}
                          aria-label="Note for your mentor"
                          placeholder={
                            rejected
                              ? "Explain the corrections you made (optional)"
                              : "Add a note for your mentor (optional)"
                          }
                          value={draft.note || ""}
                          disabled={uploadDisabled}
                          onChange={(event) =>
                            setDraft(assignment.id, {
                              note: event.target.value,
                            })
                          }
                        />

                        <button
                          type="button"
                          className="submission-submit-btn"
                          disabled={uploadDisabled || !draft.file}
                          onClick={() => submitWork(assignment)}
                        >
                          {busy ? (
                            <span className="assignment-btn-spinner" />
                          ) : (
                            <Upload size={16} />
                          )}

                          {busy
                            ? "Submitting..."
                            : rejected || submission
                              ? "Resubmit Assignment"
                              : "Submit Assignment"}
                        </button>

                        <p className="submission-hint">
                          Accepted files: PDF, Word, PowerPoint,
                          Excel, ZIP, RAR, text and images.
                        </p>
                      </div>
                    )}

                    {message?.text && (
                      <div
                        className={`submission-msg submission-msg-${message.type}`}
                        role={
                          message.type === "error" ? "alert" : "status"
                        }
                      >
                        {message.text}
                      </div>
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
};

export default Assignments;