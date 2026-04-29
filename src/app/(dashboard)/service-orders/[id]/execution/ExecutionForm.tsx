"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";
import { finalizeExecution } from "./actions";
import { searchStockItems } from "./actions";
import type { FinalizeExecutionState } from "./actions";
import type { StockSearchResult } from "./actions";
import type { StockUnit } from "@prisma/client";

const UNIT_LABELS: Record<StockUnit, string> = {
  ML: "mL",
  G: "g",
  L: "L",
  KG: "kg",
  UNIT: "unidade",
  M2: "m²",
};

const UNIT_OPTIONS: StockUnit[] = ["ML", "G", "L", "KG", "UNIT", "M2"];

interface ApplicationPoint {
  location: string;
  productName: string;
  doseApplied: number;
  unit: StockUnit;
  stockItemId: string | null;
}

interface Props {
  serviceOrderId: string;
  technicianId: string;
  scheduledAt: string;
}

const INITIAL: FinalizeExecutionState = {};

export function ExecutionForm({
  serviceOrderId,
  technicianId,
  scheduledAt,
}: Props) {
  const router = useRouter();
  const sigCanvasRef = useRef<SignatureCanvas | null>(null);

  const [state, formAction, isPending] = useActionState(finalizeExecution, INITIAL);

  // Check-in state
  const [checkInAt, setCheckInAt] = useState<string | null>(null);

  // Application points state
  const [points, setPoints] = useState<ApplicationPoint[]>([]);

  // Current point form
  const [pointForm, setPointForm] = useState<{
    location: string;
    productName: string;
    doseApplied: string;
    unit: StockUnit;
    stockItemId: string | null;
  }>({
    location: "",
    productName: "",
    doseApplied: "",
    unit: "ML",
    stockItemId: null,
  });

  // Autocomplete
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [isSearching, startSearch] = useTransition();
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup pending timers on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  // Notes
  const [notes, setNotes] = useState("");

  // Signature
  const [signatureData, setSignatureData] = useState<string>("");

  // Handle check-in
  function handleCheckIn() {
    const now = new Date().toISOString();
    setCheckInAt(now);
  }

  // Handle product search
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearchQuery(value);
    setPointForm((prev) => ({
      ...prev,
      productName: value,
      stockItemId: null,
    }));
    setShowDropdown(true);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim().length >= 2) {
        startSearch(async () => {
          const results = await searchStockItems(value);
          setSearchResults(results);
        });
      } else {
        setSearchResults([]);
      }
    }, 300);
  }

  function handleSelectProduct(item: StockSearchResult) {
    setSearchQuery(item.name);
    setPointForm((prev) => ({
      ...prev,
      productName: item.name,
      unit: item.unit,
      stockItemId: item.id,
    }));
    setSearchResults([]);
    setShowDropdown(false);
  }

  // Add point
  function handleAddPoint() {
    const dose = parseFloat(pointForm.doseApplied);
    if (!pointForm.location.trim()) return;
    if (!pointForm.productName.trim()) return;
    if (isNaN(dose) || dose <= 0) return;

    setPoints((prev) => [
      ...prev,
      {
        location: pointForm.location.trim(),
        productName: pointForm.productName.trim(),
        doseApplied: dose,
        unit: pointForm.unit,
        stockItemId: pointForm.stockItemId,
      },
    ]);
    setPointForm({
      location: "",
      productName: "",
      doseApplied: "",
      unit: "ML",
      stockItemId: null,
    });
    setSearchQuery("");
    setSearchResults([]);
  }

  function handleRemovePoint(index: number) {
    setPoints((prev) => prev.filter((_, i) => i !== index));
  }

  // Signature
  function handleClearSignature() {
    sigCanvasRef.current?.clear();
    setSignatureData("");
  }

  function handleSaveSignature() {
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      const data = sigCanvasRef.current.toDataURL("image/png");
      setSignatureData(data);
    }
  }

  // Redirect on success — useEffect avoids side-effect in render path
  useEffect(() => {
    if (state.success) {
      router.push(`/service-orders/${serviceOrderId}`);
    }
  }, [state.success, router, serviceOrderId]);

  if (state.success) {
    return (
      <div className="rounded-xl border border-green-300 bg-green-50 p-6 text-center">
        <p className="text-green-700 font-semibold">
          Execucao registrada com sucesso! Redirecionando...
        </p>
      </div>
    );
  }

  const canFinalize = checkInAt !== null;

  return (
    <div className="space-y-6">
      {state.error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* ── Check-in ── */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          1. Chegada ao Local
        </h2>
        {checkInAt ? (
          <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 p-4">
            <svg
              className="h-6 w-6 text-green-600 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-semibold text-green-800">Check-in realizado</p>
              <p className="text-sm text-green-600">
                {new Date(checkInAt).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleCheckIn}
            className="w-full rounded-xl bg-green-600 py-5 text-lg font-bold text-white shadow-md hover:bg-green-700 active:bg-green-800 transition-colors"
          >
            Registrar Chegada
          </button>
        )}
      </section>

      {/* ── Application Points ── */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          2. Pontos de Aplicacao
        </h2>

        {/* Existing points */}
        {points.length > 0 && (
          <div className="mb-4 space-y-2">
            {points.map((point, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {point.location}
                  </p>
                  <p className="text-xs text-gray-500">
                    {point.productName} — {point.doseApplied.toLocaleString("pt-BR")}{" "}
                    {UNIT_LABELS[point.unit]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePoint(i)}
                  className="flex-shrink-0 rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                  aria-label="Remover ponto"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add point form */}
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Adicionar Ponto
          </p>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Local de Aplicacao
            </label>
            <input
              type="text"
              value={pointForm.location}
              onChange={(e) =>
                setPointForm((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="Ex: Cozinha, Banheiro, Galpao..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
            />
          </div>

          {/* Product autocomplete */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Produto
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => {
                blurTimeoutRef.current = setTimeout(() => setShowDropdown(false), 200);
              }}
              placeholder="Buscar produto no estoque..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
            />
            {pointForm.stockItemId && (
              <span className="absolute right-3 top-9 text-xs text-green-600 font-medium">
                Vinculado
              </span>
            )}
            {showDropdown && (searchResults.length > 0 || isSearching) && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                {isSearching && (
                  <p className="px-4 py-2 text-xs text-gray-400">
                    Buscando...
                  </p>
                )}
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={() => {
                      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                      handleSelectProduct(item);
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.quantity.toLocaleString("pt-BR")} {UNIT_LABELS[item.unit]} disponivel
                      {item.activeIngredient ? ` — ${item.activeIngredient}` : ""}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dose + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dose Aplicada
              </label>
              <input
                type="number"
                min="0.001"
                step="0.001"
                value={pointForm.doseApplied}
                onChange={(e) =>
                  setPointForm((prev) => ({
                    ...prev,
                    doseApplied: e.target.value,
                  }))
                }
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidade
              </label>
              <select
                value={pointForm.unit}
                onChange={(e) =>
                  setPointForm((prev) => ({
                    ...prev,
                    unit: e.target.value as StockUnit,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {UNIT_LABELS[u]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddPoint}
            disabled={
              !pointForm.location.trim() ||
              !pointForm.productName.trim() ||
              !pointForm.doseApplied ||
              parseFloat(pointForm.doseApplied) <= 0
            }
            className="w-full rounded-lg bg-gray-800 py-2.5 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            + Adicionar Ponto
          </button>
        </div>
      </section>

      {/* ── Customer Signature ── */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          3. Assinatura do Cliente
        </h2>

        <div className="rounded-lg border-2 border-dashed border-gray-300 overflow-hidden">
          <SignatureCanvas
            ref={sigCanvasRef}
            penColor="#1f2937"
            canvasProps={{
              className: "w-full",
              style: { height: "180px", touchAction: "none" },
            }}
            onEnd={handleSaveSignature}
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClearSignature}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Limpar
          </button>
          {signatureData ? (
            <span className="text-sm font-medium text-green-600">
              Assinatura capturada
            </span>
          ) : (
            <span className="text-sm text-gray-400">
              Peça ao cliente para assinar acima
            </span>
          )}
        </div>
      </section>

      {/* ── Notes ── */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-3">
          4. Observacoes (opcional)
        </h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Observacoes sobre a execucao do servico..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition resize-none"
        />
      </section>

      {/* ── Submit ── */}
      <form action={formAction}>
        <input type="hidden" name="serviceOrderId" value={serviceOrderId} />
        <input type="hidden" name="technicianId" value={technicianId} />
        <input type="hidden" name="scheduledAt" value={scheduledAt} />
        <input type="hidden" name="checkInAt" value={checkInAt ?? ""} />
        <input type="hidden" name="notes" value={notes} />
        <input type="hidden" name="customerSignature" value={signatureData} />
        <input
          type="hidden"
          name="applicationPoints"
          value={JSON.stringify(points)}
        />

        <button
          type="submit"
          disabled={!canFinalize || isPending}
          className="w-full rounded-xl bg-green-600 py-5 text-lg font-bold text-white shadow-md hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending
            ? "Salvando..."
            : !canFinalize
              ? "Registre a chegada primeiro"
              : `Finalizar Execucao${points.length > 0 ? ` (${points.length} ponto${points.length !== 1 ? "s" : ""})` : ""}`}
        </button>

        {!canFinalize && (
          <p className="mt-2 text-center text-xs text-gray-400">
            O check-in e obrigatorio para finalizar a execucao.
          </p>
        )}
      </form>
    </div>
  );
}
