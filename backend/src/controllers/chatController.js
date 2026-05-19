const { body, param, query } = require("express-validator");
const ChatMessage = require("../models/ChatMessage");
const ChatUserState = require("../models/ChatUserState");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const validate = require("../middleware/validate");

const requireAdmin = (req) => {
  if (req.user?.role !== "admin") throw new ApiError(403, "Admin moderation privileges required");
};

const roomParam = () =>
  param("room")
    .isString()
    .trim()
    .isLength({ min: 2, max: 64 })
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage("Room must be 2-64 characters using letters, numbers, dashes, or underscores");

const chatValidators = {
  room: [roomParam(), validate],
  messageId: [param("id").isMongoId().withMessage("Invalid message id"), validate],
  mute: [
    roomParam(),
    body("userId").isMongoId().withMessage("Valid userId is required"),
    body("minutes").optional().isInt({ min: 1, max: 10080 }).toInt(),
    validate
  ],
  flag: [
    roomParam(),
    body("userId").isMongoId().withMessage("Valid userId is required"),
    body("reason").optional().isString().trim().isLength({ max: 240 }),
    validate
  ],
  list: [
    roomParam(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("before").optional().isISO8601().toDate(),
    validate
  ]
};

const serializeMessage = (message) => ({
  id: message._id,
  room: message.room,
  user: message.user,
  username: message.username,
  text: message.status === "deleted" ? "Message removed by moderation" : message.text,
  moderation: message.moderation,
  status: message.status,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt
});

const getMessages = asyncHandler(async (req, res) => {
  const limit = req.query.limit || 50;
  const filter = { room: req.params.room.toLowerCase() };
  if (req.query.before) filter.createdAt = { $lt: req.query.before };

  const messages = await ChatMessage.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  res.json({ success: true, messages: messages.reverse().map(serializeMessage) });
});

const getModerationQueue = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const messages = await ChatMessage.find({
    room: req.params.room.toLowerCase(),
    status: "visible",
    "moderation.shouldAlert": true
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  res.json({ success: true, items: messages.map(serializeMessage) });
});

const getToxicHistory = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const messages = await ChatMessage.find({
    room: req.params.room.toLowerCase(),
    "moderation.severity": { $in: ["suspicious", "toxic", "threat"] }
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  res.json({ success: true, items: messages.map(serializeMessage) });
});

const getAnalytics = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const room = req.params.room.toLowerCase();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [timeline, toxicUsers, categoryDistribution, languageDistribution, termBuckets, totals] = await Promise.all([
    ChatMessage.aggregate([
      { $match: { room, createdAt: { $gte: since }, "moderation.severity": { $in: ["suspicious", "toxic", "threat"] } } },
      { $group: { _id: { $dateToString: { format: "%H:00", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { time: "$_id", count: 1, _id: 0 } }
    ]),
    ChatMessage.aggregate([
      { $match: { room, "moderation.severity": { $in: ["suspicious", "toxic", "threat"] } } },
      { $group: { _id: "$username", count: { $sum: 1 }, maxConfidence: { $max: "$moderation.confidence" } } },
      { $sort: { count: -1, maxConfidence: -1 } },
      { $limit: 8 },
      { $project: { name: "$_id", count: 1, maxConfidence: 1, _id: 0 } }
    ]),
    ChatMessage.aggregate([
      { $match: { room } },
      {
        $group: {
          _id: null,
          hate: { $sum: "$moderation.categories.hate" },
          offensive: { $sum: "$moderation.categories.offensive" },
          threat: { $sum: "$moderation.categories.threat" },
          cyberbullying: { $sum: "$moderation.categories.cyberbullying" },
          toxicity: { $sum: "$moderation.categories.toxicity" },
          safe: { $sum: "$moderation.categories.safe" }
        }
      }
    ]),
    ChatMessage.aggregate([
      { $match: { room } },
      { $group: { _id: { $ifNull: ["$moderation.language.name", "Unknown"] }, value: { $sum: 1 } } },
      { $project: { name: "$_id", value: 1, _id: 0 } }
    ]),
    ChatMessage.aggregate([
      { $match: { room, "moderation.toxicWords.0": { $exists: true } } },
      { $unwind: "$moderation.toxicWords" },
      { $group: { _id: "$moderation.toxicWords.word", count: { $sum: 1 }, score: { $max: "$moderation.toxicWords.score" } } },
      { $sort: { count: -1, score: -1 } },
      { $limit: 16 },
      { $project: { word: "$_id", count: 1, score: 1, _id: 0 } }
    ]),
    ChatMessage.aggregate([
      { $match: { room } },
      {
        $group: {
          _id: "$moderation.severity",
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  const categories = categoryDistribution[0] || {};
  delete categories._id;

  res.json({
    success: true,
    stats: {
      timeline,
      toxicUsers,
      categoryDistribution: Object.entries(categories).map(([name, value]) => ({ name, value: Number(value.toFixed?.(3) ?? value) })),
      languageDistribution,
      frequentToxicTerms: termBuckets,
      severityTotals: totals.map((item) => ({ name: item._id || "safe", value: item.count }))
    }
  });
});

const deleteMessage = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const message = await ChatMessage.findByIdAndUpdate(
    req.params.id,
    { status: "deleted", deletedBy: req.user._id, deletedAt: new Date() },
    { new: true }
  ).lean();

  if (!message) throw new ApiError(404, "Message not found");

  req.app.get("io")?.to(message.room).emit("message:deleted", { id: message._id, room: message.room });
  res.json({ success: true, message: serializeMessage(message) });
});

const muteUser = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const minutes = req.body.minutes || 15;
  const mutedUntil = new Date(Date.now() + minutes * 60 * 1000);
  const state = await ChatUserState.findOneAndUpdate(
    { room: req.params.room.toLowerCase(), user: req.body.userId },
    { mutedUntil },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  req.app.get("io")?.to(req.params.room.toLowerCase()).emit("user:muted", {
    userId: req.body.userId,
    room: req.params.room.toLowerCase(),
    mutedUntil
  });
  res.json({ success: true, state });
});

const flagUser = asyncHandler(async (req, res) => {
  requireAdmin(req);

  const state = await ChatUserState.findOneAndUpdate(
    { room: req.params.room.toLowerCase(), user: req.body.userId },
    {
      $set: {
        flagged: true,
        lastFlagReason: req.body.reason || "Moderator flag"
      },
      $inc: { flagCount: 1 }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  res.json({ success: true, state });
});

module.exports = {
  chatValidators,
  getMessages,
  getModerationQueue,
  getToxicHistory,
  getAnalytics,
  deleteMessage,
  muteUser,
  flagUser,
  serializeMessage
};
