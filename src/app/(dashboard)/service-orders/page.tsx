import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  SERVICE_TYPE_LABELS,
} from "@/lib/labels";
import { formatDate, shortId } from "@/lib/format";
import { ServiceOrdersFilter } from "./ServiceOrdersFilter";
import { KanbanBoard } from "./KanbanBoard";
import { KpiCard } from "@/components/ui/KpiCard";
import { Badge } from "@/components/ui/Badge";
import { SectionCard } from "@/components/ui/SectionCard";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteServiceOrder } from "@/lib/delete-actions";
import type { ServiceOrderStatus } from "@prisma/client";

const PAGE_SIZE = 10;

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string; view?: string }>;
}

const ALL_STATUSES = Object.keys(STATUS_LABELS) as ServiceOrderStatus[];

// Map service order status to Badge variant
function statusToBadgeVariant(
  status: ServiceOrderStatus
): "green" | "yellow" | "red" | "blue" | "gray" | "navy" {
  if (["SERVICE_EXECUTED", "CERTIFICATE_ISSUED", "WARRANTY_ACTIVE", "CLOSED"].includes(status))
    return "green";
  if (["QUOTE_CREATED", "QUOTE_APPROVED", "SERVICE_SCHEDULED", "INSPECTION_SCHEDULED"].includes(status))
    return "blue";
  if (["LEAD_CAPTURED", "VISIT_DONE"].includes(status)) return "gray";
  if (["QUOTE_REJECTED"].includes(status)) return "yellow";
  if (["CANCELED"].includes(status)) return "red";
  return "gray";
}

