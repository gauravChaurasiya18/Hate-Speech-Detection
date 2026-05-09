import { Loader2 } from "lucide-react";
import { cn } from "../utils/cn";

const variants = {
  primary: "bg-cyan-300 text-slate-950 shadow-glow hover:bg-cyan-200",
  secondary: "border border-slate-700 bg-slate-900/70 text-slate-100 hover:border-cyan-300/70 hover:text-cyan-100",
  danger: "bg-rose-500 text-white hover:bg-rose-400",
  ghost: "text-slate-300 hover:bg-white/10 hover:text-white"
};

export const Button = ({ children, className, variant = "primary", loading = false, icon: Icon, ...props }) => (
  <button
    className={cn(
      "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
      variants[variant],
      className
    )}
    disabled={loading || props.disabled}
    {...props}
  >
    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
    {children}
  </button>
);

