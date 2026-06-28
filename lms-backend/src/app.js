const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

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




const path = require("path");

const uploadRoutes = require("./routes/upload.routes");

app.use(
    "/uploads",
    express.static(path.join(__dirname, "../uploads"))
);

app.use("/api/upload", uploadRoutes);


const enrollmentRoutes = require("./routes/enrollment.routes");

app.use("/api/enrollments", enrollmentRoutes);



const progressRoutes = require("./routes/progress.routes");

app.use("/api/progress", progressRoutes);



const dashboardRoutes = require("./routes/dashboard.routes");

app.use("/api/dashboard", dashboardRoutes);


const playerRoutes = require("./routes/player.routes");

app.use("/api/player", playerRoutes);


module.exports = app;