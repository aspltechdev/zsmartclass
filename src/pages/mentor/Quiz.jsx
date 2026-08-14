// src/pages/mentor/Quiz/Quiz.jsx

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  Plus,
  Eye,
  X,
  ExternalLink
} from "lucide-react";

import "./Quiz.css";

const API = "http://localhost:5000/api";

function Quiz() {

  // ==========================================
  // URL Params
  // ==========================================

  const [params] = useSearchParams();

  // ==========================================
  // Auth
  // ==========================================

  const token = localStorage.getItem("token");

  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  // ==========================================
  // States
  // ==========================================

  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const [formData, setFormData] = useState({
    courseId: "",
    moduleId: "",
    title: "",
    description: "",
    totalMarks: "",
    googleFormUrl: ""
  });

  // ==========================================
  // Initial Load
  // ==========================================

  useEffect(() => {

    fetchCourses();
    fetchQuizzes();

  }, []);

  // ==========================================
  // Open Create Modal from
  // /mentor/quiz?create=true
  // ==========================================

  useEffect(() => {

    if (params.get("create")) {

      setShowModal(true);

    }

  }, [params]);

  // ==========================================
  // Fetch Courses
  // ==========================================

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

  // ==========================================
  // Fetch Modules
  // ==========================================

  const fetchModules = async (courseId) => {

    try {

      const res = await axios.get(
        `${API}/modules/course/${courseId}`,
        config
      );

      setModules(res.data.data || []);

    } catch (err) {

      console.error(err);

    }

  };
    // ==========================================
  // Fetch Quizzes
  // ==========================================

  const fetchQuizzes = async () => {

    try {

      const res = await axios.get(
        `${API}/quizzes`,
        config
      );

      setQuizzes(res.data.data || []);

    } catch (err) {

      console.error(err);

    }

  };

  // ==========================================
  // Handle Form Input
  // ==========================================

  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    // Load modules whenever a course is selected
    if (name === "courseId") {

      setFormData((prev) => ({
        ...prev,
        courseId: value,
        moduleId: ""
      }));

      fetchModules(value);

    }

  };

  // ==========================================
  // Create Quiz
  // ==========================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      await axios.post(
        `${API}/quizzes`,
        formData,
        config
      );

      alert("Quiz created successfully.");

      setShowModal(false);

      setFormData({
        courseId: "",
        moduleId: "",
        title: "",
        description: "",
        totalMarks: "",
        googleFormUrl: ""
      });

      fetchQuizzes();

    } catch (err) {

      console.error(err);

      alert(
        err.response?.data?.message ||
        "Unable to create quiz."
      );

    }

  };

  // ==========================================
  // Delete Quiz
  // ==========================================

  const deleteQuiz = async (id) => {

    if (!window.confirm("Delete this quiz?")) return;

    try {

      await axios.delete(
        `${API}/quizzes/${id}`,
        config
      );

      alert("Quiz deleted successfully.");

      setShowViewModal(false);

      fetchQuizzes();

    } catch (err) {

      console.error(err);

      alert(
        err.response?.data?.message ||
        "Unable to delete quiz."
      );

    }

  };

  // ==========================================
  // Update Quiz
  // ==========================================

  const updateQuiz = async () => {

    try {

      await axios.put(
        `${API}/quizzes/${selectedQuiz.id}`,
        {
          courseId: selectedQuiz.courseId,
          moduleId: selectedQuiz.moduleId,
          title: selectedQuiz.title,
          description: selectedQuiz.description,
          totalMarks: selectedQuiz.totalMarks,
          googleFormUrl: selectedQuiz.googleFormUrl
        },
        config
      );

      alert("Quiz updated successfully.");

      setIsEditing(false);

      setShowViewModal(false);

      fetchQuizzes();

    } catch (err) {

      console.error(err);

      alert(
        err.response?.data?.message ||
        "Unable to update quiz."
      );

    }

  };

  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="mentor-quiz">

      {/* ==========================================
            Header
      ========================================== */}

      <div className="quiz-header">

        <div>

          <h1>Module Quizzes</h1>

          <p>
            Create and manage quizzes for each course module.
          </p>

        </div>

        <button
          className="add-btn"
          onClick={() => setShowModal(true)}
        >

          <Plus size={18} />

          Create Quiz

        </button>

      </div>

      {/* ==========================================
            Quiz Table
      ========================================== */}

      <div className="quiz-table">

        <table>

          <thead>

            <tr>

              <th>Quiz</th>

              <th>Course</th>

              <th>Module</th>

              <th>Total Marks</th>

              <th>Google Form</th>

              <th>Actions</th>

            </tr>

          </thead>

          <tbody>

            {quizzes.length === 0 ? (

              <tr>

                <td
                  colSpan="6"
                  style={{
                    textAlign: "center",
                    padding: "35px"
                  }}
                >

                  No quizzes available.

                </td>

              </tr>

            ) : (

              quizzes.map((quiz) => (

                <tr key={quiz.id}>

                  <td>

                    {quiz.title}

                  </td>

                  <td>

                    {quiz.course?.title}

                  </td>

                  <td>

                    {quiz.module?.title}

                  </td>

                  <td>

                    {quiz.totalMarks}

                  </td>

                  <td>

                    <a
                      href={quiz.googleFormUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="form-link"
                    >

                      <ExternalLink size={16} />

                      Open Form

                    </a>

                  </td>

                  <td>

                    <button

                      className="view-btn"

                      onClick={() => {

                        setSelectedQuiz(quiz);

                        setShowViewModal(true);

                      }}

                    >

                      <Eye size={18} />

                    </button>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>
            {/* ==========================================
            Create Quiz Modal
      ========================================== */}

      {showModal && (

        <div className="modal-overlay">

          <div className="quiz-modal">

            <div className="modal-header">

              <h2>Create Quiz</h2>

              <button
                type="button"
                onClick={() => setShowModal(false)}
              >
                <X />
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

              <label>Module</label>

              <select
                name="moduleId"
                value={formData.moduleId}
                onChange={handleChange}
                required
              >

                <option value="">
                  Select Module
                </option>

                {modules.map((module) => (

                  <option
                    key={module.id}
                    value={module.id}
                  >
                    {module.title}
                  </option>

                ))}

              </select>

              <label>Quiz Title</label>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter quiz title"
                required
              />

              <label>Description</label>

              <textarea
                rows="4"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter quiz description"
              />

              <div className="row">

                <div>

                  <label>Total Marks</label>

                  <input
                    type="number"
                    name="totalMarks"
                    value={formData.totalMarks}
                    onChange={handleChange}
                    required
                  />

                </div>

                <div>

                  <label>Google Form</label>

                  <button
                    type="button"
                    className="google-btn"
                    onClick={() =>
                      window.open(
                        "https://forms.google.com",
                        "_blank"
                      )
                    }
                  >

                    <ExternalLink size={16} />

                    Open Google Forms

                  </button>

                </div>

              </div>

              <label>Google Form URL</label>

              <input
                type="url"
                name="googleFormUrl"
                value={formData.googleFormUrl}
                onChange={handleChange}
                placeholder="https://docs.google.com/forms/..."
                required
              />

              <button
                type="submit"
                className="submit-btn"
              >

                Create Quiz

              </button>

            </form>

          </div>

        </div>

      )}
            {/* ==========================================
              View / Edit Quiz Modal
      ========================================== */}

      {showViewModal && selectedQuiz && (

        <div className="modal-overlay">

          <div className="quiz-modal">

            <div className="modal-header">

              <h2>Quiz Details</h2>

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

            <div className="quiz-view">

              <label>Course</label>

              <input
                type="text"
                disabled
                value={selectedQuiz.course?.title || ""}
              />

              <label>Module</label>

              <input
                type="text"
                disabled
                value={selectedQuiz.module?.title || ""}
              />

              <label>Quiz Title</label>

              <input
                type="text"
                disabled={!isEditing}
                value={selectedQuiz.title || ""}
                onChange={(e) =>
                  setSelectedQuiz({
                    ...selectedQuiz,
                    title: e.target.value
                  })
                }
              />

              <label>Description</label>

              <textarea
                rows="5"
                disabled={!isEditing}
                value={selectedQuiz.description || ""}
                onChange={(e) =>
                  setSelectedQuiz({
                    ...selectedQuiz,
                    description: e.target.value
                  })
                }
              />

              <label>Total Marks</label>

              <input
                type="number"
                disabled={!isEditing}
                value={selectedQuiz.totalMarks || ""}
                onChange={(e) =>
                  setSelectedQuiz({
                    ...selectedQuiz,
                    totalMarks: Number(e.target.value)
                  })
                }
              />

              <label>Google Form URL</label>

              <input
                type="url"
                disabled={!isEditing}
                value={selectedQuiz.googleFormUrl || ""}
                onChange={(e) =>
                  setSelectedQuiz({
                    ...selectedQuiz,
                    googleFormUrl: e.target.value
                  })
                }
              />

              <div className="google-link">

                <a
                  href={selectedQuiz.googleFormUrl}
                  target="_blank"
                  rel="noreferrer"
                >

                  <ExternalLink size={16} />

                  Open Google Form

                </a>

              </div>

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
                        deleteQuiz(selectedQuiz.id)
                      }
                    >

                      Delete

                    </button>

                  </>

                ) : (

                  <button
                    type="button"
                    className="save-btn"
                    onClick={updateQuiz}
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

export default Quiz;