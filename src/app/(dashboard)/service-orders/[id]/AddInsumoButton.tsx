"use client";

import { useState, useTransition, useRef } from "react";
import { addInsumo } from "./actions";
import type { StockUnit } from "@prisma/client";

interface StockOption {
  id: string;
  name: string;
  quantity: number;
  unit: StockUnit;
  unitCost: number;
}

interface Props {
  orderId: string;
}

const UNIT_LABELS: Record<StockUnit, string> = {
  ML: "mL", G: "g", L: "L", KG: "kg", UNIT: "unidade", M2: "m²",
};

export function AddInsumoButton({ orderId }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<StockOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<StockOption | null>(null);
  const [location, setLocation] = useState("");
  const [dose, setDose] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showDrop, setShowDrop] = useState(false);

  function handleSearch(val: string) {
    setSearch(val);
    setSelected(null);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (val.trim().length < 2) { setResults([]); setShowDrop(false); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/stock-search?q=${encodeURIComponent(val.trim())}`);
        if (res.ok) { setResults(await res.json()); setShowDrop(true); }
      } finally { setSearching(false); }
    }, 300);
  }

  function handleSelect(item: StockOption) {
    setSelected(item);
    setSearch(item.name);
    setResults([]);
    setShowDrop(false);
  }

  function reset() {
    setSearch(""); setResults([]); setSelected(null);
    setLocation(""); setDose(""); setError(null); setOpen(false);
  }

  function handleSubmit() {
    if (!selected || !dose || !location) return;
    setError(null);
    startTransition(async () => {
      const res = await addInsumo(orderId, {
        stockItemId: selected.id,
        productName: selected.name,
        location,
        doseApplied: parseFloat(dose),
        unit: selected.unit,
      });
      if (res.error) { setError(res.error); return; }
      reset();
    });
  }

  const doseNum = parseFloat(dose) || 0;
  const estimatedCost = selected ? doseNum * selected.unitCost : 0;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors"
        style={{ background: "#15803d" }}
      >
        + Adicionar Insumo
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-green-800">Novo Insumo</p>

      {/* Local */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Local de aplicação</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Ex: Cozinha, Banheiro..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
        />
      </div>

      {/* Produto autocomplete */}
      <div className="relative">
        <label className="block text-xs font-medium text-gray-700 mb-1">Produto do estoque</label>
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setShowDrop(true)}
          onBlur={() => { blurTimer.current = setTimeout(() => setShowDrop(false), 200); }}
          placeholder="Buscar produto..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
        />
        {selected && (
          <span className="absolute right-3 top-7 text-xs text-green-600 font-medium">✓ Vinculado</span>
        )}
        {showDrop && results.length > 0 && (
          <ul className="absolute z-20 top-full left-0 right-0 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto">
            {searching && <li className="px-4 py-2 text-xs text-gray-400">Buscando...</li>}
            {results.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onMouseDown={() => { if (blurTimer.current) clearTimeout(blurTimer.current); handleSelect(item); }}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-50"
                >
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.quantity.toLocaleString("pt-BR")} {UNIT_LABELS[item.unit]} disponível
                    {item.unitCost > 0 ? ` · R$${item.unitCost.toFixed(3)}/${UNIT_LABELS[item.unit]}` : ""}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Dose */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Quantidade utilizada {selected ? `(${UNIT_LABELS[selected.unit]})` : ""}
          </label>
          <input
            type="number"
            min="0.001"
            step="0.001"
            value={dose}
            onChange={(e) => setDose(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </div>
        {estimatedCost > 0 && (
          <div className="text-xs text-gray-500 pb-2">
            Custo est.: <span className="font-semibold text-gray-800">R${estimatedCost.toFixed(2)}</span>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending || !selected || !location || !dose || doseNum <= 0}
          onClick={handleSubmit}
          className="rounded-lg px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "#15803d" }}
        >
          {pending ? "Salvando..." : "Confirmar"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
