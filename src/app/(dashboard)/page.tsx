import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/format";
import { KpiCard } from "@/components/ui/KpiCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { Badge } from "@/components/ui/Badge";
import { FaturamentoChart, OsChart, type PeriodSeries } from "@/components/charts/DashboardCharts";
import type { Role } from "@prisma/client";

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const in45Days = new Date();
  in45Days.setDate(in45Days.getDate() + 45);

  const [openOrders, todayVisits, expiringWarranties, lowStockItems] =
    await Promise.all([
      prisma.serviceOrder.count({
        where: { status: { notIn: ["CLOSED", "CANCELED"] } },
      }),
      prisma.technicalVisit.count({
        where: { scheduledAt: { gte: today, lt: tomorrow } },
      }),
      prisma.warranty.count({
        where: { status: "ACTIVE", expiresAt: { lte: in45Days } },
      }),
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint as count FROM "StockItem"
        WHERE quantity <= "minThreshold"
      `.then((r) => Number(r[0]?.count ?? 0)),
    ]);

  return { openOrders, todayVisits, expiringWarranties, lowStockItems };
}

async function getComparisonStats() {
  const now = new Date();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevOpenOrders = await prisma.serviceOrder.count({
    where: {
      status: { notIn: ["CLOSED", "CANCELED"] },
      createdAt: { gte: prevMonthStart, lt: prevMonthEnd },
    },
  });
  return { prevOpenOrders };
}

function getMondayOfWeek(now: Date): Date {
  const d = new Date(now);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

async function getChartData() {
  const now = new Date();
  const monday = getMondayOfWeek(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [paidRows, allYearRows] = await Promise.all([
    prisma.serviceOrder.findMany({
      where: { paymentStatus: "PAID", paidAt: { gte: yearStart } },
      select: { price: true, paidAt: true },
    }),
    prisma.serviceOrder.findMany({
      where: { createdAt: { gte: monthStart } },
      select: { createdAt: true },
    }),
  ]);

  const weekLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const weekLabelsMonth = ["Sem 1", "Sem 2", "Sem 3", "Sem 4"];
  const yearLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  // Revenue
  const revWeek = [0, 0, 0, 0, 0, 0];
  const revMonth = [0, 0, 0, 0];
  const revYear = Array(12).fill(0);

  for (const row of paidRows) {
    if (!row.paidAt) continue;
    const val = row.price ?? 0;
    // yearly
    revYear[row.paidAt.getMonth()] += val;
    // monthly (current month only)
    if (row.paidAt >= monthStart) {
      revMonth[Math.min(Math.floor((row.paidAt.getDate() - 1) / 7), 3)] += val;
    }
    // weekly (current week only)
    if (row.paidAt >= monday) {
      const day = row.paidAt.getDay();
      const idx = day === 0 ? 6 : day - 1;
      if (idx < 6) revWeek[idx] += val;
    }
  }

  // OS counts
  const osWeek = [0, 0, 0, 0, 0, 0];
  const osMonth = [0, 0, 0, 0];

  for (const row of allYearRows) {
    // monthly buckets
    osMonth[Math.min(Math.floor((row.createdAt.getDate() - 1) / 7), 3)]++;
    // weekly buckets (only from monday)
    if (row.createdAt >= monday) {
      const day = row.createdAt.getDay();
      const idx = day === 0 ? 6 : day - 1;
      if (idx < 6) osWeek[idx]++;
    }
  }

  // OS by month for "ano" view (all 12 months of current year)
  const osYear = Array(12).fill(0);
  for (const row of allYearRows) {
    osYear[row.createdAt.getMonth()]++;
  }
  // also need OS from full year start — allYearRows only goes from monthStart, re-fetch needed
  const allOsYear = await prisma.serviceOrder.findMany({
    where: { createdAt: { gte: yearStart } },
    select: { createdAt: true },
  });
  const osYearFull = Array(12).fill(0);
  for (const row of allOsYear) {
    osYearFull[row.createdAt.getMonth()]++;
  }

  return {
    revenue: {
      semana: { labels: weekLabels, data: revWeek } as PeriodSeries,
      mes: { labels: weekLabelsMonth, data: revMonth } as PeriodSeries,
      ano: { labels: yearLabels, data: revYear } as PeriodSeries,
    },
    os: {
      semana: { labels: weekLabels, data: osWeek } as PeriodSeries,
      mes: { labels: weekLabelsMonth, data: osMonth } as PeriodSeries,
      ano: { labels: yearLabels, data: osYearFull } as PeriodSeries,
    },
  };
}

async function getUpcomingVisits() {
  const now = new Date();
  return prisma.technicalVisit.findMany({
    where: { scheduledAt: { gte: now } },
    orderBy: { scheduledAt: "asc" },
    take: 5,
    include: {
      technician: { select: { name: true } },
      serviceOrder: { include: { customer: { select: { fullName: true } } } },
    },
  });
}

async function getExpiringWarranties() {
  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  return prisma.warranty.findMany({
    where: { status: "ACTIVE", expiresAt: { gte: now, lte: in30Days } },
    orderBy: { expiresAt: "asc" },
    take: 5,
    include: {
      serviceOrder: { include: { customer: { select: { fullName: true } } } },
    },
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const EMPTY_SERIES: PeriodSeries = { labels: [], data: [] };
const WEEK_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const WEEK_MONTHS = ["Sem 1", "Sem 2", "Sem 3", "Sem 4"];
const YEAR_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const EMPTY_CHART = {
  revenue: {
    semana: { labels: WEEK_LABELS, data: [0, 0, 0, 0, 0, 0] } as PeriodSeries,
    mes: { labels: WEEK_MONTHS, data: [0, 0, 0, 0] } as PeriodSeries,
    ano: { labels: YEAR_LABELS, data: Array(12).fill(0) } as PeriodSeries,
  },
  os: {
    semana: { labels: WEEK_LABELS, data: [0, 0, 0, 0, 0, 0] } as PeriodSeries,
    mes: { labels: WEEK_MONTHS, data: [0, 0, 0, 0] } as PeriodSeries,
    ano: { labels: YEAR_LABELS, data: Array(12).fill(0) } as PeriodSeries,
  },
};

export default async function DashboardPage() {
  const session = await auth();
  const role = session?.user?.role as Role;
  const isPrivileged = role === "ADMIN" || role === "MANAGER";

  let stats = { openOrders: 0, todayVisits: 0, expiringWarranties: 0, lowStockItems: 0 };
  let prevStats = { prevOpenOrders: 0 };
  let chartData = EMPTY_CHART;
  let upcomingVisitsRaw: Awaited<ReturnType<typeof getUpcomingVisits>> = [];
  let expiringWarrantiesRaw: Awaited<ReturnType<typeof getExpiringWarranties>> = [];

  try {
    [stats, prevStats, chartData, upcomingVisitsRaw, expiringWarrantiesRaw] = await Promise.all([
      getDashboardStats(),
      getComparisonStats(),
      getChartData(),
      getUpcomingVisits(),
      getExpiringWarranties(),
    ]);
  } catch {
    // DB not connected — show zeros
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  type VisitRow = { id: string; customerName: string; technicianName: string; scheduledAt: Date; daysLeft: number };
  const visitsToShow: VisitRow[] = upcomingVisitsRaw.map((v) => {
    const msLeft = v.scheduledAt.getTime() - now.getTime();
    return {
      id: v.id,
      customerName: v.serviceOrder?.customer?.fullName ?? "—",
      technicianName: v.technician?.name ?? "—",
      scheduledAt: v.scheduledAt,
      daysLeft: Math.ceil(msLeft / (1000 * 60 * 60 * 24)),
    };
  });

  type WarrantyRow = { id: string; customerName: string; expiresAt: Date; daysLeft: number };
  const warrantiesToShow: WarrantyRow[] = expiringWarrantiesRaw.map((w) => {
    const msLeft = w.expiresAt.getTime() - now.getTime();
    return {
      id: w.id,
      customerName: w.serviceOrder?.customer?.fullName ?? "—",
      expiresAt: w.expiresAt,
      daysLeft: Math.ceil(msLeft / (1000 * 60 * 60 * 24)),
    };
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            Bem-vindo de volta,{" "}
            <strong style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
              {session?.user?.name}
            </strong>
          </p>
        </div>
        <span
          className="shrink-0 capitalize"
          style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}
        >
          {dateStr}
        </span>
      </div>

      {/* Operational KPI row */}
      <div className="kpi-row">
        <KpiCard
          label="OS em aberto"
          value={stats.openOrders}
          trend={{ value: stats.openOrders - prevStats.prevOpenOrders, label: "vs mês passado" }}
        />
        <KpiCard label="Visitas hoje" value={stats.todayVisits} />
        {isPrivileged && (
          <>
            <KpiCard label="Garantias vencendo" value={stats.expiringWarranties} />
            <KpiCard label="Estoque baixo" value={stats.lowStockItems} />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <FaturamentoChart
          semana={chartData.revenue.semana}
          mes={chartData.revenue.mes}
          ano={chartData.revenue.ano}
        />
        <OsChart
          semana={chartData.os.semana}
          mes={chartData.os.mes}
          ano={chartData.os.ano}
        />
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <SectionCard title="Próximos Agendamentos">
          {visitsToShow.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: "var(--text-muted)" }}>
              Nenhuma visita agendada.
            </p>
          ) : (
            <div className="table-scroll">
              <table className="table-hover w-full text-sm">
                <thead>
                  <tr>
                    {["Cliente", "Data", "Técnico", ""].map((h) => (
                      <th key={h} className="text-left pb-3 text-xs font-bold uppercase tracking-wide border-b"
                        style={{ color: "var(--text-muted)", borderColor: "#d0d5e8" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visitsToShow.map((v) => (
                    <tr key={v.id} className="border-b last:border-0" style={{ borderColor: "#dde1ed" }}>
                      <td className="py-2.5 pr-3 font-medium" style={{ color: "var(--text)" }}>{v.customerName}</td>
                      <td className="py-2.5 pr-3 text-xs" style={{ color: "var(--text-muted)" }}>{formatDateTime(v.scheduledAt)}</td>
                      <td className="py-2.5 pr-3 text-xs" style={{ color: "var(--text-muted)" }}>{v.technicianName}</td>
                      <td className="py-2.5">
                        <Badge variant={v.daysLeft <= 1 ? "red" : v.daysLeft <= 3 ? "yellow" : "blue"}
                          label={v.daysLeft === 0 ? "Hoje" : `${v.daysLeft}d`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Garantias Vencendo em Breve">
          {warrantiesToShow.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: "var(--text-muted)" }}>
              Nenhuma garantia vencendo em 30 dias.
            </p>
          ) : (
            <div className="table-scroll">
              <table className="table-hover w-full text-sm">
                <thead>
                  <tr>
                    {["Cliente", "Vencimento", ""].map((h) => (
                      <th key={h} className="text-left pb-3 text-xs font-bold uppercase tracking-wide border-b"
                        style={{ color: "var(--text-muted)", borderColor: "#d0d5e8" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {warrantiesToShow.map((w) => (
                    <tr key={w.id} className="border-b last:border-0" style={{ borderColor: "#dde1ed" }}>
                      <td className="py-2.5 pr-3 font-medium" style={{ color: "var(--text)" }}>{w.customerName}</td>
                      <td className="py-2.5 pr-3 text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(w.expiresAt)}</td>
                      <td className="py-2.5">
                        <Badge variant={w.daysLeft <= 7 ? "red" : "yellow"} label={`${w.daysLeft}d`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
