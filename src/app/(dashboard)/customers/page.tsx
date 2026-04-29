import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCpfCnpj, formatDate } from "@/lib/format";
import { LEAD_SOURCE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/labels";
import { CustomersSearch } from "./CustomersSearch";
import { CustomersSortFilter } from "./CustomersSortFilter";
import { ExportButton } from "./ExportButton";
import { KpiCard } from "@/components/ui/KpiCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { Badge } from "@/components/ui/Badge";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteCustomer } from "@/lib/delete-actions";

const PAGE_SIZE = 10;

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string; sort?: string }>;
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const sort = params.sort ?? "recentes";
  const skip = (page - 1) * PAGE_SIZE;

  const where = query
    ? {
        OR: [
          { fullName: { contains: query, mode: "insensitive" as const } },
          { cpfCnpj: { contains: query.replace(/\D/g, ""), mode: "insensitive" as const } },
        ],
      }
    : {};

  const orderBy =
    sort === "antigos"
      ? { createdAt: "asc" as const }
      : { createdAt: "desc" as const };

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [customers, allCustomers, total, residentialCount, commercialCount, newThisMonth] =
    await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy,
        skip,
        take: PAGE_SIZE,
        select: {
          id: true,
          fullName: true,
          cpfCnpj: true,
          city: true,
          state: true,
          propertyType: true,
          leadSource: true,
          createdAt: true,
          _count: { select: { serviceOrders: true } },
        },
      }),
      // Fetch all (for export) without pagination
      prisma.customer.findMany({
        where,
        orderBy,
        select: {
          fullName: true,
          cpfCnpj: true,
          city: true,
          state: true,
          propertyType: true,
          leadSource: true,
          createdAt: true,
          _count: { select: { serviceOrders: true } },
        },
      }),
      prisma.customer.count({ where }),
      prisma.customer.count({ where: { propertyType: "RESIDENTIAL" } }),
      prisma.customer.count({ where: { propertyType: { not: "RESIDENTIAL" } } }),
      prisma.customer.count({ where: { createdAt: { gte: monthStart } } }),
    ]);

  // Sort by OS count client-side since Prisma doesn't support _count ordering easily
  if (sort === "mais-os") {
    customers.sort((a, b) => b._count.serviceOrders - a._count.serviceOrders);
    allCustomers.sort((a, b) => b._count.serviceOrders - a._count.serviceOrders);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const exportRows = allCustomers.map((c) => ({
    fullName: c.fullName,
    cpfCnpj: c.cpfCnpj,
    city: c.city,
    state: c.state,
    propertyType: PROPERTY_TYPE_LABELS[c.propertyType],
    leadSource: LEAD_SOURCE_LABELS[c.leadSource],
    serviceOrderCount: c._count.serviceOrders,
    createdAt: c.createdAt.toISOString(),
  }));

  const buildUrl = (p: number, q: string, s: string) => {
    const qp = new URLSearchParams();
    if (q) qp.set("q", q);
    if (s && s !== "recentes") qp.set("sort", s);
    if (p > 1) qp.set("page", String(p));
    const qs = qp.toString();
    return `/customers${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold leading-none" style={{ color: "var(--text)" }}>
            CLIENTES
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {total} cliente{total !== 1 ? "s" : ""} cadastrado{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ExportButton customers={exportRows} />
          <Link
            href="/customers/new"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ background: "var(--navy)" }}
          >
            <span className="text-base leading-none">+</span>
            Novo Cliente
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <div className="kpi-row">
        <KpiCard label="Total de clientes" value={total} />
        <KpiCard label="Residenciais" value={residentialCount} />
        <KpiCard label="Comerciais" value={commercialCount} />
        <KpiCard label="Novos este mês" value={newThisMonth} />
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CustomersSearch initialQuery={query} />
        <CustomersSortFilter current={sort} />
      </div>

      {/* Table */}
      <SectionCard title="Base de Clientes">
        <div className="hidden md:block table-scroll">
          <table className="table-hover w-full text-sm">
            <thead>
              <tr>
                {["Nome", "CPF / CNPJ", "Cidade", "Tipo de Imóvel", "Canal", "OS", "Cadastro", "Ações"].map((h) => (
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
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-2 py-16 text-center">
                    <div className="flex flex-col items-center gap-2" style={{ color: "var(--text-muted)" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="font-medium text-sm">Nenhum cliente encontrado</p>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b last:border-0"
                    style={{ borderColor: "#dde1ed" }}
                  >
                    <td className="px-2 py-3">
                      <Link
                        href={`/customers/${c.id}`}
                        className="font-semibold hover:underline"
                        style={{ color: "var(--text)" }}
                      >
                        {c.fullName}
                      </Link>
                    </td>
                    <td className="px-2 py-3 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                      {formatCpfCnpj(c.cpfCnpj)}
                    </td>
                    <td className="px-2 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                      {c.city}/{c.state}
                    </td>
                    <td className="px-2 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                      {PROPERTY_TYPE_LABELS[c.propertyType]}
                    </td>
                    <td className="px-2 py-3">
                      <Badge variant="gray" label={LEAD_SOURCE_LABELS[c.leadSource]} />
                    </td>
                    <td className="px-2 py-3 text-center text-sm font-semibold" style={{ color: "var(--navy)" }}>
                      {c._count.serviceOrders}
                    </td>
                    <td className="px-2 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="px-2 py-3">
                      <DeleteButton
                        size="sm"
                        action={async () => {
                          "use server";
                          return deleteCustomer(c.id);
                        }}
                        confirmMessage={`Apagar cliente "${c.fullName}"?\n\nTODAS as OS, certificados e garantias deste cliente também serão apagados. Esta ação não pode ser desfeita.`}
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
          {customers.length === 0 ? (
            <p className="py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Nenhum cliente encontrado.
            </p>
          ) : (
            customers.map((c) => (
              <Link
                key={c.id}
                href={`/customers/${c.id}`}
                className="block rounded-[14px] border p-4 shadow-sm"
                style={{ background: "var(--white)", borderColor: "#dde1ed" }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold" style={{ color: "var(--text)" }}>{c.fullName}</p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {formatCpfCnpj(c.cpfCnpj)}
                    </p>
                  </div>
                  <Badge variant="gray" label={LEAD_SOURCE_LABELS[c.leadSource]} />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: "var(--text-muted)" }}>
                  <span>{c.city}/{c.state}</span>
                  <span>{PROPERTY_TYPE_LABELS[c.propertyType]}</span>
                  <span>{c._count.serviceOrders} OS</span>
                </div>
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
              <Link href={buildUrl(page - 1, query, sort)} className="rounded-full border px-4 py-1.5 text-xs font-semibold" style={{ borderColor: "#d0d5e8" }}>← Anterior</Link>
            ) : (
              <span className="rounded-full border px-4 py-1.5 text-xs opacity-40" style={{ borderColor: "#d0d5e8" }}>← Anterior</span>
            )}
            {page < totalPages ? (
              <Link href={buildUrl(page + 1, query, sort)} className="rounded-full border px-4 py-1.5 text-xs font-semibold" style={{ borderColor: "#d0d5e8" }}>Próximo →</Link>
            ) : (
              <span className="rounded-full border px-4 py-1.5 text-xs opacity-40" style={{ borderColor: "#d0d5e8" }}>Próximo →</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
