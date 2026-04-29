"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
  active: boolean;
  action: (id: string, active: boolean) => Promise<{ success?: boolean; error?: string }>;
}

export function ToggleActiveButton({ id, active, action }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      const result = await action(id, !active);
      if (result.error) {
        alert(`Erro: ${result.error}`);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50 min-h-[32px]"
      style={{
        background: active ? "#fef3c7" : "#dcfce7",
        color: active ? "#854d0e" : "#166534",
      }}
    >
      {pending ? "..." : active ? "Desativar" : "Ativar"}
    </button>
  );
}
