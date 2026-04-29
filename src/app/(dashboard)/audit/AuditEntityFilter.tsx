"use client";

import { useRouter } from "next/navigation";

interface Option {
  value: string;
  label: string;
}

interface Props {
  currentEntity?: string;
  options: Option[];
}

export function AuditEntityFilter({ currentEntity, options }: Props) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value) {
      router.push(`/audit?entity=${value}`);
    } else {
      router.push("/audit");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor="entityFilter"
        className="text-sm font-medium text-gray-700 whitespace-nowrap"
      >
        Filtrar por entidade:
      </label>
      <select
        id="entityFilter"
        value={currentEntity ?? ""}
        onChange={handleChange}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
