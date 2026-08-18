// src/pages/admin/AdminReports.jsx
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Users,
  BookOpen,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Award,
  Star,
  Activity,
  RefreshCw,
  Download,
  FileText,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import api from "../../services/api";
import "./AdminReports.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

function AdminReports() {
  const [period, setPeriod] = useState("monthly"); // monthly=6m, yearly=12m
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState("");
  const [apiError, setApiError] = useState("");

  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState({ labels: [], data: [], total: 0, growth: 0 });
  const [enroll, setEnroll] = useState({ labels: [], data: [], total: 0, growth: 0 });
  const [courses, setCourses] = useState([]);
  const [payments, setPayments] = useState({ labels: [], data: [], totals: {} });
  const [revByCourse, setRevByCourse] = useState([]);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line
  }, [period]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setApiError("");
      const q = `?period=${period}`;
      const [ov, rev, en, co, pa, rbc] = await Promise.all([
        api.get("/reports/overview").catch(() => null),
        api.get(`/reports/revenue${q}`).catch(() => null),
        api.get(`/reports/enrollment-trends${q}`).catch(() => null),
        api.get("/reports/courses").catch(() => null),
        api.get(`/reports/payments${q}`).catch(() => null),
        api.get("/reports/revenue-by-course").catch(() => null),
      ]);

      const unwrap = (r) => r?.data?.data ?? r?.data ?? null;

      setOverview(unwrap(ov));
      setRevenue(unwrap(rev) || { labels: [], data: [], total: 0, growth: 0 });
      setEnroll(unwrap(en) || { labels: [], data: [], total: 0, growth: 0 });
      setCourses(unwrap(co) || []);
      setPayments(unwrap(pa) || { labels: [], data: [], totals: {} });
      setRevByCourse(unwrap(rbc) || []);

      if (!ov) setApiError("Some report data couldn't be loaded. Check the backend.");
    } catch {
      setApiError("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  const [exportType, setExportType] = useState("overview");

  const handleExport = async (format) => {
    try {
      setExporting(format);
      // The backend reads the report type from ?type= — without it every
      // export silently returns the default "overview" report.
      const res = await api.get(`/reports/export/${format}?type=${exportType}`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], {
        type: format === "pdf" ? "application/pdf" : "text/csv;charset=utf-8",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zsmartclass-${exportType}-report.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setExporting("");
    }
  };

  // ---- derived KPIs ----
  const kpis = useMemo(() => {
    const ov = overview || {};
    const enr = ov.enrollments || {};
    const total = enr.total || 0;
    const completed = enr.completed || 0;
    const inProgress = enr.inProgress || 0;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;
    return {
      students: ov.users?.students || 0,
      activeLearners: inProgress,
      courses: ov.courses?.total || 0,
      published: ov.courses?.published || 0,
      enrollments: total,
      completionRate,
      revenue: ov.revenue || 0,
      certificates: ov.certificates?.active || 0,
      avgRating: ov.reviews?.averageRating || 0,
      notStarted: Math.max(0, total - completed - inProgress),
      completed,
      inProgress,
    };
  }, [overview]);

  // ---- chart data ----
  const lineOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { padding: 10, cornerRadius: 8 } },
    scales: {
      y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" }, ticks: { precision: 0 } },
      x: { grid: { display: false } },
    },
  };

  const revenueChart = {
    labels: revenue.labels,
    datasets: [
      {
        label: "Revenue",
        data: revenue.data,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99,102,241,0.15)",
        fill: true,
        tension: 0.4,
        pointRadius: 3,
      },
    ],
  };

  const enrollChart = {
    labels: enroll.labels,
    datasets: [
      {
        label: "Enrollments",
        data: enroll.data,
        backgroundColor: "#10b981",
        borderRadius: 6,
        maxBarThickness: 32,
      },
    ],
  };

  const topCourses = useMemo(
    () => [...revByCourse].sort((a, b) => b.revenue - a.revenue).slice(0, 6),
    [revByCourse]
  );
  const revByCourseChart = {
    labels: topCourses.map((c) => c.title),
    datasets: [
      {
        label: "Revenue",
        data: topCourses.map((c) => c.revenue),
        backgroundColor: "#8b5cf6",
        borderRadius: 6,
        maxBarThickness: 24,
      },
    ],
  };

  const paymentDoughnut = {
    labels: ["Completed", "Pending", "Failed"],
    datasets: [
      {
        data: [
          payments.totals?.completed || 0,
          payments.totals?.pending || 0,
          payments.totals?.failed || 0,
        ],
        backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
        borderWidth: 0,
      },
    ],
  };

  const enrollmentDoughnut = {
    labels: ["Completed", "In Progress", "Not Started"],
    datasets: [
      {
        data: [kpis.completed, kpis.inProgress, kpis.notStarted],
        backgroundColor: ["#10b981", "#6366f1", "#e5e7eb"],
        borderWidth: 0,
      },
    ],
  };

  const courseStatusDoughnut = {
    labels: ["Published", "Draft", "Archived"],
    datasets: [
      {
        data: [
          overview?.courses?.published || 0,
          overview?.courses?.draft || 0,
          overview?.courses?.archived || 0,
        ],
        backgroundColor: ["#10b981", "#f59e0b", "#94a3b8"],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: { legend: { position: "bottom", labels: { padding: 14, usePointStyle: true, boxWidth: 8 } } },
  };
  const barHOpts = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => money(c.raw) } } },
    scales: { x: { beginAtZero: true, ticks: { callback: (v) => money(v) } }, y: { grid: { display: false } } },
  };

  const GrowthBadge = ({ value }) => {
    const up = value >= 0;
    return (
      <span className={`rp-growth ${up ? "up" : "down"}`}>
        {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
        {Math.abs(value)}%
      </span>
    );
  };

  const kpiCards = [
    { label: "Students", value: kpis.students, icon: Users, color: "#6366f1" },
    { label: "Active Learners", value: kpis.activeLearners, icon: Activity, color: "#06b6d4" },
    { label: "Courses", value: kpis.courses, icon: BookOpen, color: "#8b5cf6", sub: `${kpis.published} published` },
    { label: "Enrollments", value: kpis.enrollments, icon: GraduationCap, color: "#0ea5e9" },
    { label: "Completion Rate", value: `${kpis.completionRate}%`, icon: TrendingUp, color: "#10b981" },
    { label: "Revenue", value: money(kpis.revenue), icon: IndianRupee, color: "#f59e0b" },
    { label: "Certificates", value: kpis.certificates, icon: Award, color: "#ec4899" },
    { label: "Avg Rating", value: kpis.avgRating.toFixed(1), icon: Star, color: "#eab308" },
  ];

  return (
    <div className="rp-page">
      <div className="rp-header">
        <div>
          <h1 className="rp-title"><BarChart3 size={26} /> Reports &amp; Analytics</h1>
          <p className="rp-subtitle">Platform performance, revenue, and learner insights.</p>
        </div>
        <div className="rp-actions">
          <div className="rp-period">
            <button className={period === "monthly" ? "active" : ""} onClick={() => setPeriod("monthly")}>6 Months</button>
            <button className={period === "yearly" ? "active" : ""} onClick={() => setPeriod("yearly")}>12 Months</button>
          </div>
          <select
            className="rp-export-select"
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
            title="Choose which report to export"
          >
            <option value="overview">Overview</option>
            <option value="courses">Courses</option>
            <option value="users">Users</option>
            <option value="enrollments">Enrollments</option>
            <option value="payments">Payments</option>
            <option value="revenue">Revenue</option>
          </select>
          <button className="rp-btn ghost" onClick={() => handleExport("csv")} disabled={exporting === "csv"}>
            <Download size={16} /> {exporting === "csv" ? "…" : "CSV"}
          </button>
          <button className="rp-btn ghost" onClick={() => handleExport("pdf")} disabled={exporting === "pdf"}>
            <FileText size={16} /> {exporting === "pdf" ? "…" : "PDF"}
          </button>
          <button className="rp-btn ghost icon" onClick={fetchAll}><RefreshCw size={16} /></button>
        </div>
      </div>

      {apiError && <div className="rp-alert">{apiError}</div>}

      {loading ? (
        <div className="rp-empty">Loading analytics…</div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="rp-kpis">
            {kpiCards.map((k) => {
              const Icon = k.icon;
              return (
                <div className="rp-kpi" key={k.label}>
                  <div className="rp-kpi-icon" style={{ background: `${k.color}18`, color: k.color }}>
                    <Icon size={20} />
                  </div>
                  <div className="rp-kpi-value">{k.value}</div>
                  <div className="rp-kpi-label">{k.label}</div>
                  {k.sub && <div className="rp-kpi-sub">{k.sub}</div>}
                </div>
              );
            })}
          </div>

          {/* Trends row */}
          <div className="rp-grid-2">
            <div className="rp-card">
              <div className="rp-card-head">
                <div>
                  <h3>Revenue Trend</h3>
                  <span className="rp-card-total">{money(revenue.total)}</span>
                </div>
                <GrowthBadge value={revenue.growth || 0} />
              </div>
              <div className="rp-chart"><Line data={revenueChart} options={lineOpts} /></div>
            </div>

            <div className="rp-card">
              <div className="rp-card-head">
                <div>
                  <h3>Enrollment Trend</h3>
                  <span className="rp-card-total">{enroll.total} enrollments</span>
                </div>
                <GrowthBadge value={enroll.growth || 0} />
              </div>
              <div className="rp-chart"><Bar data={enrollChart} options={lineOpts} /></div>
            </div>
          </div>

          {/* Breakdown row */}
          <div className="rp-grid-3">
            <div className="rp-card">
              <div className="rp-card-head"><h3>Enrollment Status</h3></div>
              <div className="rp-chart sm"><Doughnut data={enrollmentDoughnut} options={doughnutOpts} /></div>
            </div>
            <div className="rp-card">
              <div className="rp-card-head"><h3>Payments</h3></div>
              <div className="rp-chart sm"><Doughnut data={paymentDoughnut} options={doughnutOpts} /></div>
            </div>
            <div className="rp-card">
              <div className="rp-card-head"><h3>Course Status</h3></div>
              <div className="rp-chart sm"><Doughnut data={courseStatusDoughnut} options={doughnutOpts} /></div>
            </div>
          </div>

          {/* Revenue by course */}
          <div className="rp-card">
            <div className="rp-card-head"><h3>Top Courses by Revenue</h3></div>
            {topCourses.length === 0 ? (
              <div className="rp-empty sm">No revenue data yet.</div>
            ) : (
              <div className="rp-chart wide"><Bar data={revByCourseChart} options={barHOpts} /></div>
            )}
          </div>

          {/* Course performance table */}
          <div className="rp-card">
            <div className="rp-card-head"><h3>Course Performance</h3></div>
            <div className="rp-table-wrap">
              <table className="rp-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Enrollments</th>
                    <th>Completion</th>
                    <th>Rating</th>
                    <th>Modules</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.length === 0 ? (
                    <tr><td colSpan={8} className="rp-empty sm">No courses yet.</td></tr>
                  ) : (
                    courses.map((c) => (
                      <tr key={c.id}>
                        <td className="rp-course-title">{c.title}</td>
                        <td>{c.category}</td>
                        <td>
                          <span className={`rp-badge status-${(c.status || "").toLowerCase()}`}>
                            {c.status}
                          </span>
                        </td>
                        <td>{c.enrollments}</td>
                        <td>
                          <div className="rp-progress">
                            <div className="rp-progress-bar" style={{ width: `${c.completionRate}%` }} />
                            <span>{c.completionRate}%</span>
                          </div>
                        </td>
                        <td>
                          <span className="rp-rating"><Star size={13} fill="#eab308" color="#eab308" /> {c.avgRating || 0}</span>
                        </td>
                        <td>{c.modules}</td>
                        <td className="rp-revenue">{money(c.revenue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminReports;