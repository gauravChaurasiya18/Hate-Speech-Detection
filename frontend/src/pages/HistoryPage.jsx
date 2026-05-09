import { useEffect, useState } from "react";
import { Eye, Search, Trash2 } from "lucide-react";
import { deleteHistory, getHistory } from "../services/analysisService";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { GlassCard } from "../components/GlassCard";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { Modal } from "../components/Modal";
import { HighlightedText } from "../components/HighlightedText";
import { ProgressBar } from "../components/ProgressBar";
import { dateTime, labelName } from "../utils/format";

const labels = ["all", "non_toxic", "toxic", "hate_speech", "offensive", "threat", "cyberbullying"];

const HistoryPage = () => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [search, setSearch] = useState("");
  const [label, setLabel] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    const data = await getHistory({ page, limit: 8, search, label });
    setItems(data.items);
    setPagination(data.pagination);
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => fetchHistory(1), 300);
    return () => window.clearTimeout(timer);
  }, [search, label]);

  const remove = async (id) => {
    await deleteHistory(id);
    fetchHistory(pagination.page);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">History</p>
        <h1 className="mt-2 text-4xl font-black text-white">Saved analyses</h1>
      </div>

      <GlassCard>
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/70 px-3">
            <Search className="h-4 w-4 text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="min-h-12 w-full bg-transparent text-white outline-none" placeholder="Search text, labels, toxic words..." />
          </div>
          <select value={label} onChange={(e) => setLabel(e.target.value)} className="min-h-12 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-white outline-none">
            {labels.map((item) => <option key={item} value={item}>{labelName(item)}</option>)}
          </select>
        </div>
      </GlassCard>

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : items.length ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <GlassCard key={item._id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-cyan-300/10 px-3 py-1 text-sm font-semibold text-cyan-100">{labelName(item.prediction)}</span>
                    <span className="text-xs text-slate-500">{dateTime(item.createdAt)}</span>
                  </div>
                  <p className="line-clamp-2 text-slate-300">{item.text}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" icon={Eye} onClick={() => setSelected(item)}>Details</Button>
                  <Button variant="danger" icon={Trash2} onClick={() => remove(item._id)}>Delete</Button>
                </div>
              </div>
            </GlassCard>
          ))}
          <div className="flex items-center justify-between">
            <Button variant="secondary" disabled={pagination.page <= 1} onClick={() => fetchHistory(pagination.page - 1)}>Previous</Button>
            <span className="text-sm text-slate-400">Page {pagination.page} of {pagination.pages}</span>
            <Button variant="secondary" disabled={pagination.page >= pagination.pages} onClick={() => fetchHistory(pagination.page + 1)}>Next</Button>
          </div>
        </div>
      ) : (
        <EmptyState />
      )}

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Analysis details">
        {selected && (
          <div className="space-y-5">
            <HighlightedText text={selected.text} words={selected.toxicWords} />
            <div className="grid gap-3">
              {Object.entries(selected.categories || {}).map(([key, value]) => <ProgressBar key={key} label={key} value={value} />)}
            </div>
            <div className="rounded-2xl border border-lime-300/20 bg-lime-300/10 p-4 text-lime-50">{selected.saferRewrite}</div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HistoryPage;

