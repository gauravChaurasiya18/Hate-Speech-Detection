/**
 * Middleware to validate content and prevent toxic/hate speech submissions
 */
const ApiError = require("../utils/ApiError");
const { analyzeText } = require("../services/mlService");

/**
 * Validate content for toxic and hate speech before submission
 * Blocks submissions that contain toxic or hate speech
 */
const validateContentSafety = async (req, res, next) => {
  try {
    // Check if request body contains text to validate
    const textToValidate = req.body.text || req.body.message || req.body.comment;

    if (!textToValidate) {
      return next(); // No text to validate
    }

    // Analyze the text
    const mlResult = await analyzeText(textToValidate, { explain: false });

    // Check for blocked predictions
    const blockedPredictions = ["toxic", "hate_speech"];
    if (blockedPredictions.includes(mlResult.prediction)) {
      const errorMessage = mlResult.prediction === "hate_speech"
        ? "Hate speech detected. This message cannot be sent."
        : "Toxic content detected. Please rephrase your message.";

      throw new ApiError(400, errorMessage, {
        prediction: mlResult.prediction,
        confidence: mlResult.confidence,
        saferRewrite: mlResult.safer_rewrite,
        suggestion: "Consider using the safer rewrite suggestion above"
      });
    }

    // Store analysis result in request for potential use downstream
    req.contentAnalysis = {
      prediction: mlResult.prediction,
      confidence: mlResult.confidence,
      toxicWords: mlResult.toxic_words || [],
      safe: true
    };

    next();
  } catch (error) {
    // If it's our ApiError, pass it through
    if (error instanceof ApiError) {
      return next(error);
    }
    // Log unexpected errors but don't block the request
    console.error("Content validation error:", error);
    next();
  }
};

module.exports = { validateContentSafety };
