const mongoose = require("mongoose");

const chatUserStateSchema = new mongoose.Schema(
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
    mutedUntil: Date,
    flagged: {
      type: Boolean,
      default: false
    },
    flagCount: {
      type: Number,
      default: 0
    },
    lastFlagReason: String
  },
  { timestamps: true }
);

chatUserStateSchema.index({ room: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("ChatUserState", chatUserStateSchema);
