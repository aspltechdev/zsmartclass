import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./Modules.css";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  Eye,
  ChevronDown,
  ChevronRight
} from "lucide-react";

function Modules() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModule, setShowAddModule] = useState(false);
  const [showEditModule, setShowEditModule] = useState(false);
  const [showViewModule, setShowViewModule] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  
  const [newModule, setNewModule] = useState({
    title: "",
    description: "",
    position: "",
    courseId: courseId
  });
  
  const [editModule, setEditModule] = useState({
    id: "",
    title: "",
    description: "",
    position: ""
  });

  // Function to get course ID from various sources
  const getCourseId = () => {
    // Try 1: From URL params
    if (courseId && !isNaN(courseId)) {
      return courseId;
    }
    
    // Try 2: From URL path
    const pathParts = window.location.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && !isNaN(lastPart)) {
      return lastPart;
    }
    
    // Try 3: From URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const idFromQuery = urlParams.get('courseId');
    if (idFromQuery && !isNaN(idFromQuery)) {
      return idFromQuery;
    }
    
    // Try 4: From state (if passed via navigate)
    if (location.state && location.state.courseId) {
      return location.state.courseId;
    }
    
    return null;
  };

  useEffect(() => {
    const id = getCourseId();
    console.log("Final course ID:", id);
    
    if (id) {
      setNewModule(prev => ({ ...prev, courseId: id }));
      fetchCourseDetails(id);
      fetchModules(id);
    } else {
      console.error("No courseId found");
      setError("No course ID provided. Please select a course first.");
      setLoading(false);
    }
  }, [courseId, location]);

  const fetchCourseDetails = async (id) => {
    try {
      const token = localStorage.getItem("token");
      console.log("Fetching course details for ID:", id);
      
      const response = await axios.get(
        `http://localhost:5000/api/courses/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      console.log("Course details:", response.data);
      setCourse(response.data.data);
    } catch (err) {
      console.error("Error fetching course details:", err);
    }
  };

  const fetchModules = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      console.log("Fetching modules for course ID:", id);
      
      const response = await axios.get(
        `http://localhost:5000/api/modules/course/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log("Modules response:", response.data);
      const moduleData = response.data.data || [];
      console.log("Modules data:", moduleData);
      
      moduleData.sort((a, b) => a.position - b.position);
      setModules(moduleData);
      
      const expanded = {};
      moduleData.forEach(module => {
        expanded[module.id] = true;
      });
      setExpandedModules(expanded);
    } catch (err) {
      console.error("Error fetching modules:", err);
      console.error("Error response:", err.response?.data);
      setError(err.response?.data?.message || "Failed to load modules");
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  const getNextModulePosition = () => {
    if (modules.length === 0) return 1;
    const maxPosition = Math.max(...modules.map(m => m.position));
    return maxPosition + 1;
  };

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const createModule = async () => {
    try {
      const token = localStorage.getItem("token");
      const id = getCourseId();
      
      if (!newModule.title?.trim()) {
        alert("Module title is required.");
        return;
      }

      if (!id) {
        alert("Course ID is missing.");
        return;
      }

      await axios.post(
        "http://localhost:5000/api/modules",
        {
          title: newModule.title.trim(),
          description: newModule.description?.trim() || "",
          position: Number(newModule.position) || getNextModulePosition(),
          courseId: Number(id)
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      alert("Module created successfully.");
      setShowAddModule(false);
      setNewModule({
        title: "",
        description: "",
        position: "",
        courseId: id
      });
      fetchModules(id);
    } catch (err) {
      console.log(err);
      alert(
        err.response?.data?.message ||
        "Unable to create module."
      );
    }
  };

  const updateModule = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!editModule.title?.trim()) {
        alert("Module title is required.");
        return;
      }

      await axios.put(
        `http://localhost:5000/api/modules/${editModule.id}`,
        {
          title: editModule.title.trim(),
          description: editModule.description?.trim() || "",
          position: Number(editModule.position)
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      alert("Module updated successfully.");
      setShowEditModule(false);
      const id = getCourseId();
      if (id) fetchModules(id);
    } catch (err) {
      console.log(err);
      alert(
        err.response?.data?.message ||
        "Unable to update module."
      );
    }
  };

  const deleteModule = async (id) => {
    if (!window.confirm("Are you sure you want to delete this module?")) return;
    
    try {
      const token = localStorage.getItem("token");
      
      await axios.delete(
        `http://localhost:5000/api/modules/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      alert("Module deleted successfully.");
      const courseId = getCourseId();
      if (courseId) fetchModules(courseId);
    } catch (err) {
      console.log(err);
      alert(
        err.response?.data?.message ||
        "Unable to delete module."
      );
    }
  };

  const handleViewModule = (module) => {
    setSelectedModule(module);
    setShowViewModule(true);
  };

  const goBack = () => {
    navigate("/mentor/courses");
  };

  if (loading) {
    return (
      <div className="modules-page">
        <div className="modules-loading">
          <div className="loading-spinner"></div>
          <p>Loading modules...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modules-page">
        <div className="modules-error">
          <h3>Error Loading Modules</h3>
          <p>{error}</p>
          <button onClick={() => {
            const id = getCourseId();
            if (id) {
              fetchModules(id);
            } else {
              setError("Still no course ID found. Please go back and select a course.");
            }
          }} className="retry-btn">
            Retry
          </button>
          <button onClick={goBack} className="back-btn-secondary">
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modules-page">
      <div className="modules-header">
        <div className="modules-header-left">
          <button className="back-btn" onClick={goBack}>
            <ArrowLeft size={20} />
            Back to Courses
          </button>
          <div className="course-info-header">
            <h1>{course?.title || "Course Modules"}</h1>
            {course && (
              <span className={`course-status ${course.status?.toLowerCase()}`}>
                {course.status || "DRAFT"}
              </span>
            )}
          </div>
        </div>
        <button
          className="add-module-btn"
          onClick={() => {
            const id = getCourseId();
            setNewModule({
              title: "",
              description: "",
              position: getNextModulePosition(),
              courseId: id
            });
            setShowAddModule(true);
          }}
        >
          <Plus size={18} />
          Add Module
        </button>
      </div>

      {course?.subtitle && (
        <p className="course-subtitle-text">{course.subtitle}</p>
      )}

      <div className="modules-stats">
        <span>Total Modules: {modules.length}</span>
        <span>Total Lessons: {modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)}</span>
      </div>

      <div className="modules-container">
        {modules.length > 0 ? (
          modules.map((module) => (
            <div key={module.id} className="module-card">
              <div className="module-card-header">
                <div 
                  className="module-card-left"
                  onClick={() => toggleModule(module.id)}
                >
                  <button className="expand-btn">
                    {expandedModules[module.id] ? (
                      <ChevronDown size={20} />
                    ) : (
                      <ChevronRight size={20} />
                    )}
                  </button>
                  <div className="module-badge">
                    Module {module.position}
                  </div>
                  <h3 className="module-title">{module.title}</h3>
                  <span className="lesson-count-badge">
                    {module.lessons?.length || 0} Lessons
                  </span>
                </div>
                <div className="module-card-actions">
                  <button
                    className="module-action-btn view-module-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewModule(module);
                    }}
                    title="View Module"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="module-action-btn edit-module-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditModule({
                        id: module.id,
                        title: module.title,
                        description: module.description || "",
                        position: module.position
                      });
                      setShowEditModule(true);
                    }}
                    title="Edit Module"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="module-action-btn delete-module-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteModule(module.id);
                    }}
                    title="Delete Module"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {expandedModules[module.id] && (
                <div className="lessons-section">
                  {module.lessons && module.lessons.length > 0 ? (
                    <div className="lessons-list">
                      {module.lessons.map((lesson) => (
                        <div key={lesson.id} className="lesson-item">
                          <span className="lesson-position">
                            {module.position}.{lesson.position || 1}
                          </span>
                          <span className="lesson-title">{lesson.title}</span>
                          {lesson.duration && (
                            <span className="lesson-duration">
                              ⏱ {lesson.duration} min
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-lessons">
                      <p>No lessons in this module yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="no-modules">
            <div className="no-modules-content">
              <h3>No Modules Yet</h3>
              <p>Start by adding your first module to this course.</p>
              <button
                className="add-module-btn-primary"
                onClick={() => {
                  const id = getCourseId();
                  setNewModule({
                    title: "",
                    description: "",
                    position: 1,
                    courseId: id
                  });
                  setShowAddModule(true);
                }}
              >
                <Plus size={18} />
                Add First Module
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Module Modal */}
      {showAddModule && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Add Module</h2>
            <label>Module Title *</label>
            <input
              placeholder="Enter module title"
              value={newModule.title}
              onChange={(e) =>
                setNewModule({
                  ...newModule,
                  title: e.target.value
                })
              }
            />
            <label>Description</label>
            <textarea
              rows="4"
              placeholder="Enter module description (optional)"
              value={newModule.description}
              onChange={(e) =>
                setNewModule({
                  ...newModule,
                  description: e.target.value
                })
              }
            />
            <label>Position</label>
            <input
              type="number"
              min="1"
              value={newModule.position}
              onChange={(e) =>
                setNewModule({
                  ...newModule,
                  position: e.target.value
                })
              }
              placeholder={`Current modules: ${modules.length} (Next: ${getNextModulePosition()})`}
            />
            <small className="position-hint">
              {newModule.position && modules.some(m => m.position >= Number(newModule.position)) 
                ? "⚠️ This position will shift existing modules down" 
                : "✓ Position available"}
            </small>
            <div className="popup-buttons">
              <button className="save-btn" onClick={createModule}>
                Create Module
              </button>
              <button
                className="close-btn"
                onClick={() => setShowAddModule(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Module Modal */}
      {showEditModule && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Edit Module</h2>
            <label>Module Title *</label>
            <input
              placeholder="Enter module title"
              value={editModule.title}
              onChange={(e) =>
                setEditModule({
                  ...editModule,
                  title: e.target.value
                })
              }
            />
            <label>Description</label>
            <textarea
              rows="4"
              placeholder="Enter module description (optional)"
              value={editModule.description}
              onChange={(e) =>
                setEditModule({
                  ...editModule,
                  description: e.target.value
                })
              }
            />
            <label>Position</label>
            <input
              type="number"
              min="1"
              value={editModule.position}
              onChange={(e) =>
                setEditModule({
                  ...editModule,
                  position: e.target.value
                })
              }
            />
            <small className="position-hint">
              {editModule.position && modules.some(m => m.id !== editModule.id && m.position >= Number(editModule.position)) 
                ? "⚠️ This position will shift existing modules" 
                : "✓ Position available"}
            </small>
            <div className="popup-buttons">
              <button className="save-btn" onClick={updateModule}>
                Save Changes
              </button>
              <button
                className="close-btn"
                onClick={() => setShowEditModule(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Module Modal */}
      {showViewModule && selectedModule && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Module Details</h2>
            <div className="module-view-details">
              <div>
                <label>Module Title</label>
                <p>{selectedModule.title}</p>
              </div>
              <div>
                <label>Position</label>
                <p>Module {selectedModule.position}</p>
              </div>
              <div>
                <label>Description</label>
                <p>{selectedModule.description || "No description provided."}</p>
              </div>
              <div>
                <label>Lessons</label>
                <p>{selectedModule.lessons?.length || 0} lessons</p>
              </div>
              {selectedModule.lessons && selectedModule.lessons.length > 0 && (
                <div>
                  <label>Lesson List</label>
                  <ul className="lesson-list-view">
                    {selectedModule.lessons.map((lesson) => (
                      <li key={lesson.id}>
                        <span className="lesson-number">
                          {selectedModule.position}.{lesson.position || 1}
                        </span>
                        {lesson.title}
                        {lesson.duration && (
                          <span className="lesson-duration-badge">
                            ⏱ {lesson.duration} min
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="popup-buttons">
              <button
                className="close-btn"
                onClick={() => setShowViewModule(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Modules;