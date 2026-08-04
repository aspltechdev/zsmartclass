import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Courses.css";
import {
  Eye,
  Pencil,
  Plus,
  Trash2
} from "lucide-react";

function MentorCourses() {
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showModuleView, setShowModuleView] = useState(false);
  const [editCourse, setEditCourse] = useState({});
  const [showAddModule, setShowAddModule] = useState(false);
  const [showEditModule, setShowEditModule] = useState(false);
  const [newModule, setNewModule] = useState({
    title: "",
    description: "",
    position: "",
    courseId: ""
  });
  const [editModule, setEditModule] = useState({
    id: "",
    title: "",
    description: "",
    position: ""
  });
  const [showAddCourse, setShowAddCourse] = useState(false);
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
    "English",
    "Hindi",
    "Spanish",
    "French",
    "German",
    "Chinese",
    "Japanese",
    "Arabic",
    "Portuguese",
    "Russian"
  ];

  // Level options
  const levels = [
    "Beginner",
    "Intermediate",
    "Advanced",
    "All Levels"
  ];

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/courses",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const courseData = response.data.data || [];
      setCourses(courseData);
      courseData.forEach((course) => {
        fetchModules(course.id);
      });
    } catch (err) {
      console.log(err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async (courseId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/modules/course/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setModules((prev) => ({
        ...prev,
        [courseId]: response.data.data || []
      }));
    } catch (err) {
      console.log(err);
    }
  };

  // Function to reorder modules when a module is added/deleted/updated
  const reorderModules = async (courseId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/modules/course/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      const modulesList = response.data.data || [];
      const sortedModules = [...modulesList].sort((a, b) => a.position - b.position);
      
      for (let i = 0; i < sortedModules.length; i++) {
        const newPosition = i + 1;
        if (sortedModules[i].position !== newPosition) {
          await axios.put(
            `http://localhost:5000/api/modules/${sortedModules[i].id}`,
            {
              title: sortedModules[i].title,
              description: sortedModules[i].description,
              position: newPosition
            },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
        }
      }
      
      fetchModules(courseId);
    } catch (err) {
      console.log("Error reordering modules:", err);
    }
  };

  const createModule = async () => {
    try {
      const token = localStorage.getItem("token");
      const courseId = Number(newModule.courseId);
      
      const response = await axios.get(
        `http://localhost:5000/api/modules/course/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      const currentModules = response.data.data || [];
      const maxPosition = currentModules.length > 0 
        ? Math.max(...currentModules.map(m => m.position)) 
        : 0;
      
      let position = Number(newModule.position);
      if (!position || position <= 0) {
        position = maxPosition + 1;
      }
      
      const positionExists = currentModules.some(m => m.position === position);
      if (positionExists) {
        const modulesToShift = currentModules.filter(m => m.position >= position);
        for (const module of modulesToShift) {
          await axios.put(
            `http://localhost:5000/api/modules/${module.id}`,
            {
              title: module.title,
              description: module.description,
              position: module.position + 1
            },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
        }
      }
      
      await axios.post(
        "http://localhost:5000/api/modules",
        {
          title: newModule.title,
          description: newModule.description,
          position: position,
          courseId: courseId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      await reorderModules(courseId);
      
      alert("Module created successfully.");
      setShowAddModule(false);
      setNewModule({
        title: "",
        description: "",
        position: "",
        courseId: ""
      });
      fetchCourses();
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
      const moduleId = Number(editModule.id);
      const newPosition = Number(editModule.position);
      
      const currentModuleResponse = await axios.get(
        `http://localhost:5000/api/modules/${moduleId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      const currentModule = currentModuleResponse.data.data;
      const courseId = currentModule.courseId;
      
      const response = await axios.get(
        `http://localhost:5000/api/modules/course/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      const allModules = response.data.data || [];
      const oldPosition = currentModule.position;
      
      if (newPosition !== oldPosition && newPosition > 0) {
        if (newPosition < oldPosition) {
          const modulesToShift = allModules.filter(
            m => m.position >= newPosition && m.position < oldPosition && m.id !== moduleId
          );
          for (const module of modulesToShift) {
            await axios.put(
              `http://localhost:5000/api/modules/${module.id}`,
              {
                title: module.title,
                description: module.description,
                position: module.position + 1
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );
          }
        } else if (newPosition > oldPosition) {
          const modulesToShift = allModules.filter(
            m => m.position > oldPosition && m.position <= newPosition && m.id !== moduleId
          );
          for (const module of modulesToShift) {
            await axios.put(
              `http://localhost:5000/api/modules/${module.id}`,
              {
                title: module.title,
                description: module.description,
                position: module.position - 1
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );
          }
        }
      }
      
      await axios.put(
        `http://localhost:5000/api/modules/${moduleId}`,
        {
          title: editModule.title,
          description: editModule.description,
          position: newPosition > 0 ? newPosition : oldPosition
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      await reorderModules(courseId);
      
      alert("Module updated successfully.");
      setShowEditModule(false);
      fetchCourses();
    } catch (err) {
      console.log(err);
      alert(
        err.response?.data?.message ||
        "Unable to update module."
      );
    }
  };

  const deleteModule = async (id) => {
    if (!window.confirm("Delete this module?")) return;
    try {
      const token = localStorage.getItem("token");
      
      const moduleResponse = await axios.get(
        `http://localhost:5000/api/modules/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      const module = moduleResponse.data.data;
      const courseId = module.courseId;
      
      await axios.delete(
        `http://localhost:5000/api/modules/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      await reorderModules(courseId);
      setShowModuleView(false);
      alert("Module deleted successfully.");
      fetchCourses();
    } catch (err) {
      console.log(err);
      alert(
        err.response?.data?.message ||
        "Unable to delete module."
      );
    }
  };

  const deleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/courses/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setShowView(false);
      alert("Course deleted successfully.");
      fetchCourses();
    } catch (err) {
      console.log(err);
      alert(
        err.response?.data?.message ||
        "Unable to delete course."
      );
    }
  };

  const handleView = (course) => {
    setSelectedCourse(course);
    setShowView(true);
  };

  const handleModuleView = (module) => {
    setSelectedModule(module);
    setShowModuleView(true);
  };

  const handleEdit = (course) => {
    setEditCourse({ ...course });
    setShowEdit(true);
  };

  const handleModuleEdit = (module) => {
    setEditModule({
      id: module.id,
      title: module.title,
      description: module.description,
      position: module.position
    });
    setShowEditModule(true);
  };

  const saveCourse = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        title: editCourse.title,
        subtitle: editCourse.subtitle,
        description: editCourse.description,
        language: editCourse.language,
        level: editCourse.level,
        duration: Number(editCourse.duration),
        price: Number(editCourse.price),
        discountPrice: editCourse.discountPrice ? Number(editCourse.discountPrice) : null,
        requirements: editCourse.requirements,
        outcomes: editCourse.outcomes,
        audience: editCourse.audience,
        status: editCourse.status,
        categoryId: 1
      };

      await axios.put(
        `http://localhost:5000/api/courses/${editCourse.id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      alert("Course updated successfully.");
      setShowEdit(false);
      fetchCourses();
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || err.message);
    }
  };

  const addCourse = async () => {
    try {
      const token = localStorage.getItem("token");
      
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
        status: newCourse.status || "DRAFT",
        categoryId: 1
      };

      await axios.post(
        "http://localhost:5000/api/courses",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      alert("Course created successfully.");
      setShowAddCourse(false);
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
      fetchCourses();
    } catch (err) {
      console.error("Error creating course:", err);
      alert(err.response?.data?.message || "Unable to create course.");
    }
  };

  const getNextModulePosition = (courseId) => {
    const courseModules = modules[courseId] || [];
    if (courseModules.length === 0) return 1;
    const maxPosition = Math.max(...courseModules.map(m => m.position));
    return maxPosition + 1;
  };

  if (loading) {
    return <h3>Loading Courses...</h3>;
  }

  return (
    <div className="mentor-courses">
      {/* Header */}
      <div className="courses-header">
        <div>
          <h1>My Courses</h1>
          <p>Create, manage and organize your courses.</p>
        </div>
        <button
          className="add-course-btn"
          onClick={() => setShowAddCourse(true)}
        >
          <Plus size={18} />
          Add Course
        </button>
      </div>

      {/* Course Cards */}
      <div className="courses-container">
        {courses.length > 0 ? (
          courses.map((course) => (
            <div key={course.id} className="course-card">
              {/* Course Header */}
              <div className="course-card-header">
                <div className="course-info">
                  <h2 className="course-title">{course.title}</h2>
                  <p className="course-subtitle">{course.subtitle || "No subtitle"}</p>
                </div>
                <div className="course-meta">
                  <span className={`status-badge ${course.status?.toLowerCase()}`}>
                    {course.status || "DRAFT"}
                  </span>
                  <button
                    className="view-btn-header"
                    onClick={() => handleView(course)}
                    title="View Course"
                  >
                    <Eye size={16} />
                    View
                  </button>
                  <span className="course-stats">
                    👥 {course.students ?? 0}
                  </span>
                  <span className="course-stats">
                    📅 {course.createdAt ?
                      new Date(course.createdAt).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        }
                      )
                      : "-"
                    }
                  </span>
                </div>
              </div>

              {/* Modules Section */}
              <div className="modules-section">
                <div className="modules-header">
                  <h4>📚 Modules</h4>
                  <span className="module-count">
                    {modules[course.id]?.length || 0} modules
                  </span>
                  <button
                    className="add-module-btn"
                    onClick={() => {
                      const nextPosition = getNextModulePosition(course.id);
                      setNewModule({
                        title: "",
                        description: "",
                        position: nextPosition,
                        courseId: course.id
                      });
                      setShowAddModule(true);
                    }}
                  >
                    <Plus size={16} />
                    Add Module
                  </button>
                </div>

                {modules[course.id] && modules[course.id].length > 0 ? (
                  <div className="modules-list">
                    {modules[course.id]
                      .sort((a, b) => a.position - b.position)
                      .map((module) => (
                        <div key={module.id} className="module-item">
                          <div className="module-item-header">
                            <div className="module-info">
                              <h5>Module {module.position}: {module.title}</h5>
                              <span className="lesson-count">
                                {module.lessons?.length || 0} Lessons
                              </span>
                              <button
                                className="module-view-btn"
                                onClick={() => handleModuleView(module)}
                                title="View Module"
                              >
                                <Eye size={14} />
                              </button>
                            </div>
                          </div>
                          {module.lessons && module.lessons.length > 0 && (
                            <div className="lessons-container">
                              {module.lessons.map((lesson) => (
                                <span key={lesson.id} className="lesson-tag">
                                  {lesson.title}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="no-modules">
                    <p>No modules available</p>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-courses">
            <p>No Courses Found. Start by adding your first course!</p>
          </div>
        )}
      </div>

      {/* View Course Modal */}
      {showView && selectedCourse && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Course Details</h2>
            
            <div className="view-grid">
              <div>
                <label>Course Title</label>
                <p>{selectedCourse.title}</p>
              </div>
              <div>
                <label>Subtitle</label>
                <p>{selectedCourse.subtitle || "-"}</p>
              </div>
              <div>
                <label>Language</label>
                <p>{selectedCourse.language}</p>
              </div>
              <div>
                <label>Level</label>
                <p>{selectedCourse.level}</p>
              </div>
              <div>
                <label>Duration</label>
                <p>{selectedCourse.duration} Hours</p>
              </div>
              <div>
                <label>Price</label>
                <p>₹{selectedCourse.price}</p>
              </div>
              <div>
                <label>Discount Price</label>
                <p>₹{selectedCourse.discountPrice || "N/A"}</p>
              </div>
              <div>
                <label>Status</label>
                <p>{selectedCourse.status}</p>
              </div>
            </div>

            <label>Description</label>
            <div className="description-box">
              {selectedCourse.description || "No description available."}
            </div>

            <label>Requirements</label>
            <div className="description-box">
              {selectedCourse.requirements || "No requirements specified."}
            </div>

            <label>Learning Outcomes</label>
            <div className="description-box">
              {selectedCourse.outcomes || "No learning outcomes specified."}
            </div>

            <div className="popup-buttons">
              <button
                className="edit-btn"
                onClick={() => {
                  setShowView(false);
                  handleEdit(selectedCourse);
                }}
              >
                <Pencil size={16} />
                Edit Course
              </button>
              <button
                className="delete-btn"
                onClick={() => deleteCourse(selectedCourse.id)}
              >
                <Trash2 size={16} />
                Delete Course
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

      {/* View Module Modal */}
      {showModuleView && selectedModule && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Module Details</h2>
            
            <div className="view-grid">
              <div>
                <label>Module Title</label>
                <p>{selectedModule.title}</p>
              </div>
              <div>
                <label>Course</label>
                <p>{selectedModule.course?.title}</p>
              </div>
              <div>
                <label>Position</label>
                <p>{selectedModule.position}</p>
              </div>
              <div>
                <label>Lessons</label>
                <p>{selectedModule.lessons?.length || 0}</p>
              </div>
            </div>

            <label>Description</label>
            <div className="description-box">
              {selectedModule.description || "No description available."}
            </div>

            {selectedModule.lessons && selectedModule.lessons.length > 0 && (
              <>
                <label>Lessons</label>
                <div className="lessons-list-view">
                  {selectedModule.lessons.map((lesson) => (
                    <div key={lesson.id} className="lesson-item-view">
                      <span className="lesson-number">{lesson.position}</span>
                      <span className="lesson-name">{lesson.title}</span>
                      <span className="lesson-duration">{lesson.duration} mins</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="popup-buttons">
              <button
                className="edit-btn"
                onClick={() => {
                  setShowModuleView(false);
                  handleModuleEdit(selectedModule);
                }}
              >
                <Pencil size={16} />
                Edit Module
              </button>
              <button
                className="delete-btn"
                onClick={() => deleteModule(selectedModule.id)}
              >
                <Trash2 size={16} />
                Delete Module
              </button>
              <button
                className="close-btn"
                onClick={() => setShowModuleView(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEdit && (
        <div className="popup-overlay">
          <div className="popup popup-large">
            <h2>Edit Course</h2>
            
            <h3 className="section-title">Basic Information</h3>
            <input
              placeholder="Course Title *"
              value={editCourse.title || ""}
              onChange={(e) =>
                setEditCourse({
                  ...editCourse,
                  title: e.target.value
                })
              }
            />
            <input
              placeholder="Subtitle"
              value={editCourse.subtitle || ""}
              onChange={(e) =>
                setEditCourse({
                  ...editCourse,
                  subtitle: e.target.value
                })
              }
            />
            <textarea
              rows="5"
              placeholder="Description"
              value={editCourse.description || ""}
              onChange={(e) =>
                setEditCourse({
                  ...editCourse,
                  description: e.target.value
                })
              }
            />

            <h3 className="section-title">Course Details</h3>
            <input
              placeholder="Trailer URL (Optional)"
              value={editCourse.trailer || ""}
              onChange={(e) =>
                setEditCourse({
                  ...editCourse,
                  trailer: e.target.value
                })
              }
            />

            <select
              value={editCourse.language || ""}
              onChange={(e) =>
                setEditCourse({
                  ...editCourse,
                  language: e.target.value
                })
              }
              className="form-select"
            >
              <option value="">Select Language *</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>

            <select
              value={editCourse.level || ""}
              onChange={(e) =>
                setEditCourse({
                  ...editCourse,
                  level: e.target.value
                })
              }
              className="form-select"
            >
              <option value="">Select Level *</option>
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Duration (Hours) *"
              value={editCourse.duration || ""}
              onChange={(e) =>
                setEditCourse({
                  ...editCourse,
                  duration: Number(e.target.value)
                })
              }
            />

            <h3 className="section-title">Pricing</h3>
            <input
              type="number"
              placeholder="Price *"
              value={editCourse.price || ""}
              onChange={(e) =>
                setEditCourse({
                  ...editCourse,
                  price: Number(e.target.value)
                })
              }
            />
            <input
              type="number"
              placeholder="Discount Price (Optional)"
              value={editCourse.discountPrice || ""}
              onChange={(e) =>
                setEditCourse({
                  ...editCourse,
                  discountPrice: Number(e.target.value)
                })
              }
            />

            <h3 className="section-title">Learning Information</h3>
            <textarea
              rows="3"
              placeholder="Requirements (Optional)"
              value={editCourse.requirements || ""}
              onChange={(e) =>
                setEditCourse({
                  ...editCourse,
                  requirements: e.target.value
                })
              }
            />
            <textarea
              rows="3"
              placeholder="Learning Outcomes (Optional)"
              value={editCourse.outcomes || ""}
              onChange={(e) =>
                setEditCourse({
                  ...editCourse,
                  outcomes: e.target.value
                })
              }
            />

            <h3 className="section-title">Publishing</h3>
            <select
              value={editCourse.status || "DRAFT"}
              onChange={(e) =>
                setEditCourse({
                  ...editCourse,
                  status: e.target.value
                })
              }
              className="form-select"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>

            <div className="popup-buttons">
              <button className="save-btn" onClick={saveCourse}>
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

      {/* Add Course Modal */}
      {showAddCourse && (
        <div className="popup-overlay">
          <div className="popup popup-large">
            <h2>Create New Course</h2>
            
            <h3 className="section-title">Basic Information</h3>
            <input
              placeholder="Course Title *"
              value={newCourse.title}
              onChange={(e) => {
                setNewCourse({
                  ...newCourse,
                  title: e.target.value
                });
              }}
              required
            />
            <input
              placeholder="Subtitle"
              value={newCourse.subtitle}
              onChange={(e) =>
                setNewCourse({
                  ...newCourse,
                  subtitle: e.target.value
                })
              }
            />
            <textarea
              rows="5"
              placeholder="Description"
              value={newCourse.description}
              onChange={(e) =>
                setNewCourse({
                  ...newCourse,
                  description: e.target.value
                })
              }
            />

            <h3 className="section-title">Course Details</h3>
            <input
              placeholder="Trailer URL (Optional)"
              value={newCourse.trailer}
              onChange={(e) =>
                setNewCourse({
                  ...newCourse,
                  trailer: e.target.value
                })
              }
            />

            <select
              value={newCourse.language}
              onChange={(e) =>
                setNewCourse({
                  ...newCourse,
                  language: e.target.value
                })
              }
              className="form-select"
              required
            >
              <option value="">Select Language *</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>

            <select
              value={newCourse.level}
              onChange={(e) =>
                setNewCourse({
                  ...newCourse,
                  level: e.target.value
                })
              }
              className="form-select"
              required
            >
              <option value="">Select Level *</option>
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Duration (Hours) *"
              value={newCourse.duration}
              onChange={(e) =>
                setNewCourse({
                  ...newCourse,
                  duration: Number(e.target.value)
                })
              }
              required
            />

            <h3 className="section-title">Pricing</h3>
            <input
              type="number"
              placeholder="Price *"
              value={newCourse.price}
              onChange={(e) =>
                setNewCourse({
                  ...newCourse,
                  price: Number(e.target.value)
                })
              }
              required
            />
            <input
              type="number"
              placeholder="Discount Price (Optional)"
              value={newCourse.discountPrice}
              onChange={(e) =>
                setNewCourse({
                  ...newCourse,
                  discountPrice: e.target.value
                })
              }
            />

            <h3 className="section-title">Learning Information</h3>
            <textarea
              rows="3"
              placeholder="Requirements (Optional)"
              value={newCourse.requirements}
              onChange={(e) =>
                setNewCourse({
                  ...newCourse,
                  requirements: e.target.value
                })
              }
            />
            <textarea
              rows="3"
              placeholder="Learning Outcomes (Optional)"
              value={newCourse.outcomes}
              onChange={(e) =>
                setNewCourse({
                  ...newCourse,
                  outcomes: e.target.value
                })
              }
            />

            <h3 className="section-title">Publishing</h3>
            <select
              value={newCourse.status}
              onChange={(e) =>
                setNewCourse({
                  ...newCourse,
                  status: e.target.value
                })
              }
              className="form-select"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>

            <div className="popup-buttons">
              <button className="save-btn" onClick={addCourse}>
                Create Course
              </button>
              <button
                className="close-btn"
                onClick={() => {
                  setShowAddCourse(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Module Modal */}
      {showAddModule && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Add Module</h2>
            <label>Module Title</label>
            <input
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
            />
            <p className="position-hint">
              Current modules: {modules[newModule.courseId]?.length || 0}
              {modules[newModule.courseId]?.length > 0 && (
                <> (Positions: {modules[newModule.courseId].sort((a, b) => a.position - b.position).map(m => m.position).join(", ")})</>
              )}
            </p>
            <div className="popup-buttons">
              <button className="save-btn" onClick={createModule}>
                Create
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
            <label>Module Title</label>
            <input
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
            <div className="popup-buttons">
              <button className="save-btn" onClick={updateModule}>
                Save
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
    </div>
  );
}

export default MentorCourses;