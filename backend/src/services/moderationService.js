const { analyzeText } = require("./mlService");

const CATEGORY_KEYS = ["hate", "toxicity", "offensive", "threat", "cyberbullying", "safe"];

const number = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeCategories = (categories = {}, label, confidence) => {
  const normalized = CATEGORY_KEYS.reduce((acc, key) => {
    acc[key] = number(categories[key]);
    return acc;
  }, {});

  if (label === "toxic" && !normalized.toxicity) normalized.toxicity = confidence;
  if (label === "hate speech" && !normalized.hate) normalized.hate = confidence;
  if (label === "safe" && !normalized.safe) normalized.safe = confidence;

  return normalized;
};

const findWordSpan = (text, word, fromIndex = 0) => {
  if (!word) return { start: null, end: null };
  const index = text.toLowerCase().indexOf(String(word).toLowerCase(), fromIndex);
  if (index < 0) return { start: null, end: null };
  return { start: index, end: index + String(word).length };
};

const normalizeToxicWords = (text, mlResult) => {
  const explanationTokens = mlResult.explanation?.tokens || [];
  let cursor = 0;

  const explicitWords = (mlResult.toxic_words || mlResult.toxicWords || []).map((item) => {
    const word = typeof item === "string" ? item : item.word;
    const span = findWordSpan(text, word, cursor);
    if (Number.isFinite(span.end)) cursor = span.end;
    return {
      word,
      score: number(typeof item === "string" ? mlResult.confidence : item.score),
      contribution: number(item.contribution ?? item.signed_score ?? item.signedScore ?? item.score),
      explanation: item.explanation || `${word} contributed to the model's toxicity decision.`,
      category: item.category || "toxicity",
      ...span
    };
  });

  if (explicitWords.length) return explicitWords;

  return explanationTokens
    .filter((token) => token.polarity === "toxic" || number(token.score) >= 0.35 || number(token.signed_score ?? token.signedScore) > 0)
    .slice(0, 12)
    .map((token) => ({
      word: token.word,
      score: number(token.score),
      contribution: number(token.signed_score ?? token.signedScore ?? token.score),
      explanation: `${token.word} is a ${token.category || "toxicity"} signal with ${Math.round(number(token.confidence, token.score) * 100)}% token confidence.`,
      category: token.category || "toxicity",
      start: Number.isFinite(Number(token.start)) ? Number(token.start) : null,
      end: Number.isFinite(Number(token.end)) ? Number(token.end) : null
    }));
};

const severityFor = (label, confidence, categories) => {
  const maxCategory = Math.max(...Object.values(categories).map(number));
  if (label === "threat" || categories.threat >= 0.65) return "threat";
  if (["toxic", "hate speech", "offensive", "cyberbullying"].includes(label) && confidence >= 0.72) return "toxic";
  if (maxCategory >= 0.45 || confidence >= 0.5) return "suspicious";
  return "safe";
};

const normalizeModeration = (text, mlResult = {}) => {
  const label = String(mlResult.label || mlResult.prediction || "safe").toLowerCase();
  const confidence = number(mlResult.confidence);
  const categories = normalizeCategories(mlResult.categories, label, confidence);
  const severity = severityFor(label, confidence, categories);

  return {
    label,
    severity,
    confidence,
    categories,
    toxicWords: normalizeToxicWords(text, mlResult),
    explanation: mlResult.explanation || { tokens: [], topToxicWords: [], categorySummary: [] },
    rewrite: mlResult.rewrite || mlResult.safer_rewrite || mlResult.saferRewrite || "",
    language: mlResult.language || null,
    shouldAlert: severity === "threat" || severity === "toxic" || confidence >= 0.82
  };
};

const moderateText = async (text, options = {}) => {
  const mlResult = await analyzeText(text, {
    explain: options.explain !== false,
    deepExplain: options.deepExplain === true
  });

  return normalizeModeration(text, mlResult);
};

module.exports = { moderateText, normalizeModeration };
