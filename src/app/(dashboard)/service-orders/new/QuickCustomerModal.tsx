"use client";

import { useActionState, useEffect } from "react";
import { createCustomerQuick, type QuickCustomerState } from "./actions";

const inputCls =
  "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200";
const errCls =
  "block w-full rounded-lg border border-red-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200";

function F({ id, name, label, placeholder, type = "text", required, errors, defaultValue }: {
  id: string; name: string; label: string; placeholder?: string; type?: string;
  required?: boolean; errors?: string[]; defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={id} name={name} type={type} placeholder={placeholder}
        required={required} defaultValue={defaultValue}
        className={errors?.length ? errCls : inputCls}
      />
      {errors?.[0] && <p className="mt-1 text-xs text-red-600">{errors[0]}</p>}
    </div>
  );
}

interface CustomerOption {
  id: string; fullName: string; cpfCnpj: string; city: string; state: string;
}

interface Props {
  onClose: () => void;
  onCreated: (customer: CustomerOption) => void;
}

const INITIAL: QuickCustomerState = {};

export function QuickCustomerModal({ onClose, onCreated }: Props) {
  const [state, action, pending] = useActionState(createCustomerQuick, INITIAL);

  useEffect(() => {
    if (state.created) {
      onCreated(state.created);
      onClose();
    }
  }, [state.created, onCreated, onClose]);

  const e = state.errors ?? {};

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">Cadastrar Novo Cliente</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fechar"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form action={action} className="p-6 space-y-5">
          {state.message && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {state.message}
            </div>
          )}

          {/* Identificação */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Identificação</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="qc-type" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Pessoa<span className="text-red-500 ml-0.5">*</span>
                </label>
                <select id="qc-type" name="type" required className={inputCls}>
                  <option value="PERSON">Pessoa Física</option>
                  <option value="COMPANY">Pessoa Jurídica</option>
                </select>
              </div>
              <div>
                <label htmlFor="qc-leadSource" className="block text-sm font-medium text-gray-700 mb-1">
                  Canal de Entrada<span className="text-red-500 ml-0.5">*</span>
                </label>
                <select id="qc-leadSource" name="leadSource" required className={inputCls}>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="PHONE">Telefone</option>
                  <option value="REFERRAL">Indicação</option>
                  <option value="PORTAL">Portal</option>
                  <option value="DOOR_TO_DOOR">Porta a Porta</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <F id="qc-fullName" name="fullName" label="Nome / Razão Social" placeholder="João da Silva" required errors={e.fullName} />
              </div>
              <F id="qc-cpfCnpj" name="cpfCnpj" label="CPF / CNPJ" placeholder="000.000.000-00" required errors={e.cpfCnpj} />
              <F id="qc-phone" name="phone" label="Telefone" type="tel" placeholder="(11) 99999-9999" required errors={e.phone} />
              <div className="sm:col-span-2">
                <F id="qc-email" name="email" label="E-mail" type="email" placeholder="email@exemplo.com" errors={e.email} />
              </div>
            </div>
          </section>

          {/* Endereço */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Endereço</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <F id="qc-street" name="street" label="Rua / Av." placeholder="Rua das Flores" required errors={e.street} />
              </div>
              <F id="qc-number" name="number" label="Número" placeholder="123" required errors={e.number} />
              <F id="qc-complement" name="complement" label="Complemento" placeholder="Apto 4B" errors={e.complement} />
              <F id="qc-city" name="city" label="Cidade" placeholder="São Paulo" required errors={e.city} />
              <F id="qc-state" name="state" label="Estado (UF)" placeholder="SP" required errors={e.state} />
              <div className="sm:col-span-2">
                <F id="qc-zip" name="zip" label="CEP" placeholder="01310-100" required errors={e.zip} />
              </div>
            </div>
          </section>

          {/* Imóvel */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Imóvel</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="qc-propertyType" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Imóvel<span className="text-red-500 ml-0.5">*</span>
                </label>
                <select id="qc-propertyType" name="propertyType" required className={inputCls}>
                  <option value="RESIDENTIAL">Residencial</option>
                  <option value="COMMERCIAL">Comercial</option>
                  <option value="INDUSTRIAL">Industrial</option>
                  <option value="RURAL">Rural</option>
                </select>
              </div>
              <F id="qc-siteSizeM2" name="siteSizeM2" label="Área (m²)" type="number" placeholder="150" required errors={e.siteSizeM2} />
            </div>
          </section>

          {/* Footer */}
          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {pending ? "Salvando..." : "Salvar e Selecionar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
