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

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("pt-BR");
}

export function PaymentButton({ orderId, currentStatus, currentPrice, isFree }: PaymentButtonProps) {
  const [state, formAction, pending] = useActionState(updatePaymentStatus, initialState);
  const [showForm, setShowForm] = useState(false);
  const [price, setPrice] = useState(currentPrice?.toString() ?? "");
  const [mode, setMode] = useState<"avista" | "parcelado">("avista");
  const [installments, setInstallments] = useState("2");
  const [intervalDays, setIntervalDays] = useState("30");
  const [firstDueDate, setFirstDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });

  if (isFree) return null;
  if (currentStatus === "PAID") return null;

  const priceNum = parseFloat(price.replace(",", ".")) || 0;
  const installmentCount = Math.max(1, parseInt(installments) || 2);
  const installmentAmount = installmentCount > 0 ? priceNum / installmentCount : 0;

  const intervalDaysNum = parseInt(intervalDays) || 30;

  const preview = mode === "parcelado" && priceNum > 0 && firstDueDate
    ? Array.from({ length: installmentCount }, (_, i) => ({
        n: i + 1,
        date: addDays(new Date(firstDueDate + "T12:00:00"), i * intervalDaysNum),
        amount: installmentAmount,
      }))
    : [];

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
          {mode === "parcelado" && (
            <>
              <input type="hidden" name="installments" value={installmentCount} />
              <input type="hidden" name="firstDueDate" value={firstDueDate} />
              <input type="hidden" name="intervalDays" value={intervalDaysNum} />
            </>
          )}

          {/* Valor */}
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

          {/* Modo de pagamento */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("avista")}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                background: mode === "avista" ? "#15803d" : "var(--card-bg)",
                color: mode === "avista" ? "#fff" : "var(--text-muted)",
                border: "1px solid #d0d5e8",
              }}
            >
              À vista
            </button>
            <button
              type="button"
              onClick={() => setMode("parcelado")}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                background: mode === "parcelado" ? "#15803d" : "var(--card-bg)",
                color: mode === "parcelado" ? "#fff" : "var(--text-muted)",
                border: "1px solid #d0d5e8",
              }}
            >
              Parcelado
            </button>
          </div>

          {/* Parcelamento config */}
          {mode === "parcelado" && (
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                  Nº de parcelas
                </label>
                <input
                  type="number"
                  min="2"
                  max="60"
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                  className="rounded-lg border px-3 py-1.5 text-sm w-24"
                  style={{ borderColor: "#d0d5e8", background: "var(--white)", color: "var(--text)" }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                  Intervalo entre parcelas
                </label>
                <select
                  value={intervalDays}
                  onChange={(e) => setIntervalDays(e.target.value)}
                  className="rounded-lg border px-3 py-1.5 text-sm"
                  style={{ borderColor: "#d0d5e8", background: "var(--white)", color: "var(--text)" }}
                >
                  <option value="15">15 dias</option>
                  <option value="20">20 dias</option>
                  <option value="30">30 dias</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                  1º vencimento
                </label>
                <input
                  type="date"
                  value={firstDueDate}
                  onChange={(e) => setFirstDueDate(e.target.value)}
                  className="rounded-lg border px-3 py-1.5 text-sm"
                  style={{ borderColor: "#d0d5e8", background: "var(--white)", color: "var(--text)" }}
                />
              </div>
            </div>
          )}

          {/* Preview parcelas */}
          {preview.length > 0 && (
            <div className="rounded-lg bg-gray-50 p-3 text-xs" style={{ borderColor: "#e8ebf2", border: "1px solid #e8ebf2" }}>
              <p className="font-semibold mb-2" style={{ color: "var(--text)" }}>
                Prévia: {installmentCount}x de R${installmentAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                {preview.map((p) => (
                  <div key={p.n} className="flex justify-between">
                    <span style={{ color: "var(--text-muted)" }}>{p.n}ª parcela</span>
                    <span className="font-medium" style={{ color: "var(--text)" }}>{fmtDate(p.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {state.error && <p className="text-xs text-red-600">{state.error}</p>}
          {state.success && <p className="text-xs text-green-700">Pagamento registrado com sucesso.</p>}
        </form>
      )}
    </div>
  );
}
