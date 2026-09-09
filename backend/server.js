require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { protect } = require("./middleware/auth");
const startFollowUpCron = require("./jobs/followupCron");

const authRoutes = require("./routes/authRoutes");
const traineeRoutes = require("./routes/traineeRoutes");
const courseRoutes = require("./routes/courseRoutes");
const providerRoutes = require("./routes/providerRoutes");
const employerRoutes = require("./routes/employerRoutes");
const placementRoutes = require("./routes/placementRoutes");
const followUpRoutes = require("./routes/followUpRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:3000" }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// Public
app.use("/api/auth", authRoutes);

// Everything below requires a valid Bearer token (see middleware/auth.js)
app.use("/api/trainees", protect, traineeRoutes);
app.use("/api/courses", protect, courseRoutes);
app.use("/api/providers", protect, providerRoutes);
app.use("/api/employers", protect, employerRoutes);
app.use("/api/placements", protect, placementRoutes);
app.use("/api/followups", protect, followUpRoutes);
app.use("/api/analytics", protect, analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Skilling Outcomes API running on port ${PORT}`);
  startFollowUpCron();
});
