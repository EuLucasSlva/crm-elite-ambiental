"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createCustomer } from "./actions";
import type { CustomerFormState } from "./actions";

const INITIAL_STATE: CustomerFormState = {};

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

const inputCls =
  "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200";

const errorInputCls =
  "block w-full rounded-lg border border-red-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200";

function Input({
  id,
  name,
  type = "text",
  placeholder,
  required,
  errors,
  defaultValue,
}: {
  id: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  errors?: string[];
  defaultValue?: string;
}) {
  return (
    <>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        className={errors?.length ? errorInputCls : inputCls}
      />
      <FieldError errors={errors} />
    </>
  );
}

export function NewCustomerForm() {
  const [state, formAction, isPending] = useActionState(
    createCustomer,
    INITIAL_STATE
  );
  const [hadBefore, setHadBefore] = useState(false);

  const e = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {state.message && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Section: Identificação */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Identificação
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="type" required>
              Tipo de Pessoa
            </Label>
            <select
              id="type"
              name="type"
              required
              className={inputCls}
            >
              <option value="PERSON">Pessoa Física</option>
              <option value="COMPANY">Pessoa Jurídica</option>
            </select>
            <FieldError errors={e.type} />
          </div>

          <div>
            <Label htmlFor="leadSource" required>
              Canal de Entrada
            </Label>
            <select
              id="leadSource"
              name="leadSource"
              required
              className={inputCls}
            >
              <option value="WHATSAPP">WhatsApp</option>
              <option value="PHONE">Telefone</option>
              <option value="REFERRAL">Indicação</option>
              <option value="PORTAL">Portal</option>
              <option value="DOOR_TO_DOOR">Porta a Porta</option>
            </select>
            <FieldError errors={e.leadSource} />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="fullName" required>
              Nome Completo / Razão Social
            </Label>
            <Input
              id="fullName"
              name="fullName"
              placeholder="João da Silva"
              required
              errors={e.fullName}
            />
          </div>

          <div>
            <Label htmlFor="cpfCnpj" required>
              CPF / CNPJ
            </Label>
            <Input
              id="cpfCnpj"
              name="cpfCnpj"
              placeholder="000.000.000-00 ou 00.000.000/0001-00"
              required
              errors={e.cpfCnpj}
            />
          </div>

          <div>
            <Label htmlFor="phone" required>
              Telefone
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="(11) 99999-9999"
              required
              errors={e.phone}
            />
          </div>

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="email@exemplo.com"
              errors={e.email}
            />
          </div>
        </div>
      </section>

      {/* Section: Endereço */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Endereço
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-2">
            <Label htmlFor="street" required>
              Rua / Av.
            </Label>
            <Input
              id="street"
              name="street"
              placeholder="Rua das Flores"
              required
              errors={e.street}
            />
          </div>

          <div>
            <Label htmlFor="number" required>
              Número
            </Label>
            <Input
              id="number"
              name="number"
              placeholder="123"
              required
              errors={e.number}
            />
          </div>

          <div>
            <Label htmlFor="complement">Complemento</Label>
            <Input
              id="complement"
              name="complement"
              placeholder="Apto 4B"
              errors={e.complement}
            />
          </div>

          <div>
            <Label htmlFor="city" required>
              Cidade
            </Label>
            <Input
              id="city"
              name="city"
              placeholder="São Paulo"
              required
              errors={e.city}
            />
          </div>

          <div>
            <Label htmlFor="state" required>
              Estado (UF)
            </Label>
            <Input
              id="state"
              name="state"
              placeholder="SP"
              required
              errors={e.state}
            />
          </div>

          <div>
            <Label htmlFor="zip" required>
              CEP
            </Label>
            <Input
              id="zip"
              name="zip"
              placeholder="01310-100"
              required
              errors={e.zip}
            />
          </div>
        </div>
      </section>

      {/* Section: Imóvel */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Dados do Imóvel
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="propertyType" required>
              Tipo de Imóvel
            </Label>
            <select
              id="propertyType"
              name="propertyType"
              required
              className={inputCls}
            >
              <option value="RESIDENTIAL">Residencial</option>
              <option value="COMMERCIAL">Comercial</option>
              <option value="INDUSTRIAL">Industrial</option>
              <option value="RURAL">Rural</option>
            </select>
            <FieldError errors={e.propertyType} />
          </div>

          <div>
            <Label htmlFor="siteSizeM2" required>
              Área (m²)
            </Label>
            <Input
              id="siteSizeM2"
              name="siteSizeM2"
              type="number"
              placeholder="150"
              required
              errors={e.siteSizeM2}
            />
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={hadBefore}
                onClick={() => setHadBefore((v) => !v)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  hadBefore ? "bg-green-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                    hadBefore ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <label className="text-sm font-medium text-gray-700">
                Cliente já teve o serviço antes
              </label>
            </div>
            <input
              type="hidden"
              name="hadServiceBefore"
              value={hadBefore ? "true" : "false"}
            />
          </div>

          {hadBefore && (
            <div>
              <Label htmlFor="lastServiceDate">Data do Último Serviço</Label>
              <Input
                id="lastServiceDate"
                name="lastServiceDate"
                type="date"
                errors={e.lastServiceDate}
              />
            </div>
          )}
        </div>
      </section>

      {/* Section: Observações */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Observações
        </h2>
        <div>
          <Label htmlFor="notes">Notas Internas</Label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Informações adicionais, histórico de pragas, preferências do cliente..."
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 resize-none"
          />
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
        <Link
          href="/customers"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Salvando..." : "Salvar Cliente"}
        </button>
      </div>
    </form>
  );
}
