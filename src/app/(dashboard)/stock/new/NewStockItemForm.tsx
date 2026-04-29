"use client";

import { useActionState } from "react";
import { createStockItem } from "./actions";
import type { CreateStockItemState } from "./actions";

const INITIAL: CreateStockItemState = {};

const UNIT_OPTIONS = [
  { value: "ML", label: "mL — mililitros" },
  { value: "G", label: "g — gramas" },
  { value: "L", label: "L — litros" },
  { value: "KG", label: "kg — quilogramas" },
  { value: "UNIT", label: "unidade" },
  { value: "M2", label: "m² — metro quadrado" },
];

export function NewStockItemForm() {
  const [state, formAction, isPending] = useActionState(createStockItem, INITIAL);

  return (
    <form action={formAction} className="space-y-5">
      {state.globalError && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {state.globalError}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Nome */}
        <div className="sm:col-span-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nome do Produto <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Ex: Cipermetrina 200 CE"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
          />
          {state.errors?.name && (
            <p className="mt-1 text-xs text-red-600">
              {state.errors.name[0]}
            </p>
          )}
        </div>

        {/* Princípio ativo */}
        <div className="sm:col-span-2">
          <label
            htmlFor="activeIngredient"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Princípio Ativo
          </label>
          <input
            id="activeIngredient"
            name="activeIngredient"
            type="text"
            placeholder="Ex: Cipermetrina 20%"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
          />
        </div>

        {/* Unidade */}
        <div>
          <label
            htmlFor="unit"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Unidade de Medida <span className="text-red-500">*</span>
          </label>
          <select
            id="unit"
            name="unit"
            required
            defaultValue="ML"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition bg-white"
          >
            {UNIT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {state.errors?.unit && (
            <p className="mt-1 text-xs text-red-600">
              {state.errors.unit[0]}
            </p>
          )}
        </div>

        {/* Quantidade */}
        <div>
          <label
            htmlFor="quantity"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Quantidade em Estoque <span className="text-red-500">*</span>
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min="0"
            step="0.001"
            defaultValue="0"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
          />
          {state.errors?.quantity && (
            <p className="mt-1 text-xs text-red-600">
              {state.errors.quantity[0]}
            </p>
          )}
        </div>

        {/* Estoque mínimo */}
        <div>
          <label
            htmlFor="minThreshold"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Estoque Mínimo <span className="text-red-500">*</span>
          </label>
          <input
            id="minThreshold"
            name="minThreshold"
            type="number"
            min="0"
            step="0.001"
            defaultValue="0"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
          />
          {state.errors?.minThreshold && (
            <p className="mt-1 text-xs text-red-600">
              {state.errors.minThreshold[0]}
            </p>
          )}
        </div>

        {/* Custo unitário */}
        <div>
          <label
            htmlFor="unitCost"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Custo Unitário (R$)
          </label>
          <input
            id="unitCost"
            name="unitCost"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
          />
          <p className="mt-1 text-xs text-gray-400">Custo de compra por unidade — usado para calcular lucro nas OS.</p>
        </div>

        {/* Validade */}
        <div>
          <label
            htmlFor="expiryDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Data de Validade
          </label>
          <input
            id="expiryDate"
            name="expiryDate"
            type="date"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
          />
        </div>

        {/* Fornecedor */}
        <div className="sm:col-span-2">
          <label
            htmlFor="supplier"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Fornecedor
          </label>
          <input
            id="supplier"
            name="supplier"
            type="text"
            placeholder="Nome do fornecedor"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
          />
        </div>

        {/* Observações */}
        <div className="sm:col-span-2">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Observações
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Informações adicionais sobre o produto..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Salvando..." : "Salvar Item"}
        </button>
        <a
          href="/stock"
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
