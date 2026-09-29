export const StatCardsSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3"
        >
          <div className="flex justify-between items-center">
            <div className="h-3.5 w-24 bg-slate-200 rounded" />
            <div className="h-9 w-9 bg-slate-100 rounded-xl" />
          </div>
          <div className="h-8 w-16 bg-slate-200 rounded" />
          <div className="h-3 w-32 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
      <div className="h-14 bg-slate-50 border-b border-slate-200" />
      <div className="divide-y divide-slate-100 p-2">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center justify-between p-4 gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-4 bg-slate-200 rounded"
                style={{ width: `${Math.max(15, 100 / cols - 5)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardListSkeleton = ({ count = 3 }) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4"
        >
          <div className="h-5 w-3/4 bg-slate-200 rounded" />
          <div className="h-4 w-1/2 bg-slate-100 rounded" />
          <div className="h-20 bg-slate-50 rounded-xl" />
          <div className="h-9 bg-slate-200 rounded-lg" />
        </div>
      ))}
    </div>
  );
};
