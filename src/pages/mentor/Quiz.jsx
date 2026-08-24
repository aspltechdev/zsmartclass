// src/pages/mentor/Quiz.jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  ClipboardList, Plus, Edit, Trash2, X, Save, ArrowLeft, Check,
} from "lucide-react";
import api from "../../services/api";
import "./Quiz.css";
import "./MentorShared.css";

const EMPTY_OPTION = () => ({ text: "", isCorrect: false });
const EMPTY_QUESTION = () => ({
  question: "", type: "RADIO", marks: 1,
  options: [EMPTY_OPTION(), EMPTY_OPTION()],
});
const EMPTY_QUIZ = () => ({ title: "", description: "", questions: [EMPTY_QUESTION()] });

function Quiz() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const moduleId = params.get("moduleId") || "";

  const [modules, setModules] = useState([]);
  const [module, setModule] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_QUIZ());
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { fetchModules(); }, []);
  useEffect(() => { if (moduleId) loadData(moduleId); else setLoading(false); }, [moduleId]);

  const fetchModules = async () => {
    try {
      const res = await api.get("/modules");
      setModules(res.data?.data || res.data || []);
    } catch { setModules([]); }
  };

  const loadData = async (id) => {
    try {
      setLoading(true); setError("");
      const [modRes, quizRes] = await Promise.all([
        api.get(`/modules/${id}`),
        api.get(`/quizzes/module/${id}`).catch(() => ({ data: { data: [] } })),
      ]);
      setModule(modRes.data?.data || modRes.data);
      setQuizzes(quizRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't load quizzes for this module.");
      setQuizzes([]);
    } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_QUIZ()); setFormErrors({}); setShowModal(true);
  };

  const openEdit = (quiz) => {
    setEditing(quiz);
    setForm({
      title: quiz.title || "", description: quiz.description || "",
      questions: (quiz.questions || []).map((q) => ({
        question: q.question || "", type: q.type || "RADIO", marks: q.marks ?? 1,
        options: (q.options || []).map((o) => ({ text: o.text || "", isCorrect: !!o.isCorrect })),
      })),
    });
    setFormErrors({}); setShowModal(true);
  };

  // ---- builder helpers ----
  const updateQuestion = (qi, patch) =>
    setForm((f) => ({ ...f, questions: f.questions.map((q, i) => i === qi ? { ...q, ...patch } : q) }));

  const addQuestion = () => setForm((f) => ({ ...f, questions: [...f.questions, EMPTY_QUESTION()] }));

  const removeQuestion = (qi) =>
    setForm((f) => ({ ...f, questions: f.questions.filter((_, i) => i !== qi) }));

  const setOptionCount = (qi, count) =>
    setForm((f) => ({ ...f, questions: f.questions.map((q, i) => {
      if (i !== qi) return q;
      const next = [...q.options];
      while (next.length < count) next.push(EMPTY_OPTION());
      return { ...q, options: next.slice(0, count) };
    })}));

  const updateOption = (qi, oi, patch) =>
    setForm((f) => ({ ...f, questions: f.questions.map((q, i) =>
      i !== qi ? q : { ...q, options: q.options.map((o, j) => j === oi ? { ...o, ...patch } : o) })}));

  const toggleCorrect = (qi, oi) =>
    setForm((f) => ({ ...f, questions: f.questions.map((q, i) => {
      if (i !== qi) return q;
      if (q.type === "RADIO") {
        return { ...q, options: q.options.map((o, j) => ({ ...o, isCorrect: j === oi })) };
      }
      return { ...q, options: q.options.map((o, j) => j === oi ? { ...o, isCorrect: !o.isCorrect } : o) };
    })}));

  const changeType = (qi, type) =>
    setForm((f) => ({ ...f, questions: f.questions.map((q, i) => {
      if (i !== qi) return q;
      if (type === "RADIO") {
        let seen = false;
        return { ...q, type, options: q.options.map((o) => {
          if (o.isCorrect && !seen) { seen = true; return o; }
          return { ...o, isCorrect: false };
        })};
      }
      return { ...q, type };
    })}));

  const totalMarks = form.questions.reduce((s, q) => s + (Number(q.marks) || 0), 0);

  const saveQuiz = async () => {
    if (!form.title.trim()) { setFormErrors({ submit: "Quiz title is required." }); return; }
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i]; const label = `Question ${i + 1}`;
      if (!q.question.trim()) return setFormErrors({ submit: `${label}: text is required.` });
      if (!Number(q.marks) || Number(q.marks) <= 0)
        return setFormErrors({ submit: `${label}: marks must be greater than 0.` });
      const filled = q.options.filter((o) => o.text.trim());
      if (filled.length < 2) return setFormErrors({ submit: `${label}: needs at least 2 options.` });
      const correct = filled.filter((o) => o.isCorrect).length;
      if (q.type === "RADIO" && correct !== 1)
        return setFormErrors({ submit: `${label}: pick exactly one correct option.` });
      if (q.type === "CHECKBOX" && correct < 1)
        return setFormErrors({ submit: `${label}: pick at least one correct option.` });
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: form.title.trim(), description: form.description || "",
        moduleId: Number(moduleId),
        questions: form.questions.map((q) => ({
          question: q.question.trim(), type: q.type, marks: Number(q.marks),
          options: q.options.filter((o) => o.text.trim())
            .map((o) => ({ text: o.text.trim(), isCorrect: !!o.isCorrect })),
        })),
      };
      if (editing) await api.put(`/quizzes/${editing.id}`, payload);
      else await api.post("/quizzes", payload);
      setShowModal(false); setEditing(null); setForm(EMPTY_QUIZ());
      await loadData(moduleId);
    } catch (err) {
      setFormErrors({ submit: err.response?.data?.message || "Failed to save quiz." });
      document.querySelector(".quiz-modal .modal-body")?.scrollTo({ top: 0, behavior: "smooth" });
    } finally { setIsSubmitting(false); }
  };

  const deleteQuiz = async (id) => {
    try {
      await api.delete(`/quizzes/${id}`);
      setDeleteTarget(null);
      await loadData(moduleId);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete quiz.");
      setDeleteTarget(null);
    }
  };

  if (!moduleId) {
    return (
      <div className="modules-page">
        <div className="page-header">
          <div><h1>Quizzes</h1><p className="subtitle">Pick a module to manage its quizzes</p></div>
          <button className="refresh-btn" onClick={() => navigate("/mentor/modules")}>
            <ArrowLeft size={18} />
          </button>
        </div>
        <div className="empty-state">
          <ClipboardList size={48} />
          <h3>Select a module</h3>
          <p>Choose which module's quizzes you want to manage.</p>
          <select className="module-picker" defaultValue=""
                  onChange={(e) => e.target.value && setParams({ moduleId: e.target.value })}>
            <option value="">Select a module…</option>
            {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="modules-page">
        <div className="loading-state"><div className="spinner"></div><p>Loading quizzes...</p></div>
      </div>
    );
  }

  return (
    <div className="modules-page">
      <div className="page-header">
        <div>
          <button className="back-link" onClick={() => navigate("/mentor/modules")}>
            <ArrowLeft size={15} /> Back to Modules
          </button>
          <h1>{module?.title || "Quizzes"}</h1>
          <p className="subtitle">{quizzes.length} quiz{quizzes.length === 1 ? "" : "zes"} in this module</p>
        </div>
        <button className="add-btn" onClick={openCreate}><Plus size={18} /> Add Quiz</button>
      </div>

      {error && <div className="error-text">{error}</div>}

      <div className="modules-container">
        {quizzes.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={48} />
            <h3>No quizzes yet</h3>
            <p>Create the first quiz for this module</p>
            <button className="add-btn" onClick={openCreate}><Plus size={18} /> Add Quiz</button>
          </div>
        ) : (
          <div className="lesson-list">
            {quizzes.map((quiz, idx) => (
              <div className="lesson-item" key={quiz.id}>
                <span className="lesson-number">{idx + 1}</span>
                <div className="lesson-title">
                  <strong>{quiz.title}</strong>
                  <span className="quiz-meta">
                    {quiz.questionCount} question{quiz.questionCount === 1 ? "" : "s"} · {quiz.totalMarks} marks
                    {quiz.submissionCount > 0 ? ` · ${quiz.submissionCount} submitted` : ""}
                  </span>
                </div>
                <div className="lesson-actions">
                  <button className="edit-lesson-btn" title="Edit quiz"
                          onClick={() => openEdit(quiz)}><Edit size={14} /></button>
                  <button className="delete-lesson-btn" title="Delete quiz"
                          onClick={() => setDeleteTarget(quiz.id)}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quiz builder */}
      {showModal && createPortal(
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content quiz-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? "Edit Quiz" : "Create Quiz"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            <div className="modal-body">
              {formErrors.submit && <div className="quiz-error-banner">{formErrors.submit}</div>}

              <div className="form-group">
                <label>Quiz Name *</label>
                <input value={form.title} placeholder="e.g. HTML Basics Test"
                       onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea rows={2} value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="quiz-total-bar">
                <span>{form.questions.length} question{form.questions.length === 1 ? "" : "s"}</span>
                <strong>Total marks: {totalMarks}</strong>
              </div>

              {form.questions.map((q, qi) => (
                <div className="quiz-question-card" key={qi}>
                  <div className="quiz-question-head">
                    <span className="quiz-question-number">Q{qi + 1}</span>
                    {form.questions.length > 1 && (
                      <button className="delete-lesson-btn" title="Remove question"
                              onClick={() => removeQuestion(qi)}><Trash2 size={14} /></button>
                    )}
                  </div>

                  <div className="form-group full-width">
                    <label>Question *</label>
                    <input value={q.question} placeholder="Type the question"
                           onChange={(e) => updateQuestion(qi, { question: e.target.value })} />
                  </div>

                  <div className="quiz-question-controls">
                    <div className="form-group">
                      <label>Answer type</label>
                      <select value={q.type} onChange={(e) => changeType(qi, e.target.value)}>
                        <option value="RADIO">Single choice (radio)</option>
                        <option value="CHECKBOX">Multiple choice (checkbox)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Options</label>
                      <select value={q.options.length}
                              onChange={(e) => setOptionCount(qi, Number(e.target.value))}>
                        {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} options</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Marks</label>
                      <input type="number" min="1" value={q.marks}
                             onChange={(e) => updateQuestion(qi, { marks: e.target.value })} />
                    </div>
                  </div>

                  <div className="quiz-options">
                    <div className="quiz-options-head">
                      <span>Options</span>
                      <span className="quiz-correct-hint">
                        {q.type === "RADIO" ? "Tick the ONE correct answer →" : "Tick ALL correct answers →"}
                      </span>
                    </div>

                    {q.options.map((o, oi) => (
                      <div className={`quiz-option-row${o.isCorrect ? " is-correct" : ""}`} key={oi}>
                        <input className="quiz-option-text" value={o.text}
                               placeholder={`Option ${oi + 1}`}
                               onChange={(e) => updateOption(qi, oi, { text: e.target.value })} />
                        <label className={`quiz-correct-toggle${o.isCorrect ? " active" : ""}`}
                               title="Mark this option as the correct answer">
                          <input type={q.type === "RADIO" ? "radio" : "checkbox"}
                                 name={`correct-${qi}`} checked={!!o.isCorrect}
                                 onChange={() => toggleCorrect(qi, oi)} />
                          {o.isCorrect ? <><Check size={13} /> Correct</> : "Correct?"}
                        </label>
                      </div>
                    ))}

                    <span className="field-hint">
                      {q.options.filter((o) => o.isCorrect).length === 0
                        ? "⚠ No correct answer selected for this question."
                        : `${q.options.filter((o) => o.isCorrect).length} correct answer(s) selected.`}
                    </span>
                  </div>
                </div>
              ))}

              <button className="btn-add-lesson-secondary" onClick={addQuestion}>
                <Plus size={16} /> Add Question
              </button>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)} disabled={isSubmitting}>Cancel</button>
              <button className="btn-save" onClick={saveQuiz} disabled={isSubmitting}>
                <Save size={16} /> {isSubmitting ? "Saving…" : "Save Quiz"}
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
                <h3>Delete this quiz?</h3>
                <p className="confirm-sub">Its questions and any student results will be removed.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => deleteQuiz(deleteTarget)}>Delete Quiz</button>
            </div>
          </div>
        </div>, document.body)}
    </div>
  );
}

export default Quiz;