import { motion } from "framer-motion";

export const StatCard = ({ label, value, icon: Icon, accent = "text-cyan-300" }) => (
  <motion.div whileHover={{ y: -3 }} className="glass rounded-2xl p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="mt-2 text-3xl font-black text-white">{value}</p>
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 ${accent}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  </motion.div>
);

