import { X } from "lucide-react";

export const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="glass max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-white">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-300 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

