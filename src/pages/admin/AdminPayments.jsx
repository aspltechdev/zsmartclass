// src/pages/admin/AdminPayments.jsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  CreditCard,
  Search,
  Plus,
  Printer,
  RefreshCw,
  X,
  IndianRupee,
  CheckCircle,
  Calendar,
  Eye,
} from "lucide-react";
import api from "../../services/api";
import "./AdminPayments.css";

const BRAND = "ZsmartClass";

const emptyForm = {
  studentId: "",
  courseIds: [],
  amount: "",
  method: "CASH",
  utr: "",
  durationDays: "",
};

function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");

  const [showRecord, setShowRecord] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [detail, setDetail] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setApiError("");

      const [usersRes, coursesRes] = await Promise.all([
        api.get("/users").catch(() => ({ data: { data: [] } })),
        api.get("/courses").catch(() => ({ data: { data: [] } })),
      ]);

      setUsers(usersRes.data?.data || usersRes.data || []);
      setCourses(coursesRes.data?.data || coursesRes.data || []);

      try {
        const res = await api.get("/payments/admin/all");
        setPayments(res.data?.data || res.data || []);
      } catch {
        setApiError("Could not fetch payments. Please check your backend.");
        setPayments([]);
      }
    } catch {
      setApiError("Something went wrong while loading the page.");
    } finally {
      setLoading(false);
    }
  };

  const students = useMemo(
    () => users.filter((u) => (u.role || "").toUpperCase() === "STUDENT"),
    [users]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      const name = p.student?.name?.toLowerCase() || "";
      const email = p.student?.email?.toLowerCase() || "";
      const order = (p.orderId || "").toLowerCase();
      const matchesSearch =
        !q || name.includes(q) || email.includes(q) || order.includes(q);
      const matchesMethod =
        methodFilter === "all" ||
        (p.method || "").toUpperCase() === methodFilter.toUpperCase();
      return matchesSearch && matchesMethod;
    });
  }, [payments, search, methodFilter]);

  const stats = useMemo(() => {
    const completed = payments.filter(
      (p) => (p.status || "").toUpperCase() === "COMPLETED"
    );
    const revenue = completed.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const now = new Date();
    const thisMonth = completed
      .filter((p) => {
        const d = new Date(p.createdAt);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    return {
      total: payments.length,
      completed: completed.length,
      revenue,
      thisMonth,
    };
  }, [payments]);

  const money = (n) =>
    `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const fmtDateTime = (d) =>
    d ? new Date(d).toLocaleString("en-IN") : "—";

  const coursesOf = (p) =>
    p.courses && p.courses.length ? p.courses : p.course ? [p.course] : [];

  // ---- Record payment ----
  const toggleCourse = (id) => {
    setForm((f) => {
      const has = f.courseIds.includes(id);
      return {
        ...f,
        courseIds: has
          ? f.courseIds.filter((c) => c !== id)
          : [...f.courseIds, id],
      };
    });
  };

  const openRecord = () => {
    setForm(emptyForm);
    setFormError("");
    setShowRecord(true);
  };

  const submitRecord = async () => {
    setFormError("");

    if (!form.studentId) return setFormError("Please select a student.");
    if (!form.courseIds.length)
      return setFormError("Select at least one course.");
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return setFormError("Enter a valid amount.");
    if (form.method === "UPI" && !form.utr.trim())
      return setFormError("UTR / reference is required for UPI payments.");

    try {
      setSubmitting(true);
      await api.post("/payments/admin/manual", {
        studentId: parseInt(form.studentId),
        courseIds: form.courseIds,
        amount: amt,
        method: form.method,
        utr: form.method === "UPI" ? form.utr.trim() : undefined,
        durationDays: form.durationDays ? parseInt(form.durationDays) : undefined,
      });
      setShowRecord(false);
      setForm(emptyForm);
      await fetchAllData();
    } catch (err) {
      setFormError(
        err.response?.data?.message || "Failed to record payment. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Printing ----
  const printHTML = (title, bodyHtml) => {
    const win = window.open("", "_blank", "width=900,height=1000");
    if (!win) {
      alert("Please allow pop-ups to print.");
      return;
    }
    win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
      <style>
        *{box-sizing:border-box} body{font-family:Arial,Helvetica,sans-serif;color:#1f2937;margin:32px}
        h1{font-size:20px;margin:0 0 4px} .muted{color:#6b7280;font-size:12px}
        .brand{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #4f46e5;padding-bottom:12px;margin-bottom:20px}
        table{width:100%;border-collapse:collapse;margin-top:12px}
        th,td{border:1px solid #e5e7eb;padding:8px 10px;text-align:left;font-size:13px}
        th{background:#f3f4f6}
        .row{display:flex;justify-content:space-between;margin:6px 0;font-size:14px}
        .k{color:#6b7280} .total{font-size:16px;font-weight:700;color:#4f46e5}
        .stamp{display:inline-block;margin-top:16px;border:2px solid #16a34a;color:#16a34a;padding:4px 14px;border-radius:6px;font-weight:700;transform:rotate(-4deg)}
        @media print{body{margin:12mm}}
      </style></head><body>${bodyHtml}
      <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
      </body></html>`);
    win.document.close();
  };

  const printReceipt = (p) => {
    const list = coursesOf(p)
      .map((c) => `<li>${c.title}</li>`)
      .join("");
    printHTML(
      `Receipt ${p.orderId}`,
      `
      <div class="brand">
        <div><h1>${BRAND}</h1><div class="muted">Payment Receipt</div></div>
        <div class="muted"><b>${p.orderId || "—"}</b><br/>${fmtDateTime(p.createdAt)}</div>
      </div>
      <div class="row"><span class="k">Student</span><span>${p.student?.name || "—"} (${p.student?.email || "—"})</span></div>
      <div class="row"><span class="k">Method</span><span>${(p.method || "—").toUpperCase()}${p.paymentId ? ` · UTR: ${p.paymentId}` : ""}</span></div>
      <div class="row"><span class="k">Status</span><span>${(p.status || "—").toUpperCase()}</span></div>
      <div><b>Course(s)</b><ul>${list || "<li>—</li>"}</ul></div>
      <div class="row total"><span>Total Paid</span><span>${money(p.amount)}</span></div>
      <div class="stamp">PAID</div>
      <p class="muted" style="margin-top:24px">This is a system-generated receipt.</p>
    `
    );
  };

  const printAll = () => {
    const rows = filtered
      .map(
        (p, i) => `<tr>
        <td>${i + 1}</td>
        <td>${p.orderId || "—"}</td>
        <td>${p.student?.name || "—"}</td>
        <td>${coursesOf(p).map((c) => c.title).join(", ") || "—"}</td>
        <td>${(p.method || "—").toUpperCase()}</td>
        <td>${p.paymentId || "—"}</td>
        <td>${fmtDate(p.createdAt)}</td>
        <td style="text-align:right">${money(p.amount)}</td>
      </tr>`
      )
      .join("");
    const total = filtered.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    printHTML(
      "Payment Records",
      `
      <div class="brand">
        <div><h1>${BRAND}</h1><div class="muted">Payment Records</div></div>
        <div class="muted">Generated ${fmtDateTime(new Date())}<br/>${filtered.length} record(s)</div>
      </div>
      <table>
        <thead><tr>
          <th>#</th><th>Receipt</th><th>Student</th><th>Course(s)</th>
          <th>Method</th><th>UTR / Ref</th><th>Date</th><th style="text-align:right">Amount</th>
        </tr></thead>
        <tbody>${rows || `<tr><td colspan="8">No records</td></tr>`}</tbody>
        <tfoot><tr><td colspan="7" style="text-align:right;font-weight:700">Total</td>
        <td style="text-align:right" class="total">${money(total)}</td></tr></tfoot>
      </table>
    `
    );
  };

  return (
    <div className="pay-page">
      <div className="pay-header">
        <div>
          <h1 className="pay-title">
            <CreditCard size={26} /> Payments
          </h1>
          <p className="pay-subtitle">
            Record offline (cash / UPI) payments and grant course access.
          </p>
        </div>
        <div className="pay-actions">
          <button className="pay-btn pay-btn-ghost" onClick={printAll}>
            <Printer size={18} /> Print records
          </button>
          <button className="pay-btn pay-btn-ghost" onClick={fetchAllData}>
            <RefreshCw size={18} />
          </button>
          <button className="pay-btn pay-btn-primary" onClick={openRecord}>
            <Plus size={18} /> Record payment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="pay-stats">
        <div className="pay-stat-card">
          <div className="pay-stat-icon indigo">
            <CreditCard size={22} />
          </div>
          <div>
            <div className="pay-stat-value">{stats.total}</div>
            <div className="pay-stat-label">Total Payments</div>
          </div>
        </div>
        <div className="pay-stat-card">
          <div className="pay-stat-icon green">
            <IndianRupee size={22} />
          </div>
          <div>
            <div className="pay-stat-value">{money(stats.revenue)}</div>
            <div className="pay-stat-label">Total Revenue</div>
          </div>
        </div>
        <div className="pay-stat-card">
          <div className="pay-stat-icon amber">
            <Calendar size={22} />
          </div>
          <div>
            <div className="pay-stat-value">{money(stats.thisMonth)}</div>
            <div className="pay-stat-label">This Month</div>
          </div>
        </div>
        <div className="pay-stat-card">
          <div className="pay-stat-icon teal">
            <CheckCircle size={22} />
          </div>
          <div>
            <div className="pay-stat-value">{stats.completed}</div>
            <div className="pay-stat-label">Completed</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="pay-toolbar">
        <div className="pay-search">
          <Search size={18} />
          <input
            placeholder="Search by student, email, or receipt no…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="pay-select"
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
        >
          <option value="all">All Methods</option>
          <option value="CASH">Cash</option>
          <option value="UPI">UPI</option>
        </select>
      </div>

      {apiError && <div className="pay-alert">{apiError}</div>}

      {/* Table */}
      <div className="pay-table-wrap">
        {loading ? (
          <div className="pay-empty">Loading payments…</div>
        ) : filtered.length === 0 ? (
          <div className="pay-empty">
            No payments found. Click “Record payment” to add one.
          </div>
        ) : (
          <table className="pay-table">
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Student</th>
                <th>Course(s)</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="mono">{p.orderId || "—"}</td>
                  <td>
                    <div className="pay-student">
                      <span className="pay-student-name">
                        {p.student?.name || "—"}
                      </span>
                      <span className="pay-student-email">
                        {p.student?.email || ""}
                      </span>
                    </div>
                  </td>
                  <td>
                    {coursesOf(p)
                      .map((c) => c.title)
                      .join(", ") || "—"}
                  </td>
                  <td className="pay-amount">{money(p.amount)}</td>
                  <td>
                    <span
                      className={`pay-badge ${
                        (p.method || "").toUpperCase() === "UPI"
                          ? "badge-upi"
                          : "badge-cash"
                      }`}
                    >
                      {(p.method || "—").toUpperCase()}
                    </span>
                  </td>
                  <td>{fmtDate(p.createdAt)}</td>
                  <td>
                    <span
                      className={`pay-badge status-${(
                        p.status || "pending"
                      ).toLowerCase()}`}
                    >
                      {(p.status || "—").toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="pay-row-actions">
                      <button
                        className="pay-icon-btn"
                        title="View"
                        onClick={() => setDetail(p)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="pay-icon-btn"
                        title="Print receipt"
                        onClick={() => printReceipt(p)}
                      >
                        <Printer size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Record Payment Modal */}
      {showRecord &&
        createPortal(
          <div className="pay-modal-overlay" onClick={() => setShowRecord(false)}>
          <div className="pay-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pay-modal-header">
              <h3>Record Payment</h3>
              <button
                className="pay-icon-btn"
                onClick={() => setShowRecord(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="pay-modal-body">
              {formError && <div className="pay-form-error">{formError}</div>}

              <div className="pay-field">
                <label className="pay-label">Student</label>
                <select
                  className="pay-input"
                  value={form.studentId}
                  onChange={(e) =>
                    setForm({ ...form, studentId: e.target.value })
                  }
                >
                  <option value="">Select a student…</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pay-field">
                <label className="pay-label">
                  Courses to grant ({form.courseIds.length} selected)
                </label>
                <div className="pay-course-list">
                  {courses.length === 0 && (
                    <div className="pay-muted">No courses available.</div>
                  )}
                  {courses.map((c) => (
                    <label key={c.id} className="pay-course-item">
                      <input
                        type="checkbox"
                        checked={form.courseIds.includes(c.id)}
                        onChange={() => toggleCourse(c.id)}
                      />
                      <span>{c.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pay-grid-2">
                <div className="pay-field">
                  <label className="pay-label">Amount (₹)</label>
                  <input
                    className="pay-input"
                    type="number"
                    min="1"
                    placeholder="e.g. 5000"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
                    }
                  />
                </div>
                <div className="pay-field">
                  <label className="pay-label">Access duration (days)</label>
                  <input
                    className="pay-input"
                    type="number"
                    min="1"
                    placeholder="Leave empty = unlimited"
                    value={form.durationDays}
                    onChange={(e) =>
                      setForm({ ...form, durationDays: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="pay-field">
                <label className="pay-label">Payment method</label>
                <div className="pay-method-toggle">
                  <button
                    type="button"
                    className={form.method === "CASH" ? "active" : ""}
                    onClick={() => setForm({ ...form, method: "CASH", utr: "" })}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    className={form.method === "UPI" ? "active" : ""}
                    onClick={() => setForm({ ...form, method: "UPI" })}
                  >
                    UPI
                  </button>
                </div>
              </div>

              {form.method === "UPI" && (
                <div className="pay-field">
                  <label className="pay-label">UTR / Reference ID</label>
                  <input
                    className="pay-input"
                    placeholder="12-digit UTR or transaction reference"
                    value={form.utr}
                    onChange={(e) => setForm({ ...form, utr: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="pay-modal-footer">
              <button
                className="pay-btn pay-btn-ghost"
                onClick={() => setShowRecord(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="pay-btn pay-btn-primary"
                onClick={submitRecord}
                disabled={submitting}
              >
                {submitting ? "Recording…" : "Record & Grant Access"}
              </button>
            </div>
          </div>
        </div>,
          document.body
        )}

      {/* Detail Modal */}
      {detail &&
        createPortal(
          <div className="pay-modal-overlay" onClick={() => setDetail(null)}>
          <div className="pay-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pay-modal-header">
              <h3>Payment {detail.orderId}</h3>
              <button className="pay-icon-btn" onClick={() => setDetail(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="pay-modal-body">
              <div className="pay-detail-row">
                <span>Student</span>
                <b>{detail.student?.name}</b>
              </div>
              <div className="pay-detail-row">
                <span>Email</span>
                <b>{detail.student?.email}</b>
              </div>
              <div className="pay-detail-row">
                <span>Amount</span>
                <b>{money(detail.amount)}</b>
              </div>
              <div className="pay-detail-row">
                <span>Method</span>
                <b>
                  {(detail.method || "—").toUpperCase()}
                  {detail.paymentId ? ` · UTR ${detail.paymentId}` : ""}
                </b>
              </div>
              <div className="pay-detail-row">
                <span>Status</span>
                <b>{(detail.status || "—").toUpperCase()}</b>
              </div>
              <div className="pay-detail-row">
                <span>Date</span>
                <b>{fmtDateTime(detail.createdAt)}</b>
              </div>
              <div className="pay-detail-row">
                <span>Course(s)</span>
                <b>{coursesOf(detail).map((c) => c.title).join(", ") || "—"}</b>
              </div>
            </div>
            <div className="pay-modal-footer">
              <button
                className="pay-btn pay-btn-ghost"
                onClick={() => setDetail(null)}
              >
                Close
              </button>
              <button
                className="pay-btn pay-btn-primary"
                onClick={() => printReceipt(detail)}
              >
                <Printer size={16} /> Print receipt
              </button>
            </div>
          </div>
        </div>,
          document.body
        )}
    </div>
  );
}

export default AdminPayments;