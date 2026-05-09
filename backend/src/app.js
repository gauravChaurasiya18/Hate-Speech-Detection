const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const morgan = require("morgan");
const env = require("./config/env");
const sanitizeRequest = require("./middleware/securityMiddleware");
const authRoutes = require("./routes/authRoutes");
const analysisRoutes = require("./routes/analysisRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(
  rateLimit({
    windowMs: env.rateWindowMs,
    limit: env.rateLimitMax,
    standardHeaders: "draft-8",
    legacyHeaders: false
  })
);
app.use(
  slowDown({
    windowMs: env.rateWindowMs,
    delayAfter: Math.floor(env.rateLimitMax / 2),
    delayMs: () => 250
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());
app.use(sanitizeRequest);
if (env.nodeEnv !== "test") app.use(morgan("dev"));

app.get("/api/health", (_req, res) => res.json({ success: true, service: "backend" }));
app.use("/api/auth", authRoutes);
app.use("/api", analysisRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
