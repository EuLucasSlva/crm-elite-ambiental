"use client";

import { useActionState, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { createServiceOrder, searchCustomers } from "./actions";
import type { NewServiceOrderState } from "./actions";
import { formatCpfCnpj } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/labels";
import { QuickCustomerModal } from "./QuickCustomerModal";
import type { Role } from "@prisma/client";

const INITIAL_STATE: NewServiceOrderState = {};

const DEFAULT_SERVICE_TYPES = [
  { value: "INSPECTION", label: "Inspeção" },
  { value: "TREATMENT", label: "Tratamento" },
  { value: "RETURN", label: "Retorno" },
];

const DEFAULT_PEST_OPTIONS = [
  "Baratas",
  "Ratos",
  "Formigas",
  "Cupins",
  "Mosquitos",
  "Aranhas",
  "Escorpiões",
  "Pombos",
  "Pulgas",
  "Carrapatos",
  "Outros",
];

const DEFAULT_AREA_OPTIONS = [
  "Cozinha",
  "Despensa / Depósito de alimentos",
  "Refeitório",
  "Sala",
  "Banheiro",
  "Área externa",
  "Depósito",
  "Garagem",
];

const inputCls =
  "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200";

const errorInputCls =
  "block w-full rounded-lg border border-red-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{errors[0]}</p>;
}

function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-gray-700 mb-1"
    >
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

interface CustomerOption {
  id: string;
  fullName: string;
  cpfCnpj: string;
  city: string;
  state: string;
}

interface TechnicianOption {
  id: string;
  name: string;
  role: Role;
}

interface Props {
  preselectedCustomer: CustomerOption | null;
  technicians: TechnicianOption[];
}

