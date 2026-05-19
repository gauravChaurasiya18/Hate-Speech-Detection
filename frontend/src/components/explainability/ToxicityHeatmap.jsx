import { memo, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Network } from "lucide-react";
import { labelName } from "../../utils/format";
import { formatSignedScore, tokenColor } from "../../utils/explainability";

const contributionLabel = (token) => {
  if (token.signedScore > 0.02) return "Toxicity";
  if (token.signedScore < -0.02) return "Safety";
  return "Neutral";
};

const TokenTooltip = ({ token }) => {
  const influences = Object.entries(token.categoryInfluence || {})
    .filter(([, value]) => Number(value) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.96 }}
      transition={{ duration: 0.16 }}
      className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-3 w-64 rounded-2xl border border-white/10 bg-slate-950/95 p-3 text-left text-xs shadow-2xl shadow-black/40"
      style={{ translate: "-50% 0" }}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="truncate text-sm font-bold text-white">{token.word}</span>
        <span className={token.signedScore >= 0 ? "text-rose-200" : "text-lime-200"}>{formatSignedScore(token.signedScore)}</span>
      </div>
      <div className="space-y-1 text-slate-300">
        <p>
          <span className="text-slate-500">Category:</span> {labelName(token.category)}
        </p>
        <p>
          <span className="text-slate-500">Confidence:</span> {Math.round(token.confidence || 0)}%
        </p>
        <p>
          <span className="text-slate-500">Signal:</span> {contributionLabel(token)}
        </p>
      </div>
      {influences.length > 0 && (
        <div className="mt-3 space-y-1">
          {influences.map(([category, value]) => (
            <div key={category} className="flex items-center justify-between gap-2">
              <span className="text-slate-400">{labelName(category)}</span>
              <span className="text-cyan-100">{Math.round(Number(value) * 100)}%</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export const ToxicityHeatmap = memo(({ tokens = [] }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [lines, setLines] = useState([]);
  const containerRef = useRef(null);
  const tokenRefs = useRef({});

  const activeToken = useMemo(() => tokens.find((token) => token.index === activeIndex), [activeIndex, tokens]);
  const relatedIndexes = useMemo(() => new Set((activeToken?.attention || []).map((item) => item.index)), [activeToken]);

  useLayoutEffect(() => {
    if (activeIndex === null || !containerRef.current || !activeToken) {
      setLines([]);
      return undefined;
    }

    const calculateLines = () => {
      const containerRect = containerRef.current?.getBoundingClientRect();
      const sourceRect = tokenRefs.current[activeIndex]?.getBoundingClientRect();
      if (!containerRect || !sourceRect) return;

      const nextLines = (activeToken.attention || [])
        .map((link) => {
          const targetRect = tokenRefs.current[link.index]?.getBoundingClientRect();
          if (!targetRect) return null;
          const sx = sourceRect.left - containerRect.left + sourceRect.width / 2;
          const sy = sourceRect.top - containerRect.top + sourceRect.height / 2;
          const tx = targetRect.left - containerRect.left + targetRect.width / 2;
          const ty = targetRect.top - containerRect.top + targetRect.height / 2;
          const lift = Math.min(44, 16 + Math.abs(tx - sx) * 0.05);
          return {
            key: `${activeIndex}-${link.index}`,
            strength: link.strength,
            d: `M ${sx} ${sy} C ${(sx + tx) / 2} ${Math.min(sy, ty) - lift}, ${(sx + tx) / 2} ${Math.min(sy, ty) - lift}, ${tx} ${ty}`
          };
        })
        .filter(Boolean);

      setLines(nextLines);
    };

    calculateLines();
    window.addEventListener("resize", calculateLines);
    return () => window.removeEventListener("resize", calculateLines);
  }, [activeIndex, activeToken]);

  if (!tokens.length) {
    return (
      <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/45 text-sm text-slate-500">
        Token heatmap will appear once analysis starts.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div ref={containerRef} className="relative overflow-visible rounded-2xl border border-white/10 bg-slate-950/45 p-4">
        <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible">
          <AnimatePresence>
            {lines.map((line) => (
              <motion.path
                key={line.key}
                d={line.d}
                fill="none"
                stroke="rgba(103, 232, 249, 0.62)"
                strokeWidth={Math.max(1.25, Number(line.strength || 0) * 3)}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.85 }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={{ duration: 0.28 }}
              />
            ))}
          </AnimatePresence>
        </svg>

        <div className="relative z-10 flex flex-wrap gap-2">
          {tokens.map((token) => {
            const isActive = activeIndex === token.index;
            const isRelated = relatedIndexes.has(token.index);
            const style = tokenColor(token.score);

            return (
              <motion.button
                key={`${token.word}-${token.index}`}
                ref={(node) => {
                  if (node) tokenRefs.current[token.index] = node;
                }}
                type="button"
                layout
                onMouseEnter={() => setActiveIndex(token.index)}
                onMouseLeave={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(token.index)}
                onBlur={() => setActiveIndex(null)}
                className={[
                  "relative rounded-xl border px-3 py-2 text-sm font-semibold text-white outline-none transition",
                  "focus-visible:ring-2 focus-visible:ring-cyan-200/70",
                  isActive ? "z-20 scale-[1.04] ring-2 ring-cyan-200/70" : "",
                  isRelated ? "z-20 ring-2 ring-lime-200/60" : "opacity-95"
                ].join(" ")}
                style={style}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16, delay: Math.min(token.index * 0.008, 0.18) }}
              >
                {token.word}
                <AnimatePresence>{isActive && <TokenTooltip token={token} />}</AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Network className="h-4 w-4 text-cyan-200" />
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-200">Attention Links</h3>
        </div>
        {activeToken?.attention?.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {activeToken.attention.map((link) => (
              <div key={`${activeToken.index}-${link.index}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="truncate font-semibold text-white">{`${activeToken.word} -> ${link.word}`}</span>
                  <span className="text-cyan-100">{Math.round(Number(link.strength || 0) * 100)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10">
                  <motion.div
                    className="h-1.5 rounded-full bg-cyan-300"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(Number(link.strength || 0) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Hover a token to inspect contextual attention strengths.</p>
        )}
      </div>
    </div>
  );
});

ToxicityHeatmap.displayName = "ToxicityHeatmap";
