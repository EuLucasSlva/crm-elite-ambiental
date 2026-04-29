"use client";

import { useActionState } from "react";
import { createPestType, createApplicationArea, type PestState, type AreaState } from "./catalog/actions";

interface Props {
  kind: "pest" | "area";
}

export function CatalogForm({ kind }: Props) {
  if (kind === "pest") return <PestForm />;
  return <AreaForm />;
}

function PestForm() {
  const [state, formAction, pending] = useActionState<PestState, FormData>(createPestType, {});

  return (
    <form action={formAction} className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs font-bold mb-1" style={{ color: "var(--text)" }}>
          Nome da praga *
        </label>
        <input
          type="text"
          name="name"
          required
          placeholder="Ex: Baratas"
          className="w-full rounded-md border px-3 py-2 text-sm min-h-[40px]"
          style={{ borderColor: "#d0d5e8" }}
        />
        {state?.errors?.name && <p className="mt-1 text-xs text-red-600">{state.errors.name[0]}</p>}
      </div>
      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-bold mb-1" style={{ color: "var(--text)" }}>
          Categoria
        </label>
        <input
          type="text"
          name="category"
          placeholder="Opcional (ex: barata)"
          className="w-full rounded-md border px-3 py-2 text-sm min-h-[40px]"
          style={{ borderColor: "#d0d5e8" }}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full px-5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50 min-h-[40px]"
        style={{ background: "var(--navy)" }}
      >
        {pending ? "Cadastrando..." : "+ Cadastrar"}
      </button>
      {state?.globalError && <p className="text-xs text-red-600 w-full">{state.globalError}</p>}
    </form>
  );
}

function AreaForm() {
  const [state, formAction, pending] = useActionState<AreaState, FormData>(createApplicationArea, {});

  return (
    <form action={formAction} className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[250px]">
        <label className="block text-xs font-bold mb-1" style={{ color: "var(--text)" }}>
          Nome da área *
        </label>
        <input
          type="text"
          name="name"
          required
          placeholder="Ex: Cozinha"
          className="w-full rounded-md border px-3 py-2 text-sm min-h-[40px]"
          style={{ borderColor: "#d0d5e8" }}
        />
        {state?.errors?.name && <p className="mt-1 text-xs text-red-600">{state.errors.name[0]}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full px-5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50 min-h-[40px]"
        style={{ background: "var(--navy)" }}
      >
        {pending ? "Cadastrando..." : "+ Cadastrar"}
      </button>
      {state?.globalError && <p className="text-xs text-red-600 w-full">{state.globalError}</p>}
    </form>
  );
}
