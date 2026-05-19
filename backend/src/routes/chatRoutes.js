const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  chatValidators,
  getMessages,
  getModerationQueue,
  getToxicHistory,
  getAnalytics,
  deleteMessage,
  muteUser,
  flagUser
} = require("../controllers/chatController");

const router = express.Router();

router.use(protect);

router.get("/rooms/:room/messages", chatValidators.list, getMessages);
router.get("/rooms/:room/analytics", chatValidators.room, getAnalytics);
router.get("/rooms/:room/queue", chatValidators.room, getModerationQueue);
router.get("/rooms/:room/toxic-history", chatValidators.room, getToxicHistory);
router.delete("/messages/:id", chatValidators.messageId, deleteMessage);
router.post("/rooms/:room/mute", chatValidators.mute, muteUser);
router.post("/rooms/:room/flag", chatValidators.flag, flagUser);

module.exports = router;
