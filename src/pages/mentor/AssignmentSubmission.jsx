import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Search,
  RefreshCw,
  Loader2,
  X,
} from "lucide-react";

import api from "../../services/api";
import "./MentorShared.css";
import "./AssignmentSubmission.css";

const getList = (response) => {
  const data = response?.data?.data;
  return Array.isArray(data) ? data : [];
};

const fileUrl = (path) => {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) return path;

  const base = (
    api.defaults?.baseURL || "http://localhost:5000/api"
  )
    .replace(/\/$/, "")
    .replace(/\/api$/, "");

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatus = (submission) => {
  const status = String(
    submission?.status || ""
  ).toUpperCase();

  if (status === "GRADED") {
    return {
      label: "Accepted",
      className: "graded",
      Icon: CheckCircle,
    };
  }

  if (status === "REJECTED") {
    return {
      label: "Rejected",
      className: "rejected",
      Icon: XCircle,
    };
  }

  return {
    label: "Awaiting Review",
    className: "submitted",
    Icon: Clock,
  };
};

function AssignmentSubmission() {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedAssignment, setSelectedAssignment] =
    useState(null);
  const [selectedSubmission, setSelectedSubmission] =
    useState(null);

  const [loadingAssignments, setLoadingAssignments] =
    useState(true);
  const [loadingSubmissions, setLoadingSubmissions] =
    useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [draft, setDraft] = useState({
    marks: "",
    feedback: "",
  });

  const [savingDecision, setSavingDecision] = useState("");
  const [message, setMessage] = useState(null);
  const [modalMessage, setModalMessage] = useState(null);

  const requestId = useRef(0);
  const savingRef = useRef(false);
  const closeButtonRef = useRef(null);
  const openerRef = useRef(null);

  const saving = Boolean(savingDecision);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await api.get("/assignments");

        if (active) {
          setAssignments(getList(response));
        }
      } catch (error) {
        if (active) {
          setMessage({
            type: "error",
            text:
              error.response?.data?.message ||
              "Unable to load assignments.",
          });
        }
      } finally {
        if (active) setLoadingAssignments(false);
      }
    };

    load();

    return () => {
      active = false;
      requestId.current += 1;
    };
  }, []);

  const modalOpen = Boolean(selectedSubmission);

  useEffect(() => {
    if (!modalOpen) return;

    closeButtonRef.current?.focus();

    return () => {
      openerRef.current?.focus();
    };
  }, [modalOpen]);

  const selectAssignment = async (assignment) => {
    const currentRequest = ++requestId.current;

    setSelectedAssignment(assignment);
    setSelectedSubmission(null);
    setSubmissions([]);
    setMessage(null);
    setLoadingSubmissions(true);

    try {
      const response = await api.get(
        `/assignments/${assignment.id}/submissions`
      );

      if (currentRequest === requestId.current) {
        setSubmissions(getList(response));
      }
    } catch (error) {
      if (currentRequest === requestId.current) {
        setMessage({
          type: "error",
          text:
            error.response?.data?.message ||
            "Unable to load submissions.",
        });
      }
    } finally {
      if (currentRequest === requestId.current) {
        setLoadingSubmissions(false);
      }
    }
  };

  const refresh = async () => {
    if (refreshing || savingRef.current) return;

    const currentRequest = ++requestId.current;
    const assignmentId = selectedAssignment?.id;

    setRefreshing(true);
    setMessage(null);

    if (assignmentId) setLoadingSubmissions(true);

    try {
      const [assignmentResponse, submissionResponse] =
        await Promise.all([
          api.get("/assignments", {
            params: { _refresh: Date.now() },
          }),
          assignmentId
            ? api.get(
                `/assignments/${assignmentId}/submissions`,
                { params: { _refresh: Date.now() } }
              )
            : Promise.resolve(null),
        ]);

      if (currentRequest !== requestId.current) return;

      const freshAssignments = getList(assignmentResponse);
      setAssignments(freshAssignments);

      if (assignmentId) {
        const freshAssignment = freshAssignments.find(
          (item) => Number(item.id) === Number(assignmentId)
        );

        setSelectedAssignment(freshAssignment || null);
        setSubmissions(
          freshAssignment ? getList(submissionResponse) : []
        );
      }
    } catch (error) {
      if (currentRequest === requestId.current) {
        setMessage({
          type: "error",
          text:
            error.response?.data?.message ||
            "Unable to refresh submissions.",
        });
      }
    } finally {
      if (currentRequest === requestId.current) {
        setLoadingSubmissions(false);
      }

      setRefreshing(false);
    }
  };

  const openReview = (submission, event) => {
    openerRef.current = event.currentTarget;
    setSelectedSubmission(submission);
    setDraft({
      marks: submission.marks ?? "",
      feedback: submission.feedback || "",
    });
    setModalMessage(null);
  };

  const closeReview = () => {
    if (savingRef.current) return;

    setSelectedSubmission(null);
    setModalMessage(null);
    setDraft({ marks: "", feedback: "" });
  };

  const handleModalKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeReview();
    }

    if (event.key !== "Tab") return;

    const items = Array.from(
      event.currentTarget.querySelectorAll(
        'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled)'
      )
    );

    if (!items.length) return;

    const first = items[0];
    const last = items[items.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      document.activeElement === last
    ) {
      event.preventDefault();
      first.focus();
    }
  };

  const reviewSubmission = async (decision) => {
    if (
      savingRef.current ||
      !selectedAssignment ||
      !selectedSubmission
    ) {
      return;
    }

    const feedback = draft.feedback.trim();
    const marks = Number(draft.marks);

    if (decision === "ACCEPT") {
      if (
        String(draft.marks).trim() === "" ||
        !Number.isFinite(marks) ||
        marks < 0 ||
        marks > Number(selectedAssignment.totalMarks)
      ) {
        setModalMessage({
          type: "error",
          text:
            `Enter marks between 0 and ` +
            `${selectedAssignment.totalMarks} before accepting.`,
        });
        return;
      }
    }

    if (decision === "REJECT" && !feedback) {
      setModalMessage({
        type: "error",
        text: "Enter feedback explaining what the student should correct.",
      });
      return;
    }

    savingRef.current = true;
    setSavingDecision(decision);
    setModalMessage(null);

    try {
      const response = await api.put(
        `/assignments/submissions/${selectedSubmission.id}/grade`,
        {
          decision,
          marks: decision === "ACCEPT" ? marks : null,
          feedback,
          submittedAt: selectedSubmission.submittedAt,
          previousStatus: selectedSubmission.status,
        }
      );

      if (!response.data?.success || !response.data?.data) {
        throw new Error(
          response.data?.message || "Unable to save the review."
        );
      }

      const updated = response.data.data;

      setSubmissions((current) =>
        current.map((item) =>
          Number(item.id) === Number(updated.id)
            ? updated
            : item
        )
      );

      setSelectedSubmission(updated);
      setDraft({
        marks: updated.marks ?? "",
        feedback: updated.feedback || "",
      });

      const successMessage = {
        type: "success",
        text: response.data.message,
      };

      setModalMessage(successMessage);
      setMessage(successMessage);
    } catch (error) {
      setModalMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          error.message ||
          "Unable to save the review.",
      });
    } finally {
      savingRef.current = false;
      setSavingDecision("");
    }
  };

  const filteredAssignments = assignments.filter((item) => {
    const search = searchTerm.trim().toLowerCase();

    return (
      String(item.title || "").toLowerCase().includes(search) ||
      String(item.course?.title || "")
        .toLowerCase()
        .includes(search)
    );
  });

  return (
    <div className="mentor-assignment-submissions">
      <div className="assignment-submission-header">
        <div className="assignment-submission-title">
          <CheckCircle />
          <div>
            <h1>Assignment Submission</h1>
            <p>
              Review student work, accept or reject submissions,
              and provide marks and feedback.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="assignment-refresh-btn"
          onClick={refresh}
          disabled={refreshing || loadingAssignments}
          aria-label="Refresh assignments and submissions"
          title="Refresh"
        >
          <RefreshCw
            size={17}
            className={
              refreshing ? "assignment-refresh-spinning" : ""
            }
          />
        </button>
      </div>

      <div className="submission-search">
        <Search size={18} />
        <input
          type="search"
          aria-label="Search assignments or courses"
          placeholder="Search assignments or courses..."
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(event.target.value)
          }
        />
      </div>

      {message?.text && (
        <div
          className={`submission-message ${message.type}`}
          role={message.type === "error" ? "alert" : "status"}
        >
          {message.text}
        </div>
      )}

      <div className="assignment-submission-layout">
        <div className="assignment-list-panel">
          <div className="panel-title">
            <h2>Assignments</h2>
            <span>
              {filteredAssignments.length} assignment
              {filteredAssignments.length === 1 ? "" : "s"}
            </span>
          </div>

          {loadingAssignments ? (
            <div className="submission-loading">
              Loading assignments...
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="submission-empty">
              <FileText size={35} />
              <h3>No assignments found</h3>
              <p>Create an assignment or change your search.</p>
            </div>
          ) : (
            <div className="assignment-selection-list">
              {filteredAssignments.map((assignment) => (
                <button
                  key={assignment.id}
                  type="button"
                  disabled={refreshing}
                  aria-pressed={
                    selectedAssignment?.id === assignment.id
                  }
                  className={`assignment-selection-card ${
                    selectedAssignment?.id === assignment.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => selectAssignment(assignment)}
                >
                  <div className="assignment-card-icon">
                    <FileText size={20} />
                  </div>

                  <div className="assignment-card-content">
                    <h3>{assignment.title}</h3>
                    <p>{assignment.course?.title || "Course"}</p>
                    <div className="assignment-card-meta">
                      <span>{assignment.totalMarks} marks</span>
                    </div>
                  </div>

                  <div className="assignment-submission-count">
                    {selectedAssignment?.id === assignment.id &&
                    !loadingSubmissions
                      ? submissions.length
                      : assignment.submissions?.length || 0}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="student-submissions-panel">
          {!selectedAssignment ? (
            <div className="select-assignment-placeholder">
              <FileText size={48} />
              <h2>Select an Assignment</h2>
              <p>
                Select an assignment from the left to review
                student submissions.
              </p>
            </div>
          ) : (
            <>
              <div className="submissions-panel-header">
                <div>
                  <h2>{selectedAssignment.title}</h2>
                  <p>
                    {selectedAssignment.course?.title || "Course"}
                    {" • "}
                    {selectedAssignment.totalMarks} marks
                  </p>
                </div>

                <div className="submission-total">
                  {loadingSubmissions
                    ? "..."
                    : `${submissions.length} submitted`}
                </div>
              </div>

              {loadingSubmissions ? (
                <div className="submission-loading">
                  Loading student submissions...
                </div>
              ) : submissions.length === 0 ? (
                <div className="submission-empty">
                  <Clock size={40} />
                  <h3>No submissions yet</h3>
                  <p>Student submissions will appear here.</p>
                </div>
              ) : (
                <div className="student-submission-list">
                  {submissions.map((submission) => {
                    const status = getStatus(submission);
                    const StatusIcon = status.Icon;
                    const student = submission.student;

                    return (
                      <div
                        key={submission.id}
                        className="student-submission-card"
                      >
                        <div className="student-submission-top">
                          <div className="student-information">
                            <div className="student-avatar">
                              {(student?.name || "S")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div>
                              <h3>{student?.name || "Student"}</h3>
                              <p>{student?.email || "—"}</p>
                            </div>
                          </div>

                          <div
                            className={`submission-status ${status.className}`}
                          >
                            <StatusIcon size={15} />
                            {status.label}
                          </div>
                        </div>

                        <div className="submission-information">
                          <div className="submission-info-item">
                            <span>Submitted</span>
                            <strong>
                              {formatDateTime(submission.submittedAt)}
                            </strong>
                          </div>
                          <div className="submission-info-item">
                            <span>Marks</span>
                            <strong>
                              {submission.marks !== null &&
                              submission.marks !== undefined
                              ? `${submission.marks} / ${selectedAssignment.totalMarks}`
                              : "Not graded"}
                            </strong>
                          </div>
                          <div className="submission-info-item">
                            <span>Status</span>
                            <strong>{status.label}</strong>
                          </div>
                        </div>

                        {submission.submissionText && (
                          <div className="submission-note">
                            <span>Student Note</span>
                            <p>{submission.submissionText}</p>
                          </div>
                        )}

                        {submission.feedback && (
                          <div className="submission-note">
                            <span>Mentor Feedback</span>
                            <p>{submission.feedback}</p>
                          </div>
                        )}

                        <div className="submission-actions">
                          {submission.attachment ? (
                            <a
                              href={fileUrl(submission.attachment)}
                              target="_blank"
                              rel="noreferrer"
                              className="download-submission-btn"
                            >
                              <Download size={16} />
                              Download Submission
                            </a>
                          ) : (
                            <span className="no-file">
                              No file attached
                            </span>
                          )}

                          <button
                            type="button"
                            className="review-submission-btn"
                            onClick={(event) =>
                              openReview(submission, event)
                            }
                          >
                            <Award size={16} />
                            Review Submission
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedSubmission && selectedAssignment && (
        <div
          className="submission-modal-overlay"
          onClick={closeReview}
        >
          <div
            className="submission-review-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="submission-review-title"
            aria-busy={saving}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={handleModalKeyDown}
          >
            <div className="submission-modal-header">
              <div>
                <h2 id="submission-review-title">
                  Review Submission
                </h2>
                <p>{selectedAssignment.title}</p>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                className="submission-modal-close"
                onClick={closeReview}
                disabled={saving}
                aria-label="Close review"
              >
                <X size={20} />
              </button>
            </div>

            <div className="review-student">
              <div className="review-student-avatar">
                {(selectedSubmission.student?.name || "S")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div>
                <h3>
                  {selectedSubmission.student?.name || "Student"}
                </h3>
                <p>{selectedSubmission.student?.email || ""}</p>
              </div>
            </div>

            <div className="review-section">
              <h3>Submission</h3>
              <div className="review-file">
                <FileText size={25} />
                <div>
                  <strong>Student Assignment</strong>
                  <p>
                    Submitted on{" "}
                    {formatDateTime(selectedSubmission.submittedAt)}
                  </p>
                </div>
                {selectedSubmission.attachment && (
                  <a
                    href={fileUrl(selectedSubmission.attachment)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Download size={16} />
                    Download
                  </a>
                )}
              </div>
            </div>

            {selectedSubmission.submissionText && (
              <div className="review-section">
                <h3>Student Note</h3>
                <div className="student-note-box">
                  {selectedSubmission.submissionText}
                </div>
              </div>
            )}

            <div className="review-section">
              <h3>
                Review — {getStatus(selectedSubmission).label}
              </h3>

              <div className="grade-form">
                <div>
                  <label htmlFor="submission-marks">
                    Marks — required to accept
                  </label>
                  <div className="marks-input-wrapper">
                    <input
                      id="submission-marks"
                      type="number"
                      min="0"
                      max={selectedAssignment.totalMarks}
                      step="any"
                      value={draft.marks}
                      disabled={saving}
                      placeholder="Enter marks"
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          marks: event.target.value,
                        }))
                      }
                    />
                    <span>/ {selectedAssignment.totalMarks}</span>
                  </div>
                </div>

                <div className="feedback-field">
                  <label htmlFor="submission-feedback">
                    Feedback — required to reject
                  </label>
                  <textarea
                    id="submission-feedback"
                    rows={4}
                    value={draft.feedback}
                    disabled={saving}
                    placeholder="Explain what was done well or what needs correction..."
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        feedback: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {modalMessage?.text && (
              <div
                className={`submission-message ${modalMessage.type}`}
                role={
                  modalMessage.type === "error" ? "alert" : "status"
                }
              >
                {modalMessage.text}
              </div>
            )}

            <div className="review-modal-actions">
              <button
                type="button"
                className="cancel-review-btn"
                onClick={closeReview}
                disabled={saving}
              >
                Close
              </button>

              <button
                type="button"
                className="reject-submission-btn"
                disabled={saving}
                onClick={() => reviewSubmission("REJECT")}
              >
                {savingDecision === "REJECT" ? (
                  <Loader2
                    size={16}
                    className="assignment-refresh-spinning"
                  />
                ) : (
                  <XCircle size={16} />
                )}
                {savingDecision === "REJECT"
                  ? "Rejecting..."
                  : "Reject"}
              </button>

              <button
                type="button"
                className="accept-submission-btn"
                disabled={saving}
                onClick={() => reviewSubmission("ACCEPT")}
              >
                {savingDecision === "ACCEPT" ? (
                  <Loader2
                    size={16}
                    className="assignment-refresh-spinning"
                  />
                ) : (
                  <CheckCircle size={16} />
                )}
                {savingDecision === "ACCEPT"
                  ? "Accepting..."
                  : "Accept"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssignmentSubmission;