// src/pages/mentor/Certificates.jsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Award, Search, RefreshCw, CheckCircle, XCircle, Clock,
  Download, Zap, X, User, BookOpen,
} from "lucide-react";
import api from "../../services/api";
import "./Certificates.css";

function Certificates() {
  const [pending, setPending] = useState([]);
  const [issued, setIssued] = useState([]);
  const [tab, setTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true); setError("");
      const [p, a] = await Promise.all([
        api.get("/certificates/admin/pending").catch(() => ({ data: { data: [] } })),
        api.get("/certificates/admin/all").catch(() => ({ data: { data: [] } })),
      ]);
      const pend = p.data?.data || p.data || [];
      const all = a.data?.data || a.data || [];
      setPending(Array.isArray(pend) ? pend : []);
      setIssued(
        (Array.isArray(all) ? all : []).filter(
          (c) => (c.status || "").toUpperCase() === "ACTIVE"
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't load certificates.");
    } finally { setLoading(false); }
  };

  const flash = (msg) => { setNotice(msg); setTimeout(() => setNotice(""), 4000); };

  const approve = async (cert) => {
    setActionId(cert.id);
    try {
      await api.put(`/certificates/admin/${cert.id}/approve`);
      await fetchAll();
      flash("Certificate approved and sent to the student.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve.");
    } finally { setActionId(null); }
  };

  const reject = async () => {
    if (!rejectTarget) return;
    setActionId(rejectTarget.id);
    try {
      await api.put(`/certificates/admin/${rejectTarget.id}/reject`, {
        reason: rejectReason || "Not eligible yet",
      });
      setRejectTarget(null); setRejectReason("");
      await fetchAll();
      flash("Certificate request rejected.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject.");
    } finally { setActionId(null); }
  };

  const verifyNow = async () => {
    setActionId("verify");
    try {
      const res = await api.post("/certificates/admin/verify-now");
      await fetchAll();
      flash(res.data?.message || "Verification run complete.");
    } catch (err) {
      alert(err.response?.data?.message || "Verify failed.");
    } finally { setActionId(null); }
  };

  const download = async (certNo) => {
    if (!certNo) return;
    setActionId(certNo);
    try {
      const res = await api.get(`/certificates/download/${certNo}`);
      const payload = res.data?.data || res.data;
      if (!payload?.pdfBuffer) throw new Error("No PDF returned");
      const bytes = atob(payload.pdfBuffer);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      const url = window.URL.createObjectURL(new Blob([arr], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url; a.download = `${certNo}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't download this certificate.");
    } finally { setActionId(null); }
  };

  const rows = tab === "pending" ? pending : issued;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((c) =>
      (c.student?.name || c.User?.name || "").toLowerCase().includes(q) ||
      (c.student?.email || c.User?.email || "").toLowerCase().includes(q) ||
      (c.course?.title || c.Course?.title || "").toLowerCase().includes(q) ||
      (c.certificateNo || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  const nameOf = (c) => c.student?.name || c.User?.name || "—";
  const emailOf = (c) => c.student?.email || c.User?.email || "";
  const courseOf = (c) => c.course?.title || c.Course?.title || "—";
  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN",
    { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <div className="cert-page">
      <div className="cert-header">
        <div>
          <h1><Award size={24} /> Certificates</h1>
          <p className="cert-subtitle">
            Review certificate requests and approve them for your students.
          </p>
        </div>
        <div className="cert-actions">
          <button className="cert-btn ghost" onClick={fetchAll}><RefreshCw size={16} /></button>
          <button className="cert-btn primary" onClick={verifyNow} disabled={actionId === "verify"}>
            <Zap size={16} /> {actionId === "verify" ? "Verifying…" : "Verify Now"}
          </button>
        </div>
      </div>

      {notice && <div className="cert-notice">{notice}</div>}
      {error && <div className="cert-alert">{error}</div>}

      <div className="cert-stats">
        <div className="cert-stat">
          <div className="cert-stat-icon amber"><Clock size={20} /></div>
          <div><div className="cert-stat-value">{pending.length}</div>
               <div className="cert-stat-label">Pending Review</div></div>
        </div>
        <div className="cert-stat">
          <div className="cert-stat-icon green"><CheckCircle size={20} /></div>
          <div><div className="cert-stat-value">{issued.length}</div>
               <div className="cert-stat-label">Issued</div></div>
        </div>
      </div>

      <div className="cert-tabs">
        <button className={tab === "pending" ? "active" : ""} onClick={() => setTab("pending")}>
          <Clock size={15} /> Pending ({pending.length})
        </button>
        <button className={tab === "issued" ? "active" : ""} onClick={() => setTab("issued")}>
          <CheckCircle size={15} /> Issued ({issued.length})
        </button>
      </div>

      <div className="cert-toolbar">
        <div className="cert-search">
          <Search size={18} />
          <input placeholder="Search student, course, or certificate no…"
                 value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="cert-empty">Loading certificates…</div>
      ) : filtered.length === 0 ? (
        <div className="cert-empty">
          <Award size={44} />
          <h3>{tab === "pending" ? "No pending requests" : "No certificates issued yet"}</h3>
          <p>{tab === "pending"
            ? "Requests appear here when students who completed a course apply."
            : "Approved certificates will be listed here."}</p>
        </div>
      ) : (
        <div className="cert-list">
          {filtered.map((c) => (
            <div className="cert-card" key={c.id}>
              <div className="cert-card-icon"><Award size={20} /></div>
              <div className="cert-card-body">
                <div className="cert-card-top">
                  <span className="cert-student"><User size={13} /> {nameOf(c)}</span>
                  {c.certificateNo && <span className="cert-no">{c.certificateNo}</span>}
                </div>
                <div className="cert-card-meta">
                  <span><BookOpen size={13} /> {courseOf(c)}</span>
                  <span>{emailOf(c)}</span>
                  <span>{fmt(c.createdAt || c.issuedAt)}</span>
                </div>
              </div>

              <div className="cert-card-actions">
                {tab === "pending" ? (
                  <>
                    <button className="cert-btn approve" onClick={() => approve(c)}
                            disabled={actionId === c.id}>
                      <CheckCircle size={15} /> {actionId === c.id ? "…" : "Approve"}
                    </button>
                    <button className="cert-btn reject" onClick={() => setRejectTarget(c)}
                            disabled={actionId === c.id}>
                      <XCircle size={15} /> Reject
                    </button>
                  </>
                ) : (
                  <button className="cert-btn ghost" onClick={() => download(c.certificateNo)}
                          disabled={actionId === c.certificateNo}>
                    <Download size={15} /> Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectTarget && createPortal(
        <div className="cert-modal-overlay" onClick={() => setRejectTarget(null)}>
          <div className="cert-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cert-modal-header">
              <h3>Reject certificate request</h3>
              <button className="cert-btn ghost" onClick={() => setRejectTarget(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="cert-modal-body">
              <p className="cert-modal-text">
                Rejecting <strong>{nameOf(rejectTarget)}</strong>'s request for{" "}
                <strong>{courseOf(rejectTarget)}</strong>.
              </p>
              <label className="cert-label">Reason (shown to the student)</label>
              <textarea className="cert-input" rows={3} value={rejectReason}
                        placeholder="e.g. Course not fully completed yet"
                        onChange={(e) => setRejectReason(e.target.value)} />
            </div>
            <div className="cert-modal-footer">
              <button className="cert-btn ghost" onClick={() => setRejectTarget(null)}>Cancel</button>
              <button className="cert-btn reject" onClick={reject}
                      disabled={actionId === rejectTarget.id}>
                {actionId === rejectTarget.id ? "Rejecting…" : "Reject Request"}
              </button>
            </div>
          </div>
        </div>, document.body)}
    </div>
  );
}

export default Certificates;