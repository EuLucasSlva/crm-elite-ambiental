"use client";

import { useActionState } from "react";
import { createExpense, type CreateExpenseState } from "../actions";
import { EXPENSE_CATEGORY_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/labels-extras";

interface Props {
  orders: { id: string; customer: { fullName: string } }[];
}

const initialState: CreateExpenseState = {};

export function NewExpenseForm({ orders }: Props) {
  const [state, formAction, pending] = useActionState(createExpense, initialState);

  const today = new Date().toISOString().split("T")[0];

  return (
    <form action={formAction} className="space-y-4">
      {state?.globalError && (
        <div className="rounded-md p-3 text-sm" style={{ background: "#fee2e2", color: "#991b1b" }}>
          {state.globalError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs font-bold mb-1" style={{ color: "var(--text)" }}>
            Categoria *
          </label>
          <select
            name="category"
            required
            className="w-full rounded-md border px-3 py-2 text-sm min-h-[44px]"
            style={{ borderColor: "#d0d5e8" }}
            defaultValue="FUEL"
          >
            {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {state?.errors?.category && (
            <p className="mt-1 text-xs text-red-600">{state.errors.category[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold mb-1" style={{ color: "var(--text)" }}>
            Forma de pagamento *
          </label>
          <select
            name="paymentMethod"
            required
            className="w-full rounded-md border px-3 py-2 text-sm min-h-[44px]"
            style={{ borderColor: "#d0d5e8" }}
            defaultValue="PIX"
          >
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold mb-1" style={{ color: "var(--text)" }}>
            Descrição *
          </label>
          <input
            type="text"
            name="description"
            required
            placeholder="Ex: Combustível semanal frota"
            className="w-full rounded-md border px-3 py-2 text-sm min-h-[44px]"
            style={{ borderColor: "#d0d5e8" }}
          />
          {state?.errors?.description && (
            <p className="mt-1 text-xs text-red-600">{state.errors.description[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold mb-1" style={{ color: "var(--text)" }}>
            Valor (R$) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            name="amount"
            required
            placeholder="0,00"
            className="w-full rounded-md border px-3 py-2 text-sm min-h-[44px]"
            style={{ borderColor: "#d0d5e8" }}
          />
          {state?.errors?.amount && (
            <p className="mt-1 text-xs text-red-600">{state.errors.amount[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold mb-1" style={{ color: "var(--text)" }}>
            Data do pagamento *
          </label>
          <input
            type="date"
            name="paidAt"
            required
            defaultValue={today}
            className="w-full rounded-md border px-3 py-2 text-sm min-h-[44px]"
            style={{ borderColor: "#d0d5e8" }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1" style={{ color: "var(--text)" }}>
            Fornecedor
          </label>
          <input
            type="text"
            name="supplier"
            placeholder="Opcional"
            className="w-full rounded-md border px-3 py-2 text-sm min-h-[44px]"
            style={{ borderColor: "#d0d5e8" }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1" style={{ color: "var(--text)" }}>
            Vincular a uma OS (opcional)
          </label>
          <select
            name="serviceOrderId"
            className="w-full rounded-md border px-3 py-2 text-sm min-h-[44px]"
            style={{ borderColor: "#d0d5e8" }}
          >
            <option value="">— Nenhuma —</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.customer.fullName} ({o.id.slice(0, 6)})
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold mb-1" style={{ color: "var(--text)" }}>
            Observações
          </label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Opcional"
            className="w-full rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "#d0d5e8" }}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full px-6 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50 min-h-[44px]"
          style={{ background: "#dc2626" }}
        >
          {pending ? "Salvando..." : "Salvar Despesa"}
        </button>
      </div>
    </form>
  );
}
