// src/pages/mentor/Modules.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  Layers, Plus, Search, Edit, Trash2, Eye, X, RefreshCw,
  FileText, Save, ClipboardList, ChevronRight,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./Modules.css";

const EMPTY_FORM = { title: "", description: "" };

function Modules() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { fetchModules(); }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/modules");
      setModules(res.data?.data || res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't load modules.");
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  const totalLessons = modules.reduce((s, m) => s + (m.lessons?.length || 0), 0);

  const filtered = modules.filter((m) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return m.title?.toLowerCase().includes(q) ||
           m.description?.toLowerCase().includes(q);
  });

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); setFormErrors({}); setShowModal(true);
  };

  const openEdit = (module) => {
    setEditing(module);
    setForm({ title: module.title || "", description: module.description || "" });
    setFormErrors({}); setShowModal(true);
  };

  const saveModule = async () => {
    if (!form.title.trim()) {
      setFormErrors({ title: "Module title is required" });
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = {
        title: form.title.trim(),
        description: form.description || "",
        createdBy: user?.id,
      };
      if (editing) await api.put(`/modules/${editing.id}`, payload);
      else await api.post("/modules", payload);

      setShowModal(false); setEditing(null); setForm(EMPTY_FORM);
      await fetchModules();
    } catch (err) {
      setFormErrors({ submit: err.response?.data?.message || "Failed to save module." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteModule = async (id) => {
    try {
      await api.delete(`/modules/${id}`);
      setDeleteTarget(null);
      await fetchModules();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete module.");
      setDeleteTarget(null);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "—";

  // Hand off to the dedicated Lessons / Quiz pages, carrying the module id.
  const goToLessons = (moduleId) => navigate(`/mentor/lessons?moduleId=${moduleId}`);
  const goToQuizzes = (moduleId) => navigate(`/mentor/quiz?moduleId=${moduleId}`);

  if (loading) {
    return (
      <div className="modules-page">
        <div className="loading-state"><div className="spinner"></div><p>Loading modules...</p></div>
      </div>
    );
  }

  return (
    <div className="modules-page">
      <div className="page-header">
        <div>
          <h1>Module Management</h1>
          <p className="subtitle">Create modules, then add lessons and quizzes inside them</p>
        </div>
        <button className="add-btn" onClick={openCreate}>
          <Plus size={18} /> New Module
        </button>
      </div>

      {error && <div className="error-text">{error}</div>}

      <div className="module-stats">
        <div className="stat-card">
          <Layers size={24} />
          <div><h3>{modules.length}</h3><p>Total Modules</p></div>
        </div>
        <div className="stat-card">
          <FileText size={24} />
          <div><h3>{totalLessons}</h3><p>Total Lessons</p></div>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input placeholder="Search modules..." value={search}
                 onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="refresh-btn" onClick={fetchModules}><RefreshCw size={18} /></button>
      </div>

      <div className="modules-container">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <Layers size={48} />
            <h3>No modules found</h3>
            <p>Create your first module to get started</p>
            <button className="add-btn" onClick={openCreate}><Plus size={18} /> Create Module</button>
          </div>
        ) : (
          <div className="module-grid">
            {filtered.map((module) => {
              const lessons = module.lessons || [];
              return (
                <div className="module-card" key={module.id}>
                  <div className="module-card-header">
                    <div className="module-card-icon"><Layers size={20} /></div>
                    <div className="module-card-info">
                      <div className="module-card-title-row"><h4>{module.title}</h4></div>
                      <div className="module-card-meta">
                        <span className="lesson-count">{lessons.length} lessons</span>
                        <span className="date-badge">{formatDate(module.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {module.description && (
                    <p className="module-card-description">{module.description}</p>
                  )}

                  {/* Hand-off buttons */}
                  <div className="module-nav-actions">
                    <button className="module-nav-btn" onClick={() => goToLessons(module.id)}>
                      <FileText size={15} /> Lessons <ChevronRight size={14} />
                    </button>
                    <button className="module-nav-btn" onClick={() => goToQuizzes(module.id)}>
                      <ClipboardList size={15} /> Quizzes <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="module-card-actions">
                    <button title="Edit module" className="edit-btn" onClick={() => openEdit(module)}>
                      <Edit size={16} />
                    </button>
                    <button title="Delete module" className="delete-btn" onClick={() => setDeleteTarget(module.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / edit module */}
      {showModal && createPortal(
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? "Edit Module" : "New Module"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {formErrors.submit && <p className="error-text">{formErrors.submit}</p>}
              <div className="form-group">
                <label>Module Title *</label>
                <input value={form.title} placeholder="e.g. HTML Basics"
                       onChange={(e) => setForm({ ...form, title: e.target.value })} />
                {formErrors.title && <p className="error-text">{formErrors.title}</p>}
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea rows={4} value={form.description}
                          placeholder="What does this module cover?"
                          onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)} disabled={isSubmitting}>Cancel</button>
              <button className="btn-save" onClick={saveModule} disabled={isSubmitting}>
                <Save size={16} /> {isSubmitting ? "Saving…" : "Save Module"}
              </button>
            </div>
          </div>
        </div>, document.body)}

      {/* Delete confirm */}
      {deleteTarget && createPortal(
        <div className="modal" onClick={() => setDeleteTarget(null)}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-content">
              <div className="confirm-icon"><Trash2 size={24} /></div>
              <div className="confirm-body">
                <h3>Delete this module?</h3>
                <p className="confirm-sub">Its lessons, quizzes and student progress will also be removed.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => deleteModule(deleteTarget)}>Delete Module</button>
            </div>
          </div>
        </div>, document.body)}
    </div>
  );
}

export default Modules;