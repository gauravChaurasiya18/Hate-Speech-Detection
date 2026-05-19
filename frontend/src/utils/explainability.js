import { labelName } from "./format.js";

const WORD_PATTERN = /[\w\u0900-\u097F\u0C00-\u0C7F\u0B80-\u0BFF']+/gu;
const MAX_CHART_TOKENS = 14;

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

export const formatScore = (value) => `${Math.round((Number(value) || 0) * 100)}%`;

export const formatSignedScore = (value) => {
  const numeric = Number(value) || 0;
  const sign = numeric > 0 ? "+" : "";
  return `${sign}${Math.round(numeric * 100)}%`;
};

const tokenizeFallback = (text = "") =>
  [...text.matchAll(WORD_PATTERN)].map((match, index) => ({
    index,
    word: match[0],
    normalized: match[0].toLowerCase(),
    start: match.index,
    end: match.index + match[0].length
  }));

const fallbackTokens = (result, text) => {
  const toxicWords = new Set((result?.toxicWords || []).map((word) => String(word).toLowerCase()));
  const shapByToken = new Map(
    (result?.shapExplanation || []).map((item) => [String(item.token || "").toLowerCase(), item])
  );

  return tokenizeFallback(result?.text || text).map((token) => {
    const shap = shapByToken.get(token.normalized);
    const isToxic = toxicWords.has(token.normalized) || (shap && shap.polarity !== "safe");
    const rawScore = shap ? Number(shap.score || 0) : isToxic ? Number(result?.confidence || 0) * 0.7 : 0;
    const signedScore = shap?.polarity === "safe" ? -rawScore : rawScore;
    return {
      ...token,
      score: Math.max(0, signedScore),
      signedScore,
      polarity: signedScore > 0.02 ? "toxic" : signedScore < -0.02 ? "safe" : "neutral",
      category: isToxic ? result?.prediction || "toxicity" : "safe",
      categoryInfluence: {},
      confidence: Math.round(Math.max(Math.abs(signedScore), Number(result?.confidence || 0)) * 100),
      attention: []
    };
  });
};

const normalizeAttention = (attention = []) =>
  attention
    .map((item) =>
      typeof item === "string"
        ? { word: item, index: null, strength: 0.35 }
        : {
            word: item.word,
            index: Number.isFinite(Number(item.index)) ? Number(item.index) : null,
            strength: Number(item.strength || 0)
          }
    )
    .filter((item) => item.word);

export const normalizeExplanation = (result, text = "") => {
  const sourceTokens = result?.explanation?.tokens?.length ? result.explanation.tokens : fallbackTokens(result, text);
  const tokens = sourceTokens.map((token, index) => ({
    index: Number.isFinite(Number(token.index)) ? Number(token.index) : index,
    word: token.word || "",
    normalized: token.normalized || String(token.word || "").toLowerCase(),
    score: clamp(Number(token.score || 0)),
    signedScore: clamp(Number(token.signedScore ?? token.signed_score ?? token.score ?? 0), -1, 1),
    polarity: token.polarity || "neutral",
    category: token.category || "neutral",
    categoryInfluence: token.categoryInfluence || token.category_influence || {},
    confidence: Number(token.confidence || 0),
    attention: normalizeAttention(token.attention || [])
  }));

  const topToxicWords = result?.explanation?.topToxicWords?.length
    ? result.explanation.topToxicWords
    : [...tokens]
        .filter((token) => token.signedScore > 0.04)
        .sort((a, b) => b.signedScore - a.signedScore)
        .slice(0, 8)
        .map((token) => ({
          word: token.word,
          score: token.signedScore,
          category: token.category,
          percentage: Math.round(token.signedScore * 100)
        }));

  const categorySummary = result?.explanation?.categorySummary?.length
    ? result.explanation.categorySummary
    : Object.entries(result?.categories || {}).map(([category, score]) => ({
        category,
        score,
        percentage: Math.round(Number(score || 0) * 100),
        tokenCount: tokens.filter((token) => token.category === category).length
      }));

  return {
    tokens,
    topToxicWords,
    categorySummary,
    confidence: Number(result?.explanation?.confidence ?? Number(result?.confidence || 0) * 100),
    tokenCount: Number(result?.explanation?.tokenCount ?? tokens.length),
    truncated: Boolean(result?.explanation?.truncated)
  };
};

const lerp = (start, end, amount) => Math.round(start + (end - start) * amount);

const gradientStops = [
  { at: 0, color: [34, 197, 94] },
  { at: 0.34, color: [250, 204, 21] },
  { at: 0.66, color: [249, 115, 22] },
  { at: 1, color: [127, 29, 29] }
];

export const tokenColor = (score = 0) => {
  const value = clamp(score);
  const upperIndex = gradientStops.findIndex((stop) => value <= stop.at);
  const upper = gradientStops[Math.max(upperIndex, 1)];
  const lower = gradientStops[Math.max(upperIndex - 1, 0)];
  const range = upper.at - lower.at || 1;
  const amount = (value - lower.at) / range;
  const [r, g, b] = lower.color.map((channel, index) => lerp(channel, upper.color[index], amount));
  return {
    background: `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.78), rgba(${r}, ${g}, ${b}, 0.28))`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.58)`,
    boxShadow: score > 0.5 ? `0 0 24px rgba(${r}, ${g}, ${b}, 0.22)` : undefined
  };
};

export const buildContributionData = (tokens = []) =>
  [...tokens]
    .filter((token) => Math.abs(token.signedScore) > 0.015)
    .sort((a, b) => Math.abs(b.signedScore) - Math.abs(a.signedScore))
    .slice(0, MAX_CHART_TOKENS)
    .map((token) => ({
      name: token.word,
      label: `${token.word} (${labelName(token.category)})`,
      positive: token.signedScore > 0 ? Math.round(token.signedScore * 100) : 0,
      negative: token.signedScore < 0 ? -Math.round(Math.abs(token.signedScore) * 100) : 0,
      category: labelName(token.category)
    }));
