// src/components/student/DashboardCard.jsx
import { motion } from "framer-motion";
import "./DashboardCard.css";

function DashboardCard({ title, value, icon, color }) {
  return (
    <motion.div
      className="dashboard-card"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
      style={{ borderTop: `4px solid ${color}` }}
    >
      <div className="card-icon" style={{ background: `${color}20`, color }}>
        {icon}
      </div>
      <div className="card-content">
        <h4 className="card-value">{value}</h4>
        <p className="card-title">{title}</p>
      </div>
    </motion.div>
  );
}

export default DashboardCard;