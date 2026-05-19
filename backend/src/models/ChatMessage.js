const mongoose = require("mongoose");

const TEXT_SEARCH_INDEX_NAME = "chat_message_text_search";
const TEXT_SEARCH_INDEX_KEYS = { username: "text", text: "text", "moderation.toxicWords.word": "text" };
const TEXT_SEARCH_INDEX_OPTIONS = {
  name: TEXT_SEARCH_INDEX_NAME,
  default_language: "none",
  language_override: "chatLanguageOverride"
};

const toxicWordSchema = new mongoose.Schema(
  {
    word: String,
    score: Number,
    contribution: Number,
    explanation: String,
    category: String,
    start: Number,
    end: Number
  },
  { _id: false }
);

const moderationSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      default: "safe",
      index: true
    },
    severity: {
      type: String,
      enum: ["safe", "suspicious", "toxic", "threat"],
      default: "safe",
      index: true
    },
    confidence: {
      type: Number,
      default: 0
    },
    categories: {
      hate: { type: Number, default: 0 },
      toxicity: { type: Number, default: 0 },
      offensive: { type: Number, default: 0 },
      threat: { type: Number, default: 0 },
      cyberbullying: { type: Number, default: 0 },
      safe: { type: Number, default: 0 }
    },
    toxicWords: [toxicWordSchema],
    explanation: mongoose.Schema.Types.Mixed,
    rewrite: String,
    language: {
      code: String,
      name: String,
      confidence: Number
    },
    shouldAlert: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const chatMessageSchema = new mongoose.Schema(
  {
    room: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    username: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: 2000
    },
    moderation: moderationSchema,
    status: {
      type: String,
      enum: ["visible", "deleted"],
      default: "visible",
      index: true
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    deletedAt: Date
  },
  { timestamps: true, autoIndex: false }
);

chatMessageSchema.index({ room: 1, createdAt: -1 });
chatMessageSchema.index({ "moderation.severity": 1, createdAt: -1 });
chatMessageSchema.index(TEXT_SEARCH_INDEX_KEYS, TEXT_SEARCH_INDEX_OPTIONS);

const hasTextIndex = (index) => index.key?._fts === "text" || Object.values(index.key || {}).includes("text");

chatMessageSchema.statics.ensureAppIndexes = async function ensureAppIndexes() {
  await this.collection.createIndex({ room: 1 }, { name: "room_1" });
  await this.collection.createIndex({ user: 1 }, { name: "user_1" });
  await this.collection.createIndex({ status: 1 }, { name: "status_1" });
  await this.collection.createIndex({ "moderation.severity": 1 }, { name: "moderation.severity_1" });
  await this.collection.createIndex({ room: 1, createdAt: -1 }, { name: "room_1_createdAt_-1" });
  await this.collection.createIndex({ "moderation.severity": 1, createdAt: -1 }, { name: "moderation.severity_1_createdAt_-1" });

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

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
