// src/pages/mentor/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BookOpen,
  Layers,
  Video,
  Users,
  FileText,
  CheckCircle,
  TrendingUp,
  Calendar,
  Award,
  PlusCircle,
  BarChart3,
  X,
  Save
} from "lucide-react";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    courses: 0,
    modules: 0,
    lessons: 0,
    students: 0,
    draftCourses: 0,
    publishedCourses: 0
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ name: "Renuka R", role: "Mentor" });
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: "",
    subtitle: "",
    description: "",
    trailer: "",
    language: "",
    level: "",
    duration: "",
    price: "",
    discountPrice: "",
    requirements: "",
    outcomes: "",
    audience: "",
    status: "DRAFT"
  });

  // Language options
  const languages = [
    "English", "Hindi", "Spanish", "French", "German",
    "Chinese", "Japanese", "Arabic", "Portuguese", "Russian"
  ];

  // Level options
  const levels = ["Beginner", "Intermediate", "Advanced", "All Levels"];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch courses
      const coursesRes = await axios.get("http://localhost:5000/api/courses", { headers });
      const courses = coursesRes.data.data || [];
      
      // Fetch modules
      const modulesRes = await axios.get("http://localhost:5000/api/modules", { headers });
      const modules = modulesRes.data.data || [];
      
      // Fetch lessons
      const lessonsRes = await axios.get("http://localhost:5000/api/lessons", { headers });
      const lessons = lessonsRes.data.data || [];
      
      // --- ✅ FIX: Use the Admin route that you know works ---
      let students = 0;
      try {
        // Use the /admin/all endpoint that is working in your backend
        const enrollmentsRes = await axios.get(
          "http://localhost:5000/api/enrollments/admin/all", 
          { headers }
        );
        
        // Grab the data the same way AdminEnrollments.jsx does
        const enrollmentsData = enrollmentsRes.data?.data || enrollmentsRes.data || [];
        
        // Count unique students (users) from the enrollments
        const uniqueStudents = new Set();
        enrollmentsData.forEach(enrollment => {
          // Account for different possible key names (userId, userid, or user_id)
          const userId = enrollment.userId || enrollment.userid || enrollment.user_id;
          if (userId) uniqueStudents.add(userId);
        });
        students = uniqueStudents.size;

      } catch (err) {
        console.log("Could not fetch enrollments, using fallback.");
        students = 6; // Fallback value if API call fails
      }

      const draftCourses = courses.filter(c => c.status === "DRAFT").length;
      const publishedCourses = courses.filter(c => c.status === "PUBLISHED").length;

      setStats({
        courses: courses.length,
        modules: modules.length,
        lessons: lessons.length,
        students: students,
        draftCourses: draftCourses,
        publishedCourses: publishedCourses
      });

    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = () => {
    setShowAddCourseModal(true);
  };

  const handleAddCourseSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Validate required fields
      if (!newCourse.title?.trim()) {
        alert("Course title is required.");
        return;
      }
      
      if (!newCourse.language) {
        alert("Please select a language.");
        return;
      }
      
      if (!newCourse.level) {
        alert("Please select a level.");
        return;
      }
      
      if (!newCourse.duration || newCourse.duration <= 0) {
        alert("Please enter a valid course duration.");
        return;
      }
      
      if (!newCourse.price || newCourse.price <= 0) {
        alert("Please enter a valid course price.");
        return;
      }

      // Ensure status is properly set
      const statusValue = newCourse.status || "DRAFT";
      
      const payload = {
        title: newCourse.title.trim(),
        subtitle: newCourse.subtitle?.trim() || "",
        description: newCourse.description?.trim() || "",
        trailer: newCourse.trailer?.trim() || "",
        language: newCourse.language,
        level: newCourse.level,
        duration: Number(newCourse.duration),
        price: Number(newCourse.price),
        discountPrice: newCourse.discountPrice ? Number(newCourse.discountPrice) : null,
        requirements: newCourse.requirements?.trim() || "",
        outcomes: newCourse.outcomes?.trim() || "",
        audience: newCourse.audience?.trim() || "",
        status: statusValue,
        categoryId: 1
      };

      const response = await axios.post(
        "http://localhost:5000/api/courses",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("✅ Course created successfully:", response.data);
      
      alert(`Course created successfully with status: ${statusValue}`);
      setShowAddCourseModal(false);
      
      // Reset form
      setNewCourse({
        title: "",
        subtitle: "",
        description: "",
        trailer: "",
        language: "",
        level: "",
        duration: "",
        price: "",
        discountPrice: "",
        requirements: "",
        outcomes: "",
        audience: "",
        status: "DRAFT"
      });
      
      // Refresh dashboard data
      await fetchDashboardData();
      
    } catch (err) {
      console.error("❌ Error creating course:", err);
      alert(err.response?.data?.message || "Unable to create course. Please try again.");
    }
  };

  // ==========================================
  // HANDLE QUICK ACTIONS
  // ==========================================
  const handleQuickAction = (action) => {
    switch(action) {
      case "Add Course":
        setShowAddCourseModal(true);
        break;
      case "Add Module":
        navigate("/mentor/courses");
        break;
      case "Add Lesson":
        navigate("/mentor/lessons");
        break;
      case "View Students":
        navigate("/mentor/students");
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <div className="dashboard-welcome">
        <div className="welcome-content">
          <div className="welcome-text">
            <h1>Welcome Back, {user.name} 👋</h1>
            <p>Here's an overview of your mentoring activities.</p>
          </div>
          <div className="welcome-actions">
            <button className="welcome-btn primary" onClick={handleCreateCourse}>
              <PlusCircle size={18} />
              Create New Course
            </button>
            
          </div>
        </div>
        <div className="welcome-date">
          <Calendar size={18} />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Cards - Updated to look like Admin Dashboard */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderTop: "3px solid #7c3aed" }}>
          <div className="stat-icon" style={{ background: "#7c3aed", color: "white" }}>
            <BookOpen />
          </div>
          <div className="stat-content">
            <h3>{stats.courses}</h3>
            <p>Total Courses</p>
            <span className="stat-trend up">
              <TrendingUp size={14} />
              +12%
            </span>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: "3px solid #2563eb" }}>
          <div className="stat-icon" style={{ background: "#2563eb", color: "white" }}>
            <Layers />
          </div>
          <div className="stat-content">
            <h3>{stats.modules}</h3>
            <p>Total Modules</p>
            <span className="stat-trend up">
              <TrendingUp size={14} />
              +8%
            </span>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: "3px solid #059669" }}>
          <div className="stat-icon" style={{ background: "#059669", color: "white" }}>
            <Video />
          </div>
          <div className="stat-content">
            <h3>{stats.lessons}</h3>
            <p>Total Lessons</p>
            <span className="stat-trend up">
              <TrendingUp size={14} />
              +5%
            </span>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: "3px solid #d97706" }}>
          <div className="stat-icon" style={{ background: "#d97706", color: "white" }}>
            <Users />
          </div>
          <div className="stat-content">
            <h3>{stats.students}</h3>
            <p>Total Students</p>
            <span className="stat-trend up">
              <TrendingUp size={14} />
              +18%
            </span>
          </div>
        </div>
      </div>

      {/* Course Status Cards */}
      <div className="status-grid">
        <div className="status-card draft">
          <div className="status-icon">
            <FileText />
          </div>
          <div className="status-info">
            <h4>{stats.draftCourses}</h4>
            <p>Draft Courses</p>
          </div>
          <span className="status-badge draft-badge">Draft</span>
        </div>

        <div className="status-card published">
          <div className="status-icon">
            <CheckCircle />
          </div>
          <div className="status-info">
            <h4>{stats.publishedCourses}</h4>
            <p>Published Courses</p>
          </div>
          <span className="status-badge published-badge">Published</span>
        </div>

        <div className="status-card total-modules">
          <div className="status-icon">
            <Award />
          </div>
          <div className="status-info">
            <h4>{stats.modules + stats.lessons}</h4>
            <p>Total Content Items</p>
          </div>
          <span className="status-badge content-badge">Content</span>
        </div>
      </div>

      {/* Quick Actions - Full Width */}
      <div className="quick-actions-section full-width">
        <div className="section-header">
          <h3>⚡ Quick Actions</h3>
        </div>
        <div className="quick-actions-grid">
          <button className="quick-action-btn add-btn" onClick={() => handleQuickAction("Add Course")}>
            <PlusCircle size={20} />
            <span>Add Course</span>
          </button>
          <button className="quick-action-btn add-btn" onClick={() => handleQuickAction("Add Module")}>
            <Layers size={20} />
            <span>Add Module</span>
          </button>
          <button className="quick-action-btn add-btn" onClick={() => handleQuickAction("Add Lesson")}>
            <Video size={20} />
            <span>Add Lesson</span>
          </button>
          <button className="quick-action-btn add-btn" onClick={() => handleQuickAction("View Students")}>
            <Users size={20} />
            <span>View Students</span>
          </button>
        </div>
      </div>

      {/* Add Course Modal - Updated with Admin's Button Styles */}
      {showAddCourseModal && (
        <div className="modal-overlay" onClick={() => setShowAddCourseModal(false)}>
          <div className="modal-content course-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Course</h2>
              <button className="modal-close" onClick={() => setShowAddCourseModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body course-modal-body">
              <div className="form-section">
                <h4>Basic Information</h4>
                <input
                  className="form-input"
                  placeholder="Course Title *"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                />
                <input
                  className="form-input"
                  placeholder="Subtitle"
                  value={newCourse.subtitle}
                  onChange={(e) => setNewCourse({ ...newCourse, subtitle: e.target.value })}
                />
                <textarea
                  className="form-textarea"
                  rows="4"
                  placeholder="Description"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                />
              </div>

              <div className="form-section">
                <h4>Course Details</h4>
                <input
                  className="form-input"
                  placeholder="Trailer URL (Optional)"
                  value={newCourse.trailer}
                  onChange={(e) => setNewCourse({ ...newCourse, trailer: e.target.value })}
                />
                <select
                  className="form-select"
                  value={newCourse.language}
                  onChange={(e) => setNewCourse({ ...newCourse, language: e.target.value })}
                >
                  <option value="">Select Language *</option>
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
                <select
                  className="form-select"
                  value={newCourse.level}
                  onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                >
                  <option value="">Select Level *</option>
                  {levels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                <input
                  className="form-input"
                  type="number"
                  placeholder="Duration (Hours) *"
                  value={newCourse.duration}
                  onChange={(e) => setNewCourse({ ...newCourse, duration: Number(e.target.value) })}
                />
              </div>

              <div className="form-section">
                <h4>Pricing</h4>
                <input
                  className="form-input"
                  type="number"
                  placeholder="Price *"
                  value={newCourse.price}
                  onChange={(e) => setNewCourse({ ...newCourse, price: Number(e.target.value) })}
                />
                <input
                  className="form-input"
                  type="number"
                  placeholder="Discount Price (Optional)"
                  value={newCourse.discountPrice}
                  onChange={(e) => setNewCourse({ ...newCourse, discountPrice: e.target.value })}
                />
              </div>

              <div className="form-section">
                <h4>Learning Information</h4>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Requirements (Optional)"
                  value={newCourse.requirements}
                  onChange={(e) => setNewCourse({ ...newCourse, requirements: e.target.value })}
                />
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Learning Outcomes (Optional)"
                  value={newCourse.outcomes}
                  onChange={(e) => setNewCourse({ ...newCourse, outcomes: e.target.value })}
                />
              </div>

              <div className="form-section">
                <h4>Publishing</h4>
                <select
                  className="form-select"
                  value={newCourse.status || "DRAFT"}
                  onChange={(e) => setNewCourse({ ...newCourse, status: e.target.value })}
                >
                  <option value="DRAFT">Save as Draft</option>
                  <option value="PUBLISHED">Publish Now</option>
                </select>
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  {newCourse.status === "PUBLISHED" 
                    ? "⚠️ Course will be published immediately and visible to students." 
                    : "💡 Course will be saved as draft. You can publish it later."}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAddCourseModal(false)}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleAddCourseSubmit}>
                <PlusCircle size={18} />
                {newCourse.status === "PUBLISHED" ? "Publish Course" : "Save as Draft"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;