import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { StockSearch } from "./StockSearch";
import { StockStatusFilter } from "./StockStatusFilter";
import { StockExportButton } from "./StockExportButton";
import { KpiCard } from "@/components/ui/KpiCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { Badge } from "@/components/ui/Badge";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteStockItem } from "@/lib/delete-actions";
import type { StockUnit } from "@prisma/client";

const UNIT_LABELS: Record<StockUnit, string> = {
  ML: "mL", G: "g", L: "L", KG: "kg", UNIT: "unidade", M2: "m²",
};

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function StockPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const statusFilter = params.status ?? "todos";

  const now = new Date();
  const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  // Build where clause based on status filter
  function buildWhere() {
    const base = query ? { name: { contains: query, mode: "insensitive" as const } } : {};

    if (statusFilter === "baixo") {
      // Prisma doesn't support comparing two columns directly, handled post-fetch
      return base;
    }
    if (statusFilter === "atencao") {
      return { ...base, expiryDate: { gte: now, lte: sixtyDaysFromNow } };
    }
    if (statusFilter === "vencido") {
      return { ...base, expiryDate: { lt: now } };
    }
    return base;
  }

  const [rawItems, totalItems, lowStockCount, expiringSoonCount, expiredCount] =
    await Promise.all([
      prisma.stockItem.findMany({
        where: buildWhere(),
        orderBy: { name: "asc" },
        select: {
          id: true, name: true, activeIngredient: true, unit: true,
          quantity: true, minThreshold: true, expiryDate: true, supplier: true,
        },
      }),
      prisma.stockItem.count(),
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint as count FROM "StockItem" WHERE quantity <= "minThreshold"
      `.then((r) => Number(r[0]?.count ?? 0)),
      prisma.stockItem.count({
        where: { expiryDate: { gte: now, lte: sixtyDaysFromNow } },
      }),
      prisma.stockItem.count({ where: { expiryDate: { lt: now } } }),
    ]);

  // Filter "baixo" post-fetch (requires column comparison)
  const items = statusFilter === "baixo"
    ? rawItems.filter((i) => i.quantity <= i.minThreshold)
    : rawItems;

  function getItemStatus(item: { quantity: number; minThreshold: number; expiryDate: Date | null }): string {
    if (item.expiryDate && item.expiryDate < now) return "Vencido";
    if (item.quantity <= item.minThreshold) return "Baixo";
    if (item.expiryDate && item.expiryDate < sixtyDaysFromNow) return "Atenção";
    return "OK";
  }

  function getItemBadge(item: { quantity: number; minThreshold: number; expiryDate: Date | null }) {
    if (item.expiryDate && item.expiryDate < now) return { variant: "gray" as const, label: "Vencido" };
    if (item.quantity <= item.minThreshold) return { variant: "red" as const, label: "Baixo" };
    if (item.expiryDate && item.expiryDate < sixtyDaysFromNow) return { variant: "yellow" as const, label: "Atenção" };
    return { variant: "green" as const, label: "OK" };
  }

  function getRowStyle(item: { quantity: number; minThreshold: number; expiryDate: Date | null }) {
    if (item.expiryDate && item.expiryDate < now) return { opacity: 0.6 };
    return {};
  }

  const exportRows = items.map((item) => ({
    name: item.name,
    activeIngredient: item.activeIngredient ?? "",
    unit: UNIT_LABELS[item.unit],
    quantity: item.quantity,
    minThreshold: item.minThreshold,
    expiryDate: item.expiryDate?.toISOString() ?? null,
    supplier: item.supplier ?? "",
    status: getItemStatus(item),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold leading-none" style={{ color: "var(--text)" }}>
            ESTOQUE
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Controle de produtos e insumos
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StockExportButton items={exportRows} />
          <Link
            href="/stock/new"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ background: "var(--navy)" }}
          >
            <span className="text-base leading-none">+</span>
            Novo Item
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <div className="kpi-row">
        <KpiCard label="Total de itens" value={totalItems} />
        <KpiCard label="Abaixo do mínimo" value={lowStockCount} />
        <KpiCard label="Vencendo em 60 dias" value={expiringSoonCount} />
        <KpiCard label="Vencidos" value={expiredCount} />
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StockSearch initialQuery={query} />
        <StockStatusFilter current={statusFilter} />
      </div>

      {/* Table */}
      <SectionCard title={`Produtos em Estoque${items.length !== totalItems ? ` (${items.length} filtrado${items.length !== 1 ? "s" : ""})` : ""}`}>
        <div className="hidden md:block table-scroll">
          <table className="table-hover w-full text-sm">
            <thead>
              <tr>
                {["Nome", "Princípio Ativo", "Un.", "Quantidade", "Mínimo", "Validade", "Fornecedor", "Status", "Ações"].map((h) => (
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
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-2 py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    Nenhum item encontrado.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const badge = getItemBadge(item);
                  return (
                    <tr
                      key={item.id}
                      className="border-b last:border-0"
                      style={{ borderColor: "#dde1ed", ...getRowStyle(item) }}
                    >
                      <td className="px-2 py-3">
                        <Link href={`/stock/${item.id}`} className="font-semibold hover:underline" style={{ color: "var(--text)" }}>
                          {item.name}
                        </Link>
                      </td>
                      <td className="px-2 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                        {item.activeIngredient ?? "—"}
                      </td>
                      <td className="px-2 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                        {UNIT_LABELS[item.unit]}
                      </td>
                      <td className="px-2 py-3 text-sm font-semibold text-right" style={{ color: "var(--text)" }}>
                        {item.quantity.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-2 py-3 text-sm text-right" style={{ color: "var(--text-muted)" }}>
                        {item.minThreshold.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-2 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                        {formatDate(item.expiryDate)}
                      </td>
                      <td className="px-2 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                        {item.supplier ?? "—"}
                      </td>
                      <td className="px-2 py-3">
                        <Badge variant={badge.variant} label={badge.label} />
                      </td>
                      <td className="px-2 py-3">
                        <DeleteButton
                          size="sm"
                          action={async () => {
                            "use server";
                            return deleteStockItem(item.id);
                          }}
                          confirmMessage={`Apagar item de estoque "${item.name}"?\n\nTodos os lotes e movimentações serão removidos. Esta ação não pode ser desfeita.`}
                        />
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
          {items.length === 0 ? (
            <p className="py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Nenhum item encontrado.
            </p>
          ) : (
            items.map((item) => {
              const badge = getItemBadge(item);
              return (
                <Link
                  key={item.id}
                  href={`/stock/${item.id}`}
                  className="block rounded-[14px] border p-4 shadow-sm"
                  style={{ background: "var(--white)", borderColor: "#dde1ed", ...getRowStyle(item) }}
                >
                  <div className="flex items-start justify-between">
                    <p className="font-semibold" style={{ color: "var(--text)" }}>{item.name}</p>
                    <Badge variant={badge.variant} label={badge.label} />
                  </div>
                  {item.activeIngredient && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.activeIngredient}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: "var(--text-muted)" }}>
                    <span>Qtd: {item.quantity.toLocaleString("pt-BR")} {UNIT_LABELS[item.unit]}</span>
                    <span>Mín: {item.minThreshold.toLocaleString("pt-BR")}</span>
                    <span>Val: {formatDate(item.expiryDate)}</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </SectionCard>
    </div>
  );
}
