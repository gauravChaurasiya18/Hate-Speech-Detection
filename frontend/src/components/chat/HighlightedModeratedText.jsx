import { percent } from "../../utils/format";

const buildSegments = (text, toxicWords = []) => {
  const spans = toxicWords
    .map((item) => {
      if (Number.isFinite(item.start) && Number.isFinite(item.end)) return item;
      const index = text.toLowerCase().indexOf(String(item.word || "").toLowerCase());
      return index >= 0 ? { ...item, start: index, end: index + String(item.word).length } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start);

  const segments = [];
  let cursor = 0;
  spans.forEach((span) => {
    if (span.start < cursor) return;
    if (span.start > cursor) segments.push({ text: text.slice(cursor, span.start) });
    segments.push({ text: text.slice(span.start, span.end), toxic: span });
    cursor = span.end;
  });
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments.length ? segments : [{ text }];
};

export const HighlightedModeratedText = ({ text, toxicWords = [] }) => (
  <span>
    {buildSegments(text, toxicWords).map((segment, index) =>
      segment.toxic ? (
        <span key={`${segment.text}-${index}`} className="group relative rounded bg-rose-300/25 px-1 text-rose-50 ring-1 ring-rose-200/30">
          {segment.text}
          <span className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden w-64 rounded-lg border border-white/10 bg-slate-950/95 p-3 text-xs text-slate-200 shadow-2xl group-hover:block">
            <span className="block font-bold text-rose-100">{segment.toxic.category || "toxicity"} signal</span>
            <span className="mt-1 block">Toxicity: {percent(segment.toxic.score || 0)}</span>
            <span className="block">Contribution: {percent(Math.abs(segment.toxic.contribution || segment.toxic.score || 0))}</span>
            <span className="mt-1 block text-slate-400">{segment.toxic.explanation}</span>
          </span>
        </span>
      ) : (
        <span key={`${segment.text}-${index}`}>{segment.text}</span>
      )
    )}
  </span>
);
