require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");

const uploadRoutes = require("./routes/uploadRoutes");
const contentRoutes = require("./routes/contentRoutes");

const app = express();

app.set("trust proxy", 1);

// Logging
app.use(morgan("combined"));

// Rate limiting (100 req / 15 min per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS
app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());

// Health endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    time: new Date().toISOString(),
  });
});

// Routes
app.use("/api/upload", uploadRoutes);
app.use("/content", contentRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, "0.0.0.0", () =>
    console.log(`Server running on ${PORT}`)
  );
});