import { motion } from "framer-motion";
import { labelName, percent } from "../utils/format";

export const ProgressBar = ({ label, value }) => (
  <div>
    <div className="mb-2 flex justify-between text-sm">
      <span className="text-slate-300">{labelName(label)}</span>
      <span className="font-semibold text-cyan-100">{percent(value)}</span>
    </div>
    <div className="h-2 rounded-full bg-slate-950">
      <motion.div
        className="h-2 rounded-full bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-lime-300"
        initial={{ width: 0 }}
        animate={{ width: `${Math.round((value || 0) * 100)}%` }}
      />
    </div>
  </div>
);

