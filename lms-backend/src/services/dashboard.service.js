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
  async mentorDashboard(mentorId) {
    const id = Number(mentorId);

    const [
      myCourses,
      publishedCourses,
      draftCourses,
      modules,
      lessons,
      students,
      recentCourses,
    ] = await Promise.all([
      prisma.course.count({ where: { createdById: id } }),
      // Enum-safe values (was "Published"/"Draft" -> Prisma validation error)
      prisma.course.count({ where: { createdById: id, status: "PUBLISHED" } }),
      prisma.course.count({ where: { createdById: id, status: "DRAFT" } }),
      // CourseModule's relation to Course is named `Course` (capital C) in the schema.
      prisma.courseModule.count({ where: { Course: { createdById: id } } }),
      prisma.lesson.count({
        where: { module: { Course: { createdById: id } } },
      }),
      prisma.enrollment.count({ where: { course: { createdById: id } } }),
      prisma.course.findMany({
        where: { createdById: id },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      myCourses,
      publishedCourses,
      draftCourses,
      modules,
      lessons,
      students,
      recentCourses,
    };
  }

  // ============================================================
  // STUDENT DASHBOARD
  // ============================================================
  async studentDashboard(studentId) {
    const id = Number(studentId);

    const [myCourses, completedCourses, continueLearning, recentCourses] =
      await Promise.all([
        prisma.enrollment.count({ where: { studentId: id } }),
        prisma.enrollment.count({ where: { studentId: id, completed: true } }),
        prisma.enrollment.findFirst({
          where: { studentId: id, completed: false },
          include: { course: true },
          orderBy: { enrolledAt: "desc" },
        }),
        prisma.enrollment.findMany({
          where: { studentId: id },
          take: 5,
          orderBy: { enrolledAt: "desc" },
          include: { course: true },
        }),
      ]);

    return { myCourses, completedCourses, continueLearning, recentCourses };
  }
}

module.exports = new DashboardService();