import { useEffect, useState } from "react";
import {
  FileText,
  Download,
  CheckCircle,
  Clock,
  Award,
  Search,
  X,
} from "lucide-react";
import api from "../../services/api";
import "./AssignmentSubmission.css";
import "./MentorShared.css";

/* =========================================================
   FILE URL
========================================================= */

const fileUrl = (path) => {
  if (!path) return "";

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const base = (api.defaults?.baseURL || "http://localhost:5000/api")
    .replace(/\/$/, "")
    .replace(/\/api$/, "");

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

/* =========================================================
   COMPONENT
========================================================= */

function AssignmentSubmission() {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [gradeDraft, setGradeDraft] = useState({
    marks: "",
    feedback: "",
  });

  const [grading, setGrading] = useState(false);
  const [message, setMessage] = useState(null);

  /* =========================================================
     FETCH ASSIGNMENTS
  ========================================================= */

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoadingAssignments(true);

      const res = await api.get("/assignments");

      setAssignments(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  };

  /* =========================================================
     FETCH SUBMISSIONS FOR ASSIGNMENT
  ========================================================= */

  const fetchSubmissions = async (assignment) => {
    try {
      setSelectedAssignment(assignment);
      setSelectedSubmission(null);
      setMessage(null);
      setLoadingSubmissions(true);

      const res = await api.get(
        `/assignments/${assignment.id}/submissions`
      );

      setSubmissions(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching submissions:", err);

      setSubmissions([]);

      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          "Unable to load assignment submissions.",
      });
    } finally {
      setLoadingSubmissions(false);
    }
  };

  /* =========================================================
     OPEN STUDENT SUBMISSION
  ========================================================= */

  const openSubmission = (submission) => {
    setSelectedSubmission(submission);

    setGradeDraft({
      marks:
        submission.marks !== null && submission.marks !== undefined
          ? submission.marks
          : "",
      feedback: submission.feedback || "",
    });

    setMessage(null);
  };

  /* =========================================================
     CLOSE SUBMISSION
  ========================================================= */

  const closeSubmission = () => {
    setSelectedSubmission(null);

    setGradeDraft({
      marks: "",
      feedback: "",
    });

    setMessage(null);
  };

  /* =========================================================
     GRADE SUBMISSION
  ========================================================= */

  const saveGrade = async () => {
    if (!selectedSubmission || !selectedAssignment) {
      return;
    }

    if (
      gradeDraft.marks === "" ||
      gradeDraft.marks === null ||
      gradeDraft.marks === undefined
    ) {
      setMessage({
        type: "error",
        text: "Please enter marks before saving.",
      });

      return;
    }

    const marks = Number(gradeDraft.marks);

    if (Number.isNaN(marks) || marks < 0) {
      setMessage({
        type: "error",
        text: "Marks must be zero or greater.",
      });

      return;
    }

    if (
      selectedAssignment.totalMarks &&
      marks > Number(selectedAssignment.totalMarks)
    ) {
      setMessage({
        type: "error",
        text: `Marks cannot exceed ${selectedAssignment.totalMarks}.`,
      });

      return;
    }

    try {
      setGrading(true);
      setMessage(null);

      await api.put(
        `/assignments/submissions/${selectedSubmission.id}/grade`,
        {
          marks,
          feedback: gradeDraft.feedback || "",
        }
      );

      setMessage({
        type: "success",
        text: "Submission graded successfully.",
      });

      /*
       * Refresh submissions so the new marks/status appear immediately.
       */
      const res = await api.get(
        `/assignments/${selectedAssignment.id}/submissions`
      );

      const updatedSubmissions = res.data?.data || [];

      setSubmissions(updatedSubmissions);

      const updatedSubmission = updatedSubmissions.find(
        (item) => item.id === selectedSubmission.id
      );

      if (updatedSubmission) {
        setSelectedSubmission(updatedSubmission);

        setGradeDraft({
          marks: updatedSubmission.marks ?? "",
          feedback: updatedSubmission.feedback || "",
        });
      }
    } catch (err) {
      console.error("Error grading submission:", err);

      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          "Unable to save the grade.",
      });
    } finally {
      setGrading(false);
    }
  };

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatDate = (date) => {
    if (!date) return "—";

    const d = new Date(date);

    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "—";

    const d = new Date(date);

    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* =========================================================
     FILTER ASSIGNMENTS
  ========================================================= */

  const filteredAssignments = assignments.filter((assignment) => {
    const search = searchTerm.toLowerCase();

    return (
      assignment.title?.toLowerCase().includes(search) ||
      assignment.course?.title?.toLowerCase().includes(search)
    );
  });

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="mentor-assignment-submissions">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="assignment-submission-header">
        <div><h1>
       <CheckCircle size={24} /> Assignment Submission</h1>

          <p>
            Review student submissions, download assignments,
            and provide marks and feedback.
          </p>
        </div>
      </div>

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <div className="submission-search">
        <Search size={18} />

        <input
          type="text"
          placeholder="Search assignments or courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="assignment-submission-layout">

        {/* ===================================================
            ASSIGNMENT LIST
        =================================================== */}

        <div className="assignment-list-panel">

          <div className="panel-title">
            <div>
              <h2>Assignments</h2>
              <span>
                {filteredAssignments.length} assignment
                {filteredAssignments.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {loadingAssignments ? (
            <div className="submission-loading">
              Loading assignments...
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="submission-empty">
              <FileText size={35} />

              <h3>No assignments found</h3>

              <p>
                Create an assignment first to receive student
                submissions.
              </p>
            </div>
          ) : (
            <div className="assignment-selection-list">
              {filteredAssignments.map((assignment) => (
                <button
                  key={assignment.id}
                  type="button"
                  className={`assignment-selection-card ${
                    selectedAssignment?.id === assignment.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => fetchSubmissions(assignment)}
                >
                  <div className="assignment-card-icon">
                    <FileText size={20} />
                  </div>

                  <div className="assignment-card-content">
                    <h3>{assignment.title}</h3>

                    <p>
                      {assignment.course?.title || "Course"}
                    </p>

                    <div className="assignment-card-meta">
                      <span>
                        Due: {formatDate(assignment.dueDate)}
                      </span>

                      <span>
                        {assignment.totalMarks} marks
                      </span>
                    </div>
                  </div>

                  <div className="assignment-submission-count">
                    {assignment.submissions?.length || 0}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ===================================================
            SUBMISSION LIST
        =================================================== */}

        <div className="student-submissions-panel">

          {!selectedAssignment ? (
            <div className="select-assignment-placeholder">
              <FileText size={48} />

              <h2>Select an Assignment</h2>

              <p>
                Select an assignment from the left to view the
                students who submitted their work.
              </p>
            </div>
          ) : (
            <>
              <div className="submissions-panel-header">

                <div>
                  <h2>{selectedAssignment.title}</h2>

                  <p>
                    {selectedAssignment.course?.title ||
                      "Course"}{" "}
                    • {selectedAssignment.totalMarks} marks
                  </p>
                </div>

                <div className="submission-total">
                  {loadingSubmissions
                    ? "..."
                    : `${submissions.length} submitted`}
                </div>

              </div>

              {message?.text && (
                <div
                  className={`submission-message ${message.type}`}
                >
                  {message.text}
                </div>
              )}

              {loadingSubmissions ? (
                <div className="submission-loading">
                  Loading student submissions...
                </div>
              ) : submissions.length === 0 ? (
                <div className="submission-empty">

                  <Clock size={40} />

                  <h3>No submissions yet</h3>

                  <p>
                    No students have submitted this assignment
                    yet.
                  </p>

                </div>
              ) : (
                <div className="student-submission-list">

                  {submissions.map((submission) => {

                    const isGraded =
                      String(submission.status || "")
                        .toUpperCase() === "GRADED";

                    return (
                      <div
                        key={submission.id}
                        className="student-submission-card"
                      >

                        {/* STUDENT INFORMATION */}

                        <div className="student-submission-top">

                          <div className="student-information">

                            <div className="student-avatar">
                              {(
                                submission.student?.name ||
                                "S"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <h3>
                                {submission.student?.name ||
                                  "Student"}
                              </h3>

                              <p>
                                {submission.student?.email ||
                                  "No email available"}
                              </p>
                            </div>

                          </div>

                          <div
                            className={`submission-status ${
                              isGraded
                                ? "graded"
                                : "submitted"
                            }`}
                          >
                            {isGraded ? (
                              <>
                                <CheckCircle size={15} />
                                Graded
                              </>
                            ) : (
                              <>
                                <Clock size={15} />
                                Awaiting Review
                              </>
                            )}
                          </div>

                        </div>

                        {/* SUBMISSION DETAILS */}

                        <div className="submission-information">

                          <div className="submission-info-item">
                            <span>Submitted</span>

                            <strong>
                              {formatDateTime(
                                submission.submittedAt
                              )}
                            </strong>
                          </div>

                          <div className="submission-info-item">
                            <span>Marks</span>

                            <strong>
                              {isGraded
                                ? `${submission.marks ?? 0} / ${
                                    selectedAssignment.totalMarks
                                  }`
                                : "Not graded"}
                            </strong>
                          </div>

                          <div className="submission-info-item">
                            <span>Status</span>

                            <strong>
                              {submission.status || "SUBMITTED"}
                            </strong>
                          </div>

                        </div>

                        {/* NOTE */}

                        {submission.submissionText && (
                          <div className="submission-note">

                            <span>Student Note</span>

                            <p>
                              {submission.submissionText}
                            </p>

                          </div>
                        )}

                        {/* ACTIONS */}

                        <div className="submission-actions">

                          {submission.attachment ? (
                            <a
                              href={fileUrl(
                                submission.attachment
                              )}
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
                            onClick={() =>
                              openSubmission(submission)
                            }
                          >
                            <Award size={16} />

                            {isGraded
                              ? "Review Grade"
                              : "Review Submission"}
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

      {/* =====================================================
          REVIEW / GRADE MODAL
      ===================================================== */}

      {selectedSubmission && selectedAssignment && (
        <div
          className="submission-modal-overlay"
          onClick={closeSubmission}
        >
          <div
            className="submission-review-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="submission-modal-header">

              <div>
                <h2>Review Submission</h2>

                <p>
                  {selectedAssignment.title}
                </p>
              </div>

              <button
                type="button"
                className="submission-modal-close"
                onClick={closeSubmission}
              >
                <X size={20} />
              </button>

            </div>

            {/* STUDENT */}

            <div className="review-student">

              <div className="review-student-avatar">
                {(
                  selectedSubmission.student?.name ||
                  "S"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <h3>
                  {selectedSubmission.student?.name ||
                    "Student"}
                </h3>

                <p>
                  {selectedSubmission.student?.email || ""}
                </p>
              </div>

            </div>

            {/* SUBMISSION */}

            <div className="review-section">

              <h3>Submission</h3>

              <div className="review-file">

                {selectedSubmission.attachment ? (
                  <>
                    <FileText size={25} />

                    <div>
                      <strong>
                        Student Assignment
                      </strong>

                      <p>
                        Submitted on{" "}
                        {formatDateTime(
                          selectedSubmission.submittedAt
                        )}
                      </p>
                    </div>

                    <a
                      href={fileUrl(
                        selectedSubmission.attachment
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Download size={16} />
                      Download
                    </a>
                  </>
                ) : (
                  <p>No file was attached.</p>
                )}

              </div>

            </div>

            {/* STUDENT NOTE */}

            {selectedSubmission.submissionText && (
              <div className="review-section">

                <h3>Student Note</h3>

                <div className="student-note-box">
                  {selectedSubmission.submissionText}
                </div>

              </div>
            )}

            {/* GRADING */}

            <div className="review-section">

              <h3>Grade Submission</h3>

              <div className="grade-form">

                <div className="marks-field">

                  <label>
                    Marks
                  </label>

                  <div className="marks-input-wrapper">

                    <input
                      type="number"
                      min="0"
                      max={selectedAssignment.totalMarks}
                      value={gradeDraft.marks}
                      onChange={(e) =>
                        setGradeDraft({
                          ...gradeDraft,
                          marks: e.target.value,
                        })
                      }
                      placeholder="Enter marks"
                    />

                    <span>
                      / {selectedAssignment.totalMarks}
                    </span>

                  </div>

                </div>

                <div className="feedback-field">

                  <label>
                    Feedback
                  </label>

                  <textarea
                    rows="4"
                    placeholder="Write feedback for the student..."
                    value={gradeDraft.feedback}
                    onChange={(e) =>
                      setGradeDraft({
                        ...gradeDraft,
                        feedback: e.target.value,
                      })
                    }
                  />

                </div>

              </div>

            </div>

            {/* MODAL ACTIONS */}

            <div className="review-modal-actions">

              <button
                type="button"
                className="cancel-review-btn"
                onClick={closeSubmission}
              >
                Cancel
              </button>

              <button
                type="button"
                className="save-grade-btn"
                onClick={saveGrade}
                disabled={grading}
              >
                {grading
                  ? "Saving..."
                  : String(
                      selectedSubmission.status || ""
                    ).toUpperCase() === "GRADED"
                  ? "Update Grade"
                  : "Save Grade"}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default AssignmentSubmission;