import { motion } from "framer-motion";
import { percent } from "../utils/format";

export const ToxicityMeter = ({ value = 0, label = "Waiting" }) => {
  const pct = Math.round((Number(value) || 0) * 100);
  const color = pct > 75 ? "from-rose-500 to-orange-300" : pct > 45 ? "from-amber-300 to-pink-400" : "from-lime-300 to-cyan-300";

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-slate-400">Toxicity meter</span>
        <span className="text-sm font-bold text-white">{label} · {percent(value)}</span>
      </div>
      <div className="h-4 overflow-hidden rounded-full bg-slate-950 ring-1 ring-white/10">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
        />
      </div>
    </div>
  );
};

