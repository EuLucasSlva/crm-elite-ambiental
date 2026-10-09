import { formatCurrency } from "@/lib/format";

interface TrendProps {
  value: number;
  label: string;
  isGood?: boolean;
  isCurrency?: boolean; // format value as R$ instead of raw number
}

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: TrendProps;
  tone?: "default" | "success" | "warning" | "danger";
}

function TrendIndicator({ trend }: { trend: TrendProps }) {
  const { value, label, isGood, isCurrency } = trend;

  if (value === 0) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#9ca3af" }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        = igual ao mês passado
      </span>
    );
  }

  const isPositiveChange = value > 0;
  const isVisuallyGood = isPositiveChange ? isGood !== false : isGood === false;
  const color = isVisuallyGood ? "#128452" : "#ef4444";
  const sign = isPositiveChange ? "+" : "";
  const displayValue = isCurrency
    ? `${sign}${formatCurrency(Math.abs(value))}`.replace("R$\u00a0", "R$ ")
    : `${sign}${value}`;

  const ArrowUp = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 10V2M6 2L2.5 5.5M6 2L9.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const ArrowDown = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 2V10M6 10L2.5 6.5M6 10L9.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <span className="flex items-center gap-1 text-xs font-medium" style={{ color }}>
      {isPositiveChange ? <ArrowUp /> : <ArrowDown />}
      {displayValue} {label}
    </span>
  );
}

export function KpiCard({ label, value, subtext, trend, tone = "default" }: KpiCardProps) {
  const palette = {
    default: { accent: "var(--accent)", surface: "#ffffff" },
    success: { accent: "var(--color-success)", surface: "#f7fbf8" },
    warning: { accent: "var(--color-warning)", surface: "#fffdf8" },
    danger: { accent: "var(--color-error)", surface: "#fffafa" },
  }[tone];
  return (
    <div
      className="kpi-card flex flex-col gap-1 min-w-0"
      style={{
        background: palette.surface,
        border: "1px solid var(--card-border)",
        borderTop: `3px solid ${palette.accent}`,
        borderRadius: "var(--radius-md)",
        padding: "0.8rem 0.9rem 0.85rem",
        boxShadow: "var(--shadow-xs)",
        flex: "1 1 120px",
        transition: "box-shadow var(--ease-normal), transform var(--ease-normal)",
      }}
    >
      {/* Label */}
      <span
        className="truncate font-semibold uppercase"
        style={{
          fontSize: "0.6875rem",    /* 11px — label de card pequeno e discreto */
          letterSpacing: "0.06em",
          color: "var(--text-muted)",
        }}
      >
        {label}
      </span>

      {/* Value */}
      <span
        className="font-extrabold leading-none"
        style={{
          fontSize: "1.45rem",
          color: "var(--text)",
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </span>

      {trend && <TrendIndicator trend={trend} />}

      {subtext && (
        <span
          className="font-medium"
          style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}
        >
          {subtext}
        </span>
      )}
    </div>
  );
}