export default async function ServiceOrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  // Kanban is the default view
  const view = params.view === "lista" ? "lista" : "kanban";
  const statusFilter =
    params.status && ALL_STATUSES.includes(params.status as ServiceOrderStatus)
      ? (params.status as ServiceOrderStatus)
      : undefined;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;
  const where = statusFilter ? { status: statusFilter } : {};

  // ── KPI stats ─────────────────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [activeCount, todayCount, completedThisMonth, canceledThisMonth] =
    await Promise.all([
      prisma.serviceOrder.count({ where: { status: { notIn: ["CLOSED", "CANCELED"] } } }),
      prisma.technicalVisit.count({ where: { scheduledAt: { gte: today, lt: tomorrow } } }),
      prisma.serviceOrder.count({
        where: { status: "SERVICE_EXECUTED", updatedAt: { gte: monthStart } },
      }),
      prisma.serviceOrder.count({
        where: { status: "CANCELED", updatedAt: { gte: monthStart } },
      }),
    ]).catch(() => [0, 0, 0, 0]);

  // ── Kanban data ───────────────────────────────────────────────────────────
  const kanbanOrders =
    view === "kanban"
      ? await prisma.serviceOrder.findMany({
          where: { status: { notIn: ["CLOSED", "CANCELED"] } },
          orderBy: { updatedAt: "desc" },
          take: 200,
          select: {
            id: true,
            status: true,
            serviceType: true,
            isFree: true,
            scheduledAt: true,
            customer: { select: { fullName: true } },
            technician: { select: { name: true } },
          },
        })
      : [];

  // ── List data ─────────────────────────────────────────────────────────────
  const [orders, total] =
    view === "lista"
      ? await Promise.all([
          prisma.serviceOrder.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: PAGE_SIZE,
            select: {
              id: true,
              status: true,
              serviceType: true,
              isFree: true,
              scheduledAt: true,
              createdAt: true,
              customer: { select: { fullName: true } },
              technician: { select: { name: true } },
            },
          }),
          prisma.serviceOrder.count({ where }),
        ])
      : [[], 0];

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const buildListUrl = (p: number, s?: string) => {
    const qs = new URLSearchParams();
    qs.set("view", "lista");
    if (s) qs.set("status", s);
    if (p > 1) qs.set("page", String(p));
    return `/service-orders?${qs.toString()}`;
  };

  const viewUrl = (v: "lista" | "kanban") => {
    const qs = new URLSearchParams();
    qs.set("view", v);
    if (statusFilter) qs.set("status", statusFilter);
    return `/service-orders?${qs.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold leading-none" style={{ color: "var(--text)" }}>
            ORDENS DE SERVIÇO
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {view === "lista"
              ? `${total} ordem${total !== 1 ? "s" : ""} encontrada${total !== 1 ? "s" : ""}`
              : `${kanbanOrders.length} ordem${kanbanOrders.length !== 1 ? "s" : ""} ativa${kanbanOrders.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div
            className="flex rounded-full overflow-hidden border"
            style={{ borderColor: "#d0d5e8", background: "var(--card-bg)" }}
          >
            <Link
              href={viewUrl("kanban")}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-colors"
              style={
                view === "kanban"
                  ? { background: "var(--navy)", color: "#fff" }
                  : { color: "var(--text-muted)" }
              }
            >
              <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13">
                <rect x="1" y="1" width="4" height="14" rx="1" />
                <rect x="6" y="1" width="4" height="10" rx="1" />
                <rect x="11" y="1" width="4" height="12" rx="1" />
              </svg>
              Kanban
            </Link>
            <Link
              href={viewUrl("lista")}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-l transition-colors"
              style={
                view === "lista"
                  ? { background: "var(--navy)", color: "#fff", borderColor: "#d0d5e8" }
                  : { color: "var(--text-muted)", borderColor: "#d0d5e8" }
              }
            >
              <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13">
                <rect x="1" y="2" width="14" height="2.5" rx="1" />
                <rect x="1" y="6.75" width="14" height="2.5" rx="1" />
                <rect x="1" y="11.5" width="14" height="2.5" rx="1" />
              </svg>
              Lista
            </Link>
          </div>

          {/* New OS */}
          <Link
            href="/service-orders/new"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ background: "var(--navy)" }}
          >
            <span className="text-base leading-none">+</span>
            Nova OS
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <div className="kpi-row">
        <KpiCard label="OS Ativas" value={activeCount as number} />
        <KpiCard label="Agendadas Hoje" value={todayCount as number} />
        <KpiCard label="Concluídas este mês" value={completedThisMonth as number} />
        <KpiCard label="Canceladas este mês" value={canceledThisMonth as number} />
      </div>

      {/* ── KANBAN VIEW ──────────────────────────────────────────────────── */}
      {view === "kanban" && <KanbanBoard orders={kanbanOrders} />}

      {/* ── LIST VIEW ────────────────────────────────────────────────────── */}
      {view === "lista" && (
        <>
          <ServiceOrdersFilter currentStatus={statusFilter} />

          {/* Desktop table */}
          <SectionCard title="Todas as Ordens de Serviço">
            <div className="hidden md:block table-scroll">
              <table className="table-hover w-full text-sm">
                <thead>
                  <tr>
                    {["OS", "Cliente", "Status", "Tipo", "Técnico", "Agendado", "Ações"].map((h) => (
                      <th
                        key={h}
                        className="text-left pb-3 text-xs font-bold uppercase tracking-wide border-b px-2"
                        style={{ color: "var(--text-muted)", borderColor: "#d0d5e8" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-2 py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                        Nenhuma ordem de serviço encontrada.
                      </td>
                    </tr>
                  ) : (
                    orders.map((os) => (
                      <tr
                        key={os.id}
                        className="border-b last:border-0"
                        style={{ borderColor: "#dde1ed" }}
                      >
                        <td className="px-2 py-3">
                          <Link
                            href={`/service-orders/${os.id}`}
                            className="font-mono text-xs font-bold hover:underline"
                            style={{ color: "var(--navy)" }}
                          >
                            {shortId(os.id)}
                          </Link>
                          {os.isFree && (
                            <Badge variant="yellow" label="Grátis" />
                          )}
                        </td>
                        <td className="px-2 py-3 font-medium" style={{ color: "var(--text)" }}>
                          <Link
                            href={`/service-orders/${os.id}`}
                            className="hover:underline"
                            style={{ color: "var(--text)" }}
                          >
                            {os.customer.fullName}
                          </Link>
                        </td>
                        <td className="px-2 py-3">
                          <Badge
                            variant={statusToBadgeVariant(os.status)}
                            label={STATUS_LABELS[os.status]}
                          />
                        </td>
                        <td className="px-2 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                          {SERVICE_TYPE_LABELS[os.serviceType]}
                        </td>
                        <td className="px-2 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                          {os.technician?.name ?? "—"}
                        </td>
                        <td className="px-2 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                          {formatDate(os.scheduledAt)}
                        </td>
                        <td className="px-2 py-3">
                          <DeleteButton
                            size="sm"
                            action={async () => {
                              "use server";
                              return deleteServiceOrder(os.id);
                            }}
                            confirmMessage={`Apagar OS ${shortId(os.id)} de "${os.customer.fullName}"?\n\nTodos os dados desta OS (visitas, certificado, garantia, despesas vinculadas) serão removidos. Esta ação não pode ser desfeita.`}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {orders.length === 0 ? (
                <p className="py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                  Nenhuma ordem de serviço encontrada.
                </p>
              ) : (
                orders.map((os) => (
                  <Link
                    key={os.id}
                    href={`/service-orders/${os.id}`}
                    className="block rounded-[14px] border p-4 shadow-sm transition-all"
                    style={{ background: "var(--white)", borderColor: "#dde1ed" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold" style={{ color: "var(--navy)" }}>
                        {shortId(os.id)}
                      </span>
                      <Badge variant={statusToBadgeVariant(os.status)} label={STATUS_LABELS[os.status]} />
                    </div>
                    <p className="mt-1 font-semibold" style={{ color: "var(--text)" }}>
                      {os.customer.fullName}
                    </p>
                    <div className="mt-1 flex gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
                      <span>{SERVICE_TYPE_LABELS[os.serviceType]}</span>
                      {os.technician && <span>— {os.technician.name}</span>}
                    </div>
                    {os.scheduledAt && (
                      <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                        Agendado: {formatDate(os.scheduledAt)}
                      </p>
                    )}
                  </Link>
                ))
              )}
            </div>
          </SectionCard>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm" style={{ color: "var(--text-muted)" }}>
              <span>Página {page} de {totalPages}</span>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link href={buildListUrl(page - 1, statusFilter)} className="rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors" style={{ borderColor: "#d0d5e8" }}>
                    ← Anterior
                  </Link>
                ) : (
                  <span className="rounded-full border px-4 py-1.5 text-xs cursor-not-allowed opacity-40" style={{ borderColor: "#d0d5e8" }}>← Anterior</span>
                )}
                {page < totalPages ? (
                  <Link href={buildListUrl(page + 1, statusFilter)} className="rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors" style={{ borderColor: "#d0d5e8" }}>
                    Próximo →
                  </Link>
                ) : (
                  <span className="rounded-full border px-4 py-1.5 text-xs cursor-not-allowed opacity-40" style={{ borderColor: "#d0d5e8" }}>Próximo →</span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
