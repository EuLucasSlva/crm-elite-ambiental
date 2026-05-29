"use client";

import { useActionState, useState, useCallback } from "react";
import Link from "next/link";
import { updateServiceOrder, type EditServiceOrderState } from "./actions";
import { ROLE_LABELS } from "@/lib/labels";
import type { ServiceType, Role } from "@prisma/client";

const inputCls =
  "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200";

const DEFAULT_SERVICE_TYPES = [
  { value: "INSPECTION", label: "Inspeção" },
  { value: "TREATMENT", label: "Tratamento" },
  { value: "RETURN", label: "Retorno" },
];

const DEFAULT_PEST_OPTIONS = [
  "Baratas", "Ratos", "Formigas", "Cupins", "Mosquitos",
  "Aranhas", "Escorpiões", "Pombos", "Pulgas", "Carrapatos", "Outros",
];

interface TechnicianOption {
  id: string;
  name: string;
  role: Role;
}

interface Props {
  orderId: string;
  current: {
    serviceType: ServiceType;
    scheduledAt: Date | null;
    technicianId: string | null;
    managerId: string | null;
    pestTypes: string[];
    notes: string | null;
    isFree: boolean;
    price: number | null;
  };
  technicians: TechnicianOption[];
}

const initialState: EditServiceOrderState = {};

export function EditServiceOrderForm({ orderId, current, technicians }: Props) {
  const boundAction = updateServiceOrder.bind(null, orderId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  const [isFree, setIsFree] = useState(current.isFree);

  // Pest chips
  const allPests = [...new Set([...DEFAULT_PEST_OPTIONS, ...current.pestTypes])];
  const [pestOptions, setPestOptions] = useState(allPests);
  const [selectedPests, setSelectedPests] = useState<string[]>(current.pestTypes);
  const [customPestInput, setCustomPestInput] = useState("");

  // Service types
  const existingCustom = DEFAULT_SERVICE_TYPES.find((t) => t.value === current.serviceType)
    ? null
    : { value: current.serviceType, label: current.serviceType };
  const [serviceTypes, setServiceTypes] = useState([
    ...DEFAULT_SERVICE_TYPES,
    ...(existingCustom ? [existingCustom] : []),
  ]);
  const [selectedServiceType, setSelectedServiceType] = useState(current.serviceType);
  const [customServiceInput, setCustomServiceInput] = useState("");

  const togglePest = useCallback((pest: string) => {
    setSelectedPests((prev) =>
      prev.includes(pest) ? prev.filter((p) => p !== pest) : [...prev, pest]
    );
  }, []);

  const addCustomPest = useCallback(() => {
    const name = customPestInput.trim();
    if (!name) return;
    if (!pestOptions.includes(name)) {
      setPestOptions((prev) => [...prev.slice(0, -1), name, prev[prev.length - 1]]);
    }
    setSelectedPests((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setCustomPestInput("");
  }, [customPestInput, pestOptions]);

  const addCustomServiceType = useCallback(() => {
    const label = customServiceInput.trim();
    if (!label) return;
    const value = label.toUpperCase().replace(/\s+/g, "_") as ServiceType;
    if (!serviceTypes.find((s) => s.value === value)) {
      setServiceTypes((prev) => [...prev, { value, label }]);
      setSelectedServiceType(value);
    }
    setCustomServiceInput("");
  }, [customServiceInput, serviceTypes]);

  // Format datetime-local value from Date
  const scheduledAtValue = current.scheduledAt
    ? new Date(current.scheduledAt.getTime() - current.scheduledAt.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : "";

  return (
    <form action={formAction} className="space-y-6">
      {state?.globalError && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {state.globalError}
        </div>
      )}

      {/* Tipo de Serviço */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Tipo de Serviço</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select
              name="serviceType"
              value={selectedServiceType}
              onChange={(e) => setSelectedServiceType(e.target.value as ServiceType)}
              className={inputCls}
            >
              {serviceTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <div className="flex gap-1.5 mt-1.5">
              <input
                type="text"
                value={customServiceInput}
                onChange={(e) => setCustomServiceInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomServiceType(); } }}
                placeholder="Novo tipo..."
                className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 focus:border-green-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={addCustomServiceType}
                className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600 hover:bg-gray-200"
              >
                + Adicionar
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Agendamento</label>
            <input
              name="scheduledAt"
              type="datetime-local"
              defaultValue={scheduledAtValue}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Serviço (R$)</label>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              defaultValue={current.price ?? ""}
              placeholder="0,00"
              className={inputCls}
            />
          </div>

          <div className="flex items-end pb-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={isFree}
                onClick={() => setIsFree((v) => !v)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  isFree ? "bg-green-600" : "bg-gray-200"
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${isFree ? "translate-x-5" : "translate-x-0"}`} />
              </button>
              <span className="text-sm font-medium text-gray-700">Serviço gratuito</span>
            </div>
            <input type="hidden" name="isFree" value={isFree ? "true" : "false"} />
          </div>
        </div>
      </section>

      {/* Pragas */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-3">Pragas</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {pestOptions.map((pest) => (
            <button
              key={pest}
              type="button"
              onClick={() => togglePest(pest)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                selectedPests.includes(pest)
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {pest}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 mt-1">
          <input
            type="text"
            value={customPestInput}
            onChange={(e) => setCustomPestInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomPest(); } }}
            placeholder="Outra praga..."
            className="flex-1 max-w-xs rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 focus:border-green-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={addCustomPest}
            className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600 hover:bg-gray-200"
          >
            + Adicionar
          </button>
        </div>
        <input type="hidden" name="pestTypes" value={selectedPests.join(",")} />
      </section>

      {/* Equipe */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Equipe Responsável</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Técnico</label>
            <select name="technicianId" defaultValue={current.technicianId ?? ""} className={inputCls}>
              <option value="">Selecionar técnico...</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({ROLE_LABELS[t.role]})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gerente</label>
            <select name="managerId" defaultValue={current.managerId ?? ""} className={inputCls}>
              <option value="">Selecionar gerente...</option>
              {technicians
                .filter((t) => t.role === "MANAGER" || t.role === "ADMIN")
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({ROLE_LABELS[t.role]})
                  </option>
                ))}
            </select>
          </div>
        </div>
      </section>

      {/* Observações */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Observações</h2>
        <textarea
          name="notes"
          rows={4}
          defaultValue={current.notes ?? ""}
          placeholder="Instruções especiais, informações sobre o local, histórico de pragas..."
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 resize-none"
        />
      </section>

      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
        <Link
          href={`/service-orders/${orderId}`}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>
    </form>
  );
}
