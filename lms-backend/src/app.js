const express = require("express");
const cors = require("cors");
const path = require("path");
const os = require("os");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health-check route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "LMS Backend Running",
  });
});

// Authentication
const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

// Categories
const categoryRoutes = require("./routes/category.routes");
app.use("/api/categories", categoryRoutes);

// Courses
const courseRoutes = require("./routes/course.routes");
app.use("/api/courses", courseRoutes);

// Modules
const moduleRoutes = require("./routes/module.routes");
app.use("/api/modules", moduleRoutes);

// Lessons
const lessonRoutes = require("./routes/lesson.routes");
app.use("/api/lessons", lessonRoutes);

// Uploads
const uploadsPath = process.env.VERCEL
  ? path.join(os.tmpdir(), "uploads")
  : path.join(__dirname, "../uploads");

app.use("/uploads", express.static(uploadsPath));

const uploadRoutes = require("./routes/upload.routes");
app.use("/api/upload", uploadRoutes);

// Enrollments
const enrollmentRoutes = require("./routes/enrollment.routes");
app.use("/api/enrollments", enrollmentRoutes);

// Progress
const progressRoutes = require("./routes/progress.routes");
app.use("/api/progress", progressRoutes);

// Dashboard
const dashboardRoutes = require("./routes/dashboard.routes");
app.use("/api/dashboard", dashboardRoutes);

// Player
const playerRoutes = require("./routes/player.routes");
app.use("/api/player", playerRoutes);

// Payments
const paymentRoutes = require("./routes/payment.routes");
app.use("/api/payments", paymentRoutes);

// Webhooks
const webhookRoutes = require("./routes/webhook.routes");
app.use("/api/webhook", webhookRoutes);

// Notifications
const notificationRoutes = require("./routes/notification.routes");
app.use("/api/notifications", notificationRoutes);

// Certificates
const certificateRoutes = require("./routes/certificate.routes");
app.use("/api/certificates", certificateRoutes);

// Users
const userRoutes = require("./routes/user.routes");
app.use("/api/users", userRoutes);

// Reports
const reportRoutes = require("./routes/report.routes");
app.use("/api/reports", reportRoutes);

// Quizzes
const quizRoutes = require("./routes/quiz.routes");
app.use("/api/quizzes", quizRoutes);

// Assignments
const assignmentRoutes = require("./routes/assignment.routes");
app.use("/api/assignments", assignmentRoutes);

// Settings
const settingsRoutes = require("./routes/settings.routes");
app.use("/api/settings", settingsRoutes);

// Reviews
const reviewRoutes = require("./routes/review.routes");
app.use("/api/reviews", reviewRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

module.exports = app;