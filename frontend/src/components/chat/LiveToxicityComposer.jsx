import { Send, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { ToxicityMeter } from "../ToxicityMeter";
import { HighlightedModeratedText } from "./HighlightedModeratedText";
import { ModerationBadge } from "./ModerationBadge";

export const LiveToxicityComposer = ({ value, onChange, onSend, preview, sending, error }) => {
  const severity = preview?.severity || "safe";

  return (
    <div className="border-t border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <form className="space-y-3" onSubmit={onSend}>
          <div className="relative">
            <textarea
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Message #general"
              className="min-h-24 w-full resize-none rounded-lg border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-200/50 focus:ring-2 focus:ring-cyan-300/20"
              maxLength={2000}
            />
            {value && preview?.toxicWords?.length > 0 && (
              <div className="pointer-events-auto mt-2 rounded-lg border border-white/10 bg-slate-900/80 p-3 text-sm text-slate-200">
                <HighlightedModeratedText text={value} toxicWords={preview.toxicWords} />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {preview && <ModerationBadge severity={severity} label={preview.label} />}
              {error && <span className="text-sm text-rose-200">{error}</span>}
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={sending || !value.trim()}
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </div>
        </form>

        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <ToxicityMeter value={preview?.confidence || 0} label={preview?.label || "Live preview"} />
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {Object.entries(preview?.categories || {}).slice(0, 6).map(([name, score]) => (
              <div key={name} className="rounded-md border border-white/10 bg-slate-950/50 p-2">
                <div className="flex justify-between gap-2">
                  <span className="capitalize text-slate-400">{name}</span>
                  <span className="font-bold text-white">{Math.round((Number(score) || 0) * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
          {preview?.rewrite && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 rounded-lg border border-lime-200/15 bg-lime-300/10 p-3 text-sm text-lime-50">
              <div className="mb-1 flex items-center gap-2 font-bold">
                <Sparkles className="h-4 w-4" /> Safer rewrite
              </div>
              {preview.rewrite}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