export function NewServiceOrderForm({
  preselectedCustomer,
  technicians,
}: Props) {
  const [state, formAction, isPending] = useActionState(
    createServiceOrder,
    INITIAL_STATE
  );

  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerOption | null>(preselectedCustomer);
  const [searchQuery, setSearchQuery] = useState(
    preselectedCustomer ? preselectedCustomer.fullName : ""
  );
  const [searchResults, setSearchResults] = useState<CustomerOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const [cleanWaterTank, setCleanWaterTank] = useState(false);
  const [selectedPests, setSelectedPests] = useState<string[]>([]);
  const [pestOptions, setPestOptions] = useState(DEFAULT_PEST_OPTIONS);
  const [customPestInput, setCustomPestInput] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [areaOptions, setAreaOptions] = useState(DEFAULT_AREA_OPTIONS);
  const [customAreaInput, setCustomAreaInput] = useState("");
  const [serviceTypes, setServiceTypes] = useState(DEFAULT_SERVICE_TYPES);
  const [customServiceInput, setCustomServiceInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addCustomPest = useCallback(() => {
    const name = customPestInput.trim();
    if (!name) return;
    if (!pestOptions.includes(name)) {
      setPestOptions((prev) => [...prev.slice(0, -1), name, prev[prev.length - 1]]);
    }
    setSelectedPests((prev) => prev.includes(name) ? prev : [...prev, name]);
    setCustomPestInput("");
  }, [customPestInput, pestOptions]);

  const addCustomServiceType = useCallback(() => {
    const label = customServiceInput.trim();
    if (!label) return;
    const value = label.toUpperCase().replace(/\s+/g, "_");
    if (!serviceTypes.find((s) => s.value === value)) {
      setServiceTypes((prev) => [...prev, { value, label }]);
    }
    setCustomServiceInput("");
  }, [customServiceInput, serviceTypes]);

  const handleCustomerSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      setSearchQuery(q);
      setSelectedCustomer(null);

      if (searchTimer.current) clearTimeout(searchTimer.current);

      if (q.trim().length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      searchTimer.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const results = await searchCustomers(q.trim());
          setSearchResults(results);
          setShowDropdown(true);
        } finally {
          setIsSearching(false);
        }
      }, 400);
    },
    []
  );

  const handleSelectCustomer = useCallback((customer: CustomerOption) => {
    setSelectedCustomer(customer);
    setSearchQuery(customer.fullName);
    setShowDropdown(false);
    setSearchResults([]);
  }, []);

  const togglePest = useCallback((pest: string) => {
    setSelectedPests((prev) =>
      prev.includes(pest) ? prev.filter((p) => p !== pest) : [...prev, pest]
    );
  }, []);

  const toggleArea = useCallback((area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }, []);

  const addCustomArea = useCallback(() => {
    const name = customAreaInput.trim();
    if (!name) return;
    if (!areaOptions.includes(name)) {
      setAreaOptions((prev) => [...prev, name]);
    }
    setSelectedAreas((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setCustomAreaInput("");
  }, [customAreaInput, areaOptions]);

  const handleCustomerCreated = useCallback((customer: CustomerOption) => {
    setSelectedCustomer(customer);
    setSearchQuery(customer.fullName);
    setShowDropdown(false);
    setSearchResults([]);
  }, []);

  const e = state.errors ?? {};

  return (
    <>
    {showModal && (
      <QuickCustomerModal
        onClose={() => setShowModal(false)}
        onCreated={handleCustomerCreated}
      />
    )}
    <form action={formAction} className="space-y-6">
      {state.message && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Section: Cliente */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Cliente</h2>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Novo Cliente
          </button>
        </div>

        <div className="relative">
          <Label htmlFor="customer-search" required>
            Buscar cliente por nome ou CPF/CNPJ
          </Label>
          <div className="relative">
            <input
              id="customer-search"
              type="text"
              value={searchQuery}
              onChange={handleCustomerSearch}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="Digite o nome ou CPF/CNPJ do cliente..."
              autoComplete="off"
              className={
                e.customerId ? errorInputCls : inputCls
              }
            />
            {isSearching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                Buscando...
              </span>
            )}
          </div>

          {showDropdown && searchResults.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
              {searchResults.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onMouseDown={() => handleSelectCustomer(c)}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {c.fullName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCpfCnpj(c.cpfCnpj)} — {c.city}/{c.state}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {showDropdown && searchResults.length === 0 && !isSearching && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-sm text-gray-500">
              Nenhum cliente encontrado.{" "}
              <Link
                href="/customers/new"
                className="text-green-700 hover:underline"
              >
                Cadastrar novo cliente
              </Link>
            </div>
          )}
        </div>

        {/* Hidden input for actual customerId */}
        <input
          type="hidden"
          name="customerId"
          value={selectedCustomer?.id ?? ""}
        />

        {selectedCustomer && (
          <div className="mt-3 rounded-lg bg-green-50 border border-green-200 p-3 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-800">
                  {selectedCustomer.fullName}
                </p>
                <p className="text-green-700 text-xs mt-0.5">
                  {formatCpfCnpj(selectedCustomer.cpfCnpj)} —{" "}
                  {selectedCustomer.city}/{selectedCustomer.state}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer(null);
                  setSearchQuery("");
                }}
                className="text-green-600 hover:text-green-800 text-xs underline"
              >
                Trocar
              </button>
            </div>
          </div>
        )}

        <FieldError errors={e.customerId} />
      </section>

      {/* Section: Serviço */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Tipo de Serviço
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="serviceType" required>
              Tipo
            </Label>
            <div className="flex gap-2">
              <select
                id="serviceType"
                name="serviceType"
                required
                className={inputCls}
              >
                {serviceTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            {/* Add custom service type */}
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
                className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                title="Adicionar tipo personalizado"
              >
                + Adicionar
              </button>
            </div>
            <FieldError errors={e.serviceType} />
          </div>

          <div>
            <Label htmlFor="scheduledAt">Data de Agendamento</Label>
            <input
              id="scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              className={inputCls}
            />
            <FieldError errors={e.scheduledAt} />
          </div>

          <div>
            <Label htmlFor="visitIntervalDays">Periodicidade das próximas visitas</Label>
            <select
              id="visitIntervalDays"
              name="visitIntervalDays"
              defaultValue="90"
              className={inputCls}
            >
              <option value="15">A cada 15 dias</option>
              <option value="30">A cada 30 dias</option>
              <option value="60">A cada 60 dias</option>
              <option value="90">A cada 90 dias (3 meses) — padrão</option>
              <option value="180">A cada 180 dias (6 meses)</option>
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Define quando as próximas visitas serão sugeridas a partir do agendamento.
            </p>
          </div>

          <div>
            <Label htmlFor="price">Valor do Serviço (R$)</Label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              className={inputCls}
            />
            <p className="mt-1 text-xs text-gray-400">Opcional — pode ser preenchido depois</p>
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
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                    isFree ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <label className="text-sm font-medium text-gray-700">
                Serviço gratuito
              </label>
            </div>
            <input type="hidden" name="isFree" value={isFree ? "true" : "false"} />
          </div>
        </div>
      </section>

      {/* Section: Pragas */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Pragas</h2>
        <p className="text-sm text-gray-500 mb-3">
          Selecione as pragas alvo desta ordem:
        </p>
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
        {/* Add custom pest */}
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
            className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors"
          >
            + Adicionar
          </button>
        </div>
        <input
          type="hidden"
          name="pestTypes"
          value={selectedPests.join(",")}
        />
        <FieldError errors={e.pestTypes} />

        {/* Limpeza de Caixa d'Água */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-3">Serviço adicional:</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={cleanWaterTank}
              onClick={() => setCleanWaterTank((v) => !v)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                cleanWaterTank ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                  cleanWaterTank ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <label className="text-sm font-medium text-gray-700">
              Limpeza de Caixa d&apos;Água
            </label>
          </div>
          <input
            type="hidden"
            name="cleanWaterTank"
            value={cleanWaterTank ? "true" : "false"}
          />
        </div>
      </section>

      {/* Section: Áreas a tratar */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Áreas a Tratar
        </h2>
        <p className="text-sm text-gray-500 mb-3">
          Selecione os ambientes que serão tratados nesta ordem:
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {areaOptions.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => toggleArea(area)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                selectedAreas.includes(area)
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {area}
            </button>
          ))}
        </div>
        {/* Add custom area */}
        <div className="flex gap-1.5 mt-1">
          <input
            type="text"
            value={customAreaInput}
            onChange={(e) => setCustomAreaInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomArea(); } }}
            placeholder="Outra área..."
            className="flex-1 max-w-xs rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 focus:border-green-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={addCustomArea}
            className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors"
          >
            + Adicionar
          </button>
        </div>
        <input
          type="hidden"
          name="treatedAreas"
          value={selectedAreas.join(",")}
        />
      </section>

      {/* Section: Equipe */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Equipe Responsável
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="technicianId">Técnico</Label>
            <select
              id="technicianId"
              name="technicianId"
              className={inputCls}
            >
              <option value="">Selecionar técnico...</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({ROLE_LABELS[t.role]})
                </option>
              ))}
            </select>
            <FieldError errors={e.technicianId} />
          </div>

          <div>
            <Label htmlFor="managerId">Gerente</Label>
            <select
              id="managerId"
              name="managerId"
              className={inputCls}
            >
              <option value="">Selecionar gerente...</option>
              {technicians
                .filter((t) => t.role === "MANAGER" || t.role === "ADMIN")
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({ROLE_LABELS[t.role]})
                  </option>
                ))}
            </select>
            <FieldError errors={e.managerId} />
          </div>
        </div>
      </section>

      {/* Section: Observações */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Observações
        </h2>
        <div>
          <Label htmlFor="notes">Notas da OS</Label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Instruções especiais, informações sobre o local, histórico de pragas..."
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 resize-none"
          />
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
        <Link
          href="/service-orders"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isPending || !selectedCustomer}
          className="inline-flex items-center justify-center rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Criando OS..." : "Criar Ordem de Serviço"}
        </button>
      </div>
    </form>
    </>
  );
}
