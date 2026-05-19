const { body, query, param } = require("express-validator");
const AnalysisHistory = require("../models/AnalysisHistory");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const validate = require("../middleware/validate");
const parseUploadedFile = require("../utils/fileParser");
const { analyzeText } = require("../services/mlService");

const normalizeAttention = (attention = []) =>
  attention.map((item) =>
    typeof item === "string"
      ? { word: item, index: null, strength: null }
      : {
          index: Number.isFinite(Number(item.index)) ? Number(item.index) : null,
          word: item.word,
          strength: Number(item.strength || 0)
        }
  );

const normalizeExplanation = (mlResult) => {
  const explanation = mlResult.explanation || {};
  return {
    tokens: (explanation.tokens || []).map((token, index) => ({
      index: Number.isFinite(Number(token.index)) ? Number(token.index) : index,
      word: token.word,
      normalized: token.normalized || String(token.word || "").toLowerCase(),
      score: Number(token.score || 0),
      signedScore: Number(token.signed_score ?? token.signedScore ?? token.score ?? 0),
      polarity: token.polarity || (Number(token.score || 0) > 0 ? "toxic" : "neutral"),
      category: token.category || "neutral",
      categoryInfluence: token.category_influence || token.categoryInfluence || {},
      confidence: Number(token.confidence || 0),
      start: Number.isFinite(Number(token.start)) ? Number(token.start) : null,
      end: Number.isFinite(Number(token.end)) ? Number(token.end) : null,
      attention: normalizeAttention(token.attention || [])
    })),
    topToxicWords: (explanation.top_toxic_words || explanation.topToxicWords || []).map((item) => ({
      word: item.word,
      score: Number(item.score || 0),
      category: item.category || "toxicity",
      percentage: Number(item.percentage || 0)
    })),
    categorySummary: (explanation.category_summary || explanation.categorySummary || []).map((item) => ({
      category: item.category,
      score: Number(item.score || 0),
      percentage: Number(item.percentage || 0),
      tokenCount: Number(item.token_count ?? item.tokenCount ?? 0)
    })),
    confidence: Number(explanation.confidence ?? Math.round(Number(mlResult.confidence || 0) * 100)),
    tokenCount: Number(explanation.token_count ?? explanation.tokenCount ?? (explanation.tokens || []).length),
    truncated: Boolean(explanation.truncated),
    schemaVersion: explanation.schema_version || explanation.schemaVersion || "xai-v1"
  };
};

const analysisValidators = {
  analyze: [
    body("text").optional().isString().isLength({ min: 1, max: 5000 }).withMessage("Text must be 1-5000 characters"),
    body("save").optional().isBoolean().toBoolean(),
    body("explain").optional().isBoolean().toBoolean(),
    validate
  ],
  history: [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
    query("search").optional().isString().trim(),
    query("label").optional().isString().trim(),
    validate
  ],
  id: [param("id").isMongoId().withMessage("Invalid analysis id"), validate]
};

const normalizeAnalysis = (mlResult) => ({
  prediction: mlResult.prediction,
  confidence: mlResult.confidence,
  categories: mlResult.categories,
  toxicWords: mlResult.toxic_words || [],
  shapExplanation: mlResult.shap_explanation || [],
  explanation: normalizeExplanation(mlResult),
  language: mlResult.language,
  saferRewrite: mlResult.safer_rewrite
});

const analyze = asyncHandler(async (req, res) => {
  const texts = req.file ? parseUploadedFile(req.file) : [req.body.text].filter(Boolean);
  if (!texts.length) throw new ApiError(400, "Provide text or upload a CSV/TXT file");

  const source = req.file ? "bulk" : "single";
  const shouldSave = req.user && (req.file || req.body.save !== false);
  const results = [];

  for (const text of texts) {
    const mlResult = await analyzeText(text, { explain: req.body.explain !== false });
    const normalized = normalizeAnalysis(mlResult);
    const saved = shouldSave
      ? await AnalysisHistory.create({
          user: req.user._id,
          text,
          source,
          ...normalized
        })
      : null;

    results.push({
      id: saved?._id || null,
      text,
      createdAt: saved?.createdAt || new Date().toISOString(),
      ...normalized
    });
  }

  res.status(201).json({
    success: true,
    mode: source,
    count: results.length,
    result: results[0],
    results
  });
});

const history = asyncHandler(async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const skip = (page - 1) * limit;

  const filter = { user: req.user._id };
  if (req.query.search) filter.$text = { $search: req.query.search };
  if (req.query.label && req.query.label !== "all") filter.prediction = req.query.label;

  const [items, total] = await Promise.all([
    AnalysisHistory.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AnalysisHistory.countDocuments(filter)
  ]);

  res.json({
    success: true,
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

const deleteHistory = asyncHandler(async (req, res) => {
  const deleted = await AnalysisHistory.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!deleted) throw new ApiError(404, "Analysis not found");
  res.json({ success: true, id: req.params.id });
});

module.exports = { analysisValidators, analyze, history, deleteHistory };
