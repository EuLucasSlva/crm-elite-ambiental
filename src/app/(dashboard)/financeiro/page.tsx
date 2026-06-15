import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/format";
import { SectionCard } from "@/components/ui/SectionCard";
import { KpiCard } from "@/components/ui/KpiCard";
import { FinanceCharts } from "./FinanceCharts";
import { RecentOrdersTable } from "./RecentOrdersTable";
import type { Role } from "@prisma/client";

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

function getMonthRange(monthsAgo: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  const label = start.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
  return { start, end, label };
}

async function getFinancialReport() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = monthStart;
  const yearStart = new Date(now.getFullYear(), 0, 1);

  // ── Aggregated totals ──────────────────────────────────────────────────────
  const [
    pendingAgg,
    overdueAgg,
    totalOrders,
    expensesThisMonth,
    expensesYear,
  ] = await Promise.all([
    prisma.serviceOrder.aggregate({
      where: { paymentStatus: "PENDING", isFree: false },
      _sum: { price: true },
      _count: true,
    }),
    prisma.serviceOrder.aggregate({
      where: { paymentStatus: "OVERDUE" },
      _sum: { price: true },
      _count: true,
    }),
    prisma.serviceOrder.count({ where: { status: { notIn: ["CANCELED"] } } }),
    prisma.expense.aggregate({
      where: { paidAt: { gte: monthStart } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: { paidAt: { gte: yearStart } },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  // ── Revenue from paid installments (parcelado) ─────────────────────────────
  // Installments represent revenue recognized per due date
  const ranges = Array.from({ length: 6 }, (_, i) => getMonthRange(5 - i));
  const sixMonthsAgo = ranges[0].start;

  const [paidInstallments, paidAvistaInWindow] = await Promise.all([
    // Installments paid in the 6-month window
    prisma.installment.findMany({
      where: { status: "PAID", paidAt: { gte: sixMonthsAgo } },
      select: {
        amount: true,
        paidAt: true,
        serviceOrder: {
          select: {
            cost: true,
            serviceType: true,
            installmentCount: true,
            technician: { select: { name: true } },
          },
        },
      },
    }),
    // À vista OS paid in the 6-month window (no installments)
    prisma.serviceOrder.findMany({
      where: {
        paymentStatus: "PAID",
        paidAt: { gte: sixMonthsAgo },
        installmentCount: null,
      },
      select: {
        price: true,
        cost: true,
        paidAt: true,
        serviceType: true,
        technician: { select: { name: true } },
      },
    }),
  ]);

  // Build unified revenue rows: { revenue, cost, date, serviceType, techName }
  type RevenueRow = { revenue: number; cost: number; date: Date; serviceType: string; techName: string };
  const revenueRows: RevenueRow[] = [];

  for (const inst of paidInstallments) {
    if (!inst.paidAt) continue;
    const count = inst.serviceOrder.installmentCount ?? 1;
    const costShare = (inst.serviceOrder.cost ?? 0) / count;
    revenueRows.push({
      revenue: inst.amount,
      cost: costShare,
      date: inst.paidAt,
      serviceType: inst.serviceOrder.serviceType,
      techName: inst.serviceOrder.technician?.name ?? "Sem técnico",
    });
  }

  for (const os of paidAvistaInWindow) {
    if (!os.paidAt) continue;
    revenueRows.push({
      revenue: os.price ?? 0,
      cost: os.cost ?? 0,
      date: os.paidAt,
      serviceType: os.serviceType,
      techName: os.technician?.name ?? "Sem técnico",
    });
  }

  // -- Monthly series --
  const monthBuckets = new Map<string, { revenue: number; cost: number; count: number }>();
  for (const { label } of ranges) monthBuckets.set(label, { revenue: 0, cost: 0, count: 0 });

  for (const row of revenueRows) {
    const label = new Date(row.date.getFullYear(), row.date.getMonth(), 1)
      .toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    const bucket = monthBuckets.get(label);
    if (!bucket) continue;
    bucket.revenue += row.revenue;
    bucket.cost += row.cost;
    bucket.count += 1;
  }

  const monthlySeries = ranges.map(({ label }) => {
    const b = monthBuckets.get(label) ?? { revenue: 0, cost: 0, count: 0 };
    return { label, ...b, profit: b.revenue - b.cost };
  });

  // -- This month / last month / year aggregates from revenueRows --
  const thisMonthRows = revenueRows.filter((r) => r.date >= monthStart);
  const lastMonthRows = revenueRows.filter((r) => r.date >= prevMonthStart && r.date < prevMonthEnd);
  const yearRows = revenueRows.filter((r) => r.date >= yearStart);

  const sumRows = (rows: RevenueRow[]) =>
    rows.reduce((acc, r) => ({ revenue: acc.revenue + r.revenue, cost: acc.cost + r.cost, count: acc.count + 1 }), { revenue: 0, cost: 0, count: 0 });

  const thisMonthAgg = sumRows(thisMonthRows);
  const yearAgg = sumRows(yearRows);

  // -- By technician (this month) --
  const techMap = new Map<string, { revenue: number; cost: number; count: number }>();
  for (const r of thisMonthRows) {
    const cur = techMap.get(r.techName) ?? { revenue: 0, cost: 0, count: 0 };
    techMap.set(r.techName, { revenue: cur.revenue + r.revenue, cost: cur.cost + r.cost, count: cur.count + 1 });
  }
  const byTechnician = Array.from(techMap.entries())
    .map(([name, d]) => ({ name, ...d, profit: d.revenue - d.cost }))
    .sort((a, b) => b.revenue - a.revenue);

  // -- By service type (this month) --
  const typeMap = new Map<string, { revenue: number; cost: number; count: number }>();
  for (const r of thisMonthRows) {
    const cur = typeMap.get(r.serviceType) ?? { revenue: 0, cost: 0, count: 0 };
    typeMap.set(r.serviceType, { revenue: cur.revenue + r.revenue, cost: cur.cost + r.cost, count: cur.count + 1 });
  }
  const byServiceType = Array.from(typeMap.entries())
    .map(([type, d]) => ({ type, ...d, profit: d.revenue - d.cost }))
    .sort((a, b) => b.revenue - a.revenue);

  // ── Recent OS (paid + pending + overdue) ──────────────────────────────────
  const recentOrders = await prisma.serviceOrder.findMany({
    where: {
      paymentStatus: { in: ["PAID", "PENDING", "OVERDUE"] },
      isFree: false,
      price: { gt: 0 },
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
    select: {
      id: true,
      orderNumber: true,
      price: true,
      cost: true,
      paidAt: true,
      paymentStatus: true,
      serviceType: true,
      scheduledAt: true,
      visitIntervalDays: true,
      installmentCount: true,
      customer: { select: { fullName: true } },
      technician: { select: { name: true } },
      installments: {
        where: { status: { in: ["PENDING", "OVERDUE"] } },
        orderBy: { dueDate: "asc" },
        select: { dueDate: true },
      },
    },
  });

  // Build rows for the recent-orders table, computing next visits + due date.
  const todayMs = Date.now();
  const recentRows = recentOrders.map((o) => {
    // "A vencer" de pagamento: só a próxima parcela pendente/atrasada.
    // Não usamos a garantia aqui — garantia não é vencimento de pagamento.
    const dueDate = o.installments[0]?.dueDate ?? null;

    // próximas 6 visitas FUTURAS a partir do agendamento, no intervalo definido.
    // Começa da primeira ocorrência futura, garantindo sempre 6 datas.
    const nextVisits: string[] = [];
    if (o.scheduledAt) {
      const interval = o.visitIntervalDays || 90;
      const start = new Date(o.scheduledAt).getTime();
      const intervalMs = interval * 86_400_000;
      // quantas ocorrências já passaram desde o agendamento
      const elapsed = Math.max(0, Math.ceil((todayMs - start) / intervalMs));
      for (let k = 1; k <= 6; k++) {
        const d = new Date(o.scheduledAt);
        d.setDate(d.getDate() + interval * (elapsed + k));
        nextVisits.push(d.toISOString());
      }
    }

    return {
      id: o.id,
      orderLabel: o.orderNumber ?? o.id.slice(0, 6),
      customerName: o.customer.fullName,
      technicianName: o.technician?.name ?? null,
      serviceType: o.serviceType,
      price: o.price,
      cost: o.cost,
      profit: (o.price ?? 0) - (o.cost ?? 0),
      paymentStatus: o.paymentStatus,
      paidAt: o.paidAt?.toISOString() ?? null,
      dueDate: dueDate?.toISOString() ?? null,
      nextVisits,
    };
  });

  // Ordena: pendentes/atrasadas por data a vencer (mais próxima primeiro),
  // pagas vão para o fim ordenadas por data de pagamento decrescente.
  const recentPaid = recentRows.sort((a, b) => {
    const aPaid = a.paymentStatus === "PAID";
    const bPaid = b.paymentStatus === "PAID";
    if (aPaid !== bPaid) return aPaid ? 1 : -1; // não pagas primeiro
    if (!aPaid && !bPaid) {
      // ambas a vencer: mais próxima primeiro (sem data vai pro fim)
      const aT = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bT = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return aT - bT;
    }
    // ambas pagas: mais recente primeiro
    const aT = a.paidAt ? new Date(a.paidAt).getTime() : 0;
    const bT = b.paidAt ? new Date(b.paidAt).getTime() : 0;
    return bT - aT;
  }).slice(0, 15);

  // ── Computed summary ──────────────────────────────────────────────────────
  const revenueThis = thisMonthAgg.revenue;
  const costThis = thisMonthAgg.cost;
  const profitThis = revenueThis - costThis;
  const marginThis = revenueThis > 0 ? (profitThis / revenueThis) * 100 : 0;

  const revenueYear = yearAgg.revenue;
  const costYear = yearAgg.cost;
  const profitYear = revenueYear - costYear;

  const ticketAvg = thisMonthAgg.count > 0 ? revenueThis / thisMonthAgg.count : 0;

  const expenseThis = expensesThisMonth._sum.amount ?? 0;
  const expenseYear = expensesYear._sum.amount ?? 0;
  const balanceThis = revenueThis - expenseThis;
  const balanceYear = revenueYear - expenseYear;

  return {
    revenueThis, costThis, profitThis, marginThis, ticketAvg,
    revenueYear, costYear, profitYear,
    expenseThis, expenseYear, balanceThis, balanceYear,
    expenseCountThis: expensesThisMonth._count,
    pendingValue: pendingAgg._sum.price ?? 0,
    pendingCount: pendingAgg._count,
    overdueValue: overdueAgg._sum.price ?? 0,
    overdueCount: overdueAgg._count,
    totalOrders,
    monthlySeries,
    byTechnician,
    byServiceType,
    recentPaid,
  };
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const SERVICE_TYPE_PT: Record<string, string> = {
  INSPECTION: "Inspeção",
  TREATMENT: "Tratamento",
  RETURN: "Retorno",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function FinanceiroPage() {
  const session = await auth();
  const role = session?.user?.role as Role;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/");

  let data: Awaited<ReturnType<typeof getFinancialReport>> | null = null;
  try {
    data = await getFinancialReport();
  } catch {
    // DB offline — show zeros
  }

  const d = data ?? {
    revenueThis: 0, costThis: 0, profitThis: 0, marginThis: 0, ticketAvg: 0,
    revenueYear: 0, costYear: 0, profitYear: 0,
    expenseThis: 0, expenseYear: 0, balanceThis: 0, balanceYear: 0, expenseCountThis: 0,
    pendingValue: 0, pendingCount: 0, overdueValue: 0, overdueCount: 0, totalOrders: 0,
    monthlySeries: [], byTechnician: [], byServiceType: [], recentPaid: [],
  };

  const now = new Date();
  const monthLabel = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold leading-none" style={{ color: "var(--text)" }}>
            FINANCEIRO
          </h1>
          <p className="text-sm mt-1 capitalize" style={{ color: "var(--text-muted)" }}>
            Relatório de {monthLabel}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/financeiro/despesas"
            className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-bold transition-opacity hover:opacity-80"
            style={{ background: "var(--card-bg)", border: "1px solid #d0d5e8", color: "var(--text-muted)" }}
          >
            💸 Despesas
          </Link>
          <Link
            href="/financeiro/fluxo"
            className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-bold transition-opacity hover:opacity-80"
            style={{ background: "var(--card-bg)", border: "1px solid #d0d5e8", color: "var(--text-muted)" }}
          >
            📊 Fluxo de Caixa
          </Link>
          <Link
            href="/financeiro/despesas/new"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90"
            style={{ background: "#dc2626" }}
          >
            <span className="text-base leading-none">+</span> Nova Despesa
          </Link>
        </div>
      </div>

      {/* KPI row — This Month */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
          Este mês
        </p>
        <div className="kpi-row">
          <KpiCard label="Entradas (Receitas)" value={formatCurrency(d.revenueThis)} />
          <KpiCard
            label="Saídas (Despesas)"
            value={formatCurrency(d.expenseThis)}
            subtext={d.expenseCountThis > 0 ? `${d.expenseCountThis} lançamentos` : undefined}
          />
          <KpiCard
            label="Saldo do Mês"
            value={formatCurrency(d.balanceThis)}
            subtext={d.balanceThis >= 0 ? "Positivo" : "Negativo"}
          />
          <KpiCard label="Ticket médio" value={formatCurrency(d.ticketAvg)} />
        </div>
      </div>

      {/* KPI row — Year + Receivables */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
          Acumulado {now.getFullYear()}
        </p>
        <div className="kpi-row">
          <KpiCard label="Receita anual" value={formatCurrency(d.revenueYear)} />
          <KpiCard label="Despesas anuais" value={formatCurrency(d.expenseYear)} />
          <KpiCard
            label="Saldo anual"
            value={formatCurrency(d.balanceYear)}
            subtext={d.balanceYear >= 0 ? "Positivo" : "Negativo"}
          />
          <KpiCard
            label="A receber (pendente)"
            value={formatCurrency(d.pendingValue)}
            subtext={d.pendingCount > 0 ? `${d.pendingCount} OS pendente${d.pendingCount !== 1 ? "s" : ""}` : undefined}
          />
        </div>
      </div>

      {/* Charts — revenue + profit over 6 months */}
      <FinanceCharts monthlySeries={d.monthlySeries} />

      {/* By Technician + By Service Type */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* By Technician */}
        <SectionCard title="Faturamento por Técnico (este mês)">
          {d.byTechnician.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)" }}>
              Nenhuma OS paga este mês.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {["Técnico", "Faturamento", "Custo", "Lucro", "Margem"].map((h) => (
                    <th
                      key={h}
                      className="text-left pb-3 text-xs font-bold uppercase tracking-wide border-b px-1"
                      style={{ color: "var(--text-muted)", borderColor: "#d0d5e8" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.byTechnician.map((t) => {
                  const margin = t.revenue > 0 ? (t.profit / t.revenue) * 100 : 0;
                  return (
                    <tr key={t.name} className="border-b last:border-0" style={{ borderColor: "#dde1ed" }}>
                      <td className="px-1 py-2.5 font-medium" style={{ color: "var(--text)" }}>{t.name}</td>
                      <td className="px-1 py-2.5 font-semibold" style={{ color: "var(--navy)" }}>{formatCurrency(t.revenue)}</td>
                      <td className="px-1 py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>{formatCurrency(t.cost)}</td>
                      <td className="px-1 py-2.5 font-semibold" style={{ color: t.profit >= 0 ? "#059669" : "#ef4444" }}>{formatCurrency(t.profit)}</td>
                      <td className="px-1 py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>{margin.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </SectionCard>

        {/* By Service Type */}
        <SectionCard title="Faturamento por Tipo de Serviço (este mês)">
          {d.byServiceType.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)" }}>
              Nenhuma OS paga este mês.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {["Tipo", "Faturamento", "Custo", "Lucro", "OS"].map((h) => (
                    <th
                      key={h}
                      className="text-left pb-3 text-xs font-bold uppercase tracking-wide border-b px-1"
                      style={{ color: "var(--text-muted)", borderColor: "#d0d5e8" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.byServiceType.map((t) => (
                  <tr key={t.type} className="border-b last:border-0" style={{ borderColor: "#dde1ed" }}>
                    <td className="px-1 py-2.5 font-medium" style={{ color: "var(--text)" }}>
                      {SERVICE_TYPE_PT[t.type] ?? t.type}
                    </td>
                    <td className="px-1 py-2.5 font-semibold" style={{ color: "var(--navy)" }}>{formatCurrency(t.revenue)}</td>
                    <td className="px-1 py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>{formatCurrency(t.cost)}</td>
                    <td className="px-1 py-2.5 font-semibold" style={{ color: t.profit >= 0 ? "#059669" : "#ef4444" }}>{formatCurrency(t.profit)}</td>
                    <td className="px-1 py-2.5 text-center font-semibold" style={{ color: "var(--navy)" }}>{t.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
      </div>

      {/* Recent OS — paid, pending, overdue (clicável → cronograma de visitas) */}
      <SectionCard title="Últimas OS Financeiras">
        <RecentOrdersTable rows={d.recentPaid} />
      </SectionCard>
    </div>
  );
}
