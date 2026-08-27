// src/pages/student/Quiz.jsx

import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  HelpCircle,
  BookOpen,
  Award,
  FileQuestion,
  AlertCircle,
  RefreshCw,
  Clock,
  ArrowLeft,
  PlayCircle,
  ClipboardList,
  ChevronRight,
  XCircle,
  Send,
  Radio,
  CheckSquare
} from "lucide-react";

import api from "../../services/api";
import "./Quiz.css";
import "./StudentShared.css";

const Quiz = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const moduleId = searchParams.get("moduleId");
  const courseId = searchParams.get("courseId");

  const [quizzes, setQuizzes] = useState([]);
  const [module, setModule] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Quiz taking state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // ==========================================
  // FETCH QUIZZES
  // ==========================================

  useEffect(() => {
    if (moduleId) {
      fetchQuizzes();
      fetchModuleDetails();
      if (courseId) {
        fetchCourseDetails();
      }
    } else {
      setLoading(false);
    }
  }, [moduleId, courseId]);

  const fetchQuizzes = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      const response = await api.get(`/quizzes/module/${moduleId}`);

      let quizData = [];
      if (response.data?.success) {
        quizData = response.data.data || [];
      } else if (response.data?.data) {
        quizData = response.data.data || [];
      } else if (Array.isArray(response.data)) {
        quizData = response.data;
      }

      setQuizzes(quizData);
    } catch (err) {
      console.error("Failed to load quizzes:", err);
      setError(err.response?.data?.message || err.message || "Unable to load quizzes.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchModuleDetails = async () => {
    try {
      const response = await api.get(`/modules/${moduleId}`);
      const data = response?.data?.data || response?.data || null;
      if (data) setModule(data);
    } catch (err) {
      console.error("Failed to load module details:", err);
    }
  };

  const fetchCourseDetails = async () => {
    if (!courseId) return;
    try {
      const response = await api.get(`/courses/${courseId}`);
      const data = response?.data?.data || response?.data || null;
      if (data) setCourse(data);
    } catch (err) {
      console.error("Failed to load course details:", err);
    }
  };

  // ==========================================
  // START QUIZ
  // ==========================================

  const startQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestion(0);
    setAnswers({});
    setSubmitted(false);
    setResult(null);
    setShowResults(false);
  };

  // ==========================================
  // HANDLE ANSWER SELECTION
  // ==========================================

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    if (submitted) return;

    const question = activeQuiz.questions[questionIndex];
    
    if (question.type === "RADIO") {
      // Single select
      setAnswers({
        ...answers,
        [questionIndex]: [optionIndex]
      });
    } else {
      // Multiple select (CHECKBOX)
      const currentAnswers = answers[questionIndex] || [];
      if (currentAnswers.includes(optionIndex)) {
        setAnswers({
          ...answers,
          [questionIndex]: currentAnswers.filter(i => i !== optionIndex)
        });
      } else {
        setAnswers({
          ...answers,
          [questionIndex]: [...currentAnswers, optionIndex]
        });
      }
    }
  };

  // ==========================================
  // NAVIGATE QUESTIONS
  // ==========================================

  const goToNextQuestion = () => {
    if (currentQuestion < activeQuiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // ==========================================
  // SUBMIT QUIZ
  // ==========================================

  const submitQuiz = async () => {
    // Check if all questions are answered
    const totalQuestions = activeQuiz.questions.length;
    const answeredQuestions = Object.keys(answers).length;

    if (answeredQuestions < totalQuestions) {
      const confirmSubmit = window.confirm(
        `You've answered ${answeredQuestions} out of ${totalQuestions} questions. Are you sure you want to submit?`
      );
      if (!confirmSubmit) return;
    }

    try {
      setSubmitting(true);

      // The server grades the attempt. We send ONLY which options were picked
      // (as option IDs, resolved from the selected indices) — never a score.
      const answersPayload = activeQuiz.questions.map((question, index) => {
        const selectedIndices = answers[index] || [];
        const selectedOptionIds = selectedIndices
          .map((oi) => question.options?.[oi]?.id)
          .filter((id) => id != null);
        return { questionId: question.id, selectedOptionIds };
      });

      const response = await api.post(`/quizzes/${activeQuiz.id}/attempts`, {
        answers: answersPayload,
        courseId: courseId ? Number(courseId) : undefined,
      });

      // Authoritative grade from the server.
      const graded = response?.data?.data || {};
      const scorePercentage = graded.percentage ?? 0;

      setResult({
        correctCount: graded.correctCount ?? 0,
        totalQuestions: graded.totalQuestions ?? activeQuiz.questions.length,
        totalMarks: graded.obtainedMarks ?? 0,
        totalPossibleMarks: graded.totalMarks ?? 0,
        scorePercentage,
        passed: graded.passed ?? scorePercentage >= 50,
      });

      setSubmitted(true);
      setShowResults(true);
    } catch (err) {
      console.error("Failed to submit quiz:", err);
      alert(err.response?.data?.message || "Failed to submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // RENDER QUIZ QUESTION
  // ==========================================

  const renderQuestion = (question, index) => {
    const selectedOptions = answers[index] || [];

    return (
      <div className="quiz-question-container" key={index}>
        <div className="quiz-question-header">
          <span className="question-number">Question {index + 1} of {activeQuiz.questions.length}</span>
          <span className="question-marks">{question.marks || 1} mark{question.marks !== 1 ? 's' : ''}</span>
        </div>

        <h3 className="quiz-question-text">{question.question}</h3>

        <div className="quiz-options-list">
          {question.options.map((option, optIndex) => {
            const isSelected = selectedOptions.includes(optIndex);

            return (
              <button
                key={optIndex}
                className={`quiz-option ${isSelected ? 'selected' : ''} ${submitting ? 'disabled' : ''}`}
                onClick={() => handleAnswerSelect(index, optIndex)}
                disabled={submitting}
              >
                <span className="option-indicator">
                  {question.type === "RADIO" ? (
                    <Radio size={18} />
                  ) : (
                    <CheckSquare size={18} />
                  )}
                </span>
                <span className="option-text">{option.text}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ==========================================
  // RENDER RESULTS (NO REVIEW SECTION)
  // ==========================================

  const renderResults = () => {
    const { correctCount, totalQuestions, totalMarks, totalPossibleMarks, scorePercentage } = result;
    const passed = result.passed ?? scorePercentage >= 50;

    return (
      <div className="quiz-results-container">
        <div className="quiz-results-header">
          <Award size={48} className={passed ? 'passed-icon' : 'failed-icon'} />
          <h2>{passed ? 'Quiz Passed!' : 'Keep Learning!'}</h2>
          <p>{passed ? 'Great job! You passed the quiz. Your module is now complete.' : 'Review the material and try again.'}</p>
        </div>

        <div className="quiz-results-stats">
          <div className="result-stat">
            <span className="result-label">Score</span>
            <span className="result-value">{totalMarks} / {totalPossibleMarks}</span>
          </div>
          <div className="result-stat">
            <span className="result-label">Percentage</span>
            <span className="result-value">{scorePercentage}%</span>
          </div>
          <div className="result-stat">
            <span className="result-label">Correct Answers</span>
            <span className="result-value">{correctCount} / {totalQuestions}</span>
          </div>
          <div className="result-stat">
            <span className="result-label">Status</span>
            <span className={`result-value ${passed ? 'passed' : 'failed'}`}>
              {passed ? 'Passed' : 'Failed'}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="quiz-finish-btn"
          onClick={() => {
            setActiveQuiz(null);
            setShowResults(false);
            setSubmitted(false);
            setResult(null);
            setAnswers({});
            setCurrentQuestion(0);
          }}
        >
          <ArrowLeft size={16} />
          Back to Quizzes
        </button>
      </div>
    );
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="quiz-container">
        <div className="quiz-loading">
          <div className="quiz-spinner"></div>
          <p>Loading quizzes...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // NO MODULE SELECTED
  // ==========================================

  if (!moduleId) {
    return (
      <div className="quiz-container">
        <div className="quiz-header">
          <div>
            <h1 className="quiz-title">
              <HelpCircle size={28} />
              Quizzes
            </h1>
            <p className="quiz-subtitle">View quizzes available for your course modules</p>
          </div>
        </div>

        <div className="quiz-empty">
          <div className="quiz-empty-icon">
            <ClipboardList size={48} />
          </div>
          <h2>Select a Module</h2>
          <p>
            Please select a module from your course to view its quizzes.
          </p>

          <div className="quiz-debug-info">
            <strong>Tip:</strong><br />
            Go to your course player and click the quiz link in the sidebar.
          </div>

          <button
            type="button"
            className="quiz-empty-btn"
            onClick={() => navigate("/student/my-courses")}
          >
            <ArrowLeft size={16} />
            Go to My Courses
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="quiz-container">
        <div className="quiz-error">
          <AlertCircle size={48} />
          <h2>Unable to load quizzes</h2>
          <p>{error}</p>
          <button type="button" className="quiz-retry-btn" onClick={() => fetchQuizzes(true)}>
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // SHOW RESULTS
  // ==========================================

  if (showResults && result) {
    return (
      <div className="quiz-container">
        <div className="quiz-header">
          <div>
            <h1 className="quiz-title">
              <ClipboardList size={28} />
              Quiz Results
            </h1>
            <p className="quiz-subtitle">
              {activeQuiz?.title || "Quiz Results"}
            </p>
          </div>
          <button
            type="button"
            className="quiz-back-btn"
            onClick={() => navigate(`/student/player/${courseId}`)}
          >
            <ArrowLeft size={16} />
            Back to Course
          </button>
        </div>
        {renderResults()}
      </div>
    );
  }

  // ==========================================
  // ACTIVE QUIZ - TAKING
  // ==========================================

  if (activeQuiz) {
    const question = activeQuiz.questions[currentQuestion];
    const isLastQuestion = currentQuestion === activeQuiz.questions.length - 1;
    const hasAnswered = Object.keys(answers).length > 0;

    return (
      <div className="quiz-container">
        <div className="quiz-header">
          <div>
            <h1 className="quiz-title">
              <PlayCircle size={28} />
              {activeQuiz.title}
            </h1>
            <p className="quiz-subtitle">
              {module?.title || "Module Quiz"}
            </p>
          </div>
          <div className="quiz-progress-info">
            <span>
              {Object.keys(answers).length} / {activeQuiz.questions.length} answered
            </span>
            <button
              type="button"
              className="quiz-exit-btn"
              onClick={() => {
                if (window.confirm("Are you sure you want to exit? Your progress will be lost.")) {
                  setActiveQuiz(null);
                }
              }}
            >
              <XCircle size={16} />
              Exit
            </button>
          </div>
        </div>

        <div className="quiz-taking-container">
          {/* Progress Bar */}
          <div className="quiz-progress-bar">
            <div
              className="quiz-progress-fill"
              style={{
                width: `${((currentQuestion + 1) / activeQuiz.questions.length) * 100}%`
              }}
            />
          </div>

          {/* Question */}
          {renderQuestion(question, currentQuestion)}

          {/* Navigation */}
          <div className="quiz-navigation">
            <button
              type="button"
              className="quiz-nav-btn prev"
              onClick={goToPreviousQuestion}
              disabled={currentQuestion === 0}
            >
              <ArrowLeft size={16} />
              Previous
            </button>

            {isLastQuestion ? (
              <button
                type="button"
                className="quiz-submit-btn"
                onClick={submitQuiz}
                disabled={submitting}
              >
                <Send size={16} />
                {submitting ? "Submitting..." : "Submit Quiz"}
              </button>
            ) : (
              <button
                type="button"
                className="quiz-nav-btn next"
                onClick={goToNextQuestion}
              >
                Next
                <ChevronRight size={16} />
              </button>
            )}
          </div>

          {/* Question dots */}
          <div className="quiz-question-dots">
            {activeQuiz.questions.map((_, index) => (
              <button
                key={index}
                className={`quiz-dot ${currentQuestion === index ? 'active' : ''} 
                  ${answers[index] ? 'answered' : ''}`}
                onClick={() => setCurrentQuestion(index)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // EMPTY - No Quizzes Found
  // ==========================================

  if (quizzes.length === 0) {
    return (
      <div className="quiz-container">
        <div className="quiz-header">
          <div>
            <h1 className="quiz-title">
              <HelpCircle size={28} />
              Quizzes
            </h1>
            <p className="quiz-subtitle">
              {module?.title ? `Module: ${module.title}` : "Quizzes for this module"}
            </p>
          </div>
          <div className="quiz-header-actions">
            {courseId && (
              <button
                type="button"
                className="quiz-back-btn"
                onClick={() => navigate(`/student/player/${courseId}`)}
              >
                <ArrowLeft size={16} />
                Back to Course
              </button>
            )}
            <button
              type="button"
              className="quiz-refresh-btn"
              onClick={() => fetchQuizzes(true)}
              disabled={refreshing}
            >
              <RefreshCw size={17} className={refreshing ? "refresh-spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="quiz-empty">
          <div className="quiz-empty-icon">
            <FileQuestion size={42} />
          </div>
          <h2>No Quizzes Available</h2>
          <p>
            There are currently no quizzes available for this module.
            Check back later or contact your mentor.
          </p>
          {courseId && (
            <button
              type="button"
              className="quiz-empty-btn"
              onClick={() => navigate(`/student/player/${courseId}`)}
            >
              <BookOpen size={16} />
              Return to Course
            </button>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // QUIZ LIST
  // ==========================================

  return (
    <div className="quiz-container">

      {/* HEADER */}
      <div className="quiz-header">
        <div>
          <h1 className="quiz-title">
            <HelpCircle size={28} />
            Quizzes
          </h1>
          <p className="quiz-subtitle">
            {module?.title ? `Module: ${module.title}` : "Quizzes for this module"}
            {course?.title && <span className="quiz-course-badge"> • {course.title}</span>}
          </p>
        </div>

        <div className="quiz-header-actions">
          {courseId && (
            <button
              type="button"
              className="quiz-back-btn"
              onClick={() => navigate(`/student/player/${courseId}`)}
            >
              <ArrowLeft size={16} />
              Back to Course
            </button>
          )}
          <button
            type="button"
            className="quiz-refresh-btn"
            onClick={() => fetchQuizzes(true)}
            disabled={refreshing}
          >
            <RefreshCw size={17} className={refreshing ? "refresh-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="quiz-stats">
        <div className="quiz-stat-item">
          <FileQuestion size={16} />
          <span>Available Quizzes: <strong>{quizzes.length}</strong></span>
        </div>
      </div>

      {/* QUIZ LIST */}
      <div className="quiz-list">
        {quizzes.map((quiz) => {
          const questionCount = quiz.questionCount ?? quiz.questions?.length ?? 0;

          return (
            <div key={quiz.id} className="quiz-card">

              {/* Card Header */}
              <div className="quiz-card-header">
                <div className="quiz-icon">
                  <HelpCircle size={24} />
                </div>
                <div className="quiz-title-section">
                  <h3>{quiz.title || "Untitled Quiz"}</h3>
                  <div className="quiz-module">
                    <BookOpen size={15} />
                    <span>{module?.title || "Module Quiz"}</span>
                  </div>
                </div>
                <span className="quiz-status-badge available">
                  <PlayCircle size={14} />
                  Available
                </span>
              </div>

              {/* Card Body */}
              <div className="quiz-card-body">
                <p className="quiz-description">
                  {quiz.description?.trim()
                    ? quiz.description
                    : "No description provided for this quiz."}
                </p>

                {/* Meta Grid */}
                <div className="quiz-meta-grid">
                  <div className="quiz-meta-item">
                    <div className="quiz-meta-icon">
                      <FileQuestion size={19} />
                    </div>
                    <div>
                      <span className="quiz-meta-label">Questions</span>
                      <span className="quiz-meta-value">{questionCount}</span>
                    </div>
                  </div>

                  <div className="quiz-meta-item">
                    <div className="quiz-meta-icon">
                      <Award size={19} />
                    </div>
                    <div>
                      <span className="quiz-meta-label">Total Marks</span>
                      <span className="quiz-meta-value">
                        {quiz.totalMarks || quiz.questions?.reduce((sum, q) => sum + (q.marks || 1), 0) || 0}
                      </span>
                    </div>
                  </div>

                  <div className="quiz-meta-item">
                    <div className="quiz-meta-icon">
                      <Clock size={19} />
                    </div>
                    <div>
                      <span className="quiz-meta-label">Duration</span>
                      <span className="quiz-meta-value">
                        {quiz.duration ? `${quiz.duration} min` : "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Take Quiz Button */}
                <button
                  type="button"
                  className="quiz-take-btn"
                  onClick={() => startQuiz(quiz)}
                  disabled={!quiz.questions || quiz.questions.length === 0}
                >
                  <PlayCircle size={18} />
                  {quiz.questions && quiz.questions.length > 0 ? "Start Quiz" : "No Questions"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Quiz;