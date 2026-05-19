import { AlertTriangle, ShieldCheck, Siren } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

const badgeStyles = {
  safe: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
  suspicious: "border-amber-300/30 bg-amber-400/15 text-amber-100",
  toxic: "border-rose-300/35 bg-rose-500/15 text-rose-100",
  threat: "border-red-300/40 bg-red-950/70 text-red-100"
};

const icons = {
  safe: ShieldCheck,
  suspicious: AlertTriangle,
  toxic: Siren,
  threat: Siren
};

export const ModerationBadge = ({ severity = "safe", label }) => {
  const Icon = icons[severity] || ShieldCheck;
  const harmful = ["toxic", "threat"].includes(severity);

  return (
    <motion.span
      className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold uppercase", badgeStyles[severity])}
      animate={harmful ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ repeat: harmful ? Infinity : 0, duration: 1.6 }}
    >
      <Icon className="h-3.5 w-3.5" />
      {harmful ? "Toxic Message Detected" : label || severity}
    </motion.span>
  );
};
