import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BrainCircuit, Database, ShieldAlert } from "lucide-react";
import { getDashboardStats } from "../services/analysisService";
import { GlassCard } from "../components/GlassCard";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { StatCard } from "../components/StatCard";
import { CategoryBar, LanguagePie, TrendLine } from "../charts/DashboardCharts";
import { dateTime, labelName } from "../utils/format";

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then(setData).finally(() => setLoading(false));
  }, []);

  const stats = data?.stats;
  const languageData = useMemo(() => Object.entries(stats?.languageDistribution || {}).map(([name, value]) => ({ name, value })), [stats]);
  const categoryData = useMemo(() => Object.entries(stats?.categoryDistribution || {}).map(([name, value]) => ({ name, value })), [stats]);

  if (loading) return <LoadingSkeleton rows={8} />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">Dashboard</p>
        <h1 className="mt-2 text-4xl font-black text-white">Moderation intelligence</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total analyses" value={stats?.totalAnalyses || 0} icon={Database} />
        <StatCard label="Hate speech %" value={`${stats?.hateSpeechPercentage || 0}%`} icon={ShieldAlert} accent="text-rose-300" />
        <StatCard label="Threat count" value={stats?.threatCount || 0} icon={AlertTriangle} accent="text-amber-300" />
        <StatCard label="Languages" value={languageData.length} icon={BrainCircuit} accent="text-lime-300" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h2 className="mb-4 text-xl font-black text-white">Language distribution</h2>
          <LanguagePie data={languageData.length ? languageData : [{ name: "No data", value: 1 }]} />
        </GlassCard>
        <GlassCard>
          <h2 className="mb-4 text-xl font-black text-white">Offensive category distribution</h2>
          <CategoryBar data={categoryData} />
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className="mb-4 text-xl font-black text-white">Trend analytics</h2>
        <TrendLine data={stats?.timeline || []} />
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h2 className="mb-4 text-xl font-black text-white">Most toxic words</h2>
          <div className="flex flex-wrap gap-2">
            {(stats?.mostToxicWords || []).map((item) => (
              <span key={item.word} className="rounded-lg border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                {item.word} · {item.count}
              </span>
            ))}
            {!stats?.mostToxicWords?.length && <p className="text-sm text-slate-400">No toxic terms recorded yet.</p>}
          </div>
        </GlassCard>
        <GlassCard>
          <h2 className="mb-4 text-xl font-black text-white">Recent activity</h2>
          <div className="space-y-3">
            {(data?.recent || []).map((item) => (
              <div key={item._id} className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-cyan-100">{labelName(item.prediction)}</span>
                  <span className="text-xs text-slate-500">{dateTime(item.createdAt)}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-slate-400">{item.text}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default DashboardPage;

