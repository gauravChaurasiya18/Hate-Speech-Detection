import { memo, useDeferredValue, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, Flame, Layers3 } from "lucide-react";
import { GlassCard } from "../GlassCard";
import { normalizeExplanation } from "../../utils/explainability";
import { ToxicityHeatmap } from "./ToxicityHeatmap";
import { ExplanationScorePanel } from "./ExplanationScorePanel";
import { ContributionGraph } from "./ContributionGraph";

export const ExplainabilityDashboard = memo(({ result, text = "", loading = false }) => {
  const deferredResult = useDeferredValue(result);
  const analyzedText = deferredResult?.text || text;
  const explanation = useMemo(() => normalizeExplanation(deferredResult, analyzedText), [deferredResult, analyzedText]);
  const hasTokens = explanation.tokens.length > 0;

  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">Explainable AI</p>
          <h2 className="mt-2 text-3xl font-black text-white">Token-level moderation intelligence</h2>
          {explanation.truncated && (
            <p className="mt-2 text-sm text-amber-200">
              Showing the first {explanation.tokens.length} of {explanation.tokenCount} tokens for responsive rendering.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300">
          <span className={`h-2 w-2 rounded-full ${loading ? "animate-pulse bg-cyan-300" : hasTokens ? "bg-lime-300" : "bg-slate-500"}`} />
          {loading ? "Updating" : hasTokens ? "Ready" : "Waiting"}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <GlassCard className="overflow-visible">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-400/15 text-rose-100">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Toxicity Heatmap</h3>
                <p className="text-sm text-slate-400">Word contributions, category influence, and confidence are attached to each token.</p>
              </div>
            </div>
            <ToxicityHeatmap tokens={explanation.tokens} />
          </GlassCard>

          <GlassCard>
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/15 text-cyan-100">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">SHAP-style Contribution Graph</h3>
                <p className="text-sm text-slate-400">Positive bars increase toxicity, negative bars pull the decision toward safe.</p>
              </div>
            </div>
            <ContributionGraph tokens={explanation.tokens} />
          </GlassCard>
        </div>

        <GlassCard>
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-lime-300/15 text-lime-100">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Score Panel</h3>
              <p className="text-sm text-slate-400">Highest-impact terms and category-level model evidence.</p>
            </div>
          </div>
          <ExplanationScorePanel explanation={explanation} />
        </GlassCard>
      </div>
    </motion.section>
  );
});

ExplainabilityDashboard.displayName = "ExplainabilityDashboard";
