import React, { useEffect, useState } from "react";
import {
  FileText,
  Calendar,
  Award,
  BookOpen,
  AlertCircle,
  RefreshCw
} from "lucide-react";

import api from "../../services/api";
import "./Assignments.css";
import "./StudentShared.css";

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("Fetching student assignments...");

      const response = await api.get("/assignments");

      console.log("Assignments response:", response);

      /*
        Axios response:
        response.data = {
          success: true,
          data: [...]
        }
      */

      if (response.data?.success) {
        setAssignments(response.data.data || []);
      } else {
        setError(
          response.data?.message || "Unable to load assignments."
        );
      }
    } catch (err) {
      console.error("Failed to load assignments:", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to load assignments."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return "No due date";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "No due date";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  const formatTime = (date) => {
    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) {
      return false;
    }

    return new Date(dueDate).getTime() < Date.now();
  };

  /* ==============================
     LOADING
  ============================== */

  if (loading) {
    return (
      <div className="assignments-loading">
        <div className="assignment-spinner"></div>
        <p>Loading assignments...</p>
      </div>
    );
  }

  /* ==============================
     ERROR
  ============================== */

  if (error) {
    return (
      <div className="assignments-error">
        <AlertCircle size={48} />

        <h2>Unable to load assignments</h2>

        <p>{error}</p>

        <button
          type="button"
          className="assignment-retry-btn"
          onClick={fetchAssignments}
        >
          <RefreshCw size={17} />
          Try Again
        </button>
      </div>
    );
  }

  /* ==============================
     EMPTY
  ============================== */

  if (assignments.length === 0) {
    return (
      <div className="assignments-container">

        <div className="assignments-header">
          <div>
            <h1 className="assignments-title">
              Assignments
            </h1>

            <p className="assignments-subtitle">
              View your assignments and their details
            </p>
          </div>
        </div>

        <div className="assignments-empty">
          <div className="assignments-empty-icon">
            <FileText size={42} />
          </div>

          <h2>No Assignments Available</h2>

          <p>
            There are currently no assignments available.
          </p>
        </div>

      </div>
    );
  }

  /* ==============================
     MAIN
  ============================== */

  return (
    <div className="assignments-container">

      {/* ==============================
          HEADER
      ============================== */}

      <div className="assignments-header">

        <div>
          <h1 className="assignments-title">
            Assignments
          </h1>

          <p className="assignments-subtitle">
            View your assignments and their details
          </p>
        </div>

        <div className="assignments-count">
          <FileText size={18} />

          <span>
            {assignments.length}{" "}
            {assignments.length === 1
              ? "Assignment"
              : "Assignments"}
          </span>
        </div>

      </div>


      {/* ==============================
          ASSIGNMENT LIST
      ============================== */}

      <div className="assignments-list">

        {assignments.map((assignment) => {

          const overdue = isOverdue(
            assignment.dueDate
          );

          return (
            <div
              key={assignment.id}
              className="assignment-card"
            >

              {/* ==========================
                  CARD HEADER
              ========================== */}

              <div className="assignment-header">

                <div className="assignment-title-section">

                  <div className="assignment-icon">
                    <FileText size={24} />
                  </div>

                  <div>
                    <h2 className="assignment-title">
                      {assignment.title ||
                        "Untitled Assignment"}
                    </h2>

                    <div className="assignment-course">
                      <BookOpen size={15} />

                      <span>
                        {assignment.course?.title ||
                          assignment.Course?.title ||
                          "Course"}
                      </span>
                    </div>
                  </div>

                </div>

                {/* STATUS */}

                {overdue && (
                  <span className="assignment-overdue">
                    Overdue
                  </span>
                )}

              </div>


              {/* ==========================
                  DESCRIPTION
              ========================== */}

              <div className="assignment-body">

                <div className="assignment-description">

                  <h3>Assignment Details</h3>

                  <p>
                    {assignment.description?.trim()
                      ? assignment.description
                      : "No description provided for this assignment."}
                  </p>

                </div>


                {/* ==========================
                    META INFORMATION
                ========================== */}

                <div className="assignment-meta-grid">

                  {/* DUE DATE */}

                  <div className="meta-item">

                    <div className="meta-icon">
                      <Calendar size={19} />
                    </div>

                    <div>
                      <span className="meta-label">
                        Due Date
                      </span>

                      <span className="meta-value">
                        {formatDate(
                          assignment.dueDate
                        )}
                      </span>

                      {assignment.dueDate && (
                        <span className="meta-subvalue">
                          {formatTime(
                            assignment.dueDate
                          )}
                        </span>
                      )}
                    </div>

                  </div>


                  {/* TOTAL MARKS */}

                  <div className="meta-item">

                    <div className="meta-icon">
                      <Award size={19} />
                    </div>

                    <div>
                      <span className="meta-label">
                        Total Marks
                      </span>

                      <span className="meta-value">
                        {assignment.totalMarks ?? 0}
                      </span>
                    </div>

                  </div>


                  {/* COURSE */}

                  <div className="meta-item">

                    <div className="meta-icon">
                      <BookOpen size={19} />
                    </div>

                    <div>
                      <span className="meta-label">
                        Course
                      </span>

                      <span className="meta-value">
                        {assignment.course?.title ||
                          assignment.Course?.title ||
                          "Course"}
                      </span>
                    </div>

                  </div>

                </div>

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
};

export default Assignments;