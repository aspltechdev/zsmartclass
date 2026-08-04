import { useEffect, useState } from "react";
import axios from "axios";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  ClipboardCheck
} from "lucide-react";
import "./Assignments.css";

function MentorAssignments() {
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showView, setShowView] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [submissions, setSubmissions] = useState([]);

  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    assignmentLink: "",
    courseId: "",
    moduleId: "",
    dueDate: "",
    totalMarks: ""
  });

  const [editAssignment, setEditAssignment] = useState({
    id: "",
    title: "",
    description: "",
    assignmentLink: "",
    courseId: "",
    moduleId: "",
    dueDate: "",
    totalMarks: ""
  });

  useEffect(() => {
    fetchAssignments();
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/api/courses",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCourses(res.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchModules = async (courseId) => {
    if (!courseId) {
      setModules([]);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/modules/course/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setModules(res.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/api/assignments",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setAssignments(res.data.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const addAssignment = async () => {
    if (
      !newAssignment.title ||
      !newAssignment.dueDate ||
      !newAssignment.courseId ||
      !newAssignment.totalMarks
    ) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/assignments",
        newAssignment,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      alert("Assignment created successfully.");
      setShowAdd(false);
      setNewAssignment({
        title: "",
        description: "",
        assignmentLink: "",
        courseId: "",
        moduleId: "",
        dueDate: "",
        totalMarks: ""
      });
      fetchAssignments();
    } catch (err) {
      console.log(err);
      alert(
        err.response?.data?.message ||
        "Unable to create assignment."
      );
    }
  };

  const handleView = (assignment) => {
    setSelectedAssignment(assignment);
    setShowView(true);
  };

  const handleEdit = (assignment) => {
    setEditAssignment({
      ...assignment,
      dueDate: assignment.dueDate?.slice(0, 10)
    });
    setShowEdit(true);
  };

  const updateAssignment = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/assignments/${editAssignment.id}`,
        editAssignment,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      alert("Assignment updated successfully.");
      setShowEdit(false);
      fetchAssignments();
    } catch (err) {
      console.log(err);
      alert(
        err.response?.data?.message ||
        "Unable to update assignment."
      );
    }
  };

  const deleteAssignment = async (id) => {
    if (!window.confirm("Delete this assignment?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/assignments/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setShowView(false);
      fetchAssignments();
    } catch (err) {
      console.log(err);
      alert("Unable to delete assignment.");
    }
  };

  const viewSubmissions = async (assignmentId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/submissions/assignment/${assignmentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setSubmissions(res.data.data || []);
      setShowSubmissions(true);
    } catch (err) {
      console.log(err);
      alert("Unable to fetch submissions.");
    }
  };

  const reviewSubmission = async (
    submissionId,
    marks,
    feedback
  ) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/submissions/${submissionId}/review`,
        {
          marks,
          feedback
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      alert("Submission reviewed.");
      if (selectedAssignment) {
        viewSubmissions(selectedAssignment.id);
      }
    } catch (err) {
      console.log(err);
      alert("Unable to review submission.");
    }
  };

  if (loading) return <h2>Loading Assignments...</h2>;

  return (
    <div className="mentor-assignments">
      {/* HEADER */}
      <div className="assignment-header">
        <div>
          <h1>Assignments</h1>
          <p>Create, manage and review course assignments.</p>
        </div>
        <button
          className="add-btn"
          onClick={() => setShowAdd(true)}
        >
          <Plus size={18} />
          Add Assignment
        </button>
      </div>

      {/* TABLE */}
      <div className="assignment-table">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Course</th>
              <th>Module</th>
              <th>Due Date</th>
              <th>Total Marks</th>
              <th>Submissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length > 0 ? (
              assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td>{assignment.title}</td>
                  <td>{assignment.course?.title}</td>
                  <td>{assignment.module?.title || "-"}</td>
                  <td>
                    {new Date(assignment.dueDate).toLocaleDateString()}
                  </td>
                  <td>{assignment.totalMarks}</td>
                <td>
  <div className="submission-progress">

    <div className="progress-bar">
      <div
        className="progress-fill"
        style={{
          width: `${
            assignment.course?.enrollments?.length
              ? (assignment._count.submissions /
                  assignment.course.enrollments.length) *
                100
              : 0
          }%`
        }}
      />
    </div>

    <button
      className="submission-count-btn"
      onClick={() => {
        setSelectedAssignment(assignment);
        viewSubmissions(assignment.id);
      }}
    >
      {assignment._count?.submissions || 0}/
      {assignment.course?.enrollments?.length || 0}
    </button>

  </div>
</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="view-btn"
                        onClick={() => handleView(assignment)}
                      >
                        <Eye size={17} />
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    textAlign: "center",
                    padding: "40px"
                  }}
                >
                  No assignments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ======================================
          VIEW ASSIGNMENT MODAL - WITH EDIT & DELETE
      ====================================== */}
      {showView && selectedAssignment && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Assignment Details</h2>
            
            <div className="view-grid">
              <div>
                <label>Assignment Title</label>
                <p>{selectedAssignment.title}</p>
              </div>
              <div>
                <label>Course</label>
                <p>{selectedAssignment.course?.title}</p>
              </div>
              <div>
                <label>Module</label>
                <p>{selectedAssignment.module?.title || "-"}</p>
              </div>
              <div>
                <label>Total Marks</label>
                <p>{selectedAssignment.totalMarks}</p>
              </div>
              <div>
                <label>Due Date</label>
                <p>
                  {new Date(selectedAssignment.dueDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label>Attachment</label>
                {selectedAssignment.assignmentLink ? (
                  <a
                    className="assignment-link"
                    href={selectedAssignment.assignmentLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    📎 Open Attachment
                  </a>
                ) : (
                  <p className="no-attachment">No attachment</p>
                )}
              </div>
            </div>

            <label>Description</label>
            <div className="description-box">
              {selectedAssignment.description || "No description provided."}
            </div>

            <label>Instructions</label>
            <div className="description-box">
              {selectedAssignment.instructions || "No instructions provided."}
            </div>

            {/* EDIT & DELETE BUTTONS IN VIEW MODAL */}
            <div className="popup-buttons">
              <button
                className="edit-btn"
                onClick={() => {
                  setShowView(false);
                  handleEdit(selectedAssignment);
                }}
              >
                <Pencil size={16} />
                Edit 
              </button>
              <button
                className="delete-btn"
                onClick={() => deleteAssignment(selectedAssignment.id)}
              >
                <Trash2 size={16} />
                Delete 
              </button>
              <button
                className="close-btn"
                onClick={() => setShowView(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================
          ADD ASSIGNMENT MODAL
      ====================================== */}
      {showAdd && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Create Assignment</h2>
            <input
              placeholder="Assignment Title"
              value={newAssignment.title}
              onChange={(e) =>
                setNewAssignment({
                  ...newAssignment,
                  title: e.target.value
                })
              }
            />
            <textarea
              rows="4"
              placeholder="Description"
              value={newAssignment.description}
              onChange={(e) =>
                setNewAssignment({
                  ...newAssignment,
                  description: e.target.value
                })
              }
            />
            <textarea
              rows="4"
              placeholder="Instructions (Optional)"
              value={newAssignment.instructions}
              onChange={(e) =>
                setNewAssignment({
                  ...newAssignment,
                  instructions: e.target.value
                })
              }
            />
            <input
              placeholder="Assignment Link"
              value={newAssignment.assignmentLink}
              onChange={(e) =>
                setNewAssignment({
                  ...newAssignment,
                  assignmentLink: e.target.value
                })
              }
            />
            <select
              value={newAssignment.courseId}
              onChange={(e) => {
                setNewAssignment({
                  ...newAssignment,
                  courseId: e.target.value,
                  moduleId: "",
                });
                fetchModules(e.target.value);
              }}
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <select
              value={newAssignment.moduleId}
              onChange={(e) =>
                setNewAssignment({
                  ...newAssignment,
                  moduleId: e.target.value,
                })
              }
            >
              <option value="">Select Module (Optional)</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.title}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={newAssignment.dueDate}
              onChange={(e) =>
                setNewAssignment({
                  ...newAssignment,
                  dueDate: e.target.value
                })
              }
            />
            <input
              type="number"
              placeholder="Total Marks"
              value={newAssignment.totalMarks}
              onChange={(e) =>
                setNewAssignment({
                  ...newAssignment,
                  totalMarks: e.target.value
                })
              }
            />
            <div className="popup-buttons">
              <button className="save-btn" onClick={addAssignment}>
                Create Assignment
              </button>
              <button className="close-btn" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================
          EDIT ASSIGNMENT MODAL
      ====================================== */}
      {showEdit && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Edit Assignment</h2>
            <input
              placeholder="Assignment Title"
              value={editAssignment.title}
              onChange={(e) =>
                setEditAssignment({
                  ...editAssignment,
                  title: e.target.value
                })
              }
            />
            <textarea
              rows="4"
              placeholder="Description"
              value={editAssignment.description}
              onChange={(e) =>
                setEditAssignment({
                  ...editAssignment,
                  description: e.target.value
                })
              }
            />
            <textarea
              rows="4"
              placeholder="Instructions (Optional)"
              value={editAssignment.instructions}
              onChange={(e) =>
                setEditAssignment({
                  ...editAssignment,
                  instructions: e.target.value
                })
              }
            />
            <input
              placeholder="Assignment Link"
              value={editAssignment.assignmentLink}
              onChange={(e) =>
                setEditAssignment({
                  ...editAssignment,
                  assignmentLink: e.target.value
                })
              }
            />
            <select
              value={editAssignment.courseId}
              onChange={(e) => {
                setEditAssignment({
                  ...editAssignment,
                  courseId: e.target.value,
                  moduleId: "",
                });
                fetchModules(e.target.value);
              }}
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <select
              value={editAssignment.moduleId}
              onChange={(e) =>
                setEditAssignment({
                  ...editAssignment,
                  moduleId: e.target.value,
                })
              }
            >
              <option value="">Select Module (Optional)</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.title}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={editAssignment.dueDate}
              onChange={(e) =>
                setEditAssignment({
                  ...editAssignment,
                  dueDate: e.target.value
                })
              }
            />
            <input
              type="number"
              placeholder="Total Marks"
              value={editAssignment.totalMarks}
              onChange={(e) =>
                setEditAssignment({
                  ...editAssignment,
                  totalMarks: e.target.value
                })
              }
            />
            <div className="popup-buttons">
              <button className="save-btn" onClick={updateAssignment}>
                Save Changes
              </button>
              <button className="close-btn" onClick={() => setShowEdit(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================
          SUBMISSION REVIEW MODAL
      ====================================== */}
      {showSubmissions && (
        <div className="popup-overlay">
          <div className="popup large-popup">
            <div className="submission-header">
              <div>
                <h2>Student Submissions</h2>
                <p>
                  Assignment: <strong>{selectedAssignment?.title}</strong>
                </p>
              </div>
              <div className="submission-count">
                {submissions.length} Submission{submissions.length !== 1 && "s"}
              </div>
            </div>
            
            {submissions.length > 0 ? (
              submissions.map((submission) => (
                <div key={submission.id} className="submission-card">
                  <div className="submission-top">
                    <div>
                      <h3>{submission.student?.name}</h3>
                      <p>{submission.student?.email}</p>
                    </div>
                    <span className={`submission-status ${submission.status.toLowerCase()}`}>
                      {submission.status}
                    </span>
                  </div>
                  <div className="submission-body">
                    <p>
                      <strong>Submitted:</strong>{" "}
                      {new Date(submission.submittedAt).toLocaleString()}
                    </p>
                    <a
                      href={submission.submissionLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open Submission
                    </a>
                  </div>
                  <input
                    type="number"
                    placeholder="Marks"
                    defaultValue={submission.marks || ""}
                    readOnly={submission.status === "REVIEWED"}
                    id={`marks-${submission.id}`}
                  />
                  <textarea
                    rows="4"
                    placeholder="Feedback"
                    defaultValue={submission.feedback || ""}
                    readOnly={submission.status === "REVIEWED"}
                    id={`feedback-${submission.id}`}
                  />
                  <div className="popup-buttons">
                    <button
                      className="save-btn"
                      disabled={submission.status === "REVIEWED"}
                      onClick={() => {
                        const marks = document.getElementById(
                          `marks-${submission.id}`
                        ).value;
                        const feedback = document.getElementById(
                          `feedback-${submission.id}`
                        ).value;
                        reviewSubmission(
                          submission.id,
                          marks,
                          feedback
                        );
                      }}
                    >
                      {submission.status === "REVIEWED"
                        ? "Reviewed"
                        : "Save Review"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-box">
                <h3>No Submissions Yet</h3>
                <p>Students haven't submitted this assignment yet.</p>
              </div>
            )}
        
            <div className="popup-buttons">
              <button
                className="close-btn"
                onClick={() => setShowSubmissions(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MentorAssignments;