"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  action: () => Promise<{ success?: boolean; error?: string }>;
  confirmMessage?: string;
  label?: string;
  redirectTo?: string;
  size?: "sm" | "md";
  variant?: "danger" | "ghost";
}

export function DeleteButton({
  action,
  confirmMessage = "Tem certeza que deseja apagar este item? Esta ação não pode ser desfeita.",
  label = "Apagar",
  redirectTo,
  size = "md",
  variant = "danger",
}: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!confirm(confirmMessage)) return;
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        alert(`Erro ao apagar: ${result.error}`);
        return;
      }
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    });
  }

  const baseClasses =
    size === "sm"
      ? "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50 min-h-[32px]"
      : "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-opacity hover:opacity-80 disabled:opacity-50 min-h-[36px]";

  const variantStyle =
    variant === "danger"
      ? { background: "#dc2626", color: "#fff" }
      : { background: "transparent", color: "#dc2626", border: "1px solid #dc2626" };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={baseClasses}
      style={variantStyle}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"></path>
        <path d="M10 11v6"></path>
        <path d="M14 11v6"></path>
        <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
      </svg>
      {pending ? "Apagando..." : label}
    </button>
  );
}
