import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Activity, BarChart3, BrainCircuit, FileText, Globe2, Lock, Radar, ShieldCheck, Sparkles } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Button } from "../components/Button";
import { GlassCard } from "../components/GlassCard";
import { fadeUp, stagger } from "../animations/variants";

const features = [
  ["Multilingual Detection", "English, Hindi, Hinglish, and script-aware South Indian language signals.", Globe2],
  ["Explainable AI", "Token-level contribution charts and human-readable reasons behind predictions.", BrainCircuit],
  ["Bulk Moderation", "Upload CSV or TXT files and triage risky comments at scale.", FileText],
  ["Secure By Design", "JWT cookies, Helmet, rate limiting, CORS controls, and sanitized inputs.", Lock]
];

const steps = [
  ["Ingest", "Paste text or upload a moderation file."],
  ["Infer", "DistilBERT scores toxicity, threat, hate, offense, and bullying risk."],
  ["Explain", "SHAP-style evidence identifies which terms pushed the decision."],
  ["Repair", "The rewrite engine suggests a calmer alternative."]
];

const LandingPage = () => (
  <div className="min-h-screen noise">
    <Navbar />
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.24),transparent_36rem)]" />
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28"
      >
        <motion.div variants={fadeUp}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
            <Sparkles className="h-4 w-4" /> Explainable multilingual safety intelligence
          </div>
          <h1 className="max-w-4xl text-5xl font-black leading-tight text-white sm:text-6xl lg:text-7xl">
            Explainable Multilingual Hate Speech Detection Platform
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Detect toxicity, threats, cyberbullying, and offensive language with transparent AI evidence, safer rewrites, and analyst-grade dashboards.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/register"><Button icon={ShieldCheck} className="w-full sm:w-auto">Launch Analyzer</Button></Link>
            <Link to="/login"><Button variant="secondary" icon={Radar} className="w-full sm:w-auto">View Dashboard</Button></Link>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="glass gradient-border rounded-2xl p-5">
          <div className="rounded-xl bg-slate-950/70 p-4">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-sm font-bold text-cyan-100">Live Risk Stream</span>
              <span className="rounded-full bg-lime-300/15 px-3 py-1 text-xs text-lime-100">Active</span>
            </div>
            <div className="space-y-4">
              {["Threat signal", "Hinglish toxicity", "Offensive intensity", "Rewrite safety"].map((label, index) => (
                <div key={label}>
                  <div className="mb-2 flex justify-between text-sm text-slate-300">
                    <span>{label}</span>
                    <span>{[86, 64, 42, 91][index]}%</span>
                  </div>
                  <motion.div className="h-3 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-lime-300"
                      initial={{ width: 0 }}
                      animate={{ width: `${[86, 64, 42, 91][index]}%` }}
                      transition={{ delay: index * 0.14, duration: 0.9 }}
                    />
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>

    <section id="features" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {features.map(([title, description, Icon]) => (
          <motion.div variants={fadeUp} key={title}>
            <GlassCard hover className="h-full">
              <Icon className="mb-4 h-8 w-8 text-cyan-300" />
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>
    </section>

    <section id="stats" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-4 md:grid-cols-3">
        {[["5", "risk categories"], ["4+", "language modes"], ["200", "bulk rows per upload"]].map(([value, label]) => (
          <GlassCard key={label} className="text-center">
            <p className="text-5xl font-black text-white">{value}</p>
            <p className="mt-2 text-sm uppercase tracking-[0.2em] text-cyan-100">{label}</p>
          </GlassCard>
        ))}
      </div>
    </section>

    <section id="workflow" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">Workflow</p>
          <h2 className="mt-2 text-3xl font-black text-white">From raw text to safer language</h2>
        </div>
        <Activity className="hidden h-10 w-10 text-lime-300 sm:block" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {steps.map(([title, text], index) => (
          <GlassCard key={title}>
            <span className="text-sm font-black text-cyan-200">0{index + 1}</span>
            <h3 className="mt-3 text-xl font-bold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
          </GlassCard>
        ))}
      </div>
      <div className="mt-10 text-center">
        <Link to="/register"><Button icon={BarChart3}>Build Safer Communities</Button></Link>
      </div>
    </section>
    <Footer />
  </div>
);

export default LandingPage;

