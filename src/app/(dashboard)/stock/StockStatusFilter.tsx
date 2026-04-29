"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "baixo", label: "Estoque baixo" },
  { value: "atencao", label: "Vencendo em breve" },
  { value: "vencido", label: "Vencidos" },
] as const;

type StatusValue = (typeof OPTIONS)[number]["value"];

interface Props {
  current: string;
}

export function StockStatusFilter({ current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const active = (OPTIONS.find((o) => o.value === current)?.value ?? "todos") as StatusValue;

  function handleClick(value: StatusValue) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "todos") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    params.delete("q");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        Filtrar:
      </span>
      {OPTIONS.map((opt) => {
        const isActive = active === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => handleClick(opt.value)}
            className="rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-150"
            style={{
              background: isActive ? "var(--navy)" : "transparent",
              color: isActive ? "#fff" : "var(--navy)",
              border: "2px solid var(--navy)",
              cursor: "pointer",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
