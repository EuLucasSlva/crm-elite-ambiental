"use client";

import { useActionState } from "react";
import { createUser } from "./actions";
import type { CreateUserState } from "./actions";

const INITIAL: CreateUserState = {};

const ROLE_OPTIONS = [
  { value: "TECHNICIAN", label: "Técnico" },
  { value: "MANAGER", label: "Gerente" },
  { value: "ADMIN", label: "Administrador" },
];

export function NewUserForm() {
  const [state, formAction, isPending] = useActionState(createUser, INITIAL);

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
            Nome Completo <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Nome do usuário"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
          />
          {state.errors?.name && (
            <p className="mt-1 text-xs text-red-600">{state.errors.name[0]}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            E-mail <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="usuario@exemplo.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
          />
          {state.errors?.email && (
            <p className="mt-1 text-xs text-red-600">
              {state.errors.email[0]}
            </p>
          )}
        </div>

        {/* Telefone */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Telefone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="(00) 00000-0000"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
          />
        </div>

        {/* Senha */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Senha <span className="text-red-500">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
          />
          {state.errors?.password && (
            <p className="mt-1 text-xs text-red-600">
              {state.errors.password[0]}
            </p>
          )}
        </div>

        {/* Confirmar senha */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Confirmar Senha <span className="text-red-500">*</span>
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Repita a senha"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
          />
          {state.errors?.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">
              {state.errors.confirmPassword[0]}
            </p>
          )}
        </div>

        {/* Perfil */}
        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Perfil <span className="text-red-500">*</span>
          </label>
          <select
            id="role"
            name="role"
            required
            defaultValue="TECHNICIAN"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {state.errors?.role && (
            <p className="mt-1 text-xs text-red-600">{state.errors.role[0]}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Salvando..." : "Criar Usuário"}
        </button>
        <a
          href="/users"
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
