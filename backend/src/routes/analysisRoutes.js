const express = require("express");
const { analyze, history, deleteHistory, analysisValidators } = require("../controllers/analysisController");
const { protect, optionalProtect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/analyze", (_req, res) =>
  res.json({
    success: true,
    message: "Use POST /api/analyze with JSON { text } or multipart field file.",
    endpoints: {
      analyze: "POST /api/analyze",
      history: "GET /api/history"
    }
  })
);

// Public endpoint for testing/demo. If a valid auth cookie exists, saved analyses are attached to that user.
router.post("/analyze", optionalProtect, upload.single("file"), analysisValidators.analyze, analyze);
// Protected endpoints for saving history
router.get("/history", protect, analysisValidators.history, history);
router.delete("/history/:id", protect, analysisValidators.id, deleteHistory);

module.exports = router;
