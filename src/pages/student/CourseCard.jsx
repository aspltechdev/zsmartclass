// src/components/student/CourseCard.jsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "./CourseCard.css";

function CourseCard({ course, showProgress = false }) {
  const progress = course.progress || 0;

  return (
    <motion.div
      className="course-card"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <div className="course-card-thumbnail">
        <img 
          src={course.thumbnail || "/default-course.jpg"} 
          alt={course.title}
        />
        {showProgress && (
          <div className="course-progress-overlay">
            <div className="mini-progress-bar">
              <div 
                className="mini-progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="mini-progress-text">{progress}%</span>
          </div>
        )}
      </div>
      <div className="course-card-body">
        <h4 className="course-card-title">{course.title}</h4>
        <p className="course-card-instructor">{course.instructor?.name}</p>
        
        {showProgress && (
          <div className="course-card-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="progress-text">{progress}% Complete</span>
          </div>
        )}

        <Link 
          to={`/student/course/${course.id}`}
          className="course-card-btn"
        >
          {progress > 0 ? 'Continue Learning' : 'Start Course'}
        </Link>
      </div>
    </motion.div>
  );
}

export default CourseCard;