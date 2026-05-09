import { Link, NavLink, useNavigate } from "react-router-dom";
import { BrainCircuit, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./Button";
import { cn } from "../utils/cn";

const appLinks = [
  ["Analyzer", "/analyzer"],
  ["Dashboard", "/dashboard"],
  ["History", "/history"],
  ["Profile", "/profile"]
];

export const Navbar = ({ app = false }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const links = app ? appLinks : [["Features", "#features"], ["Workflow", "#workflow"], ["Stats", "#stats"]];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-300 text-slate-950 shadow-glow">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="text-sm font-black uppercase tracking-[0.24em] text-white">CivicAI Guard</span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {links.map(([label, href]) =>
            href.startsWith("#") ? (
              <a key={label} href={href} className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
                {label}
              </a>
            ) : (
              <NavLink
                key={label}
                to={href}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-2 text-sm transition",
                    isActive ? "bg-cyan-300/15 text-cyan-100" : "text-slate-300 hover:bg-white/10 hover:text-white"
                  )
                }
              >
                {label}
              </NavLink>
            )
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300">{user.name}</span>
              <Button variant="ghost" icon={LogOut} onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate("/login")}>Login</Button>
              <Button icon={BrainCircuit} onClick={() => navigate("/register")}>Start Free</Button>
            </>
          )}
        </div>

        <button className="rounded-lg p-2 text-slate-200 md:hidden" onClick={() => setOpen((value) => !value)}>
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/10 px-4 pb-4 md:hidden">
          <div className="grid gap-2">
            {links.map(([label, href]) => (
              <Link key={label} to={href.startsWith("#") ? "/" : href} className="rounded-lg px-3 py-2 text-slate-200" onClick={() => setOpen(false)}>
                {label}
              </Link>
            ))}
            {user ? <Button variant="secondary" onClick={handleLogout}>Logout</Button> : <Button onClick={() => navigate("/login")}>Login</Button>}
          </div>
        </div>
      )}
    </header>
  );
};

