import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatCpfCnpj,
  shortId,
} from "@/lib/format";
import { appDateRange } from "@/lib/date-time";
import {
  SERVICE_TYPE_LABELS,
  STATUS_LABELS,
} from "@/lib/labels";
import { PrintActions } from "../[id]/PrintActions";
import type { Role, ServiceOrderStatus } from "@prisma/client";

interface PageProps {
  searchParams: Promise<{
    customerId?: string;
    from?: string;
    to?: string;
    scope?: string;
  }>;
}

const TREATMENT_STATUSES: ServiceOrderStatus[] = [
  "SERVICE_SCHEDULED",
  "SERVICE_EXECUTED",
  "CERTIFICATE_ISSUED",
  "WARRANTY_ACTIVE",
  "CLOSED",
];

const UNIT_LABELS: Record<string, string> = {
  ML: "mL",
  G: "g",
  L: "L",
  KG: "kg",
  UNIT: "un",
  M2: "m²",
};

export default async function BatchServiceOrdersReport({ searchParams }: PageProps) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/service-orders");

  const params = await searchParams;
  const range =
    params.from && params.to ? appDateRange(params.from, params.to) : null;
  if (!params.customerId || !range) {
    redirect("/service-orders/export");
  }

  const customer = await prisma.customer.findUnique({
    where: { id: params.customerId },
    select: {
      id: true,
      fullName: true,
      cpfCnpj: true,
      phone: true,
      street: true,
      number: true,
      complement: true,
      city: true,
      state: true,
      zip: true,
    },
  });
  if (!customer) notFound();

  const dateFilter = {
    gte: range.start,
    lt: range.endExclusive,
  };
  const orders = await prisma.serviceOrder.findMany({
    where: {
      customerId: customer.id,
      ...(params.scope === "all"
        ? {}
        : { status: { in: TREATMENT_STATUSES } }),
      OR: [
        { executedAt: dateFilter },
        { executedAt: null, scheduledAt: dateFilter },
        {
          executedAt: null,
          scheduledAt: null,
          createdAt: dateFilter,
        },
      ],
    },
    include: {
      technician: { select: { name: true } },
      technicalVisits: {
        orderBy: { scheduledAt: "asc" },
        select: {
          id: true,
          scheduledAt: true,
          checkInAt: true,
          checkOutAt: true,
          notes: true,
          applicationPoints: {
            select: {
              id: true,
              location: true,
              productName: true,
              doseApplied: true,
              unit: true,
            },
          },
        },
      },
    },
  });

  const effectiveDate = (order: (typeof orders)[number]) =>
    order.executedAt ?? order.scheduledAt ?? order.createdAt;
  orders.sort((a, b) => effectiveDate(a).getTime() - effectiveDate(b).getTime());

  const address = [
    `${customer.street}, ${customer.number}`,
    customer.complement,
    `${customer.city}/${customer.state}`,
    customer.zip ? `CEP ${customer.zip}` : null,
  ]
    .filter(Boolean)
    .join(" — ");

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 12mm; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Arial, sans-serif; background: #eef0f4; color: #172033; }
        .toolbar { padding: 12px; }
        .report { width: 210mm; margin: 0 auto 20px; background: #fff; padding: 12mm; }
        .report-header { border-bottom: 3px solid #1e3054; padding-bottom: 10px; margin-bottom: 14px; }
        .brand { font-size: 21px; font-weight: 900; color: #1e3054; }
        .muted { color: #667085; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 24px; font-size: 11px; margin-top: 10px; }
        .meta strong { color: #1e3054; }
        table { width: 100%; border-collapse: collapse; font-size: 9px; }
        th { background: #1e3054; color: white; text-align: left; padding: 6px; }
        td { border-bottom: 1px solid #dde2ea; padding: 6px; vertical-align: top; }
        .summary { margin-bottom: 18px; }
        .order { break-before: page; padding-top: 2mm; }
        .order:first-of-type { break-before: auto; }
        .order-title { display: flex; justify-content: space-between; gap: 12px; border-bottom: 2px solid #1e3054; padding-bottom: 7px; margin-bottom: 10px; }
        .order-title h2 { margin: 0; font-size: 17px; color: #1e3054; }
        .status { font-size: 10px; font-weight: 700; border: 1px solid #cbd2df; border-radius: 999px; padding: 4px 9px; }
        .box { border: 1px solid #dce1e9; border-radius: 7px; padding: 9px; margin: 8px 0; break-inside: avoid; }
        .box h3 { font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: #1e3054; margin: 0 0 7px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px; font-size: 10px; }
        .full { grid-column: 1 / -1; }
        .label { display: block; color: #7a8498; font-size: 8px; text-transform: uppercase; font-weight: 700; }
        .chips { display: flex; flex-wrap: wrap; gap: 4px; }
        .chip { background: #edf1f7; border-radius: 4px; padding: 3px 6px; font-size: 9px; }
        .empty { padding: 18px; text-align: center; color: #7a8498; border: 1px dashed #cbd2df; border-radius: 7px; }
        @media print {
          body { background: #fff; }
          .toolbar { display: none !important; }
          .report { width: auto; margin: 0; padding: 0; }
        }
      `}</style>

      <div className="toolbar">
        <PrintActions backUrl="/service-orders/export" />
      </div>

      <main className="report">
        <header className="report-header">
          <div className="brand">Elite Ambiental</div>
          <div className="muted">Relatório de ordens de serviço por cliente</div>
          <div className="meta">
            <div>
              <strong>Cliente:</strong> {customer.fullName}
            </div>
            <div>
              <strong>CPF/CNPJ:</strong> {formatCpfCnpj(customer.cpfCnpj)}
            </div>
            <div>
              <strong>Período:</strong> {formatDate(range.start)} a{" "}
              {formatDate(new Date(range.endExclusive.getTime() - 1))}
            </div>
            <div>
              <strong>Quantidade:</strong> {orders.length} OS
            </div>
            <div className="full">
              <strong>Endereço:</strong> {address}
            </div>
          </div>
        </header>

        {orders.length === 0 ? (
          <div className="empty">
            Nenhuma ordem encontrada para o cliente, período e situação
            selecionados.
          </div>
        ) : (
          <>
            <section className="summary">
              <table>
                <thead>
                  <tr>
                    <th>OS</th>
                    <th>Data de referência</th>
                    <th>Unidade/local</th>
                    <th>Tipo</th>
                    <th>Situação</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.orderNumber ?? shortId(order.id)}</td>
                      <td>{formatDateTime(effectiveDate(order))}</td>
                      <td>{order.serviceFor ?? "—"}</td>
                      <td>{SERVICE_TYPE_LABELS[order.serviceType]}</td>
                      <td>{STATUS_LABELS[order.status]}</td>
                      <td>{formatCurrency(order.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {orders.map((order) => (
              <article className="order" key={order.id}>
                <div className="order-title">
                  <div>
                    <h2>OS #{order.orderNumber ?? shortId(order.id)}</h2>
                    <span className="muted">
                      {SERVICE_TYPE_LABELS[order.serviceType]}
                    </span>
                  </div>
                  <span className="status">{STATUS_LABELS[order.status]}</span>
                </div>

                <section className="box">
                  <h3>Atendimento</h3>
                  <div className="grid">
                    <div>
                      <span className="label">Unidade / local</span>
                      {order.serviceFor ?? "—"}
                    </div>
                    <div>
                      <span className="label">Técnico</span>
                      {order.technician?.name ?? order.team ?? "—"}
                    </div>
                    <div>
                      <span className="label">Agendado</span>
                      {formatDateTime(order.scheduledAt)}
                    </div>
                    <div>
                      <span className="label">Executado</span>
                      {formatDateTime(order.executedAt)}
                    </div>
                    <div>
                      <span className="label">Encerrado</span>
                      {formatDateTime(order.closedAt)}
                    </div>
                    <div>
                      <span className="label">Valor</span>
                      {formatCurrency(order.price)}
                    </div>
                    <div className="full">
                      <span className="label">Endereço do atendimento</span>
                      {order.serviceAddress ?? address}
                    </div>
                  </div>
                </section>

                <section className="box">
                  <h3>Escopo realizado</h3>
                  <div className="grid">
                    <div>
                      <span className="label">Pragas alvo</span>
                      <div className="chips">
                        {order.pestTypes.length
                          ? order.pestTypes.map((pest) => (
                              <span key={pest} className="chip">{pest}</span>
                            ))
                          : "—"}
                      </div>
                    </div>
                    <div>
                      <span className="label">Áreas tratadas</span>
                      <div className="chips">
                        {order.treatedAreas.length
                          ? order.treatedAreas.map((area) => (
                              <span key={area} className="chip">{area}</span>
                            ))
                          : "—"}
                      </div>
                    </div>
                    {order.notes && (
                      <div className="full">
                        <span className="label">Observações</span>
                        {order.notes}
                      </div>
                    )}
                  </div>
                </section>

                <section className="box">
                  <h3>Visitas e produtos aplicados</h3>
                  {order.technicalVisits.length === 0 ? (
                    <div className="muted">Nenhuma visita técnica registrada.</div>
                  ) : (
                    order.technicalVisits.map((visit, index) => (
                      <div key={visit.id} style={{ marginBottom: 8 }}>
                        <strong style={{ fontSize: 10 }}>
                          Visita {index + 1} — {formatDateTime(visit.checkInAt ?? visit.scheduledAt)}
                        </strong>
                        {visit.applicationPoints.length > 0 && (
                          <table style={{ marginTop: 4 }}>
                            <thead>
                              <tr>
                                <th>Produto</th>
                                <th>Local de aplicação</th>
                                <th>Quantidade</th>
                              </tr>
                            </thead>
                            <tbody>
                              {visit.applicationPoints.map((point) => (
                                <tr key={point.id}>
                                  <td>{point.productName}</td>
                                  <td>{point.location}</td>
                                  <td>
                                    {point.doseApplied.toLocaleString("pt-BR")}{" "}
                                    {UNIT_LABELS[point.unit] ?? point.unit}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    ))
                  )}
                </section>
              </article>
            ))}
          </>
        )}
      </main>
    </>
  );
}
