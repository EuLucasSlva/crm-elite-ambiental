"use client";

import { useRouter } from "next/navigation";
import type { WarrantyStatus } from "@prisma/client";

const OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "ACTIVE", label: "Ativas" },
  { value: "EXPIRED", label: "Vencidas" },
  { value: "VOIDED", label: "Canceladas" },
];

interface Props {
  currentStatus?: WarrantyStatus;
}

export function WarrantiesFilter({ currentStatus }: Props) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value) {
      router.push(`/warranties?status=${value}`);
    } else {
      router.push("/warranties");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor="statusFilter"
        className="text-sm font-medium text-gray-700 whitespace-nowrap"
      >
        Filtrar por status:
      </label>
      <select
        id="statusFilter"
        value={currentStatus ?? ""}
        onChange={handleChange}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
