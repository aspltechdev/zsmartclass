import { useEffect, useMemo, useRef, useState } from "react";
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
import "./AdminShared.css";

const newForm = () => ({
  studentId: "",
  courseIds: [],
  amount: "",
  method: "CASH",
  utr: "",
  durationDays: "",
  recordedByName: "",
  upiAccountName: "",
});

const listOf = (response) =>
  Array.isArray(response?.data?.data)
    ? response.data.data
    : Array.isArray(response?.data)
      ? response.data
      : [];

const upper = (value) => String(value || "").toUpperCase();

const money = (value) =>
  "₹" +
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

const receiptMoney = (payment) => {
  const currency = payment.currency || "INR";
  const amount = Number(payment.amount || 0);

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return currency + " " + amount.toFixed(2);
  }
};

const dateText = (value, full = false) => {
  const date = new Date(value);

  if (!value || !Number.isFinite(date.getTime())) return "—";

  return full
    ? date.toLocaleString("en-IN")
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const coursesOf = (payment) =>
  payment.courses?.length
    ? payment.courses
    : payment.course
      ? [payment.course]
      : [];

const courseNames = (payment) =>
  coursesOf(payment)
    .map((course) => course.title)
    .join(", ") || "—";

const recorderOf = (payment) =>
  payment.recordedByName || "Not recorded";

const accountOf = (payment) =>
  upper(payment.method) === "UPI"
    ? payment.upiAccountName || "Not recorded"
    : "—";

const PRINT_STYLES = `
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    background: #eef1f5;
    color: #172033;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 13px;
    line-height: 1.5;
  }

  .receipt-sheet {
    width: 100%;
    max-width: 960px;
    margin: 24px auto;
    padding: 38px;
    background: #fff;
    border: 1px solid #dce2ea;
  }

  .receipt-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
    padding-bottom: 24px;
    border-bottom: 3px solid #6455ed;
  }

  .receipt-brand {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .receipt-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 58px;
    width: 58px;
    height: 58px;
    border-radius: 16px;
    background: #ffbf19;
    color: #111827;
    font-family: Georgia, serif;
    font-size: 24px;
  }

  .receipt-brand h1 {
    margin: 0;
    font-size: 25px;
    font-weight: 800;
  }

  .receipt-brand p {
    margin: 3px 0 0;
    color: #64748b;
    font-size: 12px;
  }

  .receipt-heading {
    text-align: right;
  }

  .receipt-heading h2 {
    margin: 0;
    color: #5145ce;
    font-size: 19px;
    letter-spacing: 1px;
  }

  .receipt-heading p {
    margin: 5px 0 0;
    color: #64748b;
    font-size: 12px;
    overflow-wrap: anywhere;
  }

  .receipt-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin: 26px 0;
  }

  .receipt-box {
    min-width: 0;
    padding: 18px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
  }

  .receipt-section-label {
    margin: 0 0 12px;
    color: #5145ce;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .receipt-student-name {
    margin: 0 0 8px;
    font-size: 17px;
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  .receipt-detail-line {
    margin: 7px 0;
    overflow-wrap: anywhere;
  }

  .receipt-detail-label {
    color: #64748b;
  }

  table {
    width: 100%;
    margin-top: 18px;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 12px;
    border: 1px solid #dce2ea;
    text-align: left;
    vertical-align: top;
    overflow-wrap: anywhere;
  }

  th {
    background: #f1f3fc;
    color: #334155;
    font-size: 11px;
    letter-spacing: 0.3px;
  }

  .receipt-amount-cell {
    width: 145px;
    text-align: right;
    white-space: nowrap;
  }

  .receipt-course-name {
    margin: 5px 0 0;
  }

  .receipt-summary {
    display: flex;
    justify-content: flex-end;
    margin-top: 18px;
  }

  .receipt-total {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    width: 330px;
    padding: 16px;
    border: 1px solid #d9d5ff;
    border-radius: 8px;
    background: #f5f3ff;
    color: #33268e;
    font-size: 16px;
    font-weight: 700;
  }

  .receipt-note {
    margin-top: 22px;
    color: #64748b;
    font-size: 12px;
  }

  .receipt-signatures {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 70px;
    margin-top: 48px;
    break-inside: avoid;
  }

  .receipt-signature-space {
    height: 85px;
    border-bottom: 1px solid #94a3b8;
  }

  .receipt-seal-space {
    height: 85px;
    border: 1px dashed #94a3b8;
    border-radius: 8px;
  }

  .receipt-signature-label {
    margin: 9px 0 0;
    text-align: center;
    font-size: 12px;
    font-weight: 700;
  }

  .receipt-signature-caption {
    margin: 3px 0 0;
    text-align: center;
    color: #64748b;
    font-size: 11px;
  }

  .receipt-footer {
    margin-top: 32px;
    padding-top: 14px;
    border-top: 1px solid #e2e8f0;
    color: #64748b;
    text-align: center;
    font-size: 11px;
  }

  .records-table {
    font-size: 10px;
  }

  .records-table th,
  .records-table td {
    padding: 8px 6px;
  }

  thead {
    display: table-header-group;
  }

  tr {
    break-inside: avoid;
  }

  @page {
    size: A4;
    margin: 12mm;
  }

  @media print {
    body {
      background: #fff;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    .receipt-sheet {
      max-width: none;
      margin: 0;
      padding: 0;
      border: 0;
    }

    .receipt-header,
    .receipt-details,
    .receipt-summary {
      break-inside: avoid;
    }
  }
`;

function PaymentModal({
  title,
  onClose,
  busy = false,
  children,
  footer,
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    modalRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  const handleKeys = (event) => {
    if (event.key === "Escape" && !busy) onClose();
    if (event.key !== "Tab") return;

    const items = Array.from(
      event.currentTarget.querySelectorAll(
        "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]"
      )
    );

    if (!items.length) {
      event.preventDefault();
      return;
    }

    const first = items[0];
    const last = items[items.length - 1];

    if (
      event.shiftKey &&
      (document.activeElement === first ||
        document.activeElement === modalRef.current)
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (document.activeElement === last ||
        document.activeElement === modalRef.current)
    ) {
      event.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      className="pay-modal-overlay"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="pay-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={handleKeys}
        onClick={(event) => event.stopPropagation()}
        style={{
          outline: "none",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="pay-modal-header">
          <h3>{title}</h3>
          <button
            type="button"
            className="pay-icon-btn"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="pay-modal-body"
          style={{ overflowY: "auto", minHeight: 0 }}
        >
          {children}
        </div>

        <div className="pay-modal-footer">{footer}</div>
      </div>
    </div>,
    document.body
  );
}

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");

  const [showRecord, setShowRecord] = useState(false);
  const [form, setForm] = useState(newForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [detail, setDetail] = useState(null);
  const [printError, setPrintError] = useState("");

  const savingRef = useRef(false);
  const requestRef = useRef(0);

  const fetchOptions = async (url) => {
    const result = new Map();
    let page = 1;

    while (true) {
      const response = await api.get(url, {
        params: { page, limit: 100 },
      });

      const items = listOf(response);
      const previousSize = result.size;
      items.forEach((item) => result.set(item.id, item));

      const pagination = response.data?.pagination;
      const more =
        pagination?.hasMore ??
        (page < Number(pagination?.totalPages || 1));

      if (!items.length || !more || result.size === previousSize) break;
      page += 1;
    }

    return Array.from(result.values());
  };

  const load = async () => {
    const request = ++requestRef.current;
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      fetchOptions("/users"),
      fetchOptions("/courses"),
      api.get("/payments/admin/all"),
    ]);

    if (request !== requestRef.current) return;

    const errors = [];

    if (results[0].status === "fulfilled") {
      setUsers(results[0].value);
    } else {
      errors.push("Unable to load students.");
    }

    if (results[1].status === "fulfilled") {
      setCourses(results[1].value);
    } else {
      errors.push("Unable to load courses.");
    }

    if (results[2].status === "fulfilled") {
      setPayments(listOf(results[2].value));
    } else {
      errors.push("Unable to load payments.");
    }

    setError(errors.join(" "));
    setLoading(false);
  };

  useEffect(() => {
    load();
    return () => {
      requestRef.current += 1;
    };
  }, []);

  const students = users.filter(
    (user) => upper(user.role) === "STUDENT"
  );

  const filtered = useMemo(
    () =>
      payments.filter((payment) => {
        const text = [
          payment.student?.name,
          payment.student?.email,
          payment.orderId,
          payment.paymentId,
          payment.recordedByName,
          payment.upiAccountName,
          courseNames(payment),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return (
          text.includes(search.trim().toLowerCase()) &&
          (methodFilter === "all" ||
            upper(payment.method) === methodFilter)
        );
      }),
    [payments, search, methodFilter]
  );

  const stats = useMemo(() => {
    const completed = payments.filter(
      (payment) => upper(payment.status) === "COMPLETED"
    );

    const now = new Date();
    const sum = (items) =>
      items.reduce(
        (total, payment) => total + Number(payment.amount || 0),
        0
      );

    return {
      total: payments.length,
      completed: completed.length,
      revenue: sum(completed),
      month: sum(
        completed.filter((payment) => {
          const date = new Date(payment.createdAt);
          return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
          );
        })
      ),
    };
  }, [payments]);

  const updateForm = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const closeRecord = () => {
    if (!savingRef.current) setShowRecord(false);
  };

  const submitRecord = async () => {
    if (savingRef.current) return;

    setFormError("");

    const amount = Number(form.amount);
    const duration =
      form.durationDays === "" ? null : Number(form.durationDays);

    if (!form.studentId) return setFormError("Select a student.");
    if (!form.courseIds.length) {
      return setFormError("Select at least one course.");
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return setFormError("Enter a valid amount greater than zero.");
    }

    if (!form.recordedByName.trim()) {
      return setFormError(
        "Enter the name of the person recording this payment."
      );
    }

    if (form.method === "UPI" && !form.upiAccountName.trim()) {
      return setFormError("Enter the receiving UPI account name.");
    }

    if (form.method === "UPI" && !form.utr.trim()) {
      return setFormError("Enter the UTR / reference ID.");
    }

    if (
      duration !== null &&
      (!Number.isInteger(duration) || duration <= 0)
    ) {
      return setFormError(
        "Access duration must be a positive whole number."
      );
    }

    savingRef.current = true;
    setSubmitting(true);

    try {
      const response = await api.post("/payments/admin/manual", {
        studentId: Number(form.studentId),
        courseIds: form.courseIds,
        amount,
        method: form.method,
        durationDays: duration,
        recordedByName: form.recordedByName.trim(),
        upiAccountName:
          form.method === "UPI" ? form.upiAccountName.trim() : null,
        utr: form.method === "UPI" ? form.utr.trim() : null,
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to record payment."
        );
      }

      setShowRecord(false);
      setForm(newForm());
      setNotice(
        response.data.message || "Payment recorded successfully."
      );

      await load();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          "Unable to confirm payment recording. Refresh payment records before retrying."
      );
    } finally {
      savingRef.current = false;
      setSubmitting(false);
    }
  };

  const printPayments = (items, single) => {
    setPrintError("");

    if (single && !items.length) {
      setPrintError("Select a payment to print.");
      return;
    }

    const win = window.open("", "_blank", "width=1100,height=900");

    if (!win) {
      setPrintError("Allow browser pop-ups to print.");
      return;
    }

    const doc = win.document;
    doc.title = single
      ? "Payment Receipt " + (items[0].orderId || items[0].id)
      : "Payment Records";

    const style = doc.createElement("style");
    style.textContent = PRINT_STYLES;
    doc.head.appendChild(style);

    // Never interpret student or payment values as HTML.
    const add = (parent, tag, text, className) => {
      const element = doc.createElement(tag);

      if (text !== undefined && text !== null) {
        element.textContent = String(text);
      }

      if (className) element.className = className;
      parent.appendChild(element);
      return element;
    };

    const detailLine = (parent, label, value) => {
      const line = add(parent, "p", undefined, "receipt-detail-line");
      add(line, "span", label + ": ", "receipt-detail-label");
      add(line, "span", value || "—");
    };

    const sheet = add(doc.body, "main", undefined, "receipt-sheet");
    const header = add(sheet, "header", undefined, "receipt-header");
    const brand = add(header, "div", undefined, "receipt-brand");

    add(brand, "div", "ZC", "receipt-logo");

    const brandText = add(brand, "div");
    add(brandText, "h1", "ZmartClass");
    add(brandText, "p", "Learning Management System");

    const heading = add(
      header,
      "div",
      undefined,
      "receipt-heading"
    );

    add(
      heading,
      "h2",
      single ? "PAYMENT RECEIPT" : "PAYMENT RECORDS"
    );

    add(
      heading,
      "p",
      single
        ? "Receipt No: " + (items[0].orderId || items[0].id)
        : "Number of records: " + items.length
    );

    if (single) {
      const payment = items[0];
      const details = add(
        sheet,
        "section",
        undefined,
        "receipt-details"
      );

      const studentBox = add(
        details,
        "div",
        undefined,
        "receipt-box"
      );

      add(
        studentBox,
        "p",
        "Student details",
        "receipt-section-label"
      );

      add(
        studentBox,
        "p",
        payment.student?.name || "—",
        "receipt-student-name"
      );

      detailLine(studentBox, "Email", payment.student?.email);

      const paymentBox = add(
        details,
        "div",
        undefined,
        "receipt-box"
      );

      add(
        paymentBox,
        "p",
        "Payment details",
        "receipt-section-label"
      );

      detailLine(
        paymentBox,
        "Payment date",
        dateText(payment.createdAt, true)
      );
      detailLine(paymentBox, "Payment method", upper(payment.method));
      detailLine(paymentBox, "Status", upper(payment.status));
      detailLine(paymentBox, "Recorded by", recorderOf(payment));

      if (upper(payment.method) === "UPI") {
        detailLine(paymentBox, "UPI account", accountOf(payment));
        detailLine(paymentBox, "UTR / Reference", payment.paymentId);
      }

      const table = add(sheet, "table");
      const tableHeader = add(add(table, "thead"), "tr");

      add(tableHeader, "th", "#");
      add(tableHeader, "th", "DESCRIPTION / COURSE(S)");
      add(tableHeader, "th", "AMOUNT", "receipt-amount-cell");

      const row = add(add(table, "tbody"), "tr");
      add(row, "td", "1");

      const description = add(row, "td");
      add(description, "strong", "Course payment");

      const paymentCourses = coursesOf(payment);

      if (paymentCourses.length) {
        paymentCourses.forEach((course) => {
          add(
            description,
            "p",
            course.title || "Course",
            "receipt-course-name"
          );
        });
      } else {
        add(
          description,
          "p",
          "Course details unavailable",
          "receipt-course-name"
        );
      }

      add(
        row,
        "td",
        receiptMoney(payment),
        "receipt-amount-cell"
      );

      const summary = add(
        sheet,
        "div",
        undefined,
        "receipt-summary"
      );
      const total = add(
        summary,
        "div",
        undefined,
        "receipt-total"
      );

      add(total, "span", "Total amount");
      add(total, "span", receiptMoney(payment));

      add(
        sheet,
        "p",
        "Payment status: " +
          (upper(payment.status) || "—") +
          ". Please quote the receipt number for any payment enquiries.",
        "receipt-note"
      );

      const signatures = add(
        sheet,
        "section",
        undefined,
        "receipt-signatures"
      );

      const signature = add(signatures, "div");
      add(
        signature,
        "div",
        undefined,
        "receipt-signature-space"
      );
      add(
        signature,
        "p",
        "Authorized Signature",
        "receipt-signature-label"
      );
      add(
        signature,
        "p",
        "For ZmartClass",
        "receipt-signature-caption"
      );

      const seal = add(signatures, "div");
      add(seal, "div", undefined, "receipt-seal-space");
      add(
        seal,
        "p",
        "Official Seal",
        "receipt-signature-label"
      );
      add(
        seal,
        "p",
        "Stamp here after printing",
        "receipt-signature-caption"
      );
    } else {
      const table = add(sheet, "table", undefined, "records-table");
      const headings = [
        "Receipt",
        "Student",
        "Course(s)",
        "Recorded by",
        "Method",
        "UPI account",
        "UTR / Ref",
        "Date",
        "Status",
        "Amount",
      ];

      const tableHeader = add(add(table, "thead"), "tr");
      headings.forEach((text) => add(tableHeader, "th", text));

      const tbody = add(table, "tbody");

      items.forEach((payment) => {
        const row = add(tbody, "tr");

        [
          payment.orderId || payment.id || "—",
          payment.student?.name || "—",
          courseNames(payment),
          recorderOf(payment),
          upper(payment.method) || "—",
          accountOf(payment),
          upper(payment.method) === "UPI"
            ? payment.paymentId || "—"
            : "—",
          dateText(payment.createdAt),
          upper(payment.status) || "—",
          receiptMoney(payment),
        ].forEach((value) => add(row, "td", value));
      });

      if (!items.length) {
        const cell = add(
          add(tbody, "tr"),
          "td",
          "No payment records."
        );
        cell.colSpan = headings.length;
      }

      const totals = new Map();

      items.forEach((payment) => {
        const currency = payment.currency || "INR";
        totals.set(
          currency,
          (totals.get(currency) || 0) + Number(payment.amount || 0)
        );
      });

      totals.forEach((amount, currency) => {
        const summary = add(
          sheet,
          "div",
          undefined,
          "receipt-summary"
        );
        const total = add(
          summary,
          "div",
          undefined,
          "receipt-total"
        );

        add(total, "span", "Recorded total");
        add(total, "span", receiptMoney({ amount, currency }));
      });
    }

    const footer = add(
      sheet,
      "footer",
      undefined,
      "receipt-footer"
    );
    add(footer, "div", "Thank you for choosing ZmartClass.");
    add(footer, "div", "Printed on " + dateText(new Date(), true));

    win.focus();

    win.setTimeout(() => {
      if (!win.closed) win.print();
    }, 350);
  };

  return (
    <div className="pay-page">
      <style>
        {`
          .pay-page .pay-table-wrap {
            width:100%;
            max-width:100%;
            overflow-x:auto!important;
          }
          .pay-page .pay-table {
            width:100%;
            min-width:1150px;
          }
          .pay-page .pay-table .pay-actions-column {
            display:table-cell!important;
            position:sticky;
            right:0;
            min-width:88px;
            width:88px;
            text-align:center;
            background:white;
            z-index:2;
            box-shadow:-3px 0 8px #0000000d;
          }
          .pay-page .pay-table th.pay-actions-column {
            background:#f8fafc;
            z-index:3;
          }
          .pay-page .pay-actions-column .pay-row-actions {
            justify-content:center;
          }
          .pay-page .pay-view-btn {
            width:34px;
            height:34px;
            padding:0;
            border:1px solid #a5f3fc;
            background:#ecfeff;
            color:#0e7490;
            border-radius:8px;
            display:inline-flex;
            align-items:center;
            justify-content:center;
          }
          .pay-page .pay-view-btn:hover {
            background:#cffafe;
          }
          .pay-page .pay-view-btn:focus-visible {
            outline:2px solid #06b6d4;
            outline-offset:2px;
          }
          .pay-modal .pay-detail-row {
            gap:16px;
          }
          .pay-modal .pay-detail-row b {
            min-width:0;
            overflow-wrap:anywhere;
          }
        `}
      </style>

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
          <button
            type="button"
            className="pay-btn pay-btn-ghost"
            disabled={loading}
            onClick={() => printPayments(filtered, false)}
          >
            <Printer size={18} /> Print records
          </button>

          <button
            type="button"
            className="pay-btn pay-btn-ghost"
            disabled={loading}
            onClick={load}
            aria-label="Refresh payments"
          >
            <RefreshCw size={18} />
          </button>

          <button
            type="button"
            className="pay-btn pay-btn-primary"
            disabled={loading}
            onClick={() => {
              setForm(newForm());
              setFormError("");
              setNotice("");
              setShowRecord(true);
            }}
          >
            <Plus size={18} /> Record payment
          </button>
        </div>
      </div>

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
            <div className="pay-stat-value">{money(stats.month)}</div>
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

      <div className="pay-toolbar">
        <div className="pay-search">
          <Search size={18} />
          <input
            aria-label="Search payments"
            placeholder="Search student, receipt, recorded by or UPI account..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          className="pay-select"
          aria-label="Payment method"
          value={methodFilter}
          onChange={(event) => setMethodFilter(event.target.value)}
        >
          <option value="all">All Methods</option>
          <option value="CASH">Cash</option>
          <option value="UPI">UPI</option>
        </select>
      </div>

      {error && (
        <div className="pay-alert" role="alert">{error}</div>
      )}

      {notice && (
        <div className="pay-alert" role="status">{notice}</div>
      )}

      {printError && !detail && (
        <div className="pay-alert" role="alert">{printError}</div>
      )}

      <div className="pay-table-wrap">
        {loading ? (
          <div className="pay-empty">Loading payments...</div>
        ) : !filtered.length ? (
          <div className="pay-empty">No payments found.</div>
        ) : (
          <table className="pay-table">
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Student</th>
                <th>Course(s)</th>
                <th>Amount</th>
                <th>Recorded by</th>
                <th>Method</th>
                <th>UPI account</th>
                <th>Date</th>
                <th>Status</th>
                <th className="pay-actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((payment) => (
                <tr key={payment.id}>
                  <td className="mono">{payment.orderId || "—"}</td>
                  <td>
                    <div className="pay-student">
                      <span className="pay-student-name">
                        {payment.student?.name || "—"}
                      </span>
                      <span className="pay-student-email">
                        {payment.student?.email || ""}
                      </span>
                    </div>
                  </td>
                  <td>{courseNames(payment)}</td>
                  <td className="pay-amount">{money(payment.amount)}</td>
                  <td>{recorderOf(payment)}</td>
                  <td>
                    <span
                      className={
                        "pay-badge " +
                        (upper(payment.method) === "UPI"
                          ? "badge-upi"
                          : "badge-cash")
                      }
                    >
                      {upper(payment.method) || "—"}
                    </span>
                  </td>
                  <td>{accountOf(payment)}</td>
                  <td>{dateText(payment.createdAt)}</td>
                  <td>
                    <span
                      className={
                        "pay-badge status-" +
                        String(payment.status || "pending").toLowerCase()
                      }
                    >
                      {upper(payment.status) || "—"}
                    </span>
                  </td>
                  <td className="pay-actions-column">
                    <div className="pay-row-actions">
                      <button
                        type="button"
                        className="pay-icon-btn pay-view-btn"
                        title="View payment"
                        aria-label={"View payment " + payment.orderId}
                        onClick={() => {
                          setPrintError("");
                          setDetail(payment);
                        }}
                      >
                        <Eye size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showRecord && (
        <PaymentModal
          title="Record Payment"
          busy={submitting}
          onClose={closeRecord}
          footer={
            <>
              <button
                type="button"
                className="pay-btn pay-btn-ghost"
                disabled={submitting}
                onClick={closeRecord}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pay-btn pay-btn-primary"
                disabled={submitting}
                onClick={submitRecord}
              >
                {submitting ? "Recording..." : "Record & Grant Access"}
              </button>
            </>
          }
        >
          {formError && (
            <div className="pay-form-error" role="alert">{formError}</div>
          )}

          <div className="pay-field">
            <label className="pay-label" htmlFor="pay-student">
              Student
            </label>
            <select
              id="pay-student"
              className="pay-input"
              disabled={submitting}
              value={form.studentId}
              onChange={(event) =>
                updateForm({ studentId: event.target.value })
              }
            >
              <option value="">Select a student...</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>
          </div>

          <div className="pay-field">
            <label className="pay-label" htmlFor="pay-recorder">
              Recorded by
            </label>
            <input
              id="pay-recorder"
              className="pay-input"
              maxLength={120}
              placeholder="Enter your name"
              disabled={submitting}
              value={form.recordedByName}
              onChange={(event) =>
                updateForm({ recordedByName: event.target.value })
              }
            />
          </div>

          <div className="pay-field">
            <div className="pay-label">
              Courses to grant ({form.courseIds.length} selected)
            </div>
            <div className="pay-course-list">
              {!courses.length && (
                <div className="pay-muted">No courses available.</div>
              )}
              {courses.map((course) => (
                <label key={course.id} className="pay-course-item">
                  <input
                    type="checkbox"
                    disabled={submitting}
                    checked={form.courseIds.includes(course.id)}
                    onChange={() =>
                      setForm((current) => ({
                        ...current,
                        courseIds: current.courseIds.includes(course.id)
                          ? current.courseIds.filter((id) => id !== course.id)
                          : [...current.courseIds, course.id],
                      }))
                    }
                  />
                  <span>{course.title}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pay-grid-2">
            <div className="pay-field">
              <label className="pay-label" htmlFor="pay-amount">
                Amount (₹)
              </label>
              <input
                id="pay-amount"
                className="pay-input"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="e.g. 5000"
                disabled={submitting}
                value={form.amount}
                onChange={(event) =>
                  updateForm({ amount: event.target.value })
                }
              />
            </div>

            <div className="pay-field">
              <label className="pay-label" htmlFor="pay-duration">
                Access duration (days)
              </label>
              <input
                id="pay-duration"
                className="pay-input"
                type="number"
                min="1"
                step="1"
                placeholder="Leave empty = unlimited"
                disabled={submitting}
                value={form.durationDays}
                onChange={(event) =>
                  updateForm({ durationDays: event.target.value })
                }
              />
            </div>
          </div>

          <div className="pay-field">
            <div className="pay-label">Payment method</div>
            <div className="pay-method-toggle">
              <button
                type="button"
                disabled={submitting}
                className={form.method === "CASH" ? "active" : ""}
                onClick={() =>
                  updateForm({
                    method: "CASH",
                    utr: "",
                    upiAccountName: "",
                  })
                }
              >
                Cash
              </button>
              <button
                type="button"
                disabled={submitting}
                className={form.method === "UPI" ? "active" : ""}
                onClick={() => updateForm({ method: "UPI" })}
              >
                UPI
              </button>
            </div>
          </div>

          {form.method === "UPI" && (
            <>
              <div className="pay-field">
                <label className="pay-label" htmlFor="pay-account">
                  UPI account name
                </label>
                <input
                  id="pay-account"
                  className="pay-input"
                  maxLength={120}
                  placeholder="e.g. Dementee"
                  disabled={submitting}
                  value={form.upiAccountName}
                  onChange={(event) =>
                    updateForm({ upiAccountName: event.target.value })
                  }
                />
              </div>
              <div className="pay-field">
                <label className="pay-label" htmlFor="pay-utr">
                  UTR / Reference ID
                </label>
                <input
                  id="pay-utr"
                  className="pay-input"
                  placeholder="UTR or transaction reference"
                  disabled={submitting}
                  value={form.utr}
                  onChange={(event) =>
                    updateForm({ utr: event.target.value })
                  }
                />
              </div>
            </>
          )}
        </PaymentModal>
      )}

      {detail && (
        <PaymentModal
          title={"Payment " + (detail.orderId || detail.id)}
          onClose={() => setDetail(null)}
          footer={
            <>
              <button
                type="button"
                className="pay-btn pay-btn-ghost"
                onClick={() => setDetail(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="pay-btn pay-btn-primary"
                onClick={() => printPayments([detail], true)}
              >
                <Printer size={16} /> Print receipt
              </button>
            </>
          }
        >
          {printError && (
            <div className="pay-form-error" role="alert">{printError}</div>
          )}

          {[
            ["Student", detail.student?.name || "—"],
            ["Email", detail.student?.email || "—"],
            ["Recorded by", recorderOf(detail)],
            ["Amount", money(detail.amount)],
            ["Method", upper(detail.method) || "—"],
            ...(upper(detail.method) === "UPI"
              ? [
                  ["UPI account name", accountOf(detail)],
                  ["UTR / Reference", detail.paymentId || "—"],
                ]
              : []),
            ["Status", upper(detail.status) || "—"],
            ["Date", dateText(detail.createdAt, true)],
            ["Course(s)", courseNames(detail)],
          ].map(([label, value]) => (
            <div className="pay-detail-row" key={label}>
              <span>{label}</span>
              <b>{value}</b>
            </div>
          ))}
        </PaymentModal>
      )}
    </div>
  );
}