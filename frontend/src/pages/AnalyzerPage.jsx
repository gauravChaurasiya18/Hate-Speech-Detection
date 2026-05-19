import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, BrainCircuit, Languages, WandSparkles } from "lucide-react";
import { analyzeText, uploadFile } from "../services/analysisService";
import { useDebounce } from "../hooks/useDebounce";
import { Button } from "../components/Button";
import { FileUpload } from "../components/FileUpload";
import { GlassCard } from "../components/GlassCard";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { ProgressBar } from "../components/ProgressBar";
import { ToxicityMeter } from "../components/ToxicityMeter";
import { ExplainabilityDashboard } from "../components/explainability/ExplainabilityDashboard";
import { labelName } from "../utils/format";

const AnalyzerPage = () => {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [bulkResults, setBulkResults] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debouncedText = useDebounce(text, 900);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const runLive = async () => {
      if (!debouncedText.trim()) {
        setResult(null);
        return;
      }
      if (debouncedText.trim().length < 5) return;
      setLiveLoading(true);
      try {
        const data = await analyzeText(debouncedText, { save: false, explain: false, signal: controller.signal });
        if (active) setResult(data.result);
      } catch (err) {
        if (err.name === "CanceledError" || err.name === "AbortError") return;
        // Live analysis stays quiet so the typing experience does not become noisy.
      } finally {
        if (active) setLiveLoading(false);
      }
    };
    runLive();
    return () => {
      active = false;
      controller.abort();
    };
  }, [debouncedText]);

  const categories = useMemo(() => Object.entries(result?.categories || {}), [result]);

  const analyze = async () => {
    if (text.trim().length < 2) return setError("Enter text before analyzing.");
    setError("");
    setLoading(true);
    try {
      const data = await analyzeText(text, { save: true });
      setResult(data.result);
      setBulkResults([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (file) => {
    setError("");
    setLoading(true);
    try {
      const data = await uploadFile(file);
      setBulkResults(data.results);
      setResult(data.results[0]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">Analyzer</p>
          <h1 className="mt-2 text-4xl font-black text-white">Real-time explainable moderation</h1>
          <p className="mt-2 max-w-2xl text-slate-400">Type, inspect toxic spans, view model confidence, then save a full analysis when ready.</p>
        </div>
        <FileUpload onFile={handleFile} loading={loading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <GlassCard>
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-200">Input text</label>
            {liveLoading && <span className="text-xs text-cyan-200">Live scan...</span>}
          </div>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={12}
            maxLength={5000}
            className="cyber-scroll w-full resize-none rounded-2xl border border-white/10 bg-slate-950/80 p-4 leading-7 text-slate-100 outline-none transition focus:border-cyan-300/60"
            placeholder="Paste a comment in English, Hindi, Hinglish, Telugu, or Tamil..."
          />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-slate-500">{text.length}/5000 characters</span>
            <Button icon={BrainCircuit} loading={loading} onClick={analyze}>Analyze & Save</Button>
          </div>
          {error && <p className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</p>}
        </GlassCard>

        <GlassCard>
          {result ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <ToxicityMeter value={result.confidence} label={labelName(result.prediction)} />
              <div className="grid gap-3">
                {categories.map(([label, value]) => <ProgressBar key={label} label={label} value={value} />)}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <Languages className="mb-2 h-5 w-5 text-lime-300" />
                  <p className="text-sm text-slate-400">Language</p>
                  <p className="font-bold text-white">{result.language?.name || "Unknown"}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <AlertTriangle className="mb-2 h-5 w-5 text-amber-300" />
                  <p className="text-sm text-slate-400">Toxic terms</p>
                  <p className="font-bold text-white">{result.toxicWords?.length || 0}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <LoadingSkeleton rows={4} />
          )}
        </GlassCard>
      </div>

      <ExplainabilityDashboard result={result} text={text} loading={loading || liveLoading} />

      <div className="grid gap-6">
        <GlassCard>
          <div className="mb-4 flex items-center gap-2">
            <WandSparkles className="h-5 w-5 text-lime-300" />
            <h2 className="text-xl font-black text-white">Safer rewrite</h2>
          </div>
          <p className="rounded-2xl border border-lime-300/20 bg-lime-300/10 p-4 leading-7 text-lime-50">
            {result?.saferRewrite || "A calmer alternative will appear after analysis."}
          </p>
        </GlassCard>
      </div>

      {bulkResults.length > 0 && (
        <GlassCard>
          <h2 className="mb-4 text-xl font-black text-white">Bulk results</h2>
          <div className="grid gap-3">
            {bulkResults.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="line-clamp-2 text-sm text-slate-300">{item.text}</p>
                  <span className="rounded-lg bg-cyan-300/10 px-3 py-1 text-sm font-semibold text-cyan-100">{labelName(item.prediction)}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default AnalyzerPage;
