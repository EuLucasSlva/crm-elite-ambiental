"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "recentes", label: "Mais recentes" },
  { value: "antigos", label: "Mais antigos" },
  { value: "mais-os", label: "Mais OS" },
] as const;

type SortValue = (typeof OPTIONS)[number]["value"];

interface Props {
  current: string;
}

export function CustomersSortFilter({ current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const active = (OPTIONS.find((o) => o.value === current)?.value ?? "recentes") as SortValue;

  function handleClick(value: SortValue) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page"); // reset to page 1 when changing sort
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        Ordenar:
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
