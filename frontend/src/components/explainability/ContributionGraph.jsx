import { memo, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { buildContributionData } from "../../utils/explainability";

const TooltipContent = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const item = payload.find((entry) => entry.value !== 0) || payload[0];
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/95 px-3 py-2 text-xs shadow-2xl">
      <p className="font-semibold text-white">{label}</p>
      <p className={Number(item.value) >= 0 ? "text-rose-200" : "text-lime-200"}>
        {Number(item.value) >= 0 ? "Toxicity +" : "Safety "} {Math.abs(Number(item.value || 0))}%
      </p>
    </div>
  );
};

export const ContributionGraph = memo(({ tokens = [] }) => {
  const data = useMemo(() => buildContributionData(tokens), [tokens]);

  if (!data.length) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/45 text-sm text-slate-500">
        Contribution bars will appear after enough evidence is detected.
      </div>
    );
  }

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 12 }}>
          <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" horizontal={false} />
          <XAxis type="number" domain={[-100, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            dataKey="name"
            type="category"
            width={92}
            tick={{ fill: "#cbd5e1", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <Tooltip cursor={{ fill: "rgba(148, 163, 184, 0.08)" }} content={<TooltipContent />} />
          <ReferenceLine x={0} stroke="rgba(226, 232, 240, 0.24)" />
          <Bar dataKey="negative" radius={[6, 0, 0, 6]} isAnimationActive animationDuration={620}>
            {data.map((entry) => (
              <Cell key={`negative-${entry.name}`} fill="#86efac" />
            ))}
          </Bar>
          <Bar dataKey="positive" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={620}>
            {data.map((entry) => (
              <Cell key={`positive-${entry.name}`} fill={entry.positive > 65 ? "#ef4444" : entry.positive > 35 ? "#fb923c" : "#facc15"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

ContributionGraph.displayName = "ContributionGraph";
