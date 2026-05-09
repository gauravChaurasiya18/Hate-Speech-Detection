import { CalendarClock, Clock, Mail, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { GlassCard } from "../components/GlassCard";
import { StatCard } from "../components/StatCard";
import { dateTime } from "../utils/format";

const ProfilePage = () => {
  const { user, accountStats } = useAuth();
  const initials = user?.name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">Profile</p>
        <h1 className="mt-2 text-4xl font-black text-white">Account center</h1>
      </div>

      <GlassCard>
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl text-3xl font-black text-slate-950 shadow-glow" style={{ background: user?.avatarColor || "#22d3ee" }}>
            {initials}
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">{user?.name}</h2>
            <p className="mt-2 flex items-center gap-2 text-slate-400"><Mail className="h-4 w-4" /> {user?.email}</p>
            <p className="mt-2 flex items-center gap-2 text-slate-400"><UserRound className="h-4 w-4" /> {user?.role}</p>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total analyses" value={accountStats?.totalAnalyses || 0} icon={CalendarClock} />
        <StatCard label="Last analysis" value={accountStats?.lastAnalysisAt ? "Active" : "None"} icon={Clock} accent="text-lime-300" />
        <StatCard label="Member since" value={user?.createdAt ? new Date(user.createdAt).getFullYear() : "Now"} icon={UserRound} accent="text-fuchsia-300" />
      </div>

      <GlassCard>
        <h2 className="text-xl font-black text-white">Recent activity</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <p className="text-sm text-slate-400">Last login</p>
            <p className="mt-2 font-semibold text-white">{dateTime(user?.lastLoginAt)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <p className="text-sm text-slate-400">Last analysis</p>
            <p className="mt-2 font-semibold text-white">{dateTime(accountStats?.lastAnalysisAt)}</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default ProfilePage;

