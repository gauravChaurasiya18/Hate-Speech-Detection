import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Hash, Radio, Shield, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ChatMessageBubble } from "../components/chat/ChatMessageBubble";
import { LiveToxicityComposer } from "../components/chat/LiveToxicityComposer";
import { ModeratorDashboard } from "../components/chat/ModeratorDashboard";
import { createChatSocket, deleteChatMessage, flagChatUser, getChatAnalytics, getModerationQueue, getToxicHistory, muteChatUser } from "../services/chatService";
import { cn } from "../utils/cn";

const roomOptions = ["general", "hinglish-watch", "gaming", "campus"];

const ModerationChatPage = () => {
  const { user } = useAuth();
  const [room, setRoom] = useState("general");
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [draft, setDraft] = useState("");
  const [preview, setPreview] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [sendError, setSendError] = useState("");
  const [sending, setSending] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [queue, setQueue] = useState([]);
  const [toxicHistory, setToxicHistory] = useState([]);
  const scrollRef = useRef(null);
  const typingTimer = useRef(null);

  const isAdmin = user?.role === "admin";
  const visibleMessages = useMemo(() => messages.slice(-90), [messages]);
  const activeTyping = Object.values(typingUsers).filter((item) => item.userId !== user?.id);

  const refreshModeratorData = async (targetRoom = room) => {
    if (!isAdmin) return;
    const [analyticsData, queueData, historyData] = await Promise.all([
      getChatAnalytics(targetRoom),
      getModerationQueue(targetRoom),
      getToxicHistory(targetRoom)
    ]);
    setAnalytics(analyticsData);
    setQueue(queueData.items || []);
    setToxicHistory(historyData.items || []);
  };

  useEffect(() => {
    const chatSocket = createChatSocket();
    setSocket(chatSocket);

    chatSocket.on("connect_error", (error) => setSendError(error.message));
    chatSocket.on("room:history", (items) => setMessages(items || []));
    chatSocket.on("room:users", setOnlineUsers);
    chatSocket.on("message:new", (message) => {
      setMessages((items) => [...items, message]);
      if (message.moderation?.shouldAlert) setAlertMessage(message);
    });
    chatSocket.on("message:deleted", ({ id }) => {
      setMessages((items) => items.map((item) => (String(item.id) === String(id) ? { ...item, status: "deleted", text: "Message removed by moderation" } : item)));
    });
    chatSocket.on("moderation:alert", setAlertMessage);
    chatSocket.on("typing:update", (payload) => {
      setTypingUsers((items) => {
        const next = { ...items };
        if (payload.typing) next[payload.userId] = payload;
        else delete next[payload.userId];
        return next;
      });
    });

    return () => chatSocket.disconnect();
  }, []);

  useEffect(() => {
    if (!socket) return;
    setMessages([]);
    setPreview(null);
    setTypingUsers({});
    socket.emit("room:join", { room });
    refreshModeratorData(room).catch(() => {});
  }, [socket, room]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [visibleMessages.length]);

  useEffect(() => {
    if (!socket) return;
    const trimmed = draft.trim();

    socket.emit(trimmed ? "typing:start" : "typing:stop", { room });
    clearTimeout(typingTimer.current);

    if (!trimmed) {
      setPreview(null);
      return;
    }

    typingTimer.current = setTimeout(() => {
      socket.emit("moderation:preview", { text: trimmed }, (response) => {
        if (response?.ok) setPreview(response.moderation);
      });
    }, 450);

    return () => clearTimeout(typingTimer.current);
  }, [draft, socket, room]);

  useEffect(() => {
    if (!alertMessage) return undefined;
    const timer = setTimeout(() => setAlertMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [alertMessage]);

  const handleSend = (event) => {
    event.preventDefault();
    if (!socket || !draft.trim()) return;

    setSending(true);
    setSendError("");
    socket.emit("message:send", { room, text: draft }, async (response) => {
      setSending(false);
      if (!response?.ok) {
        setSendError(response?.error || "Unable to send message");
        return;
      }
      setDraft("");
      setPreview(null);
      socket.emit("typing:stop", { room });
      await refreshModeratorData().catch(() => {});
    });
  };

  const handleDelete = async (message) => {
    await deleteChatMessage(message.id);
    await refreshModeratorData();
  };

  const handleMute = async (message) => {
    await muteChatUser(room, message.user, 15);
  };

  const handleFlag = async (message) => {
    await flagChatUser(room, message.user, "Flagged from live moderation chat");
    await refreshModeratorData();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">Realtime AI moderation</p>
          <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">Live moderation chat</h1>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">
          <Radio className="h-4 w-4 text-lime-300" />
          Socket live
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="glass gradient-border overflow-hidden rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-950/60 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-300 text-slate-950">
                <Hash className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-black text-white">#{room}</h2>
                <p className="text-xs text-slate-400">{onlineUsers.length} online</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {roomOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setRoom(option)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm transition",
                    room === option ? "border-cyan-200/50 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10"
                  )}
                >
                  #{option}
                </button>
              ))}
            </div>
          </div>

          <div className="grid min-h-[640px] lg:grid-cols-[180px_1fr]">
            <aside className="border-b border-white/10 bg-slate-950/40 p-4 lg:border-b-0 lg:border-r">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                <Users className="h-4 w-4 text-cyan-200" /> Online users
              </div>
              <div className="space-y-2">
                {onlineUsers.map((member) => (
                  <div key={member.id} className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-2 py-2 text-sm text-slate-200">
                    <span className="h-2.5 w-2.5 rounded-full bg-lime-300" />
                    <span className="truncate">{member.name}</span>
                    {member.role === "admin" && <Shield className="ml-auto h-3.5 w-3.5 text-cyan-200" />}
                  </div>
                ))}
              </div>
            </aside>

            <div className="flex min-h-0 flex-col">
              <div className="cyber-scroll h-[520px] space-y-3 overflow-y-auto p-4">
                <AnimatePresence initial={false}>
                  {visibleMessages.map((message) => (
                    <ChatMessageBubble
                      key={message.id}
                      message={message}
                      currentUserId={user?.id}
                      isAdmin={isAdmin}
                      onDelete={handleDelete}
                      onMute={handleMute}
                      onFlag={handleFlag}
                    />
                  ))}
                </AnimatePresence>
                <div ref={scrollRef} />
              </div>

              <div className="min-h-7 px-4 pb-2 text-sm text-slate-500">
                {activeTyping.length > 0 && `${activeTyping.map((item) => item.username).join(", ")} typing...`}
              </div>

              <LiveToxicityComposer value={draft} onChange={setDraft} onSend={handleSend} preview={preview} sending={sending} error={sendError} />
            </div>
          </div>
        </section>

        {isAdmin ? (
          <ModeratorDashboard analytics={analytics} queue={queue} toxicHistory={toxicHistory} />
        ) : (
          <div className="glass gradient-border rounded-2xl p-5">
            <h2 className="font-black text-white">Moderator panel</h2>
            <p className="mt-2 text-sm text-slate-400">Admin users can review toxic history, delete messages, mute accounts, flag users, and watch live analytics here.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {alertMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border border-rose-300/35 bg-rose-950/90 p-4 text-rose-50 shadow-[0_0_42px_rgba(244,63,94,0.35)] backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 font-black">
              <AlertTriangle className="h-5 w-5" />
              Toxic Message Detected
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-rose-100">{alertMessage.username}: {alertMessage.text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModerationChatPage;
