"use client";

import { useActionState, useState } from "react";
import { updatePaymentStatus, type PaymentState } from "./actions";
import type { PaymentStatus } from "@prisma/client";

interface PaymentButtonProps {
  orderId: string;
  currentStatus: PaymentStatus;
  currentPrice: number | null;
  isFree: boolean;
}

const initialState: PaymentState = {};

export function PaymentButton({ orderId, currentStatus, currentPrice, isFree }: PaymentButtonProps) {
  const [state, formAction, pending] = useActionState(updatePaymentStatus, initialState);
  const [showForm, setShowForm] = useState(false);
  const [price, setPrice] = useState(currentPrice?.toString() ?? "");

  if (isFree) return null;
  if (currentStatus === "PAID") return null;

  return (
    <div className="mt-4 border-t pt-4" style={{ borderColor: "#e8ebf2" }}>
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
          style={{ background: "#15803d" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Marcar como pago
        </button>
      ) : (
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={orderId} />
          <input type="hidden" name="paymentStatus" value="PAID" />

          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Valor cobrado (R$)
              </label>
              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0,00"
                className="rounded-lg border px-3 py-1.5 text-sm w-36"
                style={{ borderColor: "#d0d5e8", background: "var(--white)", color: "var(--text)" }}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "#15803d" }}
              >
                {pending ? "Salvando..." : "Confirmar pagamento"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg px-4 py-1.5 text-sm font-semibold"
                style={{ background: "var(--card-bg)", color: "var(--text-muted)", border: "1px solid #d0d5e8" }}
              >
                Cancelar
              </button>
            </div>
          </div>

          {state.error && (
            <p className="text-xs text-red-600">{state.error}</p>
          )}
          {state.success && (
            <p className="text-xs text-green-700">Pagamento registrado com sucesso.</p>
          )}
        </form>
      )}
    </div>
  );
}
