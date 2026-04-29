export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page title skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg" style={{ background: "var(--card-bg)" }} />
        <div className="h-4 w-32 rounded-lg" style={{ background: "var(--card-bg)" }} />
      </div>

      {/* KPI row skeleton */}
      <div className="kpi-row">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl px-5 py-4 flex flex-col gap-2"
            style={{ background: "var(--card-bg)", flex: "1 1 140px", borderLeft: "3px solid #d0d5e8" }}
          >
            <div className="h-3 w-20 rounded" style={{ background: "#d0d5e8" }} />
            <div className="h-7 w-12 rounded" style={{ background: "#d0d5e8" }} />
          </div>
        ))}
      </div>

      {/* Charts row skeleton */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-[18px] p-6"
            style={{ background: "var(--card-bg)" }}
          >
            <div className="h-4 w-32 rounded mb-4" style={{ background: "#d0d5e8" }} />
            <div className="h-52 rounded-lg" style={{ background: "#d0d5e8" }} />
          </div>
        ))}
      </div>

      {/* Tables row skeleton */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-[18px] p-6"
            style={{ background: "var(--card-bg)" }}
          >
            <div className="h-4 w-40 rounded mb-4" style={{ background: "#d0d5e8" }} />
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-10 rounded mb-2" style={{ background: "#d0d5e8" }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
