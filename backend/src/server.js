const app = require("./app");
const connectDB = require("./config/db");
const env = require("./config/env");
const http = require("http");
const setupChatSocket = require("./socket/chatSocket");
const AnalysisHistory = require("./models/AnalysisHistory");
const ChatMessage = require("./models/ChatMessage");

const start = async () => {
  try {
    await connectDB();
    await AnalysisHistory.ensureAppIndexes();
    await ChatMessage.ensureAppIndexes();
    const server = http.createServer(app);
    setupChatSocket(server, app);

    server.listen(env.port, () => {
      console.log(`API server listening on http://localhost:${env.port}`);
      console.log(`Socket.io moderation chat listening on ws://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();
