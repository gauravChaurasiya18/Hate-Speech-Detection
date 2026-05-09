import { Outlet } from "react-router-dom";
import { Navbar } from "../components/Navbar";

export const AppLayout = () => (
  <div className="min-h-screen noise">
    <Navbar app />
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Outlet />
    </main>
  </div>
);

