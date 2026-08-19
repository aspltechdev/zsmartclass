// src/pages/mentor/Assignments/Assignments.jsx

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Plus,
  Eye,
  X
} from "lucide-react";
import "./Assignments.css";

const API = "http://localhost:5000/api";

function Assignments() {

  const token = localStorage.getItem("token");

  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);

  // Add Assignment Popup
  const [showModal, setShowModal] = useState(false);

  // View Popup
  const [showViewModal, setShowViewModal] = useState(false);

  // Selected Assignment
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Edit Mode
  const [isEditing, setIsEditing] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    courseId: "",
    title: "",
    description: "",
    dueDate: "",
    totalMarks: ""
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

      const res = await axios.get(
        `${API}/assignments`,
        config
      );

      setAssignments(res.data.data || []);

    } catch (err) {

      console.error(err);

    }

  };

  // ===========================
  // Fetch Courses
  // ===========================

  const fetchCourses = async () => {

    try {

      const res = await axios.get(
        `${API}/courses`,
        config
      );

      setCourses(res.data.data || []);

    } catch (err) {

      console.error(err);

    }

  };

  // ===========================
  // Form Change
  // ===========================

  const handleChange = (e) => {

    setFormData({

      ...formData,

      [e.target.name]: e.target.value

    });

  };

  // ===========================
  // Add Assignment
  // ===========================

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      await axios.post(

        `${API}/assignments`,

        formData,

        config

      );

      fetchAssignments();

      setShowModal(false);

      setFormData({

        courseId: "",

        title: "",

        description: "",

        dueDate: "",

        totalMarks: ""

      });

    } catch (err) {

      console.error(err);

      alert("Unable to create assignment.");

    }

  };

  // ===========================
  // Delete Assignment
  // ===========================

  const deleteAssignment = async (id) => {

    if (!window.confirm("Delete this assignment?")) return;

    try {

      await axios.delete(

        `${API}/assignments/${id}`,

        config

      );

      fetchAssignments();

      setShowViewModal(false);

    } catch (err) {

      console.error(err);

      alert("Unable to delete assignment.");

    }

  };

  // ===========================
  // Update Assignment
  // ===========================

  const updateAssignment = async () => {

    try {

      await axios.put(

        `${API}/assignments/${selectedAssignment.id}`,

        {

          title: selectedAssignment.title,

          description: selectedAssignment.description,

          dueDate: selectedAssignment.dueDate,

          totalMarks: selectedAssignment.totalMarks,

          courseId: selectedAssignment.courseId

        },

        config

      );

      fetchAssignments();

      setIsEditing(false);

      setShowViewModal(false);

    } catch (err) {

      console.error(err);

      alert("Unable to update assignment.");

    }

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

        <button
          className="add-btn"
          onClick={() => setShowModal(true)}
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

              <th>Due Date</th>

              <th>Total Marks</th>

              <th>Submissions</th>

              <th>Actions</th>

            </tr>

          </thead>

          <tbody>

            {assignments.length === 0 ? (

              <tr>

                <td colSpan="6">

                  No Assignments Found.

                </td>

              </tr>

            ) : (

              assignments.map((assignment) => (

                <tr key={assignment.id}>

                  <td>{assignment.title}</td>

                  <td>{assignment.course?.title}</td>

                  <td>

                    {new Date(
                      assignment.dueDate
                    ).toLocaleDateString()}

                  </td>

                  <td>{assignment.totalMarks}</td>

                  <td>

                    {assignment.submissions?.length || 0}

                  </td>

                  <td>

                    <div className="actions">

                      <button

                        onClick={() => {

                          setSelectedAssignment(assignment);

                          setShowViewModal(true);

                        }}

                      >

                        <Eye size={17} />

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

        <div className="modal-overlay">

          <div className="assignment-modal">

            <div className="modal-header">

              <h2>Create Assignment</h2>

              <button
                onClick={() => setShowModal(false)}
              >

                <X />

              </button>

            </div>

            <form onSubmit={handleSubmit}>

              <label>

                Course

              </label>

              <select

                name="courseId"

                value={formData.courseId}

                onChange={handleChange}

                required

              >

                <option value="">

                  Select Course

                </option>

                {courses.map((course) => (

                  <option
                    key={course.id}
                    value={course.id}
                  >

                    {course.title}

                  </option>

                ))}

              </select>

              <label>

                Assignment Title

              </label>

              <input

                type="text"

                name="title"

                value={formData.title}

                onChange={handleChange}

                required

              />

              <label>

                Assignment Description

              </label>

              <textarea

                rows="6"

                name="description"

                value={formData.description}

                onChange={handleChange}

                required

              />

              <div className="row">

                <div>

                  <label>

                    Due Date

                  </label>

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

              <button
                className="submit-btn"
              >

                Create Assignment

              </button>

            </form>

          </div>

        </div>

           )}

      {/* ===============================
          View / Edit Assignment Popup
      ================================ */}

      {showViewModal && selectedAssignment && (

        <div className="modal-overlay">

          <div className="assignment-modal">

            <div className="modal-header">

              <h2>Assignment Details</h2>

              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false);
                  setIsEditing(false);
                }}
              >
                <X />
              </button>

            </div>

            <div className="assignment-view">

              <label>Course</label>

              <input
                type="text"
                disabled
                value={selectedAssignment.course?.title || ""}
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
                rows="6"
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
                        ? selectedAssignment.dueDate.split("T")[0]
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
                  />

                </div>

              </div>

              <label>Submissions</label>

              <input
                type="text"
                disabled
                value={selectedAssignment.submissions?.length || 0}
              />

              <div className="popup-buttons">

                {!isEditing ? (

                  <>

                    <button
                      type="button"
                      className="edit-btn"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() =>
                        deleteAssignment(selectedAssignment.id)
                      }
                    >
                      Delete
                    </button>

                  </>

                ) : (

                  <button
                    type="button"
                    className="save-btn"
                    onClick={updateAssignment}
                  >
                    Save Changes
                  </button>

                )}

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}

export default Assignments;