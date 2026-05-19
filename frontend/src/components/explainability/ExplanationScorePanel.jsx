import { memo } from "react";
import { motion } from "framer-motion";
import { Activity, Gauge, Tags } from "lucide-react";
import { labelName } from "../../utils/format";
import { formatScore } from "../../utils/explainability";

const Meter = ({ value = 0 }) => {
  const pct = Math.round(Number(value) || 0);
  const color = pct > 75 ? "#ef4444" : pct > 45 ? "#fb923c" : "#84cc16";

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
      <div
        className="grid h-20 w-20 shrink-0 place-items-center rounded-full"
        style={{ background: `conic-gradient(${color} ${pct * 3.6}deg, rgba(148, 163, 184, 0.18) 0deg)` }}
      >
        <div className="grid h-14 w-14 place-items-center rounded-full bg-slate-950 text-lg font-black text-white">{pct}%</div>
      </div>
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
          <Gauge className="h-4 w-4 text-cyan-200" />
          Confidence
        </div>
        <p className="text-xs leading-5 text-slate-400">Token evidence calibrated against model and lexical signals.</p>
      </div>
    </div>
  );
};

export const ExplanationScorePanel = memo(({ explanation }) => {
  const topWords = explanation?.topToxicWords || [];
  const categorySummary = explanation?.categorySummary || [];

  return (
    <aside className="space-y-4">
      <Meter value={explanation?.confidence || 0} />

      <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-rose-200" />
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-200">Top Signals</h3>
        </div>
        <div className="space-y-3">
          {topWords.length ? (
            topWords.map((item) => (
              <div key={`${item.word}-${item.category}`}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className="max-w-[12rem] truncate font-semibold text-white">{item.word}</span>
                  <span className="text-rose-100">{Math.round(item.percentage ?? item.score * 100)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.round(item.percentage ?? item.score * 100))}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{labelName(item.category)}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No toxic token exceeded the signal threshold.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
        <div className="mb-4 flex items-center gap-2">
          <Tags className="h-4 w-4 text-lime-200" />
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-200">Category Map</h3>
        </div>
        <div className="space-y-3">
          {categorySummary.map((item) => (
            <div key={item.category}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-300">{labelName(item.category)}</span>
                <span className="font-semibold text-cyan-100">{formatScore(item.score)}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <motion.div
                  className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-lime-300"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(Number(item.score || 0) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
});

ExplanationScorePanel.displayName = "ExplanationScorePanel";
