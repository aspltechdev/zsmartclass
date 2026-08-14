// src/pages/mentor/QuizMarks/QuizMarks.jsx

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Search,
  RefreshCw,
  Trophy,
  BookOpen
} from "lucide-react";

import "./QuizMarks.css";

const API = "http://localhost:5000/api";

function QuizMarks() {

  const token = localStorage.getItem("token");

  const config = {

    headers: {

      Authorization: `Bearer ${token}`

    }

  };

  // ==========================================
  // States
  // ==========================================

  const [quizMarks, setQuizMarks] = useState([]);

  const [filteredMarks, setFilteredMarks] = useState([]);

  const [quizzes, setQuizzes] = useState([]);

  const [selectedQuiz, setSelectedQuiz] = useState("");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);

  // ==========================================
  // Initial Load
  // ==========================================

  useEffect(() => {

    fetchQuizzes();

  }, []);

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

    }

    catch (err) {

      console.error(err);

    }

  };

  // ==========================================
  // Fetch Marks
  // ==========================================

  const fetchMarks = async (quizId) => {

    if (!quizId) return;

    setLoading(true);

    try {

      const res = await axios.get(

        `${API}/quizzes/${quizId}/marks`,

        config

      );

      setQuizMarks(res.data.data || []);

      setFilteredMarks(res.data.data || []);

    }

    catch (err) {

      console.error(err);

    }

    finally {

      setLoading(false);

    }

  };

  // ==========================================
  // Quiz Change
  // ==========================================

  const handleQuizChange = (e) => {

    const id = e.target.value;

    setSelectedQuiz(id);

    fetchMarks(id);

  };

  // ==========================================
  // Search Student
  // ==========================================

  useEffect(() => {

    if (!search.trim()) {

      setFilteredMarks(quizMarks);

      return;

    }

    const value = search.toLowerCase();

    const filtered = quizMarks.filter((item) =>

      item.student.name.toLowerCase().includes(value)

    );

    setFilteredMarks(filtered);

  }, [search, quizMarks]);
    // ==========================================
  // JSX
  // ==========================================

  return (

    <div className="quiz-marks">

      <div className="quiz-marks-header">

        <div>

          <h1>Quiz Marks</h1>

          <p>View students' quiz performance.</p>

        </div>

      </div>

      {/* ==========================================
            Filters
      ========================================== */}

      <div className="marks-toolbar">

        <div className="quiz-select">

          <BookOpen size={18} />

          <select

            value={selectedQuiz}

            onChange={handleQuizChange}

          >

            <option value="">

              Select Quiz

            </option>

            {quizzes.map((quiz) => (

              <option

                key={quiz.id}

                value={quiz.id}

              >

                {quiz.title}

              </option>

            ))}

          </select>

        </div>

        <div className="search-box">

          <Search size={18} />

          <input

            type="text"

            placeholder="Search student..."

            value={search}

            onChange={(e) =>

              setSearch(e.target.value)

            }

          />

        </div>

        <button

          className="refresh-btn"

          onClick={() => fetchMarks(selectedQuiz)}

        >

          <RefreshCw size={17} />

          Refresh

        </button>

      </div>

      {/* ==========================================
            Statistics
      ========================================== */}

      <div className="marks-stats">

        <div className="stat-card">

          <Trophy size={28} />

          <div>

            <h3>

              {filteredMarks.length}

            </h3>

            <p>Students Attempted</p>

          </div>

        </div>

      </div>

      {/* ==========================================
            Table
      ========================================== */}

      <div className="marks-table">

        <table>

          <thead>

            <tr>

              <th>Student</th>

              <th>Email</th>

              <th>Quiz</th>

              <th>Course</th>

              <th>Module</th>

              <th>Marks</th>

              <th>Total</th>

              <th>Percentage</th>

              <th>Status</th>

            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>

                <td colSpan="9">

                  Loading...

                </td>

              </tr>

            ) : filteredMarks.length === 0 ? (

              <tr>

                <td colSpan="9">

                  No Marks Available

                </td>

              </tr>

            ) : (

              filteredMarks.map((item) => (

                <tr key={item.id}>

                  <td>

                    {item.student.name}

                  </td>

                  <td>

                    {item.student.email}

                  </td>

                  <td>

                    {item.quiz.title}

                  </td>

                  <td>

                    {item.quiz.course.title}

                  </td>

                  <td>

                    {item.quiz.module.title}

                  </td>

                  <td>

                    {item.obtainedMarks}

                  </td>

                  <td>

                    {item.totalMarks}

                  </td>

                  <td>

                    {item.percentage.toFixed(1)}%

                  </td>

                  <td>

                    <span

                      className={

                        item.percentage >= 40

                          ? "status pass"

                          : "status fail"

                      }

                    >

                      {item.percentage >= 40

                        ? "Pass"

                        : "Fail"}

                    </span>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>

  );

}

export default QuizMarks;