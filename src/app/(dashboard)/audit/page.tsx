import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime, shortId } from "@/lib/format";
import Link from "next/link";
import { AuditEntityFilter } from "./AuditEntityFilter";
import { SectionCard } from "@/components/ui/SectionCard";
import { Badge } from "@/components/ui/Badge";

const PAGE_SIZE = 20;

const ENTITY_OPTIONS = [
  { value: "", label: "Todas as entidades" },
  { value: "ServiceOrder", label: "Ordem de Serviço" },
  { value: "Customer", label: "Cliente" },
  { value: "StockItem", label: "Estoque" },
  { value: "User", label: "Usuário" },
  { value: "Warranty", label: "Garantia" },
  { value: "Certificate", label: "Certificado" },
  { value: "Quote", label: "Orçamento" },
];

type BadgeVariant = "green" | "yellow" | "red" | "blue" | "gray" | "navy";

const ENTITY_BADGE: Record<string, { variant: BadgeVariant; label: string }> = {
  ServiceOrder:  { variant: "green",  label: "Ordem de Serviço" },
  Customer:      { variant: "blue",   label: "Cliente" },
  StockItem:     { variant: "yellow", label: "Estoque" },
  User:          { variant: "navy",   label: "Usuário" },
  Warranty:      { variant: "red",    label: "Garantia" },
  Certificate:   { variant: "green",  label: "Certificado" },
  Quote:         { variant: "gray",   label: "Orçamento" },
};

interface PageProps {
  searchParams: Promise<{ entity?: string; page?: string }>;
}

export default async function AuditPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const params = await searchParams;
  const entityFilter = params.entity?.trim() || undefined;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;
  const where = entityFilter ? { entityName: entityFilter } : {};

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true, entityName: true, entityId: true,
        field: true, oldValue: true, newValue: true,
        timestamp: true, serviceOrderId: true,
        user: { select: { name: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const buildUrl = (p: number, entity?: string) => {
    const qs = new URLSearchParams();
    if (entity) qs.set("entity", entity);
    if (p > 1) qs.set("page", String(p));
    const str = qs.toString();
    return `/audit${str ? `?${str}` : ""}`;
  };

  function truncate(value: string | null, max = 40): string {
    if (!value) return "—";
    return value.length > max ? value.slice(0, max) + "…" : value;
  }

  function getEntityBadge(name: string) {
    return ENTITY_BADGE[name] ?? { variant: "gray" as BadgeVariant, label: name };
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold leading-none" style={{ color: "var(--text)" }}>
          AUDITORIA
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {total} registro{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Filter */}
      <AuditEntityFilter currentEntity={entityFilter} options={ENTITY_OPTIONS} />

      {/* Table */}
      <SectionCard title="Log de Atividades">
        <div className="hidden md:block table-scroll">
          <table className="table-hover w-full text-sm">
            <thead>
              <tr>
                {["Data/Hora", "Usuário", "Módulo", "ID", "Campo", "Valor Anterior", "Novo Valor"].map((h) => (
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
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const eb = getEntityBadge(log.entityName);
                  return (
                    <tr
                      key={log.id}
                      className="border-b last:border-0"
                      style={{ borderColor: "#dde1ed" }}
                    >
                      <td className="px-2 py-3 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="px-2 py-3 font-semibold text-sm" style={{ color: "var(--text)" }}>
                        {log.user.name}
                      </td>
                      <td className="px-2 py-3">
                        <Badge variant={eb.variant} label={eb.label} />
                      </td>
                      <td className="px-2 py-3">
                        {log.serviceOrderId ? (
                          <Link href={`/service-orders/${log.serviceOrderId}`} className="font-mono text-xs font-bold hover:underline" style={{ color: "var(--navy)" }}>
                            {shortId(log.entityId)}
                          </Link>
                        ) : (
                          <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                            {shortId(log.entityId)}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-3 font-mono text-xs" style={{ color: "var(--text)" }}>
                        {log.field}
                      </td>
                      <td className="px-2 py-3 text-xs max-w-xs" style={{ color: "var(--text-muted)" }}>
                        <span title={log.oldValue ?? undefined}>{truncate(log.oldValue)}</span>
                      </td>
                      <td className="px-2 py-3 text-xs font-medium max-w-xs" style={{ color: "var(--text)" }}>
                        <span title={log.newValue ?? undefined}>{truncate(log.newValue)}</span>
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
          {logs.length === 0 ? (
            <p className="py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Nenhum registro encontrado.
            </p>
          ) : (
            logs.map((log) => {
              const eb = getEntityBadge(log.entityName);
              return (
                <div key={log.id} className="rounded-[14px] border p-4 shadow-sm" style={{ background: "var(--white)", borderColor: "#dde1ed" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDateTime(log.timestamp)}</p>
                      <p className="font-semibold mt-0.5" style={{ color: "var(--text)" }}>{log.user.name}</p>
                    </div>
                    <Badge variant={eb.variant} label={eb.label} />
                  </div>
                  <div className="mt-2 text-xs space-y-1" style={{ color: "var(--text-muted)" }}>
                    <p>Campo: <span className="font-mono font-semibold" style={{ color: "var(--text)" }}>{log.field}</span></p>
                    {log.oldValue && <p>De: {truncate(log.oldValue)}</p>}
                    <p>Para: <span className="font-medium" style={{ color: "var(--text)" }}>{truncate(log.newValue)}</span></p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SectionCard>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm" style={{ color: "var(--text-muted)" }}>
          <span>Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={buildUrl(page - 1, entityFilter)} className="rounded-full border px-4 py-1.5 text-xs font-semibold" style={{ borderColor: "#d0d5e8" }}>← Anterior</Link>
            ) : (
              <span className="rounded-full border px-4 py-1.5 text-xs opacity-40" style={{ borderColor: "#d0d5e8" }}>← Anterior</span>
            )}
            {page < totalPages ? (
              <Link href={buildUrl(page + 1, entityFilter)} className="rounded-full border px-4 py-1.5 text-xs font-semibold" style={{ borderColor: "#d0d5e8" }}>Próximo →</Link>
            ) : (
              <span className="rounded-full border px-4 py-1.5 text-xs opacity-40" style={{ borderColor: "#d0d5e8" }}>Próximo →</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
