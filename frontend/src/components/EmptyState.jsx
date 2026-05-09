import { SearchX } from "lucide-react";

export const EmptyState = ({ title = "No records found", description = "Try changing filters or analyzing new text." }) => (
  <div className="glass rounded-2xl p-8 text-center">
    <SearchX className="mx-auto h-10 w-10 text-slate-500" />
    <h3 className="mt-3 text-lg font-bold text-white">{title}</h3>
    <p className="mt-1 text-sm text-slate-400">{description}</p>
  </div>
);

