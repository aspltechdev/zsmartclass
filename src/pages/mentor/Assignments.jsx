// src/pages/mentor/Assignments.jsx

import { useEffect, useState } from "react";
import { Plus, Eye, X, Edit, Trash2, Download } from "lucide-react";
import api from "../../services/api";
import "./Assignments.css";
import "./MentorShared.css";

/* Uploaded files are served from the server root (…/uploads/…), while the API
   base URL ends with /api. Strip it so submission links resolve. */
const fileUrl = (p) => {
  if (!p) return "";
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  const base = (api.defaults?.baseURL || "http://localhost:5000/api")
    .replace(/\/$/, "")
    .replace(/\/api$/, "");
  return `${base}${p.startsWith("/") ? p : `/${p}`}`;
};

function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Submissions + grading for the currently-viewed assignment
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [gradeDrafts, setGradeDrafts] = useState({}); // { [submissionId]: { marks, feedback } }
  const [gradingId, setGradingId] = useState(null);
  const [subMsg, setSubMsg] = useState(null); // { type, text }

  const [formData, setFormData] = useState({
    courseId: "",
    title: "",
    description: "",
    dueDate: "",
    totalMarks: "",
  });

  useEffect(() => {
    fetchAssignments();
    fetchCourses();
  }, []);

  // ===========================
  // Fetch Assignments
  // ===========================
  const fetchAssignments = async () => {
    try {
      const res = await api.get("/assignments");
      setAssignments(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setAssignments([]);
    }
  };

  // ===========================
  // Fetch Courses
  // ===========================
  const fetchCourses = async () => {
    try {
      const res = await api.get("/courses");
      setCourses(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setCourses([]);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ===========================
  // Add Assignment
  // ===========================
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/assignments", formData);
      fetchAssignments();
      setShowModal(false);
      setFormData({
        courseId: "",
        title: "",
        description: "",
        dueDate: "",
        totalMarks: "",
      });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Unable to create assignment.");
    }
  };

  // ===========================
  // Delete Assignment
  // ===========================
  const deleteAssignment = async (id) => {
    try {
      await api.delete(`/assignments/${id}`);
      fetchAssignments();
      setShowDeleteModal(false);
      setShowViewModal(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Unable to delete assignment.");
    }
  };

  // ===========================
  // Update Assignment
  // ===========================
  const updateAssignment = async () => {
    try {
      await api.put(`/assignments/${selectedAssignment.id}`, {
        title: selectedAssignment.title,
        description: selectedAssignment.description,
        dueDate: selectedAssignment.dueDate,
        totalMarks: selectedAssignment.totalMarks,
        courseId: selectedAssignment.courseId,
      });
      fetchAssignments();
      setIsEditing(false);
      setShowViewModal(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Unable to update assignment.");
    }
  };

  // ===========================
  // Submissions + grading
  // ===========================
  const openView = (assignment) => {
    setSelectedAssignment(assignment);
    setIsEditing(false);
    setShowViewModal(true);
    setGradeDrafts({});
    setSubMsg(null);
    fetchSubmissions(assignment.id);
  };

  const fetchSubmissions = async (assignmentId) => {
    try {
      setLoadingSubs(true);
      const res = await api.get(`/assignments/${assignmentId}/submissions`);
      setSubmissions(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setSubmissions([]);
    } finally {
      setLoadingSubs(false);
    }
  };

  const setGradeDraft = (id, patch) =>
    setGradeDrafts((d) => ({ ...d, [id]: { ...(d[id] || {}), ...patch } }));

  const saveGrade = async (submission) => {
    const draft = gradeDrafts[submission.id] || {};
    const marks = draft.marks ?? submission.marks;

    if (marks === "" || marks === null || marks === undefined) {
      setSubMsg({ type: "error", text: "Enter a mark before saving." });
      return;
    }

    try {
      setGradingId(submission.id);
      setSubMsg(null);
      await api.put(`/assignments/submissions/${submission.id}/grade`, {
        marks: Number(marks),
        feedback: (draft.feedback ?? submission.feedback) || "",
      });
      setSubMsg({
        type: "success",
        text: `Saved grade for ${submission.student?.name || "student"}.`,
      });
      await fetchSubmissions(selectedAssignment.id);
      fetchAssignments();
    } catch (err) {
      setSubMsg({
        type: "error",
        text: err.response?.data?.message || "Could not save the grade.",
      });
    } finally {
      setGradingId(null);
    }
  };

  // ===========================
  // Format Date
  // ===========================
  const formatDate = (date) => {
    if (!date) return "—";
    const d = new Date(date);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ===========================
  // JSX
  // ===========================
  return (
    <div className="mentor-assignments">
      <div className="assignment-header">
        <div>
          <h1>Assignments</h1>
          <p>Create and manage course assignments.</p>
        </div>

        <button className="add-btn" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Add Assignment
        </button>
      </div>

      <div className="assignment-table">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Course</th>
              <th>Due Date</th>
              <th>Total Marks</th>
              <th>Submissions</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {assignments.length === 0 ? (
              <tr>
                <td colSpan="6">No Assignments Found.</td>
              </tr>
            ) : (
              assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td>{assignment.title}</td>
                  <td>{assignment.course?.title || "—"}</td>
                  <td>{formatDate(assignment.dueDate)}</td>
                  <td>{assignment.totalMarks}</td>
                  <td>{assignment.submissions?.length || 0}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="view-btn"
                        title="View Assignment"
                        onClick={() => openView(assignment)}
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===============================
          Add Assignment Popup
      ================================ */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="assignment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Assignment</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>Course</label>
              <select
                name="courseId"
                value={formData.courseId}
                onChange={handleChange}
                required
              >
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>

              <label>Assignment Title</label>
              <input
                type="text"
                name="title"
                placeholder="Enter assignment title"
                value={formData.title}
                onChange={handleChange}
                required
              />

              <label>Assignment Description</label>
              <textarea
                rows="5"
                name="description"
                placeholder="Enter assignment description"
                value={formData.description}
                onChange={handleChange}
                required
              />

              <div className="row">
                <div>
                  <label>Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label>Total Marks</label>
                  <div className="marks-counter">
                    <button
                      type="button"
                      className="marks-btn"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          totalMarks: Math.max(
                            1,
                            Number(prev.totalMarks || 1) - 1
                          ),
                        }))
                      }
                    >
                      −
                    </button>

                    <input
                      type="number"
                      name="totalMarks"
                      value={formData.totalMarks}
                      onChange={handleChange}
                      min="1"
                      required
                    />

                    <button
                      type="button"
                      className="marks-btn"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          totalMarks: Number(prev.totalMarks || 0) + 1,
                        }))
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <button className="submit-btn">Create Assignment</button>
            </form>
          </div>
        </div>
      )}

      {/* ===============================
          View / Edit Assignment Popup
      ================================ */}
      {showViewModal && selectedAssignment && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowViewModal(false);
            setIsEditing(false);
          }}
        >
          <div className="assignment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditing ? "Edit Assignment" : "Assignment Details"}</h2>
              <button
                className="close-btn"
                type="button"
                onClick={() => {
                  setShowViewModal(false);
                  setIsEditing(false);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="assignment-view">
              <label>Course</label>
              <input
                type="text"
                disabled
                value={selectedAssignment.course?.title || "—"}
              />

              <label>Assignment Title</label>
              <input
                type="text"
                disabled={!isEditing}
                value={selectedAssignment.title}
                onChange={(e) =>
                  setSelectedAssignment({
                    ...selectedAssignment,
                    title: e.target.value,
                  })
                }
              />

              <label>Description</label>
              <textarea
                rows="5"
                disabled={!isEditing}
                value={selectedAssignment.description}
                onChange={(e) =>
                  setSelectedAssignment({
                    ...selectedAssignment,
                    description: e.target.value,
                  })
                }
              />

              <div className="row">
                <div>
                  <label>Due Date</label>
                  <input
                    type="date"
                    disabled={!isEditing}
                    value={
                      selectedAssignment.dueDate
                        ? String(selectedAssignment.dueDate).split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setSelectedAssignment({
                        ...selectedAssignment,
                        dueDate: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label>Total Marks</label>
                  <input
                    type="number"
                    disabled={!isEditing}
                    value={selectedAssignment.totalMarks}
                    onChange={(e) =>
                      setSelectedAssignment({
                        ...selectedAssignment,
                        totalMarks: e.target.value,
                      })
                    }
                    min="1"
                  />
                </div>
              </div>

              <label>Submissions</label>
              {!isEditing && (
                <div className="submissions-panel">
                  {loadingSubs ? (
                    <div className="submissions-loading">
                      Loading submissions…
                    </div>
                  ) : submissions.length === 0 ? (
                    <div className="submissions-empty">
                      No students have submitted this assignment yet.
                    </div>
                  ) : (
                    <div className="submissions-list">
                      {submissions.map((s) => {
                        const draft = gradeDrafts[s.id] || {};
                        const graded =
                          (s.status || "").toUpperCase() === "GRADED";
                        return (
                          <div key={s.id} className="submission-row">
                            <div className="submission-row-head">
                              <div className="submission-student">
                                <strong>
                                  {s.student?.name || "Student"}
                                </strong>
                                <span>{s.student?.email || ""}</span>
                              </div>
                              <span
                                className={`submission-tag ${
                                  graded ? "graded" : "pending"
                                }`}
                              >
                                {graded
                                  ? `Graded · ${s.marks ?? 0}/${
                                      selectedAssignment.totalMarks ?? 0
                                    }`
                                  : "Awaiting grade"}
                              </span>
                            </div>

                            {s.attachment ? (
                              <a
                                className="submission-download"
                                href={fileUrl(s.attachment)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Download size={14} /> Download file
                              </a>
                            ) : (
                              <span className="submission-nofile">
                                No file attached
                              </span>
                            )}

                            {s.submissionText && (
                              <p className="submission-note-text">
                                “{s.submissionText}”
                              </p>
                            )}

                            <div className="grade-row">
                              <div className="grade-marks">
                                <label>Marks</label>
                                <input
                                  type="number"
                                  min="0"
                                  max={selectedAssignment.totalMarks || undefined}
                                  placeholder={`/ ${
                                    selectedAssignment.totalMarks ?? 0
                                  }`}
                                  value={
                                    draft.marks ??
                                    (s.marks ?? "")
                                  }
                                  onChange={(e) =>
                                    setGradeDraft(s.id, {
                                      marks: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="grade-feedback">
                                <label>Feedback</label>
                                <input
                                  type="text"
                                  placeholder="Optional feedback for the student"
                                  value={
                                    draft.feedback ??
                                    (s.feedback ?? "")
                                  }
                                  onChange={(e) =>
                                    setGradeDraft(s.id, {
                                      feedback: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              className="grade-save-btn"
                              disabled={gradingId === s.id}
                              onClick={() => saveGrade(s)}
                            >
                              {gradingId === s.id
                                ? "Saving…"
                                : graded
                                ? "Update Grade"
                                : "Save Grade"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {subMsg?.text && (
                    <div className={`submissions-msg ${subMsg.type}`}>
                      {subMsg.text}
                    </div>
                  )}
                </div>
              )}

              <div className="popup-buttons">
                {!isEditing ? (
                  <>
                    <button
                      type="button"
                      className="edit-btn"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit size={16} /> Edit
                    </button>

                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => {
                        setShowViewModal(false);
                        setShowDeleteModal(true);
                      }}
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => {
                        setIsEditing(false);
                        const original = assignments.find(
                          (a) => a.id === selectedAssignment.id
                        );
                        if (original) {
                          setSelectedAssignment(original);
                        }
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="save-btn"
                      onClick={updateAssignment}
                    >
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===============================
          Delete Confirmation Popup
      ================================ */}
      {showDeleteModal && selectedAssignment && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="delete-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="delete-confirm-icon">
              <Trash2 size={32} />
            </div>
            <h3>Delete Assignment?</h3>
            <p>
              Are you sure you want to delete <strong>"{selectedAssignment.title}"</strong>?
              <br />
              This action cannot be undone.
            </p>
            <div className="delete-confirm-buttons">
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={() => deleteAssignment(selectedAssignment.id)}
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Assignments;