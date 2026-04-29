export default function ServiceOrdersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header skeleton */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-lg" style={{ background: "var(--card-bg)" }} />
          <div className="h-4 w-32 rounded-lg" style={{ background: "var(--card-bg)" }} />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-32 rounded-full" style={{ background: "var(--card-bg)" }} />
          <div className="h-9 w-24 rounded-full" style={{ background: "var(--card-bg)" }} />
        </div>
      </div>

      {/* KPI row skeleton */}
      <div className="kpi-row">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl px-5 py-4 flex flex-col gap-2"
            style={{ background: "var(--card-bg)", flex: "1 1 140px", borderLeft: "3px solid #d0d5e8" }}
          >
            <div className="h-3 w-24 rounded" style={{ background: "#d0d5e8" }} />
            <div className="h-7 w-10 rounded" style={{ background: "#d0d5e8" }} />
          </div>
        ))}
      </div>

      {/* Kanban / list content skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((col) => (
          <div key={col} className="space-y-3">
            <div className="h-5 w-28 rounded" style={{ background: "#d0d5e8" }} />
            {[1, 2, 3].map((card) => (
              <div
                key={card}
                className="rounded-[14px] p-4 space-y-2"
                style={{ background: "var(--card-bg)" }}
              >
                <div className="h-3 w-20 rounded" style={{ background: "#d0d5e8" }} />
                <div className="h-4 w-32 rounded" style={{ background: "#d0d5e8" }} />
                <div className="h-3 w-16 rounded" style={{ background: "#d0d5e8" }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
