export function SectionCard({
  title,
  description,
  children,
  actions,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`section-card ${className ?? ""}`}>
      {/* Card header */}
      <div
        className="flex items-center justify-between gap-3"
        style={{
          padding: "0.8rem 1rem",
          borderBottom: "1px solid var(--card-border)",
        }}
      >
        <div className="min-w-0">
          <h2 className="section-title">{title}</h2>
          {description && <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Card body */}
      <div style={{ padding: "0.85rem 1rem" }}>
        {children}
      </div>
    </section>
  );
}
