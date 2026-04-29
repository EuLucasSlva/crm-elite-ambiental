"use client";

import { useActionState, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { createServiceOrder, searchCustomers } from "./actions";
import type { NewServiceOrderState } from "./actions";
import { formatCpfCnpj } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/labels";
import type { Role } from "@prisma/client";

const INITIAL_STATE: NewServiceOrderState = {};

const PEST_OPTIONS = [
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
  const [selectedPests, setSelectedPests] = useState<string[]>([]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const e = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {state.message && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Section: Cliente */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Cliente</h2>

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
            <select
              id="serviceType"
              name="serviceType"
              required
              className={inputCls}
            >
              <option value="INSPECTION">Inspeção</option>
              <option value="TREATMENT">Tratamento</option>
              <option value="RETURN">Retorno</option>
            </select>
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

          <div className="sm:col-span-2">
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
                Serviço gratuito / inspeção sem custo
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
        <div className="flex flex-wrap gap-2">
          {PEST_OPTIONS.map((pest) => (
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
        <input
          type="hidden"
          name="pestTypes"
          value={selectedPests.join(",")}
        />
        <FieldError errors={e.pestTypes} />
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
  );
}
