import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/format";
import { KpiCard } from "@/components/ui/KpiCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { Badge } from "@/components/ui/Badge";
import { FaturamentoChart, OsChart } from "@/components/charts/DashboardCharts";
import type { Role } from "@prisma/client";

// ---------------------------------------------------------------------------
// Mock data — used when DB tables are empty
// ---------------------------------------------------------------------------

const MOCK_VISITS = [
  { id: "1", customerName: "Restaurante Sabor & Arte", technicianName: "Carlos Mendes", scheduledAt: new Date(Date.now() + 1 * 86400000), daysLeft: 1 },
  { id: "2", customerName: "Condomínio Jardins", technicianName: "Ana Lima", scheduledAt: new Date(Date.now() + 2 * 86400000), daysLeft: 2 },
  { id: "3", customerName: "Hotel Beira Mar", technicianName: "Carlos Mendes", scheduledAt: new Date(Date.now() + 4 * 86400000), daysLeft: 4 },
  { id: "4", customerName: "Escola Municipal Ipê", technicianName: "Pedro Costa", scheduledAt: new Date(Date.now() + 7 * 86400000), daysLeft: 7 },
  { id: "5", customerName: "Clínica São Lucas", technicianName: "Ana Lima", scheduledAt: new Date(Date.now() + 10 * 86400000), daysLeft: 10 },
];

const MOCK_WARRANTIES = [
  { id: "1", customerName: "Supermercado Bom Preço", expiresAt: new Date(Date.now() + 3 * 86400000), daysLeft: 3 },
  { id: "2", customerName: "Pousada Vista Mar", expiresAt: new Date(Date.now() + 8 * 86400000), daysLeft: 8 },
  { id: "3", customerName: "Academia Fitness Plus", expiresAt: new Date(Date.now() + 15 * 86400000), daysLeft: 15 },
  { id: "4", customerName: "Farmácia Saúde Total", expiresAt: new Date(Date.now() + 22 * 86400000), daysLeft: 22 },
  { id: "5", customerName: "Escritório Contábil MR", expiresAt: new Date(Date.now() + 28 * 86400000), daysLeft: 28 },
];

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

async function getOrdersByMonth(): Promise<{ label: string; count: number }[]> {
  const now = new Date();
  // Build the 6-month window in one query using groupBy
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const rows = await prisma.serviceOrder.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true },
  });

  // Build month buckets client-side to avoid 6 round-trips
  const buckets = new Map<string, number>();
  const ranges = Array.from({ length: 6 }, (_, i) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = start.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    buckets.set(label, 0);
    return { start, label };
  });

  for (const row of rows) {
    const d = row.createdAt;
    const label = new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString("pt-BR", {
      month: "short",
      year: "2-digit",
    });
    if (buckets.has(label)) buckets.set(label, (buckets.get(label) ?? 0) + 1);
  }

  return ranges.map(({ label }) => ({ label, count: buckets.get(label) ?? 0 }));
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

export default async function DashboardPage() {
  // auth() is already called in the layout — NextAuth caches the session
  // within the same request via its internal cache, so this adds minimal
  // overhead. We still call it here to access user data in the Server Component.
  const session = await auth();
  const role = session?.user?.role as Role;
  const isPrivileged = role === "ADMIN" || role === "MANAGER";

  let stats = { openOrders: 0, todayVisits: 0, expiringWarranties: 0, lowStockItems: 0 };
  let prevStats = { prevOpenOrders: 0 };
  let ordersByMonth: { label: string; count: number }[] = [];
  let upcomingVisitsRaw: Awaited<ReturnType<typeof getUpcomingVisits>> = [];
  let expiringWarrantiesRaw: Awaited<ReturnType<typeof getExpiringWarranties>> = [];

  try {
    [stats, prevStats, ordersByMonth, upcomingVisitsRaw, expiringWarrantiesRaw] = await Promise.all([
      getDashboardStats(),
      getComparisonStats(),
      getOrdersByMonth(),
      getUpcomingVisits(),
      getExpiringWarranties(),
    ]);
  } catch {
    // DB not connected — show zeros and mock data
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  type VisitRow = { id: string; customerName: string; technicianName: string; scheduledAt: Date; daysLeft: number };
  const visitsToShow: VisitRow[] =
    upcomingVisitsRaw.length > 0
      ? upcomingVisitsRaw.map((v) => {
          const msLeft = v.scheduledAt.getTime() - now.getTime();
          return {
            id: v.id,
            customerName: v.serviceOrder?.customer?.fullName ?? "—",
            technicianName: v.technician?.name ?? "—",
            scheduledAt: v.scheduledAt,
            daysLeft: Math.ceil(msLeft / (1000 * 60 * 60 * 24)),
          };
        })
      : MOCK_VISITS;

  type WarrantyRow = { id: string; customerName: string; expiresAt: Date; daysLeft: number };
  const warrantiesToShow: WarrantyRow[] =
    expiringWarrantiesRaw.length > 0
      ? expiringWarrantiesRaw.map((w) => {
          const msLeft = w.expiresAt.getTime() - now.getTime();
          return {
            id: w.id,
            customerName: w.serviceOrder?.customer?.fullName ?? "—",
            expiresAt: w.expiresAt,
            daysLeft: Math.ceil(msLeft / (1000 * 60 * 60 * 24)),
          };
        })
      : MOCK_WARRANTIES;

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
        <FaturamentoChart />
        <OsChart monthlyData={ordersByMonth} />
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <SectionCard title="Próximos Agendamentos">
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
        </SectionCard>

        <SectionCard title="Garantias Vencendo em Breve">
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
        </SectionCard>
      </div>
    </div>
  );
}
