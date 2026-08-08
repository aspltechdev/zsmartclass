const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// ✅ CRITICAL FIX: Add this middleware to handle form-data (including profile images)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "LMS Backend Running"
  });
});

const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

const categoryRoutes = require("./routes/category.routes");
app.use("/api/categories", categoryRoutes);

const courseRoutes = require("./routes/course.routes");
app.use("/api/courses", courseRoutes);

const moduleRoutes = require("./routes/module.routes");
app.use("/api/modules", moduleRoutes);

const lessonRoutes = require("./routes/lesson.routes");
app.use("/api/lessons", lessonRoutes);

const uploadRoutes = require("./routes/upload.routes");
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/upload", uploadRoutes);

const enrollmentRoutes = require("./routes/enrollment.routes");
app.use("/api/enrollments", enrollmentRoutes);

const progressRoutes = require("./routes/progress.routes");
app.use("/api/progress", progressRoutes);

const dashboardRoutes = require("./routes/dashboard.routes");
app.use("/api/dashboard", dashboardRoutes);

const playerRoutes = require("./routes/player.routes");
app.use("/api/player", playerRoutes);

const paymentRoutes = require("./routes/payment.routes");
app.use("/api/payments", paymentRoutes);

const webhookRoutes = require("./routes/webhook.routes");
app.use("/api/webhook", webhookRoutes);

const notificationRoutes = require("./routes/notification.routes");
app.use("/api/notifications", notificationRoutes);

const certificateRoutes = require("./routes/certificate.routes");
app.use("/api/certificates", certificateRoutes);

const userRoutes = require("./routes/user.routes");
app.use("/api/users", userRoutes);

const reportRoutes = require("./routes/report.routes");
app.use("/api/reports", reportRoutes);

const settingsRoutes = require("./routes/settings.routes");
app.use("/api/settings", settingsRoutes);

module.exports = app;