export const HighlightedText = ({ text = "", words = [] }) => {
  if (!text) return <p className="text-slate-500">Analyzed text will appear here.</p>;
  const escaped = words.filter(Boolean).map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!escaped.length) return <p className="whitespace-pre-wrap leading-7 text-slate-200">{text}</p>;

  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <p className="whitespace-pre-wrap leading-7 text-slate-200">
      {parts.map((part, index) =>
        escaped.some((word) => new RegExp(`^${word}$`, "i").test(part)) ? (
          <mark key={`${part}-${index}`} className="rounded-md bg-rose-500/25 px-1 py-0.5 text-rose-100 ring-1 ring-rose-300/30">
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        )
      )}
    </p>
  );
};

