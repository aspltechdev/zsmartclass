import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Eye,
  X,
  Edit,
  Trash2,
  ClipboardList
} from "lucide-react";

import api from "../../services/api";
import "./Assignments.css";
import "./MentorShared.css";

const EMPTY_FORM = {
  courseId: "",
  title: "",
  description: "",
  totalMarks: ""
};

function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const operationLock = useRef(false);

  useEffect(() => {
    fetchAssignments();
    fetchCourses();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await api.get("/assignments");
      setAssignments(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      alert(
        error.response?.data?.message ||
        "Unable to load assignments."
      );
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get("/courses");
      setCourses(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
      alert(
        error.response?.data?.message ||
        "Unable to load courses."
      );
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (operationLock.current) return;

    operationLock.current = true;
    setSaving(true);

    try {
      await api.post("/assignments", {
        courseId: Number(formData.courseId),
        title: formData.title.trim(),
        description: formData.description.trim(),
        totalMarks: Number(formData.totalMarks)
      });

      setShowModal(false);
      setFormData({ ...EMPTY_FORM });
      await fetchAssignments();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Unable to create assignment."
      );
    } finally {
      operationLock.current = false;
      setSaving(false);
    }
  };

  const deleteAssignment = async (id) => {
    if (operationLock.current) return;

    operationLock.current = true;
    setSaving(true);

    try {
      await api.delete(`/assignments/${id}`);

      setShowDeleteModal(false);
      setShowViewModal(false);
      setSelectedAssignment(null);

      await fetchAssignments();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Unable to delete assignment."
      );
    } finally {
      operationLock.current = false;
      setSaving(false);
    }
  };

  const updateAssignment = async () => {
    if (!selectedAssignment || operationLock.current) return;

    if (!selectedAssignment.title?.trim()) {
      alert("Assignment title is required.");
      return;
    }

    operationLock.current = true;
    setSaving(true);

    try {
      await api.put(`/assignments/${selectedAssignment.id}`, {
        title: selectedAssignment.title.trim(),
        description: selectedAssignment.description || "",
        totalMarks: Number(selectedAssignment.totalMarks),
        courseId: Number(selectedAssignment.courseId)
      });

      setIsEditing(false);
      setShowViewModal(false);

      await fetchAssignments();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Unable to update assignment."
      );
    } finally {
      operationLock.current = false;
      setSaving(false);
    }
  };

  const openView = (assignment) => {
    setSelectedAssignment({ ...assignment });
    setIsEditing(false);
    setShowViewModal(true);
  };

  const closeCreate = () => {
    if (!operationLock.current) setShowModal(false);
  };

  const closeView = () => {
    if (operationLock.current) return;

    setShowViewModal(false);
    setIsEditing(false);
  };

  const closeDelete = () => {
    if (!operationLock.current) setShowDeleteModal(false);
  };

  return (
    <div className="mentor-assignments">
      <div className="assignment-header">
        <div>
          <div className="assignments-title">
            <ClipboardList className="assignments-title-icon" />
            <h1>Assignments</h1>
          </div>
          <p>Create and manage course assignments.</p>
        </div>

        <button
          type="button"
          className="add-btn"
          onClick={() => {
            setFormData({ ...EMPTY_FORM });
            setShowModal(true);
          }}
        >
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
              <th>Total Marks</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {assignments.length === 0 ? (
              <tr>
                <td colSpan="4">No Assignments Found.</td>
              </tr>
            ) : (
              assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td>{assignment.title}</td>
                  <td>{assignment.course?.title || "—"}</td>
                  <td>{assignment.totalMarks}</td>
                  <td>
                    <div className="actions">
                      <button
                        type="button"
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

      {showModal && (
        <div className="modal-overlay" onClick={closeCreate}>
          <div
            className="assignment-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Create Assignment</h2>
              <button
                type="button"
                className="close-btn"
                onClick={closeCreate}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>Course</label>
              <select
                name="courseId"
                value={formData.courseId}
                onChange={handleChange}
                disabled={saving}
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
                disabled={saving}
                required
              />

              <label>Assignment Description</label>
              <textarea
                rows="5"
                name="description"
                placeholder="Enter assignment description"
                value={formData.description}
                onChange={handleChange}
                disabled={saving}
                required
              />

              <div
                className="row"
                style={{ gridTemplateColumns: "1fr" }}
              >
                <div>
                  <label>Total Marks</label>

                  <div className="marks-counter">
                    <button
                      type="button"
                      className="marks-btn"
                      disabled={saving}
                      onClick={() =>
                        setFormData((previous) => ({
                          ...previous,
                          totalMarks: Math.max(
                            1,
                            Number(previous.totalMarks || 1) - 1
                          )
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
                      step="1"
                      disabled={saving}
                      required
                    />

                    <button
                      type="button"
                      className="marks-btn"
                      disabled={saving}
                      onClick={() =>
                        setFormData((previous) => ({
                          ...previous,
                          totalMarks:
                            Number(previous.totalMarks || 0) + 1
                        }))
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={saving}
              >
                {saving ? "Creating..." : "Create Assignment"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedAssignment && (
        <div className="modal-overlay" onClick={closeView}>
          <div
            className="assignment-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2>
                {isEditing ? "Edit Assignment" : "Assignment Details"}
              </h2>
              <button
                type="button"
                className="close-btn"
                onClick={closeView}
                disabled={saving}
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
                readOnly
              />

              <label>Assignment Title</label>
              <input
                type="text"
                disabled={!isEditing || saving}
                value={selectedAssignment.title || ""}
                onChange={(event) =>
                  setSelectedAssignment((previous) => ({
                    ...previous,
                    title: event.target.value
                  }))
                }
              />

              <label>Description</label>
              <textarea
                rows="5"
                disabled={!isEditing || saving}
                value={selectedAssignment.description || ""}
                onChange={(event) =>
                  setSelectedAssignment((previous) => ({
                    ...previous,
                    description: event.target.value
                  }))
                }
              />

              <div
                className="row"
                style={{ gridTemplateColumns: "1fr" }}
              >
                <div>
                  <label>Total Marks</label>
                  <input
                    type="number"
                    disabled={!isEditing || saving}
                    value={selectedAssignment.totalMarks ?? ""}
                    min="1"
                    step="1"
                    onChange={(event) =>
                      setSelectedAssignment((previous) => ({
                        ...previous,
                        totalMarks: event.target.value
                      }))
                    }
                  />
                </div>
              </div>

              <div className="popup-buttons">
                {!isEditing ? (
                  <>
                    <button
                      type="button"
                      className="edit-btn"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit size={16} />
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => {
                        setShowViewModal(false);
                        setShowDeleteModal(true);
                      }}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn-cancel"
                      disabled={saving}
                      onClick={() => {
                        setIsEditing(false);

                        const original = assignments.find(
                          (item) => item.id === selectedAssignment.id
                        );

                        if (original) {
                          setSelectedAssignment({ ...original });
                        }
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="save-btn"
                      onClick={updateAssignment}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedAssignment && (
        <div className="modal-overlay" onClick={closeDelete}>
          <div
            className="delete-confirm-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="delete-confirm-icon">
              <Trash2 size={32} />
            </div>

            <h3>Delete Assignment?</h3>
            <p>
              Are you sure you want to delete{" "}
              <strong>"{selectedAssignment.title}"</strong>?
              <br />
              This action cannot be undone.
            </p>

            <div className="delete-confirm-buttons">
              <button
                type="button"
                className="btn-cancel"
                onClick={closeDelete}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn-danger"
                disabled={saving}
                onClick={() => deleteAssignment(selectedAssignment.id)}
              >
                <Trash2 size={16} />
                {saving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Assignments;