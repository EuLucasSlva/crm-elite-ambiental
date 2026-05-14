"use client";

import { useTransition } from "react";
import { markInstallmentPaid } from "./actions";
import { formatCurrency, formatDate } from "@/lib/format";
import type { InstallmentStatus } from "@prisma/client";

export type InstallmentRow = {
  id: string;
  number: number;
  amount: number;
  dueDate: Date;
  status: InstallmentStatus;
  paidAt: Date | null;
};

interface InstallmentsSectionProps {
  installments: InstallmentRow[];
  canManage: boolean;
}

const STATUS_LABELS: Record<InstallmentStatus, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  OVERDUE: "Vencido",
};

const STATUS_COLORS: Record<InstallmentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
};

function InstallmentMarkButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => { await markInstallmentPaid(id); })}
      className="rounded-lg px-3 py-1 text-xs font-semibold text-white disabled:opacity-50 transition-opacity"
      style={{ background: "#15803d" }}
    >
      {pending ? "..." : "Marcar pago"}
    </button>
  );
}

export function InstallmentsSection({ installments, canManage }: InstallmentsSectionProps) {
  if (installments.length === 0) return null;

  const total = installments.reduce((s, i) => s + i.amount, 0);
  const paid = installments.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amount, 0);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Parcelas ({installments.length}x)
        </h2>
        <span className="text-xs font-medium text-gray-500">
          Recebido: <span className="font-bold text-green-700">{formatCurrency(paid)}</span>
          {" / "}
          {formatCurrency(total)}
        </span>
      </div>
      <div className="space-y-2">
        {installments.map((inst) => (
          <div
            key={inst.id}
            className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm"
          >
            <span className="font-mono text-xs text-gray-500 w-6">{inst.number}ª</span>
            <span className="font-semibold text-gray-800 w-28">{formatCurrency(inst.amount)}</span>
            <span className="text-xs text-gray-500 flex-1">
              Vence: {formatDate(inst.dueDate)}
              {inst.paidAt && <> · Pago: {formatDate(inst.paidAt)}</>}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[inst.status]}`}>
              {STATUS_LABELS[inst.status]}
            </span>
            {canManage && inst.status !== "PAID" && (
              <InstallmentMarkButton id={inst.id} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
