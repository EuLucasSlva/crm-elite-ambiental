"use client";

import { useActionState, useState, useRef } from "react";
import { createExpense, type CreateExpenseState } from "../actions";
import { EXPENSE_CATEGORY_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/labels-extras";

interface Props {
  orders: { id: string; customer: { fullName: string } }[];
}

const initialState: CreateExpenseState = {};

const BUILTIN_CATEGORIES = Object.entries(EXPENSE_CATEGORY_LABELS).filter(
  ([v]) => v !== "OTHER"
);

export function NewExpenseForm({ orders }: Props) {
  const [state, formAction, pending] = useActionState(createExpense, initialState);

  const today = new Date().toISOString().split("T")[0];

  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("FUEL");
  const customInputRef = useRef<HTMLInputElement>(null);

  function addCustomCategory() {
    const label = customInput.trim();
    if (!label || customCategories.includes(label)) return;
    setCustomCategories((prev) => [...prev, label]);
    setSelectedCategory(`custom:${label}`);
    setCustomInput("");
  }

  const isCustomSelected = selectedCategory.startsWith("custom:");
  const customLabel = isCustomSelected ? selectedCategory.slice(7) : null;

  return (
    <form action={formAction} className="space-y-4">
      {state?.globalError && (
        <div className="rounded-md p-3 text-sm" style={{ background: "#fee2e2", color: "#991b1b" }}>
          {state.globalError}
        </div>
      )}

      {/* Hidden inputs for category submission */}
      <input type="hidden" name="category" value={isCustomSelected ? "OTHER" : selectedCategory} />
      {isCustomSelected && customLabel && (
        <input type="hidden" name="customCategory" value={customLabel} />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs font-bold mb-1" style={{ color: "var(--text)" }}>
            Categoria *
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            required
            className="w-full rounded-md border px-3 py-2 text-sm min-h-[44px]"
            style={{ borderColor: "#d0d5e8" }}
          >
            {BUILTIN_CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
            <option value="OTHER">Outros</option>
            {customCategories.map((label) => (
              <option key={`custom:${label}`} value={`custom:${label}`}>
                {label}
              </option>
            ))}
          </select>
          {state?.errors?.category && (
            <p className="mt-1 text-xs text-red-600">{state.errors.category[0]}</p>
          )}

          {/* Add custom category inline */}
          <div className="flex gap-2 mt-2">
            <input
              ref={customInputRef}
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomCategory(); } }}
              placeholder="Nova categoria..."
              className="flex-1 rounded-md border px-2 py-1 text-xs min-h-[32px]"
              style={{ borderColor: "#d0d5e8" }}
              maxLength={60}
            />
            <button
              type="button"
              onClick={addCustomCategory}
              disabled={!customInput.trim()}
              className="rounded-md px-3 py-1 text-xs font-semibold text-white disabled:opacity-40 min-h-[32px]"
              style={{ background: "#dc2626" }}
            >
              + Adicionar
            </button>
          </div>
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
