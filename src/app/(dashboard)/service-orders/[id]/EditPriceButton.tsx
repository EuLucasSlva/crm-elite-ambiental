"use client";

import { useState, useTransition } from "react";
import { updatePrice } from "./actions";

interface EditPriceButtonProps {
  orderId: string;
  currentPrice: number | null;
}

export function EditPriceButton({ orderId, currentPrice }: EditPriceButtonProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentPrice?.toString() ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs font-medium text-green-700 hover:underline ml-2"
      >
        Editar
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 ml-2">
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-28 rounded-lg border border-gray-300 px-2 py-0.5 text-sm focus:border-green-500 focus:outline-none"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Escape") setEditing(false);
        }}
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await updatePrice(orderId, parseFloat(value) || null);
            if (res.error) { setError(res.error); return; }
            setEditing(false);
          });
        }}
        className="rounded-lg bg-green-600 px-2 py-0.5 text-xs font-semibold text-white disabled:opacity-60"
      >
        {pending ? "..." : "Salvar"}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
      >
        Cancelar
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
