"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useState } from "react";

interface Props {
  initialQuery: string;
}

export function CustomersSearch({ initialQuery }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initialQuery);

  // Simple debounce via setTimeout ref
  const timerRef = { current: null as ReturnType<typeof setTimeout> | null };

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      setValue(q);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const params = new URLSearchParams();
        if (q.trim()) params.set("q", q.trim());
        router.push(`${pathname}?${params.toString()}`);
      }, 400);
    },
    [router, pathname]
  );

  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder="Buscar por nome ou CPF/CNPJ..."
        className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
      />
    </div>
  );
}
