const mongoose = require("mongoose");

const dashboardStatsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    totalAnalyses: { type: Number, default: 0 },
    hateSpeechPercentage: { type: Number, default: 0 },
    threatCount: { type: Number, default: 0 },
    languageDistribution: { type: Map, of: Number, default: {} },
    categoryDistribution: { type: Map, of: Number, default: {} },
    mostToxicWords: [
      {
        word: String,
        count: Number
      }
    ],
    timeline: [
      {
        date: String,
        analyses: Number,
        toxic: Number
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("DashboardStats", dashboardStatsSchema);

