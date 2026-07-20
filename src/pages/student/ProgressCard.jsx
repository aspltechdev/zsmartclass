// src/components/student/ProgressCard.jsx
import { motion } from "framer-motion";
import "./ProgressCard.css";

function ProgressCard({ course }) {
  const progress = course.progress || 0;
  const completedLessons = course.completedLessons || 0;
  const totalLessons = course.totalLessons || 0;

  return (
    <motion.div
      className="progress-card"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="progress-card-header">
        <h4>{course.title}</h4>
        <span className="progress-percentage">{progress}%</span>
      </div>
      
      <div className="progress-bar-large">
        <div 
          className="progress-fill-large" 
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="progress-stats">
        <span>{completedLessons}/{totalLessons} Lessons</span>
        <Link to={`/student/course/${course.id}`} className="continue-link">
          Continue →
        </Link>
      </div>
    </motion.div>
  );
}

export default ProgressCard;