import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, shortId } from "@/lib/format";
import { WarrantiesFilter } from "./WarrantiesFilter";
import { KpiCard } from "@/components/ui/KpiCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { Badge } from "@/components/ui/Badge";
import type { WarrantyStatus } from "@prisma/client";

const ALL_WARRANTY_STATUSES: WarrantyStatus[] = ["ACTIVE", "EXPIRED", "VOIDED"];

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

function getDaysRemaining(expiresAt: Date): number {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getStatusBadgeProps(warranty: {
  status: WarrantyStatus;
  expiresAt: Date;
}): { variant: "green" | "yellow" | "red" | "gray"; label: string } {
  const days = getDaysRemaining(warranty.expiresAt);
  if (warranty.status === "VOIDED") return { variant: "gray", label: "Cancelada" };
  if (warranty.status === "EXPIRED" || days <= 0) return { variant: "red", label: "Vencida" };
  if (days <= 30) return { variant: "yellow", label: `${days}d restantes` };
  return { variant: "green", label: `${days}d restantes` };
}

export default async function WarrantiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter =
    params.status && ALL_WARRANTY_STATUSES.includes(params.status as WarrantyStatus)
      ? (params.status as WarrantyStatus)
      : undefined;

  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  const [warranties, activeCount, expiringSoonCount, expiredCount] = await Promise.all([
    prisma.warranty.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      orderBy: { expiresAt: "asc" },
      select: {
        id: true, startsAt: true, expiresAt: true, status: true,
        serviceOrder: {
          select: {
            id: true, customerId: true,
            customer: { select: { fullName: true } },
          },
        },
      },
    }),
    prisma.warranty.count({ where: { status: "ACTIVE" } }),
    prisma.warranty.count({
      where: { status: "ACTIVE", expiresAt: { gte: now, lte: in30Days } },
    }),
    prisma.warranty.count({ where: { status: "EXPIRED" } }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold leading-none" style={{ color: "var(--text)" }}>
          GARANTIAS
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Acompanhamento de garantias emitidas
        </p>
      </div>

      {/* KPI row */}
      <div className="kpi-row">
        <KpiCard label="Garantias ativas" value={activeCount} />
        <KpiCard label="Vencendo em 30 dias" value={expiringSoonCount} />
        <KpiCard label="Vencidas" value={expiredCount} />
      </div>

      {/* Filter */}
      <WarrantiesFilter currentStatus={statusFilter} />

      {/* Table */}
      <SectionCard title="Todas as Garantias">
        <div className="hidden md:block table-scroll">
          <table className="table-hover w-full text-sm">
            <thead>
              <tr>
                {["Cliente", "OS", "Início", "Vencimento", "Dias Restantes", "Status"].map((h) => (
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
              {warranties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-2 py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    Nenhuma garantia encontrada.
                  </td>
                </tr>
              ) : (
                warranties.map((w) => {
                  const days = getDaysRemaining(w.expiresAt);
                  const bp = getStatusBadgeProps(w);
                  return (
                    <tr
                      key={w.id}
                      className="border-b last:border-0"
                      style={{ borderColor: "#dde1ed" }}
                    >
                      <td className="px-2 py-3 font-medium">
                        <Link href={`/customers/${w.serviceOrder.customerId}`} className="hover:underline" style={{ color: "var(--text)" }}>
                          {w.serviceOrder.customer.fullName}
                        </Link>
                      </td>
                      <td className="px-2 py-3">
                        <Link href={`/service-orders/${w.serviceOrder.id}`} className="font-mono text-xs font-bold hover:underline" style={{ color: "var(--navy)" }}>
                          {shortId(w.serviceOrder.id)}
                        </Link>
                      </td>
                      <td className="px-2 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{formatDate(w.startsAt)}</td>
                      <td className="px-2 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{formatDate(w.expiresAt)}</td>
                      <td className="px-2 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                        {w.status === "VOIDED" ? "—" : days <= 0 ? "Vencida" : `${days} dia${days !== 1 ? "s" : ""}`}
                      </td>
                      <td className="px-2 py-3">
                        <Badge variant={bp.variant} label={bp.label} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {warranties.map((w) => {
            const days = getDaysRemaining(w.expiresAt);
            const bp = getStatusBadgeProps(w);
            return (
              <div key={w.id} className="rounded-[14px] border p-4 shadow-sm" style={{ background: "var(--white)", borderColor: "#dde1ed" }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold" style={{ color: "var(--text)" }}>{w.serviceOrder.customer.fullName}</p>
                    <Link href={`/service-orders/${w.serviceOrder.id}`} className="font-mono text-xs font-bold hover:underline" style={{ color: "var(--navy)" }}>
                      {shortId(w.serviceOrder.id)}
                    </Link>
                  </div>
                  <Badge variant={bp.variant} label={bp.label} />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: "var(--text-muted)" }}>
                  <span>Início: {formatDate(w.startsAt)}</span>
                  <span>Venc: {formatDate(w.expiresAt)}</span>
                  {w.status !== "VOIDED" && (
                    <span>{days <= 0 ? "Vencida" : `${days} dia${days !== 1 ? "s" : ""} restante${days !== 1 ? "s" : ""}`}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
