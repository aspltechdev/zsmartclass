import React, { useEffect, useState } from "react";
import {
  FileText,
  Calendar,
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
  MessageSquare,
} from "lucide-react";

import api from "../../services/api";
import "./Assignments.css";
import "./StudentShared.css";

/* Uploaded files are served from the server root (…/uploads/…), but the API
   base URL ends with /api. Strip it so the link resolves. */
const fileUrl = (p) => {
  if (!p) return "";
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  const base = (api.defaults?.baseURL || "http://localhost:5000/api")
    .replace(/\/$/, "")
    .replace(/\/api$/, "");
  return `${base}${p.startsWith("/") ? p : `/${p}`}`;
};

const ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.txt,.png,.jpg,.jpeg";

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Per-assignment submit state
  const [drafts, setDrafts] = useState({}); // { [id]: { file, note } }
  const [busyId, setBusyId] = useState(null); // assignment currently uploading
  const [msgs, setMsgs] = useState({}); // { [id]: { type, text } }

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/assignments");

      if (response.data?.success) {
        setAssignments(response.data.data || []);
      } else {
        setError(response.data?.message || "Unable to load assignments.");
      }
    } catch (err) {
      console.error("Failed to load assignments:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load assignments."
      );
    } finally {
      setLoading(false);
    }
  };

  const setDraft = (id, patch) =>
    setDrafts((d) => ({ ...d, [id]: { ...(d[id] || {}), ...patch } }));

  const setMsg = (id, type, text) =>
    setMsgs((m) => ({ ...m, [id]: { type, text } }));

  const submitWork = async (assignment) => {
    const draft = drafts[assignment.id] || {};

    if (!draft.file) {
      setMsg(assignment.id, "error", "Please choose a file to upload.");
      return;
    }

    try {
      setBusyId(assignment.id);
      setMsg(assignment.id, "", "");

      const fd = new FormData();
      fd.append("submission", draft.file);
      if (draft.note && draft.note.trim()) {
        fd.append("submissionText", draft.note.trim());
      }

      await api.post(`/assignments/${assignment.id}/submit`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setDraft(assignment.id, { file: null, note: "" });
      setMsg(
        assignment.id,
        "success",
        "Assignment submitted. Your mentor will review it."
      );
      await fetchAssignments();
    } catch (err) {
      setMsg(
        assignment.id,
        "error",
        err.response?.data?.message || "Submission failed. Please try again."
      );
    } finally {
      setBusyId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "No due date";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "No due date";
    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date) return "";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate).getTime() < Date.now();
  };

  /* ============================== LOADING ============================== */
  if (loading) {
    return (
      <div className="assignments-loading">
        <div className="assignment-spinner"></div>
        <p>Loading assignments...</p>
      </div>
    );
  }

  /* ============================== ERROR ============================== */
  if (error) {
    return (
      <div className="assignments-error">
        <AlertCircle size={48} />
        <h2>Unable to load assignments</h2>
        <p>{error}</p>
        <button
          type="button"
          className="assignment-retry-btn"
          onClick={fetchAssignments}
        >
          <RefreshCw size={17} />
          Try Again
        </button>
      </div>
    );
  }

  /* ============================== EMPTY ============================== */
  if (assignments.length === 0) {
    return (
      <div className="assignments-container">
        <div className="assignments-header">
          <div>
            <h1 className="assignments-title">Assignments</h1>
            <p className="assignments-subtitle">
              Submit your work and track marks &amp; feedback
            </p>
          </div>
        </div>

        <div className="assignments-empty">
          <div className="assignments-empty-icon">
            <FileText size={42} />
          </div>
          <h2>No Assignments Available</h2>
          <p>There are currently no assignments available.</p>
        </div>
      </div>
    );
  }

  /* ============================== MAIN ============================== */
  return (
    <div className="assignments-container">
      <div className="assignments-header">
        <div>
          <h1 className="assignments-title"><FileText size={25} />Assignments</h1>
          <p className="assignments-subtitle">
            Submit your work and track marks &amp; feedback
          </p>
        </div>

        <div className="assignments-count">
          <FileText size={18} />
          <span>
            {assignments.length}{" "}
            {assignments.length === 1 ? "Assignment" : "Assignments"}
          </span>
        </div>
      </div>

      <div className="assignments-list">
        {assignments.map((assignment) => {
          const sub = assignment.mySubmission;
          const status = (assignment.status || "PENDING").toUpperCase();
          const graded = status === "GRADED";
          const submitted = status === "SUBMITTED" || graded;
          // Locked until the student finishes all lessons + quizzes (server-driven).
          const locked = !!assignment.locked && !submitted;
          const overdue =
            isOverdue(assignment.dueDate) && !submitted && !locked;
          const draft = drafts[assignment.id] || {};
          const msg = msgs[assignment.id];
          const busy = busyId === assignment.id;

          return (
            <div
              key={assignment.id}
              className={`assignment-card${
                overdue ? " assignment-overdue" : ""
              }`}
            >
              {/* ===== CARD HEADER ===== */}
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

                {locked && (
                  <span className="assignment-status-badge locked">
                    <Lock size={13} /> Locked
                  </span>
                )}
                {overdue && (
                  <span className="assignment-overdue-badge">Overdue</span>
                )}
                {submitted && !graded && (
                  <span className="assignment-status-badge submitted">
                    <Clock size={13} /> Submitted
                  </span>
                )}
                {graded && (
                  <span className="assignment-status-badge graded">
                    <CheckCircle2 size={13} /> Graded
                  </span>
                )}
              </div>

              {/* ===== BODY ===== */}
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
                      <Calendar size={19} />
                    </div>
                    <div>
                      <span className="meta-label">Due Date</span>
                      <span className="meta-value">
                        {formatDate(assignment.dueDate)}
                      </span>
                      {assignment.dueDate && (
                        <span className="meta-subvalue">
                          {formatTime(assignment.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="meta-item">
                    <div className="meta-icon">
                      <Award size={19} />
                    </div>
                    <div>
                      <span className="meta-label">Total Marks</span>
                      <span className="meta-value">
                        {assignment.totalMarks ?? 0}
                      </span>
                    </div>
                  </div>

                  <div className="meta-item">
                    <div className="meta-icon">
                      <BookOpen size={19} />
                    </div>
                    <div>
                      <span className="meta-label">Course</span>
                      <span className="meta-value">
                        {assignment.course?.title ||
                          assignment.Course?.title ||
                          "Course"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ===== SUBMISSION ===== */}
                <div className="assignment-submission">
                  {sub && (
                    <div
                      className={`submission-status submission-status-${status.toLowerCase()}`}
                    >
                      {graded ? (
                        <CheckCircle2 size={17} />
                      ) : (
                        <Clock size={17} />
                      )}
                      <div className="submission-status-text">
                        {graded ? (
                          <strong>
                            Graded — {sub.marks ?? 0} /{" "}
                            {assignment.totalMarks ?? 0}
                          </strong>
                        ) : (
                          <strong>Submitted — awaiting mentor review</strong>
                        )}

                        {graded && sub.feedback && (
                          <span className="submission-feedback">
                            <MessageSquare size={13} /> {sub.feedback}
                          </span>
                        )}

                        <span className="submission-meta-row">
                          {sub.attachment && (
                            <a
                              className="submission-file-link"
                              href={fileUrl(sub.attachment)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Download size={13} /> View submitted file
                            </a>
                          )}
                          {sub.submittedAt && (
                            <span className="submission-date">
                              Submitted {formatDate(sub.submittedAt)}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Locked until all lessons + quizzes are done */}
                  {locked && (
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

                  {/* Upload form — hidden once graded (locked) or course-locked */}
                  {!graded && !locked && (
                    <div className="submission-upload">
                      <label className="submission-upload-label">
                        <Paperclip size={15} />
                        {submitted ? "Replace your file" : "Upload your work"}
                      </label>

                      <input
                        key={sub?.submittedAt || "new"}
                        type="file"
                        accept={ACCEPT}
                        className="submission-file-input"
                        onChange={(e) =>
                          setDraft(assignment.id, {
                            file: e.target.files?.[0] || null,
                          })
                        }
                      />

                      <textarea
                        className="submission-note"
                        rows={2}
                        placeholder="Add a note for your mentor (optional)"
                        value={draft.note || ""}
                        onChange={(e) =>
                          setDraft(assignment.id, { note: e.target.value })
                        }
                      />

                      <button
                        type="button"
                        className="submission-submit-btn"
                        disabled={busy || !draft.file}
                        onClick={() => submitWork(assignment)}
                      >
                        {busy ? (
                          <span className="assignment-btn-spinner" />
                        ) : (
                          <Upload size={16} />
                        )}
                        {busy
                          ? "Submitting…"
                          : submitted
                          ? "Resubmit"
                          : "Submit Assignment"}
                      </button>

                      <p className="submission-hint">
                        Accepted: PDF, Word, PowerPoint, Excel, ZIP, images.
                      </p>
                    </div>
                  )}

                  {msg?.text && (
                    <div className={`submission-msg submission-msg-${msg.type}`}>
                      {msg.text}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Assignments;
