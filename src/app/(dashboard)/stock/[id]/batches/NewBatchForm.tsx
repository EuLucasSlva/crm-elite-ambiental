"use client";

import { useActionState, useState } from "react";
import { createBatch, type CreateBatchState } from "./actions";

interface Props {
  stockItemId: string;
  unit: string;
}

export function NewBatchForm({ stockItemId, unit }: Props) {
  const [state, formAction, pending] = useActionState<CreateBatchState, FormData>(
    createBatch,
    {}
  );
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 min-h-[36px]"
        style={{ background: "var(--navy)" }}
      >
        + Adicionar lote
      </button>
    );
  }

  return (
    <form
      action={(fd) => {
        formAction(fd);
        setOpen(false);
      }}
      className="rounded-lg border p-3 mb-2"
      style={{ background: "#f8fafc", borderColor: "#cbd5e1" }}
    >
      <input type="hidden" name="stockItemId" value={stockItemId} />
      <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-6">
        <div>
          <label className="block text-[10px] font-bold uppercase mb-0.5">Nº Lote</label>
          <input type="text" name="batchNumber" placeholder="Opcional" className="w-full rounded border px-2 py-1.5 text-xs" />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase mb-0.5">Quantidade ({unit}) *</label>
          <input type="number" step="0.001" min="0.001" name="quantity" required className="w-full rounded border px-2 py-1.5 text-xs" />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase mb-0.5">Validade</label>
          <input type="date" name="expiryDate" className="w-full rounded border px-2 py-1.5 text-xs" />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase mb-0.5">Custo unit. (R$)</label>
          <input type="number" step="0.01" min="0" name="unitCost" defaultValue="0" className="w-full rounded border px-2 py-1.5 text-xs" />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase mb-0.5">Fornecedor</label>
          <input type="text" name="supplier" className="w-full rounded border px-2 py-1.5 text-xs" />
        </div>
        <div className="flex gap-1 items-end">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md px-3 py-1.5 text-xs font-bold text-white min-h-[32px]"
            style={{ background: "#059669" }}
          >
            {pending ? "..." : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-1.5 text-xs font-bold min-h-[32px]"
            style={{ background: "#e2e8f0", color: "#475569" }}
          >
            Cancelar
          </button>
        </div>
      </div>
      {state?.globalError && <p className="text-xs text-red-600 mt-2">{state.globalError}</p>}
    </form>
  );
}
