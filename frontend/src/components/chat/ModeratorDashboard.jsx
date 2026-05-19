import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from "recharts";
import { Activity, ListChecks, ShieldAlert, Users } from "lucide-react";
import { GlassCard } from "../GlassCard";

const COLORS = ["#22d3ee", "#a3e635", "#fbbf24", "#fb7185", "#7f1d1d", "#94a3b8"];

export const ModeratorDashboard = ({ analytics, queue, toxicHistory }) => {
  const stats = analytics?.stats || {};

  return (
    <aside className="grid min-h-0 gap-4 xl:grid-rows-[auto_auto_1fr]">
      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="p-4">
          <Activity className="h-5 w-5 text-cyan-200" />
          <p className="mt-2 text-2xl font-black text-white">{stats.timeline?.reduce((sum, item) => sum + item.count, 0) || 0}</p>
          <p className="text-xs text-slate-400">Toxic events today</p>
        </GlassCard>
        <GlassCard className="p-4">
          <ListChecks className="h-5 w-5 text-amber-200" />
          <p className="mt-2 text-2xl font-black text-white">{queue.length}</p>
          <p className="text-xs text-slate-400">Queue items</p>
        </GlassCard>
      </div>

      <GlassCard className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-rose-200" />
          <h2 className="font-black text-white">Live moderation dashboard</h2>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.timeline || []}>
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="count" stroke="#fb7185" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="grid min-h-0 gap-4 lg:grid-cols-2 xl:grid-cols-1">
        <GlassCard className="p-4">
          <h3 className="mb-3 flex items-center gap-2 font-black text-white"><Users className="h-5 w-5 text-cyan-200" /> Most toxic users</h3>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.toxicUsers || []}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8 }} />
                <Bar dataKey="count" fill="#fb7185" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <h3 className="mb-3 font-black text-white">Category distribution</h3>
          <div className="grid gap-3 md:grid-cols-[150px_1fr]">
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.categoryDistribution || []} dataKey="value" nameKey="name" innerRadius={34} outerRadius={58}>
                    {(stats.categoryDistribution || []).map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap content-start gap-2">
              {(stats.frequentToxicTerms || []).map((term) => (
                <span key={term.word} className="rounded-md border border-rose-300/20 bg-rose-500/10 px-2 py-1 text-xs text-rose-100">
                  {term.word} · {term.count}
                </span>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="min-h-0 p-4">
          <h3 className="mb-3 font-black text-white">Toxic message history</h3>
          <div className="cyber-scroll max-h-52 space-y-2 overflow-y-auto pr-2">
            {toxicHistory.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-slate-950/50 p-3">
                <div className="flex justify-between gap-2 text-xs">
                  <span className="font-bold text-rose-100">{item.username}</span>
                  <span className="uppercase text-slate-500">{item.moderation?.severity}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-slate-300">{item.text}</p>
              </div>
            ))}
            {!toxicHistory.length && <p className="text-sm text-slate-500">No toxic messages recorded in this room.</p>}
          </div>
        </GlassCard>
      </div>
    </aside>
  );
};
