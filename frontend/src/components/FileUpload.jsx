import { UploadCloud } from "lucide-react";

export const FileUpload = ({ onFile, loading }) => (
  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-300/40 bg-cyan-300/5 p-6 text-center transition hover:bg-cyan-300/10">
    <UploadCloud className="mb-3 h-8 w-8 text-cyan-200" />
    <span className="text-sm font-semibold text-white">{loading ? "Analyzing file..." : "Upload CSV or TXT"}</span>
    <span className="mt-1 text-xs text-slate-400">CSV columns supported: text, comment, content, message</span>
    <input
      type="file"
      accept=".csv,.txt,text/csv,text/plain"
      className="hidden"
      disabled={loading}
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) onFile(file);
        event.target.value = "";
      }}
    />
  </label>
);

