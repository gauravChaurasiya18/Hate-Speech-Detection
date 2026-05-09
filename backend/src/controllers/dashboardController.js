const asyncHandler = require("../utils/asyncHandler");
const AnalysisHistory = require("../models/AnalysisHistory");
const { buildStats } = require("../services/dashboardService");

const stats = asyncHandler(async (req, res) => {
  const dashboard = await buildStats(req.user._id);
  const recent = await AnalysisHistory.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5).lean();

  res.json({
    success: true,
    stats: dashboard,
    recent
  });
});

module.exports = { stats };

