import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import { SectionCard } from "@/components/ui/SectionCard";
import { KpiCard } from "@/components/ui/KpiCard";
import { Badge } from "@/components/ui/Badge";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteExpense } from "@/lib/delete-actions";
import { EXPENSE_CATEGORY_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/labels-extras";
import type { Role } from "@prisma/client";

export default async function ExpensesPage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/");

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [expenses, totalAll, totalMonthAgg, byCategoryRaw] = await Promise.all([
    prisma.expense.findMany({
      orderBy: { paidAt: "desc" },
      take: 100,
      include: {
        createdBy: { select: { name: true } },
        serviceOrder: { select: { id: true, customer: { select: { fullName: true } } } },
      },
    }),
    prisma.expense.aggregate({ _sum: { amount: true }, _count: true }),
    prisma.expense.aggregate({
      where: { paidAt: { gte: monthStart } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.groupBy({
      by: ["category"],
      where: { paidAt: { gte: monthStart } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold leading-none" style={{ color: "var(--text)" }}>
            DESPESAS
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {totalAll._count} despesa{totalAll._count !== 1 ? "s" : ""} registrada{totalAll._count !== 1 ? "s" : ""}
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
            href="/financeiro/fluxo"
            className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-bold transition-opacity hover:opacity-80"
            style={{ background: "var(--card-bg)", border: "1px solid #d0d5e8", color: "var(--text-muted)" }}
          >
            Fluxo de Caixa
          </Link>
          <Link
            href="/financeiro/despesas/new"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90"
            style={{ background: "#dc2626" }}
          >
            <span className="text-base leading-none">+</span>
            Nova Despesa
          </Link>
        </div>
      </div>

      <div className="kpi-row">
        <KpiCard label="Total Geral" value={formatCurrency(totalAll._sum.amount ?? 0)} />
        <KpiCard label="Este Mês" value={formatCurrency(totalMonthAgg._sum.amount ?? 0)} subtext={`${totalMonthAgg._count} despesas`} />
        <KpiCard
          label="Maior Categoria"
          value={byCategoryRaw[0] ? EXPENSE_CATEGORY_LABELS[byCategoryRaw[0].category] : "—"}
          subtext={byCategoryRaw[0] ? formatCurrency(byCategoryRaw[0]._sum.amount ?? 0) : ""}
        />
        <KpiCard label="Categorias ativas" value={byCategoryRaw.length} />
      </div>

      <SectionCard title="Top categorias do mês">
        {byCategoryRaw.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)" }}>
            Nenhuma despesa este mês.
          </p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {byCategoryRaw.slice(0, 6).map((c) => (
              <div
                key={c.category}
                className="flex items-center justify-between rounded-md px-3 py-2"
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
              >
                <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                  {EXPENSE_CATEGORY_LABELS[c.category]}
                </span>
                <span className="text-sm font-bold" style={{ color: "#dc2626" }}>
                  {formatCurrency(c._sum.amount ?? 0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Lista de Despesas">
        <div className="table-scroll">
          <table className="table-hover w-full text-sm">
            <thead>
              <tr>
                {["Data", "Categoria", "Descrição", "Fornecedor", "Pagamento", "Valor", "OS Vinculada", "Ações"].map((h) => (
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
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-2 py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    Nenhuma despesa registrada. Comece em &quot;+ Nova Despesa&quot;.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="border-b last:border-0" style={{ borderColor: "#dde1ed" }}>
                    <td className="px-2 py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(e.paidAt)}</td>
                    <td className="px-2 py-2.5">
                      <Badge variant="gray" label={EXPENSE_CATEGORY_LABELS[e.category]} />
                    </td>
                    <td className="px-2 py-2.5 font-medium" style={{ color: "var(--text)" }}>{e.description}</td>
                    <td className="px-2 py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>{e.supplier ?? "—"}</td>
                    <td className="px-2 py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>{PAYMENT_METHOD_LABELS[e.paymentMethod]}</td>
                    <td className="px-2 py-2.5 font-bold" style={{ color: "#dc2626" }}>− {formatCurrency(e.amount)}</td>
                    <td className="px-2 py-2.5 text-xs">
                      {e.serviceOrder ? (
                        <Link href={`/service-orders/${e.serviceOrder.id}`} className="underline" style={{ color: "var(--navy)" }}>
                          {e.serviceOrder.customer.fullName}
                        </Link>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td className="px-2 py-2.5">
                      <DeleteButton
                        size="sm"
                        action={async () => {
                          "use server";
                          return deleteExpense(e.id);
                        }}
                        confirmMessage={`Apagar despesa "${e.description}"? Esta ação não pode ser desfeita.`}
                      />
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
