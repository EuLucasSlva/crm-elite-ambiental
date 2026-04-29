"use client";

import { useRouter, usePathname } from "next/navigation";
import { STATUS_LABELS } from "@/lib/labels";
import type { ServiceOrderStatus } from "@prisma/client";

interface Props {
  currentStatus?: ServiceOrderStatus;
}

export function ServiceOrdersFilter({ currentStatus }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    const params = new URLSearchParams();
    if (value) params.set("status", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
        Filtrar por status:
      </label>
      <select
        id="status-filter"
        value={currentStatus ?? ""}
        onChange={handleChange}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
      >
        <option value="">Todos</option>
        {(Object.entries(STATUS_LABELS) as [ServiceOrderStatus, string][]).map(
          ([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          )
        )}
      </select>
    </div>
  );
}
