const AnalysisHistory = require("../models/AnalysisHistory");
const DashboardStats = require("../models/DashboardStats");

const TOXIC_LABELS = ["hate_speech", "toxic", "offensive", "threat", "cyberbullying"];

const buildStats = async (userId) => {
  const records = await AnalysisHistory.find({ user: userId }).sort({ createdAt: 1 }).lean();
  const totalAnalyses = records.length;
  const toxicRecords = records.filter((item) => TOXIC_LABELS.includes(item.prediction));
  const hateSpeechPercentage = totalAnalyses ? Math.round((toxicRecords.length / totalAnalyses) * 1000) / 10 : 0;
  const threatCount = records.filter((item) => (item.categories?.threat || 0) >= 0.5 || item.prediction === "threat").length;

  const languageDistribution = {};
  const categoryDistribution = { hate: 0, toxicity: 0, offensive: 0, threat: 0, cyberbullying: 0 };
  const toxicWordCounts = {};
  const timelineMap = {};

  for (const item of records) {
    const language = item.language?.name || "Unknown";
    languageDistribution[language] = (languageDistribution[language] || 0) + 1;

    for (const key of Object.keys(categoryDistribution)) {
      categoryDistribution[key] += item.categories?.[key] || 0;
    }

    for (const word of item.toxicWords || []) {
      const normalized = word.toLowerCase();
      toxicWordCounts[normalized] = (toxicWordCounts[normalized] || 0) + 1;
    }

    const date = item.createdAt.toISOString().slice(0, 10);
    if (!timelineMap[date]) timelineMap[date] = { date, analyses: 0, toxic: 0 };
    timelineMap[date].analyses += 1;
    if (TOXIC_LABELS.includes(item.prediction)) timelineMap[date].toxic += 1;
  }

  for (const key of Object.keys(categoryDistribution)) {
    categoryDistribution[key] = totalAnalyses
      ? Math.round((categoryDistribution[key] / totalAnalyses) * 100)
      : 0;
  }

  const mostToxicWords = Object.entries(toxicWordCounts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const timeline = Object.values(timelineMap).slice(-30);

  const stats = {
    user: userId,
    totalAnalyses,
    hateSpeechPercentage,
    threatCount,
    languageDistribution,
    categoryDistribution,
    mostToxicWords,
    timeline
  };

  await DashboardStats.findOneAndUpdate({ user: userId }, stats, { upsert: true, new: true });
  return stats;
};

module.exports = { buildStats };

