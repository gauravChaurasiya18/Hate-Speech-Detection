const mongoose = require("mongoose");

const TEXT_SEARCH_INDEX_NAME = "analysis_history_text_search";
const TEXT_SEARCH_INDEX_KEYS = { text: "text", prediction: "text", toxicWords: "text" };
const TEXT_SEARCH_INDEX_OPTIONS = {
  name: TEXT_SEARCH_INDEX_NAME,
  default_language: "none",
  language_override: "analysisLanguageOverride"
};

const tokenScoreSchema = new mongoose.Schema(
  {
    token: String,
    score: Number,
    polarity: { type: String, enum: ["toxic", "safe"], default: "toxic" }
  },
  { _id: false }
);

const attentionLinkSchema = new mongoose.Schema(
  {
    index: Number,
    word: String,
    strength: Number
  },
  { _id: false }
);

const categoryInfluenceSchema = new mongoose.Schema(
  {
    hate: { type: Number, default: 0 },
    toxicity: { type: Number, default: 0 },
    offensive: { type: Number, default: 0 },
    threat: { type: Number, default: 0 },
    cyberbullying: { type: Number, default: 0 }
  },
  { _id: false }
);

const explanationTokenSchema = new mongoose.Schema(
  {
    index: Number,
    word: String,
    normalized: String,
    score: Number,
    signedScore: Number,
    polarity: { type: String, enum: ["toxic", "safe", "neutral"], default: "neutral" },
    category: String,
    categoryInfluence: categoryInfluenceSchema,
    confidence: Number,
    start: Number,
    end: Number,
    attention: [attentionLinkSchema]
  },
  { _id: false }
);

const explanationSummarySchema = new mongoose.Schema(
  {
    category: String,
    score: Number,
    percentage: Number,
    tokenCount: Number
  },
  { _id: false }
);

const topToxicWordSchema = new mongoose.Schema(
  {
    word: String,
    score: Number,
    category: String,
    percentage: Number
  },
  { _id: false }
);

const analysisHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    text: {
      type: String,
      required: true,
      maxlength: 5000
    },
    prediction: {
      type: String,
      required: true,
      index: true
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    categories: {
      hate: { type: Number, default: 0 },
      toxicity: { type: Number, default: 0 },
      offensive: { type: Number, default: 0 },
      threat: { type: Number, default: 0 },
      cyberbullying: { type: Number, default: 0 }
    },
    toxicWords: [String],
    shapExplanation: [tokenScoreSchema],
    explanation: {
      tokens: [explanationTokenSchema],
      topToxicWords: [topToxicWordSchema],
      categorySummary: [explanationSummarySchema],
      confidence: Number,
      tokenCount: Number,
      truncated: Boolean,
      schemaVersion: String
    },
    language: {
      code: String,
      name: String,
      confidence: Number
    },
    saferRewrite: String,
    source: {
      type: String,
      enum: ["single", "bulk"],
      default: "single"
    }
  },
  { timestamps: true, autoIndex: false }
);

analysisHistorySchema.index({ user: 1, createdAt: -1 });
analysisHistorySchema.index(TEXT_SEARCH_INDEX_KEYS, TEXT_SEARCH_INDEX_OPTIONS);

const hasTextIndex = (index) => index.key?._fts === "text" || Object.values(index.key || {}).includes("text");

analysisHistorySchema.statics.ensureAppIndexes = async function ensureAppIndexes() {
  await this.collection.createIndex({ user: 1 }, { name: "user_1" });
  await this.collection.createIndex({ prediction: 1 }, { name: "prediction_1" });
  await this.collection.createIndex({ user: 1, createdAt: -1 }, { name: "user_1_createdAt_-1" });

  const indexes = await this.collection.indexes().catch((error) => {
    if (error.code === 26 || error.codeName === "NamespaceNotFound") return [];
    throw error;
  });

  const staleTextIndexes = indexes.filter(
    (index) =>
      hasTextIndex(index) &&
      (index.name !== TEXT_SEARCH_INDEX_NAME ||
        index.language_override !== TEXT_SEARCH_INDEX_OPTIONS.language_override ||
        index.default_language !== TEXT_SEARCH_INDEX_OPTIONS.default_language)
  );

  for (const index of staleTextIndexes) {
    await this.collection.dropIndex(index.name);
  }

  await this.collection.createIndex(TEXT_SEARCH_INDEX_KEYS, TEXT_SEARCH_INDEX_OPTIONS);
};

module.exports = mongoose.model("AnalysisHistory", analysisHistorySchema);
