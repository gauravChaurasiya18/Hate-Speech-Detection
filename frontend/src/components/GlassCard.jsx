import { motion } from "framer-motion";
import { cn } from "../utils/cn";

export const GlassCard = ({ children, className, hover = false }) => (
  <motion.div
    whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
    className={cn("glass gradient-border rounded-2xl p-5", className)}
  >
    {children}
  </motion.div>
);

