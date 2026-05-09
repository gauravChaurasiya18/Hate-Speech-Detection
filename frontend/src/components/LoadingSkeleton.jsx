export const LoadingSkeleton = ({ rows = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="h-14 animate-pulse rounded-xl bg-white/10" />
    ))}
  </div>
);

