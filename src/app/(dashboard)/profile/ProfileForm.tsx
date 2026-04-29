"use client";

import { useState, useTransition } from "react";
import { changePassword } from "./actions";

export function ProfileForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await changePassword(currentPassword, newPassword, confirmPassword);
      if (result.success) {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(result.error ?? "Erro ao alterar senha.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Senha atual
        </label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
          disabled={isPending}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nova senha
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={6}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
          disabled={isPending}
        />
        <p className="mt-1 text-xs text-gray-500">Mínimo 6 caracteres.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirmar nova senha
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
          disabled={isPending}
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Senha alterada com sucesso.
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Salvando..." : "Alterar senha"}
      </button>
    </form>
  );
}
