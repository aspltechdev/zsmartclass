import { useEffect, useState } from "react";
import axios from "axios";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  ClipboardList
} from "lucide-react";
import "./Quiz.css";

function MentorQuiz() {
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const [showView, setShowView] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [newQuiz, setNewQuiz] = useState({
    title: "",
    description: "",
    quizLink: "",
    duration: "",
    instructions: "",
    status: "DRAFT",
    courseId: ""
  });

  const [editQuiz, setEditQuiz] = useState({
    id: "",
    title: "",
    description: "",
    quizLink: "",
    duration: "",
    instructions: "",
    status: "DRAFT",
    courseId: ""
  });

  useEffect(() => {
    fetchCourses();
    fetchQuizzes();
  }, []);

  // ===========================
  // FETCH COURSES
  // ===========================
  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/courses",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setCourses(res.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  // ===========================
  // FETCH QUIZZES
  // ===========================
  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/quizzes",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setQuizzes(res.data.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // CREATE QUIZ
  // ===========================
  const addQuiz = async () => {
    if (
      !newQuiz.title ||
      !newQuiz.courseId ||
      !newQuiz.quizLink ||
      !newQuiz.duration
    ) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        "http://localhost:5000/api/quizzes",
        newQuiz,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("Quiz created successfully.");

      setShowAdd(false);

      setNewQuiz({
        title: "",
        description: "",
        quizLink: "",
        duration: "",
        instructions: "",
        status: "DRAFT",
        courseId: ""
      });

      fetchQuizzes();
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.message ||
        "Unable to create quiz."
      );
    }
  };

  // ===========================
  // VIEW QUIZ
  // ===========================
  const handleView = (quiz) => {
    setSelectedQuiz(quiz);
    setShowView(true);
  };

  // ===========================
  // EDIT QUIZ
  // ===========================
  const handleEdit = (quiz) => {
    setEditQuiz({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      quizLink: quiz.quizLink,
      duration: quiz.duration,
      instructions: quiz.instructions,
      status: quiz.status,
      courseId: quiz.courseId
    });

    setShowEdit(true);
  };

  // ===========================
  // UPDATE QUIZ
  // ===========================
  const updateQuiz = async () => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:5000/api/quizzes/${editQuiz.id}`,
        editQuiz,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("Quiz updated successfully.");

      setShowEdit(false);

      fetchQuizzes();
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.message ||
        "Unable to update quiz."
      );
    }
  };

  // ===========================
  // DELETE QUIZ
  // ===========================
  const deleteQuiz = async (id) => {
    if (!window.confirm("Delete this quiz?")) return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(
        `http://localhost:5000/api/quizzes/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      fetchQuizzes();
    } catch (err) {
      console.log(err);

      alert("Unable to delete quiz.");
    }
  };

  if (loading) {
    return <h2>Loading Quizzes...</h2>;
  }
    return (
    <div className="mentor-quiz">

      {/* ===========================
            HEADER
      ============================ */}

      <div className="quiz-header">
        <div>
          <h1>Quiz Management</h1>
          <p>Create, manage and publish quizzes for your courses.</p>
        </div>

        <button
          className="add-btn"
          onClick={() => setShowAdd(true)}
        >
          <Plus size={18} />
          Add Quiz
        </button>
      </div>

      {/* ===========================
            QUIZ TABLE
      ============================ */}

      <div className="quiz-table">
        <table>

          <thead>
            <tr>
              <th>Title</th>
              <th>Course</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Quiz Link</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {quizzes.length > 0 ? (

              quizzes.map((quiz) => (

                <tr key={quiz.id}>

                  <td>{quiz.title}</td>

                  <td>{quiz.course?.title}</td>

                  <td>{quiz.duration} mins</td>

                  <td>
                    <span
                      className={
                        quiz.status === "PUBLISHED"
                          ? "status published"
                          : "status draft"
                      }
                    >
                      {quiz.status}
                    </span>
                  </td>

                  <td>
                    <a
                      href={quiz.quizLink}
                      target="_blank"
                      rel="noreferrer"
                      className="quiz-link"
                    >
                      Open Quiz
                    </a>
                  </td>

                  <td>

                 <div className="action-buttons">
    <button
        className="view-btn"
        onClick={() => handleView(quiz)}
    >
        <Eye size={18}/>
    </button>
</div>

                  </td>

                </tr>

              ))

            ) : (

              <tr>

                <td
                  colSpan="6"
                  style={{
                    textAlign: "center",
                    padding: "40px"
                  }}
                >
                  No quizzes found.
                </td>

              </tr>

            )}

          </tbody>

        </table>
      </div>

      {/* ===========================
            VIEW QUIZ MODAL
      ============================ */}

      {showView && selectedQuiz && (

        <div className="popup-overlay">

          <div className="popup">

            <h2>Quiz Details</h2>

            <div className="view-grid">

              <div>
                <label>Quiz Title</label>
                <p>{selectedQuiz.title}</p>
              </div>

              <div>
                <label>Course</label>
                <p>{selectedQuiz.course?.title}</p>
              </div>

              <div>
                <label>Duration</label>
                <p>{selectedQuiz.duration} Minutes</p>
              </div>

              <div>
                <label>Status</label>
                <p>{selectedQuiz.status}</p>
              </div>

            </div>

            <label>Description</label>

            <div className="description-box">
              {selectedQuiz.description || "-"}
            </div>

            <label>Instructions</label>

            <div className="description-box">
              {selectedQuiz.instructions || "-"}
            </div>

            <label>Quiz Link</label>

            <a
              href={selectedQuiz.quizLink}
              target="_blank"
              rel="noreferrer"
              className="assignment-link"
            >
              Open Quiz
            </a>

          <div className="popup-buttons">

    <button
        className="edit-btn"
        onClick={() => {
            setShowView(false);
            handleEdit(selectedQuiz);
        }}
    >
        Edit Quiz
    </button>

    <button
        className="delete-btn"
        onClick={() => {
            setShowView(false);
            deleteQuiz(selectedQuiz.id);
        }}
    >
        Delete Quiz
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
            ADD QUIZ MODAL
      ====================================== */}

      {showAdd && (
        <div className="popup-overlay">
          <div className="popup">

            <h2>Create Quiz</h2>

            <input
              type="text"
              placeholder="Quiz Title"
              value={newQuiz.title}
              onChange={(e) =>
                setNewQuiz({
                  ...newQuiz,
                  title: e.target.value
                })
              }
            />

            <textarea
              rows="4"
              placeholder="Description"
              value={newQuiz.description}
              onChange={(e) =>
                setNewQuiz({
                  ...newQuiz,
                  description: e.target.value
                })
              }
            />

            <input
              type="text"
              placeholder="Google Form / Quiz Link"
              value={newQuiz.quizLink}
              onChange={(e) =>
                setNewQuiz({
                  ...newQuiz,
                  quizLink: e.target.value
                })
              }
            />

            <select
              value={newQuiz.courseId}
              onChange={(e) =>
                setNewQuiz({
                  ...newQuiz,
                  courseId: e.target.value
                })
              }
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

            <input
              type="number"
              placeholder="Duration (Minutes)"
              value={newQuiz.duration}
              onChange={(e) =>
                setNewQuiz({
                  ...newQuiz,
                  duration: e.target.value
                })
              }
            />

            <textarea
              rows="4"
              placeholder="Instructions"
              value={newQuiz.instructions}
              onChange={(e) =>
                setNewQuiz({
                  ...newQuiz,
                  instructions: e.target.value
                })
              }
            />

            <select
              value={newQuiz.status}
              onChange={(e) =>
                setNewQuiz({
                  ...newQuiz,
                  status: e.target.value
                })
              }
            >
              <option value="DRAFT">
                Draft
              </option>

              <option value="PUBLISHED">
                Published
              </option>
            </select>

            <div className="popup-buttons">

              <button
                className="save-btn"
                onClick={addQuiz}
              >
                Create Quiz
              </button>

              <button
                className="close-btn"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </button>

            </div>

          </div>
        </div>
      )}
            {/* ======================================
            EDIT QUIZ MODAL
      ====================================== */}

      {showEdit && (
        <div className="popup-overlay">
          <div className="popup">

            <h2>Edit Quiz</h2>

            <input
              type="text"
              placeholder="Quiz Title"
              value={editQuiz.title}
              onChange={(e) =>
                setEditQuiz({
                  ...editQuiz,
                  title: e.target.value
                })
              }
            />

            <textarea
              rows="4"
              placeholder="Description"
              value={editQuiz.description}
              onChange={(e) =>
                setEditQuiz({
                  ...editQuiz,
                  description: e.target.value
                })
              }
            />

            <input
              type="text"
              placeholder="Quiz Link"
              value={editQuiz.quizLink}
              onChange={(e) =>
                setEditQuiz({
                  ...editQuiz,
                  quizLink: e.target.value
                })
              }
            />

            <select
              value={editQuiz.courseId}
              onChange={(e) =>
                setEditQuiz({
                  ...editQuiz,
                  courseId: e.target.value
                })
              }
            >
              <option value="">Select Course</option>

              {courses.map((course) => (
                <option
                  key={course.id}
                  value={course.id}
                >
                  {course.title}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Duration (Minutes)"
              value={editQuiz.duration}
              onChange={(e) =>
                setEditQuiz({
                  ...editQuiz,
                  duration: e.target.value
                })
              }
            />

            <textarea
              rows="4"
              placeholder="Instructions"
              value={editQuiz.instructions}
              onChange={(e) =>
                setEditQuiz({
                  ...editQuiz,
                  instructions: e.target.value
                })
              }
            />

            <select
              value={editQuiz.status}
              onChange={(e) =>
                setEditQuiz({
                  ...editQuiz,
                  status: e.target.value
                })
              }
            >
              <option value="DRAFT">
                Draft
              </option>

              <option value="PUBLISHED">
                Published
              </option>
            </select>

            <div className="popup-buttons">

              <button
                className="save-btn"
                onClick={updateQuiz}
              >
                Save Changes
              </button>

              <button
                className="close-btn"
                onClick={() => setShowEdit(false)}
              >
                Cancel
              </button>
              

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default MentorQuiz;