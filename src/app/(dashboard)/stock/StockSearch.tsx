"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

interface Props {
  initialQuery: string;
}

export function StockSearch({ initialQuery }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    startTransition(() => {
      router.replace(`/stock?${params.toString()}`);
    });
  }

  return (
    <div className="relative">
      <input
        type="search"
        defaultValue={initialQuery}
        onChange={handleChange}
        placeholder="Buscar por nome do produto..."
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-10 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
      />
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
        />
      </svg>
      {isPending && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
          Buscando...
        </span>
      )}
    </div>
  );
}
