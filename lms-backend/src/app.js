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
module.exports = app;