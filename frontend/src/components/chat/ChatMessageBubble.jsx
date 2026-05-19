import { Clock, Flag, Trash2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import { ModerationBadge } from "./ModerationBadge";
import { HighlightedModeratedText } from "./HighlightedModeratedText";
import { cn } from "../../utils/cn";
import { dateTime, percent } from "../../utils/format";

const bubbleStyles = {
  safe: "border-emerald-300/10 bg-slate-900/72 shadow-emerald-950/20",
  suspicious: "border-amber-300/30 bg-amber-950/30 shadow-[0_0_26px_rgba(251,191,36,0.12)]",
  toxic: "border-rose-300/35 bg-rose-950/35 shadow-[0_0_34px_rgba(244,63,94,0.20)]",
  threat: "border-red-400/45 bg-red-950/70 shadow-[0_0_42px_rgba(127,29,29,0.45)]"
};

export const ChatMessageBubble = ({ message, currentUserId, isAdmin, onDelete, onMute, onFlag }) => {
  const severity = message.moderation?.severity || "safe";
  const mine = String(message.user) === String(currentUserId);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn("rounded-lg border p-4 transition duration-300", bubbleStyles[severity], mine && "ml-auto max-w-[92%]")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white">{message.username}</span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Clock className="h-3 w-3" />
            {dateTime(message.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ModerationBadge severity={severity} label={message.moderation?.label} />
          <span className="text-xs font-bold text-slate-300">{percent(message.moderation?.confidence || 0)}</span>
        </div>
      </div>

      <p className={cn("mt-3 whitespace-pre-wrap break-words text-sm leading-6", message.status === "deleted" ? "italic text-slate-500" : "text-slate-100")}>
        <HighlightedModeratedText text={message.text} toxicWords={message.moderation?.toxicWords || []} />
      </p>

      {message.moderation?.rewrite && severity !== "safe" && (
        <div className="mt-3 rounded-lg border border-cyan-200/15 bg-cyan-300/10 p-3 text-sm text-cyan-50">
          <span className="font-bold">Safer rewrite: </span>
          {message.moderation.rewrite}
        </div>
      )}

      {isAdmin && message.status !== "deleted" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs text-slate-300 hover:bg-white/10" onClick={() => onDelete(message)}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
          <button className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs text-slate-300 hover:bg-white/10" onClick={() => onMute(message)}>
            <VolumeX className="h-3.5 w-3.5" /> Mute
          </button>
          <button className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs text-slate-300 hover:bg-white/10" onClick={() => onFlag(message)}>
            <Flag className="h-3.5 w-3.5" /> Flag
          </button>
        </div>
      )}
    </motion.article>
  );
};
