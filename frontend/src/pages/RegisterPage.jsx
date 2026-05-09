import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/Button";
import { GlassCard } from "../components/GlassCard";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.name.trim().length < 2) return setError("Name must be at least 2 characters.");
    if (!form.email.includes("@")) return setError("Enter a valid email.");
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(form.password)) {
      return setError("Password needs 8 characters, uppercase, lowercase, and a number.");
    }
    setLoading(true);
    try {
      await register(form);
      navigate("/analyzer");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10 noise">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link to="/" className="mb-6 block text-center text-sm font-black uppercase tracking-[0.24em] text-cyan-100">CivicAI Guard</Link>
        <GlassCard>
          <h1 className="text-3xl font-black text-white">Create workspace</h1>
          <p className="mt-2 text-sm text-slate-400">Start detecting and explaining toxic content in minutes.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Name</span>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/70 px-3">
                <UserRound className="h-4 w-4 text-slate-500" />
                <input className="min-h-12 w-full bg-transparent text-white outline-none" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
              </div>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Email</span>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/70 px-3">
                <Mail className="h-4 w-4 text-slate-500" />
                <input className="min-h-12 w-full bg-transparent text-white outline-none" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
              </div>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Password</span>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/70 px-3">
                <LockKeyhole className="h-4 w-4 text-slate-500" />
                <input className="min-h-12 w-full bg-transparent text-white outline-none" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Strong password" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-slate-400">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            {error && <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</p>}
            <Button loading={loading} className="w-full">Create account</Button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-400">
            Already have an account? <Link to="/login" className="font-semibold text-cyan-200">Login</Link>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default RegisterPage;

