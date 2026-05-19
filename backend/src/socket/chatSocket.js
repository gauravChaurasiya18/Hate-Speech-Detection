const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ChatMessage = require("../models/ChatMessage");
const ChatUserState = require("../models/ChatUserState");
const env = require("../config/env");
const { moderateText } = require("../services/moderationService");
const { serializeMessage } = require("../controllers/chatController");

const MAX_MESSAGE_LENGTH = 2000;
const PREVIEW_DEBOUNCE_MS = 350;
const SEND_WINDOW_MS = 10 * 1000;
const SEND_LIMIT = 8;

const roomUsers = new Map();

const configuredOrigins = () =>
  String(env.clientUrl || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const isLocalDevOrigin = (origin) => {
  if (env.nodeEnv === "production") return false;

  try {
    const url = new URL(origin);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname) && ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

const isAllowedOrigin = (origin) => !origin || configuredOrigins().includes(origin) || isLocalDevOrigin(origin);

const parseCookies = (cookieHeader = "") =>
  cookieHeader.split(";").reduce((cookies, pair) => {
    const [rawKey, ...rawValue] = pair.trim().split("=");
    if (!rawKey) return cookies;
    cookies[rawKey] = decodeURIComponent(rawValue.join("="));
    return cookies;
  }, {});

const normalizeRoom = (room = "general") =>
  String(room)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 64) || "general";

const publicUser = (user) => ({
  id: String(user._id),
  name: user.name,
  role: user.role,
  avatarColor: user.avatarColor
});

const emitPresence = (io, room) => {
  const users = Array.from(roomUsers.get(room)?.values() || []);
  io.to(room).emit("room:users", users);
};

const addUserToRoom = (room, socket, user) => {
  if (!roomUsers.has(room)) roomUsers.set(room, new Map());
  roomUsers.get(room).set(socket.id, publicUser(user));
};

const removeUserFromRooms = (io, socket) => {
  for (const [room, users] of roomUsers.entries()) {
    if (users.delete(socket.id)) {
      if (!users.size) roomUsers.delete(room);
      emitPresence(io, room);
      io.to(room).emit("typing:update", { userId: String(socket.data.user._id), username: socket.data.user.name, typing: false });
    }
  }
};

const isMuted = async (room, userId) => {
  const state = await ChatUserState.findOne({ room, user: userId }).lean();
  return state?.mutedUntil && new Date(state.mutedUntil).getTime() > Date.now() ? state.mutedUntil : null;
};

const withinSendRate = (socket) => {
  const now = Date.now();
  const bucket = socket.data.sendBucket || [];
  const active = bucket.filter((time) => now - time < SEND_WINDOW_MS);
  active.push(now);
  socket.data.sendBucket = active;
  return active.length <= SEND_LIMIT;
};

const setupChatSocket = (httpServer, app) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) return callback(null, true);
        return callback(new Error("Socket origin is not allowed"));
      },
      credentials: true,
      methods: ["GET", "POST"]
    },
    maxHttpBufferSize: 1e6
  });

  io.use(async (socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers.cookie || "");
      const token = socket.handshake.auth?.token || cookies[env.cookieName];
      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(decoded.id).select("-passwordHash");
      if (!user) return next(new Error("User no longer exists"));

      socket.data.user = user;
      next();
    } catch {
      next(new Error("Invalid authentication token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("room:join", async ({ room = "general" } = {}, ack) => {
      const normalizedRoom = normalizeRoom(room);
      socket.join(normalizedRoom);
      socket.data.room = normalizedRoom;
      addUserToRoom(normalizedRoom, socket, socket.data.user);

      const messages = await ChatMessage.find({ room: normalizedRoom }).sort({ createdAt: -1 }).limit(50).lean();
      socket.emit("room:history", messages.reverse().map(serializeMessage));
      emitPresence(io, normalizedRoom);
      ack?.({ ok: true, room: normalizedRoom });
    });

    socket.on("typing:start", ({ room } = {}) => {
      const normalizedRoom = normalizeRoom(room || socket.data.room);
      socket.to(normalizedRoom).emit("typing:update", {
        userId: String(socket.data.user._id),
        username: socket.data.user.name,
        typing: true
      });
    });

    socket.on("typing:stop", ({ room } = {}) => {
      const normalizedRoom = normalizeRoom(room || socket.data.room);
      socket.to(normalizedRoom).emit("typing:update", {
        userId: String(socket.data.user._id),
        username: socket.data.user.name,
        typing: false
      });
    });

    socket.on("moderation:preview", async ({ text = "" } = {}, ack) => {
      const now = Date.now();
      if (now - (socket.data.lastPreviewAt || 0) < PREVIEW_DEBOUNCE_MS) return;
      socket.data.lastPreviewAt = now;

      const trimmed = String(text).trim();
      if (!trimmed) return ack?.({ ok: true, moderation: null });
      if (trimmed.length > MAX_MESSAGE_LENGTH) return ack?.({ ok: false, error: "Message is too long" });

      try {
        const moderation = await moderateText(trimmed, { explain: true });
        ack?.({ ok: true, moderation });
      } catch (error) {
        ack?.({ ok: false, error: error.message || "Moderation preview failed" });
      }
    });

    socket.on("message:send", async ({ room, text = "" } = {}, ack) => {
      const normalizedRoom = normalizeRoom(room || socket.data.room);
      const trimmed = String(text).trim();

      if (!trimmed) return ack?.({ ok: false, error: "Message cannot be empty" });
      if (trimmed.length > MAX_MESSAGE_LENGTH) return ack?.({ ok: false, error: "Message is too long" });
      if (!withinSendRate(socket)) return ack?.({ ok: false, error: "You are sending messages too quickly" });

      const mutedUntil = await isMuted(normalizedRoom, socket.data.user._id);
      if (mutedUntil) return ack?.({ ok: false, error: `You are muted until ${new Date(mutedUntil).toLocaleString()}` });

      try {
        const moderation = await moderateText(trimmed, { explain: true });
        const message = await ChatMessage.create({
          room: normalizedRoom,
          user: socket.data.user._id,
          username: socket.data.user.name,
          text: trimmed,
          moderation
        });

        const payload = serializeMessage(message.toObject());
        io.to(normalizedRoom).emit("message:new", payload);
        if (moderation.shouldAlert) io.to(normalizedRoom).emit("moderation:alert", payload);
        ack?.({ ok: true, message: payload });
      } catch (error) {
        ack?.({ ok: false, error: error.message || "Unable to send message" });
      }
    });

    socket.on("disconnect", () => {
      removeUserFromRooms(io, socket);
    });
  });

  app.set("io", io);
  return io;
};

module.exports = setupChatSocket;
