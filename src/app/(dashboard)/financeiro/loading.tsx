export default function FinanceiroLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg" style={{ background: "var(--card-bg)" }} />
        <div className="h-4 w-40 rounded-lg" style={{ background: "var(--card-bg)" }} />
      </div>

      {/* KPI section — Este mês */}
      <div className="space-y-2">
        <div className="h-3 w-20 rounded" style={{ background: "#d0d5e8" }} />
        <div className="kpi-row">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl px-5 py-4 flex flex-col gap-2"
              style={{ background: "var(--card-bg)", flex: "1 1 140px", borderLeft: "3px solid #d0d5e8" }}
            >
              <div className="h-3 w-24 rounded" style={{ background: "#d0d5e8" }} />
              <div className="h-7 w-20 rounded" style={{ background: "#d0d5e8" }} />
            </div>
          ))}
        </div>
      </div>

      {/* KPI section — Acumulado */}
      <div className="space-y-2">
        <div className="h-3 w-28 rounded" style={{ background: "#d0d5e8" }} />
        <div className="kpi-row">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl px-5 py-4 flex flex-col gap-2"
              style={{ background: "var(--card-bg)", flex: "1 1 140px", borderLeft: "3px solid #d0d5e8" }}
            >
              <div className="h-3 w-24 rounded" style={{ background: "#d0d5e8" }} />
              <div className="h-7 w-20 rounded" style={{ background: "#d0d5e8" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Charts skeleton */}
      <div className="grid gap-5 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-[18px] p-6"
            style={{ background: "var(--card-bg)" }}
          >
            <div className="h-4 w-48 rounded mb-4" style={{ background: "#d0d5e8" }} />
            <div className="h-60 rounded-lg" style={{ background: "#d0d5e8" }} />
          </div>
        ))}
      </div>

      {/* By-technician + by-type skeleton */}
      <div className="grid gap-5 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-[18px] p-6"
            style={{ background: "var(--card-bg)" }}
          >
            <div className="h-4 w-40 rounded mb-4" style={{ background: "#d0d5e8" }} />
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-10 rounded mb-2" style={{ background: "#d0d5e8" }} />
            ))}
          </div>
        ))}
      </div>

      {/* Recent paid OS skeleton */}
      <div className="rounded-[18px] p-6" style={{ background: "var(--card-bg)" }}>
        <div className="h-4 w-36 rounded mb-4" style={{ background: "#d0d5e8" }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 rounded mb-2" style={{ background: "#d0d5e8" }} />
        ))}
      </div>
    </div>
  );
}
