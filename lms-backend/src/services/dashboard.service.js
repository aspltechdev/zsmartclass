const prisma = require("../config/prisma");

/**
 * DashboardService
 *
 * All aggregation happens on the server in a single round-trip per dashboard.
 * Counts are computed with COUNT/GROUP BY (never by fetching rows and measuring
 * array length on the client), revenue comes from actual COMPLETED payments, and
 * the 6-month trend series are bucketed in SQL so we never stream raw rows to the app.
 */
class DashboardService {
  // ============================================================
  // Helpers
  // ============================================================

  /**
   * Build an ordered list of the last `count` calendar months (inclusive of the
   * current month), anchored in UTC so it lines up with SQL date_trunc buckets.
   * Returns [{ key: "2025-03", label: "Mar" }, ...] oldest -> newest.
   */
  _buildMonthBuckets(count = 6) {
    const now = new Date();
    const buckets = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      buckets.push({
        key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
        date: d,
      });
    }
    return buckets;
  }

  /** UTC year-month key ("2025-03") from a Date returned by date_trunc. */
  _monthKey(date) {
    const d = new Date(date);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  // ============================================================
  // ADMIN DASHBOARD
  // ============================================================
  async adminDashboard() {
    const buckets = this._buildMonthBuckets(6);
    const windowStart = buckets[0].date; // first day of the oldest month in the window

    // Every query below is independent, so run them concurrently instead of
    // awaiting one after another (14 serial round-trips -> 1 parallel batch).
    const [
      usersByRole,
      coursesByStatus,
      categories,
      modules,
      lessons,
      enrollments,
      completedCourses,
      revenueAgg,
      usersBeforeWindow,
      activeCertificates,
      pendingCertificates,
      paymentsByMethod,
      enrollmentTrendRows,
      userGrowthRows,
      recentCourses,
      recentStudents,
      recentEnrollments,
    ] = await Promise.all([
      // Users grouped by role -> students / mentors / admins in one query
      prisma.user.groupBy({
        by: ["role"],
        _count: { _all: true },
      }),

      // Courses grouped by status -> enum-safe (returns whatever values exist)
      prisma.course.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),

      prisma.category.count(),
      prisma.courseModule.count(),
      prisma.lesson.count(),
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { completed: true } }),

      // Real revenue: sum of amounts on COMPLETED payments only
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "COMPLETED" },
      }),

      // Users created before the trend window, used as the cumulative baseline
      prisma.user.count({ where: { createdAt: { lt: windowStart } } }),

      // Certificates (issued vs awaiting auto-verification)
      prisma.certificate.count({ where: { status: "ACTIVE" } }),
      prisma.certificate.count({ where: { status: "PENDING" } }),

      // Payments grouped by method -> cash vs UPI split
      prisma.payment.groupBy({
        by: ["method"],
        where: { status: "COMPLETED" },
        _sum: { amount: true },
        _count: { _all: true }
      }),

      // Enrollments per month for the last 6 months (bucketed in SQL)
      prisma.$queryRaw`
        SELECT date_trunc('month', "enrolledAt") AS month, COUNT(*)::int AS count
        FROM "Enrollment"
        WHERE "enrolledAt" >= ${windowStart}
        GROUP BY 1
        ORDER BY 1
      `,

      // New users per month for the last 6 months (bucketed in SQL)
      prisma.$queryRaw`
        SELECT date_trunc('month', "createdAt") AS month, COUNT(*)::int AS count
        FROM "User"
        WHERE "createdAt" >= ${windowStart}
        GROUP BY 1
        ORDER BY 1
      `,

      prisma.course.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
          createdBy: { select: { id: true, name: true } },
        },
      }),

      prisma.user.findMany({
        where: { role: "STUDENT" },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, createdAt: true },
      }),

      prisma.enrollment.findMany({
        take: 5,
        orderBy: { enrolledAt: "desc" },
        include: {
          // NOTE: on Enrollment the user relation is named `user` (via userId),
          // unlike Payment/Certificate/LessonProgress which name it `student`.
          user: { select: { id: true, name: true } },
          course: { select: { id: true, title: true } },
        },
      }),
    ]);

    // ---- Reduce grouped results into flat counts -------------------------
    const roleCount = (role) =>
      usersByRole.find((r) => r.role === role)?._count._all ?? 0;

    const students = roleCount("STUDENT");
    const mentors = roleCount("MENTOR");
    const admins = roleCount("ADMIN");
    const users = students + mentors + admins;

    const statusCount = (status) =>
      coursesByStatus.find((c) => c.status === status)?._count._all ?? 0;

    const publishedCourses = statusCount("PUBLISHED");
    const draftCourses = statusCount("DRAFT");
    const archivedCourses = statusCount("ARCHIVED");
    const courses = coursesByStatus.reduce((sum, c) => sum + c._count._all, 0);

    const revenue = revenueAgg._sum.amount ?? 0;

    // ---- Build the two trend series against the fixed 6-month scaffold ---
    const enrollmentByKey = new Map(
      enrollmentTrendRows.map((r) => [this._monthKey(r.month), Number(r.count)])
    );
    const userByKey = new Map(
      userGrowthRows.map((r) => [this._monthKey(r.month), Number(r.count)])
    );

    const enrollmentTrends = {
      labels: buckets.map((b) => b.label),
      data: buckets.map((b) => enrollmentByKey.get(b.key) ?? 0),
    };

    // Cumulative total users at the end of each month in the window
    let running = usersBeforeWindow;
    const userGrowth = {
      labels: buckets.map((b) => b.label),
      data: buckets.map((b) => {
        running += userByKey.get(b.key) ?? 0;
        return running;
      }),
    };

    return {
      cards: {
        users,
        students,
        mentors,
        admins,
        courses,
        publishedCourses,
        draftCourses,
        archivedCourses,
        categories,
        modules,
        lessons,
        enrollments,
        completedCourses,
        revenue,
        activeCertificates,
        pendingCertificates,
        cashRevenue: paymentsByMethod
          .filter((p) => (p.method || "").toUpperCase() === "CASH")
          .reduce((s, p) => s + (p._sum.amount || 0), 0),
        upiRevenue: paymentsByMethod
          .filter((p) => (p.method || "").toUpperCase() === "UPI")
          .reduce((s, p) => s + (p._sum.amount || 0), 0),
        completionRate: enrollments
          ? Math.round((completedCourses / enrollments) * 100)
          : 0,
      },
      charts: {
        enrollmentTrends,
        userGrowth,
      },
      recentCourses,
      recentStudents,
      recentEnrollments,
    };
  }

  // ============================================================
  // MENTOR DASHBOARD
  // ============================================================
  // ============================================================
  // MENTOR DASHBOARD
  // Mentors have admin-like VISIBILITY (all courses, all students) but a
  // content-focused feature set — no revenue/payment or user-management data.
  // ============================================================
  async mentorDashboard() {
    const buckets = this._buildMonthBuckets(6);
    const windowStart = buckets[0].date;

    const [
      coursesByStatus,
      categories,
      modules,
      lessons,
      students,
      enrollments,
      completedEnrollments,
      enrollmentTrendRows,
      recentCourses,
      recentEnrollments
    ] = await Promise.all([
      prisma.course.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.category.count(),
      prisma.courseModule.count(),
      prisma.lesson.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { completed: true } }),
      prisma.$queryRaw`
        SELECT date_trunc('month', "enrolledAt") AS month, COUNT(*)::int AS count
        FROM "Enrollment"
        WHERE "enrolledAt" >= ${windowStart}
        GROUP BY 1
        ORDER BY 1
      `,
      prisma.course.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { category: true }
      }),
      prisma.enrollment.findMany({
        take: 5,
        orderBy: { enrolledAt: "desc" },
        include: {
          user: { select: { id: true, name: true } },
          course: { select: { id: true, title: true } }
        }
      })
    ]);

    const statusCount = (st) =>
      coursesByStatus.find((c) => c.status === st)?._count._all ?? 0;

    const enrollmentByKey = new Map(
      enrollmentTrendRows.map((r) => [this._monthKey(r.month), Number(r.count)])
    );

    return {
      cards: {
        courses: coursesByStatus.reduce((s, c) => s + c._count._all, 0),
        publishedCourses: statusCount("PUBLISHED"),
        draftCourses: statusCount("DRAFT"),
        categories,
        modules,
        lessons,
        students,
        enrollments,
        completedEnrollments,
        completionRate: enrollments
          ? Math.round((completedEnrollments / enrollments) * 100)
          : 0
      },
      charts: {
        enrollmentTrends: {
          labels: buckets.map((b) => b.label),
          data: buckets.map((b) => enrollmentByKey.get(b.key) ?? 0)
        }
      },
      recentCourses,
      recentEnrollments
    };
  }

  async studentDashboard(studentId) {
    const id = Number(studentId);

    // Enrollment is keyed by `userId` (NOT `studentId`). Using studentId here
    // throws "Unknown argument `studentId`". LessonProgress/Payment/etc. use
    // studentId, but Enrollment uses userId — keep them straight.
    const [myCourses, completedCourses, continueLearning, recentCourses] =
      await Promise.all([
        prisma.enrollment.count({ where: { userId: id } }),
        prisma.enrollment.count({ where: { userId: id, completed: true } }),
        prisma.enrollment.findFirst({
          where: { userId: id, completed: false },
          include: { course: true },
          orderBy: { enrolledAt: "desc" },
        }),
        prisma.enrollment.findMany({
          where: { userId: id },
          take: 5,
          orderBy: { enrolledAt: "desc" },
          include: { course: true }, // each row already carries `progress`
        }),
      ]);

    return { myCourses, completedCourses, continueLearning, recentCourses };
  }
}

module.exports = new DashboardService();