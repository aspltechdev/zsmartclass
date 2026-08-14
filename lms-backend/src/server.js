require("dotenv").config();

const app = require("./app");
const prisma = require("./config/prisma");

const PORT = process.env.PORT || 5000;

const requiredEnv = ["DATABASE_URL", "JWT_SECRET"];
const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(
    `❌ Missing required environment variables: ${missing.join(", ")}\n` +
      `   Check that lms-backend/.env exists and is populated.`
  );
  process.exit(1);
}

async function start() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(
          `❌ Port ${PORT} is already in use. ` +
            `Stop the other process or change PORT in .env.`
        );
      } else {
        console.error("❌ Server error:", err);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start();