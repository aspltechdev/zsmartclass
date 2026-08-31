// src/pages/admin/AdminReports.jsx
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3, Users, BookOpen, GraduationCap, TrendingUp, TrendingDown,
  IndianRupee, Award, Star, Activity, RefreshCw, FileText,
  Wallet, Target, AlertTriangle, CheckCircle2, Clock,
} from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import api from "../../services/api";
import "./AdminReports.css";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler
);

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const compact = (n) => {
  const v = Number(n || 0);
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v}`;
};

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "revenue", label: "Revenue", icon: Wallet },
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "learners", label: "Learners", icon: Users },
];

function AdminReports() {
  const [tab, setTab] = useState("overview");
  const [period, setPeriod] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState("");
  const [exportType, setExportType] = useState("overview");
  const [apiError, setApiError] = useState("");

  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState({ labels: [], data: [], total: 0, growth: 0 });
  const [enroll, setEnroll] = useState({ labels: [], data: [], total: 0, growth: 0 });
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState({ labels: [], data: [], totals: {} });
  const [revByCourse, setRevByCourse] = useState([]);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setApiError("");
      const q = `?period=${period}`;
      const unwrap = (r) => r?.data?.data ?? r?.data ?? null;

      const [ov, rev, en, co, us, pa, rbc] = await Promise.all([
        api.get("/reports/overview").catch(() => null),
        api.get(`/reports/revenue${q}`).catch(() => null),
        api.get(`/reports/enrollment-trends${q}`).catch(() => null),
        api.get("/reports/courses").catch(() => null),
        api.get("/reports/users").catch(() => null),
        api.get(`/reports/payments${q}`).catch(() => null),
        api.get("/reports/revenue-by-course").catch(() => null),
      ]);

      setOverview(unwrap(ov));
      setRevenue(unwrap(rev) || { labels: [], data: [], total: 0, growth: 0 });
      setEnroll(unwrap(en) || { labels: [], data: [], total: 0, growth: 0 });
      setCourses(unwrap(co) || []);
      /*
       * /reports/users nests the counts under `stats`:
       *   { id, name, email, role, createdAt, stats: { enrollments, certificates, ... } }
       * The UI reads them at the top level, so flatten here — otherwise the
       * leaderboard sorts on undefined and the directory renders blanks.
       */
      const rawUsers = unwrap(us) || [];
      setUsers(
        (Array.isArray(rawUsers) ? rawUsers : []).map((u) => ({
          ...u,
          enrollments: Number(u?.stats?.enrollments ?? u?.enrollments ?? 0),
          completedCourses: Number(
            u?.stats?.completedCourses ?? u?.completedCourses ?? 0
          ),
          certificates: Number(u?.stats?.certificates ?? u?.certificates ?? 0),
          reviews: Number(u?.stats?.reviews ?? u?.reviews ?? 0),
        }))
      );
      setPayments(unwrap(pa) || { labels: [], data: [], totals: {} });
      setRevByCourse(unwrap(rbc) || []);

      if (!ov) setApiError("Some report data couldn't be loaded. Check the backend connection.");
    } catch {
      setApiError("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format = "pdf") => {
    try {
      setExporting(format);
      const res = await api.get(`/reports/export/${format}?type=${exportType}`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
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

  // ---------------- derived metrics ----------------
  const k = useMemo(() => {
    const o = overview || {};
    const e = o.enrollments || {};
    const total = e.total || 0;
    const done = e.completed || 0;
    const prog = e.inProgress || 0;
    const students = o.users?.students || 0;
    return {
      students,
      mentors: o.users?.mentors || 0,
      courses: o.courses?.total || 0,
      published: o.courses?.published || 0,
      draft: o.courses?.draft || 0,
      archived: o.courses?.archived || 0,
      enrollments: total,
      completed: done,
      inProgress: prog,
      notStarted: Math.max(0, total - done - prog),
      completionRate: total ? Math.round((done / total) * 100) : 0,
      revenue: o.revenue || 0,
      certificates: o.certificates?.active || 0,
      pendingCerts: o.certificates?.pending || 0,
      rating: o.reviews?.averageRating || 0,
      arpu: students ? Math.round((o.revenue || 0) / students) : 0,
    };
  }, [overview]);

  // auto-generated insights — the "so what" behind the numbers
  const insights = useMemo(() => {
    const out = [];
    if (!overview) return out;

    if (k.enrollments > 0 && k.completionRate < 30) {
      out.push({
        tone: "warn", icon: AlertTriangle,
        text: `Completion is only ${k.completionRate}%. ${k.notStarted} enrolled learner${k.notStarted === 1 ? " hasn't" : "s haven't"} started yet — a reminder campaign could help.`,
      });
    } else if (k.completionRate >= 60) {
      out.push({
        tone: "good", icon: CheckCircle2,
        text: `Strong completion rate of ${k.completionRate}% across ${k.enrollments} enrollments.`,
      });
    }

    if (k.draft > 0) {
      out.push({
        tone: "info", icon: Clock,
        text: `${k.draft} course${k.draft === 1 ? " is" : "s are"} still in draft — publishing makes them available to students.`,
      });
    }

    if (k.pendingCerts > 0) {
      out.push({
        tone: "warn", icon: Award,
        text: `${k.pendingCerts} certificate request${k.pendingCerts === 1 ? "" : "s"} awaiting verification.`,
      });
    }

    if (revenue.growth > 0) {
      out.push({
        tone: "good", icon: TrendingUp,
        text: `Revenue is up ${revenue.growth}% versus the previous period.`,
      });
    } else if (revenue.growth < 0) {
      out.push({
        tone: "warn", icon: TrendingDown,
        text: `Revenue is down ${Math.abs(revenue.growth)}% versus the previous period.`,
      });
    }

    return out.slice(0, 4);
  }, [overview, k, revenue.growth]);

  const topCourses = useMemo(
    () => [...revByCourse].sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 5),
    [revByCourse]
  );

  // Reports focus on learners, so mentors/admins are excluded everywhere.
  const students = useMemo(
    () => users.filter((u) => String(u?.role || "").toUpperCase() === "STUDENT"),
    [users]
  );

  const topLearners = useMemo(
    () => [...students]
      .sort((a, b) => (b.enrollments || 0) - (a.enrollments || 0))
      .slice(0, 6),
    [students]
  );

  const needsAttention = useMemo(
    () => [...courses]
      .filter((c) => (c.enrollments || 0) > 0 && (c.completionRate || 0) < 40)
      .sort((a, b) => (a.completionRate || 0) - (b.completionRate || 0))
      .slice(0, 5),
    [courses]
  );

  // ---------------- chart config ----------------
  const axisOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { padding: 10, cornerRadius: 8 } },
    scales: {
      y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" }, ticks: { precision: 0 } },
      x: { grid: { display: false } },
    },
  };

  const doughnutOpts = {
    responsive: true, maintainAspectRatio: false, cutout: "64%",
    plugins: { legend: { position: "bottom", labels: { padding: 14, usePointStyle: true, boxWidth: 8 } } },
  };

  const hBarOpts = {
    indexAxis: "y", responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => money(c.raw) } } },
    scales: {
      x: { beginAtZero: true, ticks: { callback: (v) => compact(v) } },
      y: { grid: { display: false } },
    },
  };

  const revenueChart = {
    labels: revenue.labels,
    datasets: [{
      label: "Revenue", data: revenue.data,
      borderColor: "#6366f1", backgroundColor: "rgba(99,102,241,0.14)",
      fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2,
    }],
  };

  const enrollChart = {
    labels: enroll.labels,
    datasets: [{
      label: "Enrollments", data: enroll.data,
      backgroundColor: "#10b981", borderRadius: 6, maxBarThickness: 34,
    }],
  };

  const revCourseChart = {
    labels: topCourses.map((c) => c.title),
    datasets: [{
      data: topCourses.map((c) => c.revenue),
      backgroundColor: "#8b5cf6", borderRadius: 6, maxBarThickness: 22,
    }],
  };

  const funnelChart = {
    labels: ["Completed", "In Progress", "Not Started"],
    datasets: [{
      data: [k.completed, k.inProgress, k.notStarted],
      backgroundColor: ["#10b981", "#6366f1", "#e5e7eb"], borderWidth: 0,
    }],
  };

  const courseStatusChart = {
    labels: ["Published", "Draft", "Archived"],
    datasets: [{
      data: [k.published, k.draft, k.archived],
      backgroundColor: ["#10b981", "#f59e0b", "#94a3b8"], borderWidth: 0,
    }],
  };

  // ---------------- small components ----------------
  const Delta = ({ value }) => {
    const up = Number(value) >= 0;
    return (
      <span className={`rp-delta ${up ? "up" : "down"}`}>
        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {Math.abs(Number(value) || 0)}%
      </span>
    );
  };

  const KPI = ({ icon: Icon, tone, label, value, sub, delta }) => (
    <div className={`rp-kpi tone-${tone}`}>
      <div className="rp-kpi-top">
        <span className="rp-kpi-icon"><Icon size={18} /></span>
        {delta !== undefined && <Delta value={delta} />}
      </div>
      <div className="rp-kpi-value">{value}</div>
      <div className="rp-kpi-label">{label}</div>
      {sub && <div className="rp-kpi-sub">{sub}</div>}
    </div>
  );

  const Panel = ({ title, subtitle, children }) => (
    <section className="rp-panel">
      <header className="rp-panel-head">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </header>
      {children}
    </section>
  );

  return (
    <div className="rp-page">
      {/* ---------- Header ---------- */}
      <div className="rp-header">
        <div className="rp-header-text">
          <span className="rp-eyebrow">Analytics</span>
          <h1><BarChart3 size={24} /> Reports</h1>
          <p>Track revenue, course performance and learner progress.</p>
        </div>

        <div className="rp-actions">
          <div className="rp-period">
            <button className={period === "monthly" ? "active" : ""} onClick={() => setPeriod("monthly")}>6M</button>
            <button className={period === "yearly" ? "active" : ""} onClick={() => setPeriod("yearly")}>12M</button>
          </div>
          <select className="rp-export-select" value={exportType} onChange={(e) => setExportType(e.target.value)}>
            <option value="overview">Overview</option>
            <option value="courses">Courses</option>
            <option value="users">Users</option>
            <option value="enrollments">Enrollments</option>
            <option value="payments">Payments</option>
            <option value="revenue">Revenue</option>
          </select>
          <button className="rp-btn primary" onClick={() => handleExport("pdf")} disabled={exporting === "pdf"}>
            <FileText size={15} /> {exporting === "pdf" ? "Generating…" : "Download PDF"}
          </button>
          <button className="rp-btn icon" onClick={fetchAll} title="Refresh"><RefreshCw size={15} /></button>
        </div>
      </div>

      {apiError && <div className="rp-alert">{apiError}</div>}

      {/* ---------- Tabs ---------- */}
      <nav className="rp-tabs">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </nav>

      {loading ? (
        <div className="rp-loading"><div className="rp-spinner" /><p>Loading analytics…</p></div>
      ) : (
        <>
          {/* ================= OVERVIEW ================= */}
          {tab === "overview" && (
            <>
              <div className="rp-kpis">
                <KPI icon={IndianRupee} tone="indigo" label="Total Revenue" value={money(k.revenue)} delta={revenue.growth} sub={`${compact(k.arpu)} per student`} />
                <KPI icon={GraduationCap} tone="cyan" label="Enrollments" value={k.enrollments} delta={enroll.growth} sub={`${k.inProgress} active now`} />
                <KPI icon={Target} tone="green" label="Completion Rate" value={`${k.completionRate}%`} sub={`${k.completed} finished`} />
                <KPI icon={Users} tone="blue" label="Students" value={k.students} sub={`${k.enrollments} enrollments`} />
                <KPI icon={BookOpen} tone="purple" label="Courses" value={k.courses} sub={`${k.published} published`} />
                <KPI icon={Award} tone="pink" label="Certificates" value={k.certificates} sub={k.pendingCerts ? `${k.pendingCerts} pending` : "none pending"} />
              </div>

              {insights.length > 0 && (
                <div className="rp-insights">
                  {insights.map((i, idx) => {
                    const Icon = i.icon;
                    return (
                      <div className={`rp-insight ${i.tone}`} key={idx}>
                        <Icon size={16} /><span>{i.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="rp-grid-2">
                <Panel title="Revenue Trend" subtitle={`${money(revenue.total)} in this period`}>
                  <div className="rp-chart">
                    {revenue.data?.some((v) => v > 0)
                      ? <Line data={revenueChart} options={axisOpts} />
                      : <div className="rp-empty">No revenue recorded yet</div>}
                  </div>
                </Panel>
                <Panel title="Enrollment Trend" subtitle={`${enroll.total} enrollments`}>
                  <div className="rp-chart">
                    {enroll.data?.some((v) => v > 0)
                      ? <Bar data={enrollChart} options={axisOpts} />
                      : <div className="rp-empty">No enrollments yet</div>}
                  </div>
                </Panel>
              </div>

              <div className="rp-grid-2">
                <Panel title="Learner Funnel" subtitle="Where enrolled students are right now">
                  <div className="rp-chart sm"><Doughnut data={funnelChart} options={doughnutOpts} /></div>
                </Panel>
                <Panel title="Course Status" subtitle="Published, draft and archived courses">
                  <div className="rp-chart sm"><Doughnut data={courseStatusChart} options={doughnutOpts} /></div>
                </Panel>
              </div>
            </>
          )}

          {/* ================= REVENUE ================= */}
          {tab === "revenue" && (
            <>
              <div className="rp-kpis four">
                <KPI icon={IndianRupee} tone="indigo" label="Total Revenue" value={money(k.revenue)} delta={revenue.growth} />
                <KPI icon={Wallet} tone="green" label="This Period" value={money(revenue.total)} />
                <KPI icon={Activity} tone="cyan" label="Avg / Student" value={money(k.arpu)} />
                <KPI icon={CheckCircle2} tone="purple" label="Paid Transactions" value={payments.totals?.completed || 0} />
              </div>

              <Panel title="Revenue Over Time" subtitle="Completed payments only">
                <div className="rp-chart lg">
                  {revenue.data?.some((v) => v > 0)
                    ? <Line data={revenueChart} options={axisOpts} />
                    : <div className="rp-empty">No revenue recorded yet</div>}
                </div>
              </Panel>

              <div className="rp-grid-2">
                <Panel title="Top Earning Courses">
                  {topCourses.length === 0
                    ? <div className="rp-empty">No revenue by course yet</div>
                    : <div className="rp-chart"><Bar data={revCourseChart} options={hBarOpts} /></div>}
                </Panel>
                <Panel title="Revenue Leaderboard">
                  <ol className="rp-rank">
                    {topCourses.length === 0 && <li className="rp-empty">Nothing to rank yet</li>}
                    {topCourses.map((c, i) => (
                      <li key={c.id}>
                        <span className={`rp-rank-no r${i + 1}`}>{i + 1}</span>
                        <span className="rp-rank-name">{c.title}</span>
                        <span className="rp-rank-meta">{c.enrollments} enrolled</span>
                        <span className="rp-rank-value">{money(c.revenue)}</span>
                      </li>
                    ))}
                  </ol>
                </Panel>
              </div>
            </>
          )}

          {/* ================= COURSES ================= */}
          {tab === "courses" && (
            <>
              <div className="rp-kpis four">
                <KPI icon={BookOpen} tone="purple" label="Total Courses" value={k.courses} />
                <KPI icon={CheckCircle2} tone="green" label="Published" value={k.published} />
                <KPI icon={Clock} tone="amber" label="Drafts" value={k.draft} />
                <KPI icon={Star} tone="pink" label="Avg Rating" value={Number(k.rating).toFixed(1)} />
              </div>

              {needsAttention.length > 0 && (
                <Panel title="Needs Attention" subtitle="Courses with low completion — consider reminders or a content review">
                  <ul className="rp-attention">
                    {needsAttention.map((c) => (
                      <li key={c.id}>
                        <AlertTriangle size={15} />
                        <span className="rp-att-name">{c.title}</span>
                        <span className="rp-att-bar"><i style={{ width: `${c.completionRate}%` }} /></span>
                        <span className="rp-att-val">{c.completionRate}%</span>
                        <span className="rp-att-meta">{c.enrollments} enrolled</span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}

              <Panel title="Course Performance" subtitle={`${courses.length} course${courses.length === 1 ? "" : "s"}`}>
                <div className="rp-table-wrap">
                  <table className="rp-table">
                    <thead>
                      <tr>
                        <th>Course</th><th>Category</th><th>Status</th>
                        <th>Enrolled</th><th>Completion</th><th>Rating</th>
                        <th>Modules</th><th className="ta-r">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.length === 0 ? (
                        <tr><td colSpan={8} className="rp-empty">No courses yet</td></tr>
                      ) : courses.map((c) => (
                        <tr key={c.id}>
                          <td className="rp-strong">{c.title}</td>
                          <td>{c.category}</td>
                          <td><span className={`rp-badge s-${(c.status || "").toLowerCase()}`}>{c.status}</span></td>
                          <td>{c.enrollments}</td>
                          <td>
                            <div className="rp-prog">
                              <span><i style={{ width: `${c.completionRate}%` }} /></span>
                              <b>{c.completionRate}%</b>
                            </div>
                          </td>
                          <td><span className="rp-rating"><Star size={12} fill="#eab308" color="#eab308" />{c.avgRating || 0}</span></td>
                          <td>{c.modules}</td>
                          <td className="ta-r rp-strong">{money(c.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </>
          )}

          {/* ================= LEARNERS ================= */}
          {tab === "learners" && (
            <>
              <div className="rp-kpis four">
                <KPI icon={Users} tone="blue" label="Students" value={k.students} />
                <KPI icon={Activity} tone="cyan" label="Active Learners" value={k.inProgress} />
                <KPI icon={Target} tone="green" label="Completed" value={k.completed} />
                <KPI icon={AlertTriangle} tone="amber" label="Not Started" value={k.notStarted} />
              </div>

              <div className="rp-grid-2">
                <Panel title="Learner Funnel" subtitle="Where enrolled students are right now">
                  <div className="rp-chart"><Doughnut data={funnelChart} options={doughnutOpts} /></div>
                </Panel>
                <Panel title="Most Active Learners" subtitle="By number of enrollments">
                  <ol className="rp-rank">
                    {topLearners.length === 0 && <li className="rp-empty">No learners yet</li>}
                    {topLearners.map((u, i) => (
                      <li key={u.id}>
                        <span className={`rp-rank-no r${i + 1}`}>{i + 1}</span>
                        <span className="rp-rank-name">
                          {u.name}
                          <small>{u.email}</small>
                        </span>
                        <span className="rp-rank-value">{u.enrollments || 0}</span>
                      </li>
                    ))}
                  </ol>
                </Panel>
              </div>

              <Panel title="Student Directory" subtitle={`${students.length} student${students.length === 1 ? "" : "s"}`}>
                <div className="rp-table-wrap">
                  <table className="rp-table">
                    <thead>
                      <tr><th>Name</th><th>Email</th><th>Enrollments</th><th>Certificates</th><th>Joined</th></tr>
                    </thead>
                    <tbody>
                      {students.length === 0 ? (
                        <tr><td colSpan={5} className="rp-empty">No students yet</td></tr>
                      ) : students.slice(0, 25).map((u) => (
                        <tr key={u.id}>
                          <td className="rp-strong">{u.name}</td>
                          <td className="rp-muted">{u.email}</td>
                          <td>{u.enrollments ?? 0}</td>
                          <td>{u.certificates ?? 0}</td>
                          <td className="rp-muted">
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default AdminReports;