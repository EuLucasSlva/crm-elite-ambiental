"use client";

import { useActionState, useState } from "react";
import { adjustStock } from "./actions";
import type { StockAdjustmentState } from "./actions";

const INITIAL: StockAdjustmentState = {};

interface Props {
  stockItemId: string;
  currentQuantity: number;
  unit: string;
}

export function StockAdjustmentForm({ stockItemId, currentQuantity, unit }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(adjustStock, INITIAL);

  if (state.success && open) {
    setOpen(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
      >
        <span className="text-base leading-none">±</span>
        Ajuste de Estoque
      </button>

      {open && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Registrar Ajuste de Estoque
          </h3>

          {state.globalError && (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {state.globalError}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <input type="hidden" name="stockItemId" value={stockItemId} />

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Delta */}
              <div>
                <label
                  htmlFor="delta"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Quantidade ({unit}){" "}
                  <span className="text-gray-400 font-normal">
                    — use negativo para retirada
                  </span>
                </label>
                <input
                  id="delta"
                  name="delta"
                  type="number"
                  step="0.001"
                  placeholder="Ex: 500 ou -200"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
                />
                {state.errors?.delta && (
                  <p className="mt-1 text-xs text-red-600">
                    {state.errors.delta[0]}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Estoque atual: {currentQuantity.toLocaleString("pt-BR")} {unit}
                </p>
              </div>

              {/* Reason */}
              <div>
                <label
                  htmlFor="reason"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Motivo <span className="text-red-500">*</span>
                </label>
                <input
                  id="reason"
                  name="reason"
                  type="text"
                  required
                  placeholder="Ex: Compra, Descarte, Inventário..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
                />
                {state.errors?.reason && (
                  <p className="mt-1 text-xs text-red-600">
                    {state.errors.reason[0]}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? "Salvando..." : "Confirmar Ajuste"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
