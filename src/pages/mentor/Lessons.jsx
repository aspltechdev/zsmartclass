import { useEffect, useState } from "react";
import axios from "axios";
import {
    Eye,
    Pencil,
    Trash2,
    Plus
} from "lucide-react";
import "./Lessons.css";

function MentorLessons() {

  const [lessons, setLessons] = useState([]);
  const [modules, setModules] = useState([]);

  const [loading, setLoading] = useState(true);

  const [previewVideo, setPreviewVideo] = useState("");

  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);

  const [selectedLesson, setSelectedLesson] = useState(null);

  const [editLesson, setEditLesson] = useState({
    id: "",
    title: "",
    description: "",
    videoUrl: "",
    duration: "",
    position: "",
    isPreview: false,
    moduleId: ""
  });

  useEffect(() => {
    fetchLessons();
    fetchModules();
  }, []);

  // ==========================================
  // Convert YouTube URL to Embed URL
  // ==========================================

  const getEmbedUrl = (url) => {
    if (!url) return "";
    const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[1]
      ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&controls=1&rel=0`
      : url;
  };

  // ==========================================
  // View Lesson
  // ==========================================

  const handleView = (lesson) => {
    setSelectedLesson(lesson);
    setShowView(true);
  };

  // ==========================================
  // Edit Lesson
  // ==========================================

  const handleEdit = (lesson) => {
    setIsAddMode(false);
    setEditLesson({
      id: lesson.id,
      title: lesson.title || "",
      description: lesson.description || "",
      videoUrl: lesson.videoUrl || "",
      duration: lesson.duration || "",
      position: lesson.position || "",
      isPreview: lesson.isPreview || false,
      moduleId: lesson.moduleId || ""
    });
    setShowEdit(true);
  };

  // ==========================================
  // Fetch Lessons
  // ==========================================

  const fetchLessons = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/lessons"
      );
      setLessons(response.data.data || []);
    } catch (err) {
      console.log(err);
      alert("Unable to fetch lessons.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Fetch Modules
  // ==========================================

  const fetchModules = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/modules"
      );
      setModules(response.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  // ==========================================
  // Update Lesson
  // ==========================================

  const updateLesson = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/lessons/${editLesson.id}`,
        {
          title: editLesson.title,
          description: editLesson.description,
          videoUrl: editLesson.videoUrl,
          duration: Number(editLesson.duration),
          position: Number(editLesson.position),
          isPreview: editLesson.isPreview,
          moduleId: Number(editLesson.moduleId)
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      alert("Lesson Updated Successfully");
      setShowEdit(false);
      fetchLessons();
    } catch (err) {
      console.log(err);
      alert(
        err.response?.data?.message ||
        "Unable to update lesson."
      );
    }
  };

  // ==========================================
  // Add Lesson
  // ==========================================

  const addLesson = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/lessons",
        {
          title: editLesson.title,
          description: editLesson.description,
          videoUrl: editLesson.videoUrl,
          videoType: "youtube",
          attachment: "",
          duration: Number(editLesson.duration),
          position: Number(editLesson.position),
          isPreview: editLesson.isPreview,
          moduleId: Number(editLesson.moduleId)
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      alert("Lesson Added Successfully");
      setShowEdit(false);
      fetchLessons();
    } catch (err) {
      console.log(err);
      alert(
        err.response?.data?.message ||
        "Unable to add lesson."
      );
    }
  };

  // ==========================================
  // Delete Lesson
  // ==========================================

  const deleteLesson = async (id) => {
    if (!window.confirm("Delete this lesson?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/lessons/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setShowView(false);
      alert("Lesson Deleted Successfully");
      fetchLessons();
    } catch (err) {
      console.log(err);
      alert("Unable to delete lesson.");
    }
  };

  if (loading) {
    return <h2>Loading Lessons...</h2>;
  }

  return (
    <div className="mentor-lessons">

      {/* ================= HEADER ================= */}
      <div className="lesson-header">
        <div>
          <h1>Lesson Management</h1>
          <p>Manage all lessons inside your modules.</p>
        </div>
        <button
          className="add-btn"
          onClick={() => {
            setIsAddMode(true);
            setEditLesson({
              id: "",
              title: "",
              description: "",
              videoUrl: "",
              duration: "",
              position: "",
              isPreview: false,
              moduleId: ""
            });
            setShowEdit(true);
          }}
        >
          <Plus size={18} />
          Add Lesson
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <div className="lesson-table">
        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Module</th>
              <th>Lesson</th>
              <th>Video</th>
              <th>Duration</th>
              <th>Position</th>
              <th>Preview</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {lessons.length > 0 ? (
              lessons.map((lesson) => (
                <tr key={lesson.id}>
                  <td>{lesson.module?.course?.title}</td>
                  <td>{lesson.module?.title}</td>
                  <td>{lesson.title}</td>
                  <td>
                    <div
                      className="video-preview"
                      onMouseEnter={() =>
                        setPreviewVideo(
                          getEmbedUrl(lesson.videoUrl)
                        )
                      }
                      onMouseLeave={() =>
                        setPreviewVideo("")
                      }
                    >
                      <a
                        href={lesson.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="watch-link"
                      >
                        ▶ Watch
                      </a>
                    </div>
                    {previewVideo && (
                      <div className="floating-video">
                        <iframe
                          src={previewVideo}
                          title="Lesson Preview"
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </td>
                  <td>{lesson.duration} mins</td>
                  <td>{lesson.position}</td>
                  <td>
                    {lesson.isPreview ? "Yes" : "No"}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="view-btn"
                        title="View"
                        onClick={() => handleView(lesson)}
                      >
                        <Eye size={17} />
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="8"
                  style={{
                    textAlign: "center",
                    padding: "25px"
                  }}
                >
                  No Lessons Found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= VIEW POPUP ================= */}
      {showView && selectedLesson && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Lesson Details</h2>

            <div className="view-grid">
              <div>
                <label>Course</label>
                <p>{selectedLesson.module?.course?.title || "-"}</p>
              </div>
              <div>
                <label>Module</label>
                <p>{selectedLesson.module?.title || "-"}</p>
              </div>
              <div>
                <label>Lesson Title</label>
                <p>{selectedLesson.title}</p>
              </div>
              <div>
                <label>Duration</label>
                <p>{selectedLesson.duration} mins</p>
              </div>
              <div>
                <label>Position</label>
                <p>{selectedLesson.position}</p>
              </div>
              <div>
                <label>Preview Lesson</label>
                <p>{selectedLesson.isPreview ? "Yes" : "No"}</p>
              </div>
            </div>

            <label>Description</label>
            <div className="description-box">
              {selectedLesson.description || "No description available."}
            </div>

            {selectedLesson.videoUrl && (
              <>
                <label>Lesson Video</label>
                <iframe
                  width="100%"
                  height="360"
                  src={getEmbedUrl(selectedLesson.videoUrl)}
                  title="Lesson Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    borderRadius: "10px",
                    marginTop: "10px"
                  }}
                />
              </>
            )}

            <div className="popup-buttons">
              <button
                className="edit-btn"
                onClick={() => {
                  setShowView(false);
                  handleEdit(selectedLesson);
                }}
              >
                <Pencil size={16} />
                Edit Lesson
              </button>
              <button
                className="delete-btn"
                onClick={() => deleteLesson(selectedLesson.id)}
              >
                <Trash2 size={16} />
                Delete Lesson
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

      {/* ================= ADD / EDIT POPUP ================= */}
      {showEdit && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>{isAddMode ? "Add Lesson" : "Edit Lesson"}</h2>

            <label>Module</label>
            <select
              value={editLesson.moduleId}
              onChange={(e) =>
                setEditLesson({
                  ...editLesson,
                  moduleId: e.target.value
                })
              }
            >
              <option value="">Select Module</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.course?.title} → {module.title}
                </option>
              ))}
            </select>

            <label>Lesson Title</label>
            <input
              type="text"
              value={editLesson.title}
              onChange={(e) =>
                setEditLesson({
                  ...editLesson,
                  title: e.target.value
                })
              }
            />

            <label>Description</label>
            <textarea
              rows="4"
              value={editLesson.description}
              onChange={(e) =>
                setEditLesson({
                  ...editLesson,
                  description: e.target.value
                })
              }
            />

            <label>Video URL</label>
            <input
              type="text"
              placeholder="https://youtube.com/watch?v=..."
              value={editLesson.videoUrl}
              onChange={(e) =>
                setEditLesson({
                  ...editLesson,
                  videoUrl: e.target.value
                })
              }
            />

            <label>Duration (Minutes)</label>
            <input
              type="number"
              value={editLesson.duration}
              onChange={(e) =>
                setEditLesson({
                  ...editLesson,
                  duration: e.target.value
                })
              }
            />

            <label>Position</label>
            <input
              type="number"
              value={editLesson.position}
              onChange={(e) =>
                setEditLesson({
                  ...editLesson,
                  position: e.target.value
                })
              }
            />

            <div className="checkbox-container">
              <input
                id="previewLesson"
                type="checkbox"
                checked={editLesson.isPreview}
                onChange={(e) =>
                  setEditLesson({
                    ...editLesson,
                    isPreview: e.target.checked
                  })
                }
              />
              <label htmlFor="previewLesson">Preview Lesson</label>
            </div>

            <div className="popup-buttons">
              <button
                className="save-btn"
                onClick={isAddMode ? addLesson : updateLesson}
              >
                {isAddMode ? "Add Lesson" : "Save Changes"}
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

export default MentorLessons;