export function SectionCard({
  title,
  children,
  actions,
  className,
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className ?? ""}
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
      }}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: "0.625rem 1rem",
          borderBottom: "1px solid var(--card-border)",
        }}
      >
        <h2 className="section-title">{title}</h2>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Card body */}
      <div style={{ padding: "0.75rem 1rem" }}>
        {children}
      </div>
    </div>
  );
}
