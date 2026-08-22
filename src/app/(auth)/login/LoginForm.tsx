"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeInternalPath } from "@/lib/navigation-security";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Informe sua senha").max(128),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeInternalPath(searchParams.get("callbackUrl"));
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError(null);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email ou senha incorretos.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-xl shadow-xl p-6 space-y-4 border border-white/20"
    >
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          {...register("email")}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
          placeholder="seu@email.com"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
          Senha
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-teal-700 hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
      >
        {isSubmitting ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
