// src/services/report.service.js
const prisma = require("../config/prisma");
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

class ReportService {
    // ==========================================
    // OVERVIEW REPORTS
    // ==========================================

    /**
     * Get dashboard overview statistics
     */
    async getOverview() {
        const [
            totalUsers,
            totalStudents,
            totalMentors,
            totalAdmins,
            totalCourses,
            publishedCourses,
            draftCourses,
            archivedCourses,
            totalEnrollments,
            completedEnrollments,
            inProgressEnrollments,
            totalRevenue,
            totalCertificates,
            activeCertificates,
            pendingCertificates,
            totalReviews,
            avgRating,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: "STUDENT" } }),
            prisma.user.count({ where: { role: "MENTOR" } }),
            prisma.user.count({ where: { role: "ADMIN" } }),
            prisma.course.count(),
            prisma.course.count({ where: { status: "PUBLISHED" } }),
            prisma.course.count({ where: { status: "DRAFT" } }),
            prisma.course.count({ where: { status: "ARCHIVED" } }),
            prisma.enrollment.count(),
            prisma.enrollment.count({ where: { completed: true } }),
            prisma.enrollment.count({ where: { completed: false, progress: { gt: 0 } } }),
            prisma.payment.aggregate({
                where: { status: "COMPLETED" },
                _sum: { amount: true }
            }),
            prisma.certificate.count(),
            prisma.certificate.count({ where: { status: "ACTIVE" } }),
            prisma.certificate.count({ where: { status: "PENDING" } }),
            prisma.review.count(),
            prisma.review.aggregate({
                _avg: { rating: true }
            }),
        ]);

        return {
            users: {
                total: totalUsers,
                students: totalStudents,
                mentors: totalMentors,
                admins: totalAdmins,
            },
            courses: {
                total: totalCourses,
                published: publishedCourses,
                draft: draftCourses,
                archived: archivedCourses,
            },
            enrollments: {
                total: totalEnrollments,
                completed: completedEnrollments,
                inProgress: inProgressEnrollments,
            },
            revenue: totalRevenue._sum.amount || 0,
            certificates: {
                total: totalCertificates,
                active: activeCertificates,
                pending: pendingCertificates,
            },
            reviews: {
                total: totalReviews,
                averageRating: Math.round((avgRating._avg.rating || 0) * 10) / 10,
            },
        };
    }

    /**
     * Get revenue overview with trends
     */
    async getRevenueOverview(period = 'monthly') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const periodCount = period === 'yearly' ? 12 : 6;
        const labels = [];
        const data = [];

        for (let i = periodCount - 1; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = months[month.getMonth()];
            labels.push(monthName);

            const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
            const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

            const revenue = await prisma.payment.aggregate({
                where: {
                    status: "COMPLETED",
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                _sum: { amount: true },
            });

            data.push(revenue._sum.amount || 0);
        }

        const total = data.reduce((a, b) => a + b, 0);
        const growth = data.length > 1 && data[data.length - 2] > 0
            ? ((data[data.length - 1] - data[data.length - 2]) / data[data.length - 2]) * 100
            : 0;

        return {
            labels,
            data,
            total,
            growth: Math.round(growth * 10) / 10,
        };
    }

    /**
     * Get enrollment trends over time
     */
    async getEnrollmentTrends(period = 'monthly') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const periodCount = period === 'yearly' ? 12 : 6;
        const labels = [];
        const data = [];

        for (let i = periodCount - 1; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = months[month.getMonth()];
            labels.push(monthName);

            const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
            const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

            const count = await prisma.enrollment.count({
                where: {
                    enrolledAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            });

            data.push(count);
        }

        const total = data.reduce((a, b) => a + b, 0);
        const growth = data.length > 1 && data[data.length - 2] > 0
            ? ((data[data.length - 1] - data[data.length - 2]) / data[data.length - 2]) * 100
            : 0;

        return {
            labels,
            data,
            total,
            growth: Math.round(growth * 10) / 10,
        };
    }

    // ==========================================
    // COURSE REPORTS
    // ==========================================

    /**
     * Get course analytics and performance
     */
    async getCourseAnalytics() {
        const courses = await prisma.course.findMany({
            include: {
                category: true,
                _count: {
                    select: {
                        enrollments: true,
                        reviews: true,
                        // NOTE: `modules` removed — Course's relation is `CourseModule`
                        // and modules are now shared via the link table (counted below).
                    }
                },
                reviews: {
                    select: {
                        rating: true,
                    }
                },
                enrollments: {
                    where: { completed: true }
                },
                payments: {
                    where: { status: "COMPLETED" },
                    select: { amount: true }
                }
            },
            orderBy: {
                enrollments: {
                    _count: 'desc',
                },
            },
        });

        // Module counts per course via the sharing link table (scalar-only).
        const courseIds = courses.map((c) => c.id);
        const assignments = courseIds.length
            ? await prisma.courseModuleAssignment.findMany({
                  where: { courseId: { in: courseIds } },
                  select: { courseId: true }
              })
            : [];
        const moduleCountByCourse = new Map();
        for (const a of assignments) {
            moduleCountByCourse.set(
                a.courseId,
                (moduleCountByCourse.get(a.courseId) || 0) + 1
            );
        }

        return courses.map(course => {
            const avgRating = course.reviews.length > 0
                ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
                : 0;

            const completionRate = course._count.enrollments > 0
                ? Math.round((course.enrollments.length / course._count.enrollments) * 100)
                : 0;

            const revenue = course.payments.reduce(
                (sum, p) => sum + (p.amount || 0),
                0
            );

            return {
                id: course.id,
                title: course.title,
                category: course.category?.name || 'Uncategorized',
                status: course.status,
                level: course.level,
                revenue: revenue,      // real revenue from completed payments
                price: 0,              // kept for backward-compat (courses aren't priced)
                enrollments: course._count.enrollments,
                completedEnrollments: course.enrollments.length,
                reviews: course._count.reviews,
                avgRating: Math.round(avgRating * 10) / 10,
                completionRate: completionRate,
                modules: moduleCountByCourse.get(course.id) || 0,
            };
        });
    }

    /**
     * Get detailed performance for a specific course
     */
    async getCoursePerformance(courseId) {
        const course = await prisma.course.findUnique({
            where: { id: Number(courseId) },
            include: {
                category: true,
                enrollments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            }
                        }
                    },
                    orderBy: {
                        enrolledAt: 'desc'
                    }
                },
                reviews: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                certificates: true,
                payments: {
                    where: { status: "COMPLETED" }
                },
                modules: {
                    include: {
                        lessons: true,
                    }
                }
            },
        });

        if (!course) {
            const error = new Error("Course not found");
            error.statusCode = 404;
            throw error;
        }

        const completedEnrollments = course.enrollments.filter(e => e.completed);
        const avgRating = course.reviews.length > 0
            ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
            : 0;

        const totalLessons = course.modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);

        return {
            course: {
                id: course.id,
                title: course.title,
                description: course.description,
                level: course.level,
                status: course.status,
                price: course.price || 0,
                category: course.category?.name || 'Uncategorized',
            },
            statistics: {
                totalEnrollments: course.enrollments.length,
                completedEnrollments: completedEnrollments.length,
                completionRate: course.enrollments.length > 0
                    ? Math.round((completedEnrollments.length / course.enrollments.length) * 100)
                    : 0,
                totalRevenue: course.payments.reduce((sum, p) => sum + p.amount, 0),
                totalCertificates: course.certificates.length,
                totalReviews: course.reviews.length,
                averageRating: Math.round(avgRating * 10) / 10,
                totalModules: course.modules.length,
                totalLessons: totalLessons,
            },
            recentEnrollments: course.enrollments.slice(0, 10).map(e => ({
                student: e.user?.name || 'Unknown',
                email: e.user?.email || '',
                progress: e.progress || 0,
                completed: e.completed,
                enrolledAt: e.enrolledAt,
            })),
            reviews: course.reviews.slice(0, 10).map(r => ({
                student: r.user?.name || 'Unknown',
                rating: r.rating,
                comment: r.comment,
                createdAt: r.createdAt,
            })),
        };
    }

    // ==========================================
    // USER REPORTS
    // ==========================================

    /**
     * Get user analytics
     */
    async getUserAnalytics() {
        const users = await prisma.user.findMany({
            include: {
                _count: {
                    select: {
                        enrollments: true,
                        certificates: true,
                        reviews: true,
                        payments: true,
                    }
                },
                enrollments: {
                    where: { completed: true },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            stats: {
                enrollments: user._count.enrollments,
                completedCourses: user.enrollments.length,
                certificates: user._count.certificates,
                reviews: user._count.reviews,
                payments: user._count.payments,
            }
        }));
    }

    /**
     * Get student engagement metrics
     */
    async getStudentEngagement(studentId) {
        const student = await prisma.user.findUnique({
            where: { id: Number(studentId) },
            include: {
                enrollments: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                title: true,
                            }
                        }
                    }
                },
                certificates: true,
                reviews: true,
                payments: {
                    where: { status: "COMPLETED" }
                },
            },
        });

        if (!student) {
            const error = new Error("Student not found");
            error.statusCode = 404;
            throw error;
        }

        const completedEnrollments = student.enrollments.filter(e => e.completed);
        const totalProgress = student.enrollments.reduce((sum, e) => sum + (e.progress || 0), 0);
        const avgProgress = student.enrollments.length > 0
            ? Math.round(totalProgress / student.enrollments.length)
            : 0;

        return {
            student: {
                id: student.id,
                name: student.name,
                email: student.email,
                joinedAt: student.createdAt,
            },
            statistics: {
                totalEnrollments: student.enrollments.length,
                completedCourses: completedEnrollments.length,
                completionRate: student.enrollments.length > 0
                    ? Math.round((completedEnrollments.length / student.enrollments.length) * 100)
                    : 0,
                averageProgress: avgProgress,
                totalCertificates: student.certificates.length,
                totalReviews: student.reviews.length,
                totalSpent: student.payments.reduce((sum, p) => sum + p.amount, 0),
            },
            courses: student.enrollments.map(e => ({
                id: e.courseId,
                title: e.course.title,
                progress: e.progress || 0,
                completed: e.completed,
                enrolledAt: e.enrolledAt,
            })),
        };
    }

    // ==========================================
    // PAYMENT REPORTS
    // ==========================================

    /**
     * Get payment analytics
     */
    async getPaymentAnalytics(period = 'monthly') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const periodCount = period === 'yearly' ? 12 : 6;
        const labels = [];
        const data = [];

        for (let i = periodCount - 1; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = months[month.getMonth()];
            labels.push(monthName);

            const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
            const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

            const [completed, pending, failed, refunded] = await Promise.all([
                prisma.payment.count({
                    where: {
                        status: "COMPLETED",
                        createdAt: { gte: startDate, lte: endDate }
                    }
                }),
                prisma.payment.count({
                    where: {
                        status: "PENDING",
                        createdAt: { gte: startDate, lte: endDate }
                    }
                }),
                prisma.payment.count({
                    where: {
                        status: "FAILED",
                        createdAt: { gte: startDate, lte: endDate }
                    }
                }),
                prisma.payment.count({
                    where: {
                        status: "REFUNDED",
                        createdAt: { gte: startDate, lte: endDate }
                    }
                }),
            ]);

            data.push({ completed, pending, failed, refunded, total: completed + pending + failed + refunded });
        }

        const totals = {
            completed: data.reduce((sum, d) => sum + d.completed, 0),
            pending: data.reduce((sum, d) => sum + d.pending, 0),
            failed: data.reduce((sum, d) => sum + d.failed, 0),
            refunded: data.reduce((sum, d) => sum + d.refunded, 0),
        };

        return {
            labels,
            data,
            totals,
            totalPayments: totals.completed + totals.pending + totals.failed + totals.refunded,
        };
    }

    /**
     * Get revenue breakdown by course
     */
    async getRevenueByCourse() {
        const courses = await prisma.course.findMany({
            include: {
                payments: {
                    where: { status: "COMPLETED" }
                },
                enrollments: true,
            },
            where: {
                payments: {
                    some: { status: "COMPLETED" }
                }
            },
            orderBy: {
                payments: {
                    _count: 'desc',
                },
            },
        });

        return courses.map(course => ({
            id: course.id,
            title: course.title,
            enrollments: course.enrollments.length,
            revenue: course.payments.reduce((sum, p) => sum + p.amount, 0),
        }));
    }

    // ==========================================
    // EXPORT REPORTS
    // ==========================================

    /**
     * Export report as CSV
     */
    async exportCSV(type, startDate, endDate) {
        let data = [];
        let fields = [];

        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        switch (type) {
            case 'overview':
                const overview = await this.getOverview();
                data = [{
                    'Total Users': overview.users.total,
                    'Students': overview.users.students,
                    'Mentors': overview.users.mentors,
                    'Admins': overview.users.admins,
                    'Total Courses': overview.courses.total,
                    'Published Courses': overview.courses.published,
                    'Draft Courses': overview.courses.draft,
                    'Archived Courses': overview.courses.archived,
                    'Total Enrollments': overview.enrollments.total,
                    'Completed Enrollments': overview.enrollments.completed,
                    'In Progress Enrollments': overview.enrollments.inProgress,
                    'Total Revenue': overview.revenue,
                    'Total Certificates': overview.certificates.total,
                    'Active Certificates': overview.certificates.active,
                    'Pending Certificates': overview.certificates.pending,
                    'Total Reviews': overview.reviews.total,
                    'Average Rating': overview.reviews.averageRating,
                }];
                fields = Object.keys(data[0]);
                break;

            case 'courses':
                const courses = await this.getCourseAnalytics();
                data = courses;
                fields = ['id', 'title', 'category', 'status', 'level', 'enrollments', 'completedEnrollments', 'completionRate', 'avgRating', 'reviews', 'modules', 'revenue'];
                break;

            case 'users':
                const users = await this.getUserAnalytics();
                data = users.map(u => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
                    enrollments: u.stats.enrollments,
                    completed: u.stats.completedCourses,
                    certificates: u.stats.certificates,
                    reviews: u.stats.reviews,
                    payments: u.stats.payments,
                }));
                fields = ['id', 'name', 'email', 'role', 'joined', 'enrollments', 'completed', 'certificates', 'reviews', 'payments'];
                break;

            case 'payments':
                const payments = await prisma.payment.findMany({
                    where: dateFilter,
                    include: {
                        // Payment's relation is `student` (not `user`).
                        student: { select: { name: true, email: true } },
                        course: { select: { title: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                });
                data = payments.map(p => ({
                    id: p.id,
                    receipt: p.orderId || '',
                    student: p.student?.name || 'N/A',
                    email: p.student?.email || 'N/A',
                    course: p.course?.title || 'N/A',
                    amount: p.amount || 0,
                    status: p.status,
                    method: p.method || 'N/A',
                    reference: p.paymentId || '',
                    date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : '',
                }));
                fields = ['id', 'receipt', 'student', 'email', 'course', 'amount', 'status', 'method', 'reference', 'date'];
                break;

            case 'enrollments': {
                const enrollments = await prisma.enrollment.findMany({
                    where: startDate && endDate
                        ? { enrolledAt: { gte: new Date(startDate), lte: new Date(endDate) } }
                        : {},
                    include: {
                        user: { select: { name: true, email: true } },
                        course: { select: { title: true } },
                    },
                    orderBy: { enrolledAt: 'desc' },
                });
                data = enrollments.map(e => ({
                    id: e.id,
                    student: e.user?.name || 'N/A',
                    email: e.user?.email || 'N/A',
                    course: e.course?.title || 'N/A',
                    progress: `${Math.round(e.progress || 0)}%`,
                    status: e.completed ? 'Completed' : (e.progress > 0 ? 'In Progress' : 'Not Started'),
                    enrolled: e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString('en-IN') : '',
                    expiry: e.accessExpiry ? new Date(e.accessExpiry).toLocaleDateString('en-IN') : 'Unlimited',
                }));
                fields = ['id', 'student', 'email', 'course', 'progress', 'status', 'enrolled', 'expiry'];
                break;
            }

            case 'revenue': {
                const rev = await this.getRevenueByCourse();
                data = rev.map(r => ({
                    id: r.id,
                    course: r.title,
                    enrollments: r.enrollments,
                    revenue: r.revenue,
                }));
                fields = ['id', 'course', 'enrollments', 'revenue'];
                break;
            }

            default:
                data = [];
                fields = [];
        }

        if (data.length === 0) {
            return 'No data available for export.';
        }

        const parser = new Parser({ fields });
        const csv = parser.parse(data);
        // BOM so Excel opens this as UTF-8 instead of guessing wrong
        // and mangling currency symbols / accented names.
        return '\uFEFF' + csv;
    }

    /**
     * Draws a bordered table with a colored header row, alternating row
     * shading, and automatic page breaks (re-drawing the header row on
     * each new page). Returns the y position immediately after the table.
     */
    _drawTable(doc, { startY, columns, rows }) {
        const rowHeight = 24;
        const tableWidth = columns.reduce((sum, c) => sum + c.width, 0);
        const pageBottom = doc.page.height - doc.page.margins.bottom;
        let y = startY;

        const drawHeaderRow = () => {
            doc.rect(doc.page.margins.left, y, tableWidth, rowHeight).fill('#667eea');
            let x = doc.page.margins.left;
            doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold');
            columns.forEach((col) => {
                doc.text(col.label, x + 6, y + 8, { width: col.width - 10, ellipsis: true });
                x += col.width;
            });
            doc.font('Helvetica');
            y += rowHeight;
        };

        drawHeaderRow();

        rows.forEach((row, i) => {
            if (y + rowHeight > pageBottom) {
                doc.addPage();
                y = doc.page.margins.top;
                drawHeaderRow();
            }
            if (i % 2 === 0) {
                doc.rect(doc.page.margins.left, y, tableWidth, rowHeight).fill('#f8fafc');
            }
            let x = doc.page.margins.left;
            doc.fillColor('#334155').fontSize(8.5);
            columns.forEach((col) => {
                const raw = row[col.key];
                const val = raw === undefined || raw === null || raw === '' ? '-' : String(raw);
                doc.text(val, x + 6, y + 8, { width: col.width - 10, ellipsis: true });
                x += col.width;
            });
            y += rowHeight;
        });

        // Outer border around the whole table.
        doc.rect(doc.page.margins.left, startY, tableWidth, y - startY).stroke('#e2e8f0');

        return y;
    }

    /**
     * Draws a labeled stat box (used for the overview report's KPI grid).
     */
    _drawStatBox(doc, x, y, width, label, value) {
        const height = 54;
        doc.rect(x, y, width, height).fillAndStroke('#f8fafc', '#e2e8f0');
        doc.fillColor('#64748b').fontSize(8).font('Helvetica')
           .text(label.toUpperCase(), x + 12, y + 10, { width: width - 24 });
        doc.fillColor('#1a1a2e').fontSize(16).font('Helvetica-Bold')
           .text(String(value), x + 12, y + 26, { width: width - 24 });
        doc.font('Helvetica');
    }

    _drawSectionTitle(doc, text, y) {
        doc.fillColor('#1a1a2e').fontSize(13).font('Helvetica-Bold').text(text, doc.page.margins.left, y);
        doc.font('Helvetica');
        return y + 22;
    }

    /**
     * Export report as PDF — builds a structured, type-aware document
     * (overview KPIs, or a real table for courses/users/payments/revenue)
     * with a consistent branded header and a page-numbered footer.
     */
    async exportPDF(type = 'overview', startDate, endDate) {
        const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        const donePromise = new Promise((resolve, reject) => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
        });

        const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const typeLabels = {
            overview: 'Overview', revenue: 'Revenue', enrollments: 'Enrollments',
            courses: 'Courses', users: 'Users', payments: 'Payments',
        };

        // ===== HEADER =====
        doc.fillColor('#1a1a2e').fontSize(22).font('Helvetica-Bold')
           .text('ZsmartClass', doc.page.margins.left, 50, { continued: false });
        doc.fillColor('#667eea').fontSize(13).font('Helvetica')
           .text(`${typeLabels[type] || 'Overview'} Report`, doc.page.margins.left, 78);
        doc.fillColor('#94a3b8').fontSize(9)
           .text(`Generated ${new Date().toLocaleString()}`, doc.page.margins.left, 98);
        if (startDate && endDate) {
            doc.text(
                `Range: ${new Date(startDate).toLocaleDateString()} – ${new Date(endDate).toLocaleDateString()}`,
                doc.page.margins.left, 112
            );
        }
        doc.moveTo(doc.page.margins.left, 132)
           .lineTo(doc.page.width - doc.page.margins.right, 132)
           .strokeColor('#e2e8f0').stroke();

        let y = 150;

        try {
            if (type === 'courses') {
                const courses = await this.getCourseAnalytics();
                y = this._drawSectionTitle(doc, `Course performance (${courses.length})`, y);
                y = this._drawTable(doc, {
                    startY: y,
                    columns: [
                        { key: 'title', label: 'COURSE', width: contentWidth * 0.28 },
                        { key: 'category', label: 'CATEGORY', width: contentWidth * 0.14 },
                        { key: 'status', label: 'STATUS', width: contentWidth * 0.11 },
                        { key: 'enrollments', label: 'ENROLLED', width: contentWidth * 0.11 },
                        { key: 'reviews', label: 'REVIEWS', width: contentWidth * 0.10 },
                        { key: 'avgRating', label: 'RATING', width: contentWidth * 0.10 },
                        { key: 'completionRate', label: 'COMPLETE', width: contentWidth * 0.16 },
                    ],
                    rows: courses.map((c) => ({
                        ...c,
                        avgRating: `${c.avgRating}/5`,
                        completionRate: `${c.completionRate}%`,
                    })),
                });
            } else if (type === 'users') {
                const users = await this.getUserAnalytics();
                y = this._drawSectionTitle(doc, `Users (${users.length})`, y);
                y = this._drawTable(doc, {
                    startY: y,
                    columns: [
                        { key: 'name', label: 'NAME', width: contentWidth * 0.24 },
                        { key: 'email', label: 'EMAIL', width: contentWidth * 0.30 },
                        { key: 'role', label: 'ROLE', width: contentWidth * 0.12 },
                        { key: 'enrollments', label: 'ENROLLED', width: contentWidth * 0.12 },
                        { key: 'completed', label: 'COMPLETED', width: contentWidth * 0.11 },
                        { key: 'certificates', label: 'CERTS', width: contentWidth * 0.11 },
                    ],
                    rows: users.map((u) => ({
                        name: u.name,
                        email: u.email,
                        role: u.role,
                        enrollments: u.stats.enrollments,
                        completed: u.stats.completedCourses,
                        certificates: u.stats.certificates,
                    })),
                });
            } else if (type === 'payments') {
                const dateFilter = {};
                if (startDate && endDate) {
                    dateFilter.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
                }
                const payments = await prisma.payment.findMany({
                    where: dateFilter,
                    include: {
                        // Payment's relation is `student` (not `user`).
                        student: { select: { name: true, email: true } },
                        course: { select: { title: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                });
                const paidTotal = payments
                    .filter((p) => p.status === 'COMPLETED')
                    .reduce((s, p) => s + (p.amount || 0), 0);
                y = this._drawSectionTitle(
                    doc,
                    `Payments (${payments.length})  ·  Collected: INR ${paidTotal.toLocaleString('en-IN')}`,
                    y
                );
                y = this._drawTable(doc, {
                    startY: y,
                    columns: [
                        { key: 'receipt', label: 'RECEIPT', width: contentWidth * 0.14 },
                        { key: 'student', label: 'STUDENT', width: contentWidth * 0.20 },
                        { key: 'course', label: 'COURSE', width: contentWidth * 0.22 },
                        { key: 'amount', label: 'AMOUNT', width: contentWidth * 0.13 },
                        { key: 'status', label: 'STATUS', width: contentWidth * 0.13 },
                        { key: 'method', label: 'METHOD', width: contentWidth * 0.09 },
                        { key: 'date', label: 'DATE', width: contentWidth * 0.09 },
                    ],
                    rows: payments.map((p) => ({
                        receipt: p.orderId || '-',
                        student: p.student?.name || 'N/A',
                        course: p.course?.title || 'N/A',
                        amount: `INR ${(p.amount || 0).toLocaleString('en-IN')}`,
                        status: p.status,
                        method: p.method || 'N/A',
                        date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : '',
                    })),
                });
            } else if (type === 'revenue' || type === 'enrollments') {
                const isRevenue = type === 'revenue';
                const result = isRevenue
                    ? await this.getRevenueOverview()
                    : await this.getEnrollmentTrends();

                y = this._drawSectionTitle(doc, isRevenue ? 'Revenue by month' : 'Enrollments by month', y);
                doc.fillColor('#475569').fontSize(10)
                   .text(`Total: ${isRevenue ? '₹' + result.total.toLocaleString() : result.total}   |   Growth vs previous period: ${result.growth}%`, doc.page.margins.left, y);
                y += 24;

                y = this._drawTable(doc, {
                    startY: y,
                    columns: [
                        { key: 'label', label: 'MONTH', width: contentWidth * 0.5 },
                        { key: 'value', label: isRevenue ? 'REVENUE' : 'ENROLLMENTS', width: contentWidth * 0.5 },
                    ],
                    rows: result.labels.map((label, i) => ({
                        label,
                        value: isRevenue ? `₹${(result.data[i] || 0).toLocaleString()}` : result.data[i],
                    })),
                });
            } else {
                // Overview (default)
                const overview = await this.getOverview();
                const boxWidth = (contentWidth - 24) / 3;

                y = this._drawSectionTitle(doc, 'At a glance', y);
                this._drawStatBox(doc, doc.page.margins.left, y, boxWidth, 'Total Users', overview.users.total);
                this._drawStatBox(doc, doc.page.margins.left + boxWidth + 12, y, boxWidth, 'Total Courses', overview.courses.total);
                this._drawStatBox(doc, doc.page.margins.left + (boxWidth + 12) * 2, y, boxWidth, 'Total Revenue', `₹${overview.revenue.toLocaleString()}`);
                y += 66;
                this._drawStatBox(doc, doc.page.margins.left, y, boxWidth, 'Enrollments', overview.enrollments.total);
                this._drawStatBox(doc, doc.page.margins.left + boxWidth + 12, y, boxWidth, 'Certificates Issued', overview.certificates.active);
                this._drawStatBox(doc, doc.page.margins.left + (boxWidth + 12) * 2, y, boxWidth, 'Avg. Rating', `${overview.reviews.averageRating}/5`);
                y += 90;

                y = this._drawSectionTitle(doc, 'Breakdown', y);
                y = this._drawTable(doc, {
                    startY: y,
                    columns: [
                        { key: 'metric', label: 'METRIC', width: contentWidth * 0.6 },
                        { key: 'value', label: 'VALUE', width: contentWidth * 0.4 },
                    ],
                    rows: [
                        { metric: 'Students', value: overview.users.students },
                        { metric: 'Mentors', value: overview.users.mentors },
                        { metric: 'Admins', value: overview.users.admins },
                        { metric: 'Published courses', value: overview.courses.published },
                        { metric: 'Draft courses', value: overview.courses.draft },
                        { metric: 'Archived courses', value: overview.courses.archived },
                        { metric: 'Completed enrollments', value: overview.enrollments.completed },
                        { metric: 'In-progress enrollments', value: overview.enrollments.inProgress },
                        { metric: 'Pending certificate requests', value: overview.certificates.pending },
                        { metric: 'Total reviews', value: overview.reviews.total },
                    ],
                });
            }
        } catch (err) {
            doc.fillColor('#ef4444').fontSize(11).text(`Error building report: ${err.message}`, doc.page.margins.left, y);
        }

        // ===== FOOTER (page numbers on every page) =====
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            doc.fillColor('#cbd5e1').fontSize(8).text(
                `ZsmartClass LMS — generated ${new Date().toLocaleDateString()} — page ${i + 1} of ${range.count}`,
                doc.page.margins.left,
                doc.page.height - doc.page.margins.bottom + 15,
                { width: contentWidth, align: 'center' }
            );
        }

        doc.end();
        return donePromise;
    }
}

module.exports = new ReportService();