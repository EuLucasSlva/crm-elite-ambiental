"use client";

import { useActionState } from "react";
import { transitionServiceOrder } from "./actions";
import type { TransitionState } from "./actions";
import { STATUS_LABELS } from "@/lib/labels";
import type { ServiceOrderStatus } from "@prisma/client";

const INITIAL: TransitionState = {};

// Visual style for each target status button
function getButtonStyle(to: ServiceOrderStatus): string {
  const base =
    "inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

  if (to === "CANCELED") {
    return `${base} border border-red-300 text-red-700 hover:bg-red-50`;
  }
  if (to === "QUOTE_REJECTED") {
    return `${base} border border-yellow-300 text-yellow-700 hover:bg-yellow-50`;
  }
  return `${base} bg-green-600 text-white hover:bg-green-700`;
}

interface Props {
  orderId: string;
  nextStatuses: ServiceOrderStatus[];
}

export function TransitionButtons({ orderId, nextStatuses }: Props) {
  const [state, formAction, isPending] = useActionState(
    transitionServiceOrder,
    INITIAL
  );

  if (nextStatuses.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Ações Disponíveis
      </h3>

      {state.error && (
        <div className="mb-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="mb-3 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700">
          Status atualizado com sucesso.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((to) => (
          <form key={to} action={formAction}>
            <input type="hidden" name="id" value={orderId} />
            <input type="hidden" name="toStatus" value={to} />
            <button
              type="submit"
              disabled={isPending}
              className={getButtonStyle(to)}
            >
              {isPending ? "Aguarde..." : STATUS_LABELS[to]}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
