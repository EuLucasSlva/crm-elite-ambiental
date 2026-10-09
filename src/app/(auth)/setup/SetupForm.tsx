"use client";

import { useActionState } from "react";
import { createFirstAdmin, type SetupState } from "./actions";

const initial: SetupState = {};

export function SetupForm() {
  const [state, action, pending] = useActionState(createFirstAdmin, initial);

  return (
    <form action={action} className="auth-card space-y-4">
      <div>
        <label className="form-label">
          Nome completo
        </label>
        <input
          name="name"
          type="text"
          required
          autoComplete="name"
          className="input"
          placeholder="Seu nome"
        />
      </div>

      <div>
        <label className="form-label">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input"
          placeholder="admin@suaempresa.com"
        />
      </div>

      <div>
        <label className="form-label">
          Senha <span className="text-gray-400 font-normal">(mínimo 8 caracteres)</span>
        </label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input"
          placeholder="••••••••"
        />
      </div>

      <div>
        <label className="form-label">
          Confirmar senha
        </label>
        <input
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input"
          placeholder="••••••••"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Criando conta…" : "Criar conta de administrador"}
      </button>
    </form>
  );
}
