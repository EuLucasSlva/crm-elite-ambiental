import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import { SectionCard } from "@/components/ui/SectionCard";
import { KpiCard } from "@/components/ui/KpiCard";
import { Badge } from "@/components/ui/Badge";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/labels-extras";
import type { Role } from "@prisma/client";

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function CashFlowPage({ searchParams }: PageProps) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/");

  const params = await searchParams;
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

  const start = params.from ? new Date(params.from) : monthStart;
  const end = params.to ? new Date(params.to) : monthEnd;

  const [paidOrders, expenses] = await Promise.all([
    prisma.serviceOrder.findMany({
      where: { paymentStatus: "PAID", paidAt: { gte: start, lte: end } },
      orderBy: { paidAt: "desc" },
      select: {
        id: true,
        price: true,
        paidAt: true,
        serviceType: true,
        customer: { select: { fullName: true } },
      },
    }),
    prisma.expense.findMany({
      where: { paidAt: { gte: start, lte: end } },
      orderBy: { paidAt: "desc" },
      select: {
        id: true,
        description: true,
        category: true,
        amount: true,
        paidAt: true,
        supplier: true,
      },
    }),
  ]);

  type Entry = {
    id: string;
    type: "INCOME" | "EXPENSE";
    date: Date;
    description: string;
    category: string;
    amount: number;
    detail?: string;
  };

  const entries: Entry[] = [
    ...paidOrders
      .filter((o) => o.paidAt && o.price)
      .map<Entry>((o) => ({
        id: `OS-${o.id}`,
        type: "INCOME",
        date: o.paidAt!,
        description: `OS — ${o.customer.fullName}`,
        category: o.serviceType,
        amount: o.price ?? 0,
      })),
    ...expenses.map<Entry>((e) => ({
      id: `EXP-${e.id}`,
      type: "EXPENSE",
      date: e.paidAt,
      description: e.description,
      category: EXPENSE_CATEGORY_LABELS[e.category],
      amount: e.amount,
      detail: e.supplier ?? undefined,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const totalIncome = entries.filter((e) => e.type === "INCOME").reduce((acc, e) => acc + e.amount, 0);
  const totalExpense = entries.filter((e) => e.type === "EXPENSE").reduce((acc, e) => acc + e.amount, 0);
  const balance = totalIncome - totalExpense;

  const fmtDate = (d: Date) => d.toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold leading-none" style={{ color: "var(--text)" }}>
            FLUXO DE CAIXA
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Período: {formatDate(start)} a {formatDate(end)}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/financeiro"
            className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-bold transition-opacity hover:opacity-80"
            style={{ background: "var(--card-bg)", border: "1px solid #d0d5e8", color: "var(--text-muted)" }}
          >
            ← Financeiro
          </Link>
          <Link
            href="/financeiro/despesas"
            className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-bold transition-opacity hover:opacity-80"
            style={{ background: "var(--card-bg)", border: "1px solid #d0d5e8", color: "var(--text-muted)" }}
          >
            Ver Despesas
          </Link>
        </div>
      </div>

      {/* Filter */}
      <SectionCard title="Filtrar período">
        <form className="flex flex-wrap gap-3 items-end" method="GET">
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: "var(--text-muted)" }}>De</label>
            <input
              type="date"
              name="from"
              defaultValue={fmtDate(start)}
              className="rounded-md border px-3 py-2 text-sm min-h-[40px]"
              style={{ borderColor: "#d0d5e8" }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: "var(--text-muted)" }}>Até</label>
            <input
              type="date"
              name="to"
              defaultValue={fmtDate(end)}
              className="rounded-md border px-3 py-2 text-sm min-h-[40px]"
              style={{ borderColor: "#d0d5e8" }}
            />
          </div>
          <button
            type="submit"
            className="rounded-full px-5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 min-h-[40px]"
            style={{ background: "var(--navy)" }}
          >
            Filtrar
          </button>
        </form>
      </SectionCard>

      <div className="kpi-row">
        <KpiCard label="Entradas" value={formatCurrency(totalIncome)} />
        <KpiCard label="Saídas" value={formatCurrency(totalExpense)} />
        <KpiCard
          label="Saldo do Período"
          value={formatCurrency(balance)}
          subtext={balance >= 0 ? "Resultado positivo" : "Resultado negativo"}
        />
      </div>

      <SectionCard title="Movimentações (timeline cronológica)">
        <div className="table-scroll">
          <table className="table-hover w-full text-sm">
            <thead>
              <tr>
                {["Data", "Tipo", "Descrição", "Categoria", "Detalhe", "Valor"].map((h) => (
                  <th
                    key={h}
                    className="text-left pb-2 text-xs font-bold uppercase tracking-wide border-b px-2"
                    style={{ color: "var(--text-muted)", borderColor: "#d0d5e8" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-2 py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    Nenhuma movimentação no período.
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id} className="border-b last:border-0" style={{ borderColor: "#dde1ed" }}>
                    <td className="px-2 py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(e.date)}</td>
                    <td className="px-2 py-2.5">
                      <Badge variant={e.type === "INCOME" ? "green" : "red"} label={e.type === "INCOME" ? "Entrada" : "Saída"} />
                    </td>
                    <td className="px-2 py-2.5 font-medium" style={{ color: "var(--text)" }}>{e.description}</td>
                    <td className="px-2 py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>{e.category}</td>
                    <td className="px-2 py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>{e.detail ?? "—"}</td>
                    <td className="px-2 py-2.5 font-bold" style={{ color: e.type === "INCOME" ? "#059669" : "#dc2626" }}>
                      {e.type === "INCOME" ? "+ " : "− "}
                      {formatCurrency(e.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
