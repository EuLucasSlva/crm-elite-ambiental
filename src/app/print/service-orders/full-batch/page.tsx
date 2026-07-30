import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appDateRange } from "@/lib/date-time";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatCpfCnpj,
  shortId,
} from "@/lib/format";
import { SERVICE_TYPE_LABELS, STATUS_LABELS } from "@/lib/labels";
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

export default async function FullBatchServiceOrdersReport({
  searchParams,
}: PageProps) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/service-orders");

  const params = await searchParams;
  const range =
    params.from && params.to ? appDateRange(params.from, params.to) : null;
  if (!params.customerId || !range) redirect("/service-orders/export");

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

  const dateFilter = { gte: range.start, lt: range.endExclusive };
  const orders = await prisma.serviceOrder.findMany({
    where: {
      customerId: customer.id,
      ...(params.scope === "all"
        ? {}
        : { status: { in: TREATMENT_STATUSES } }),
      OR: [
        { executedAt: dateFilter },
        { executedAt: null, scheduledAt: dateFilter },
        { executedAt: null, scheduledAt: null, createdAt: dateFilter },
      ],
    },
    include: {
      technician: { select: { name: true } },
      technicalVisits: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          scheduledAt: true,
          checkInAt: true,
          checkOutAt: true,
          customerSignature: true,
          technicianSignature: true,
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
      stockMovements: {
        where: { delta: { lt: 0 } },
        orderBy: { performedAt: "asc" },
        select: {
          id: true,
          applicationPoint: true,
          delta: true,
          stockItem: { select: { name: true, unit: true } },
        },
      },
    },
  });

  const effectiveDate = (order: (typeof orders)[number]) =>
    order.executedAt ?? order.scheduledAt ?? order.createdAt;
  orders.sort((a, b) => effectiveDate(a).getTime() - effectiveDate(b).getTime());

  const customerAddress = [
    `${customer.street}, ${customer.number}`,
    customer.complement,
    `${customer.city} — ${customer.state}`,
    customer.zip ? `CEP ${customer.zip}` : null,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Arial, sans-serif; color: #111827; background: #e5e7eb; }
        .toolbar { padding: 12px; }
        .sheet {
          width: 210mm;
          min-height: 297mm;
          margin: 18px auto;
          padding: 12mm 13mm 10mm;
          background: white;
          display: flex;
          flex-direction: column;
          break-after: page;
        }
        .sheet:last-child { break-after: auto; }
        .header { display: flex; justify-content: space-between; gap: 20px; padding-bottom: 8px; margin-bottom: 10px; border-bottom: 2.5px solid #1e3054; }
        .brand { color: #1e3054; font-size: 20px; font-weight: 900; }
        .tagline, .issued { color: #6b7280; font-size: 8.5px; margin-top: 2px; }
        .os-head { text-align: right; }
        .os-number { color: #1e3054; font-size: 24px; font-weight: 900; }
        .os-status { display: inline-block; margin-top: 4px; border-radius: 3px; padding: 3px 7px; background: #1e3054; color: white; font-size: 8px; font-weight: 700; }
        .section { border: 1px solid #e1e5ec; border-radius: 8px; padding: 8px 11px; margin-bottom: 8px; break-inside: avoid; }
        .section-title { color: #1e3054; border-bottom: 1px solid #edf0f4; padding-bottom: 4px; margin-bottom: 6px; font-size: 9.5px; font-weight: 800; text-transform: uppercase; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 22px; }
        .full { grid-column: 1 / -1; }
        .label { color: #8a94a7; font-size: 7.5px; font-weight: 700; text-transform: uppercase; }
        .value { color: #111827; font-size: 10.5px; font-weight: 600; line-height: 1.3; }
        .value.big { color: #1e3054; font-size: 13px; font-weight: 800; }
        .chips { display: flex; flex-wrap: wrap; gap: 4px; }
        .chip { border-radius: 4px; padding: 2px 6px; background: #eef2ff; color: #1e3054; font-size: 9px; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; font-size: 9px; }
        th { border-bottom: 1px solid #cbd2df; padding: 3px 5px; color: #6b7280; font-size: 8px; text-align: left; text-transform: uppercase; }
        td { border-bottom: 1px dotted #e1e5ec; padding: 3px 5px; }
        .empty { padding: 5px; color: #9ca3af; font-size: 9px; text-align: center; }
        .accept { margin: 0 0 9px; color: #4b5563; font-size: 8.5px; line-height: 1.4; }
        .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
        .sig-area { height: 58px; display: flex; align-items: flex-end; justify-content: center; overflow: hidden; padding-bottom: 3px; }
        .sig-img { max-height: 55px; max-width: 100%; object-fit: contain; }
        .sig-typed { font-family: "Segoe Script", "Brush Script MT", cursive; font-size: 23px; text-align: center; }
        .sig-line { border-top: 1px solid #374151; padding-top: 3px; text-align: center; }
        .sig-label { color: #6b7280; font-size: 8px; font-weight: 700; text-transform: uppercase; }
        .sig-name { margin-top: 1px; color: #374151; font-size: 9px; font-weight: 600; }
        .sig-meta { margin-top: 1px; color: #9ca3af; font-size: 7.5px; }
        .footer { margin-top: auto; padding-top: 6px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; color: #9ca3af; font-size: 7.5px; }
        .no-results { width: 210mm; margin: 20px auto; padding: 30px; background: white; text-align: center; }
        @media print {
          body { background: white; }
          .toolbar { display: none !important; }
          .sheet { width: auto; margin: 0; }
        }
      `}</style>

      <div className="toolbar">
        <PrintActions backUrl="/service-orders/export" />
      </div>

      {orders.length === 0 ? (
        <div className="no-results">
          Nenhuma OS encontrada para o cliente, período e situação escolhidos.
        </div>
      ) : (
        orders.map((order) => {
          const signedVisit =
            [...order.technicalVisits]
              .reverse()
              .find(
                (visit) =>
                  visit.customerSignature || visit.technicianSignature
              ) ?? order.technicalVisits.at(-1);
          const customerSignature = signedVisit?.customerSignature ?? null;
          const technicianSignature =
            signedVisit?.technicianSignature ?? null;
          const signedAt = signedVisit?.checkOutAt ?? null;
          const orderAddress = order.serviceAddress ?? customerAddress;

          return (
            <article className="sheet" key={order.id}>
              <header className="header">
                <div>
                  <div className="brand">Elite Ambiental</div>
                  <div className="tagline">
                    Controle de Pragas e Dedetização
                  </div>
                  <div className="issued">
                    Emitido em {formatDateTime(new Date())}
                  </div>
                </div>
                <div className="os-head">
                  <div className="os-number">
                    #{order.orderNumber ?? shortId(order.id)}
                  </div>
                  <div className="os-status">
                    {SERVICE_TYPE_LABELS[order.serviceType]} —{" "}
                    {STATUS_LABELS[order.status]}
                  </div>
                </div>
              </header>

              <section className="section">
                <div className="section-title">
                  1. Dados do cliente e local de atendimento
                </div>
                <div className="grid">
                  <div className="full">
                    <div className="label">Cliente</div>
                    <div className="value big">{customer.fullName}</div>
                  </div>
                  <div>
                    <div className="label">CPF / CNPJ</div>
                    <div className="value">
                      {formatCpfCnpj(customer.cpfCnpj)}
                    </div>
                  </div>
                  <div>
                    <div className="label">Telefone / WhatsApp</div>
                    <div className="value">{customer.phone || "—"}</div>
                  </div>
                  <div className="full">
                    <div className="label">Unidade / local atendido</div>
                    <div className="value big">{order.serviceFor ?? "—"}</div>
                  </div>
                  <div className="full">
                    <div className="label">Endereço do atendimento</div>
                    <div className="value">{orderAddress}</div>
                  </div>
                </div>
              </section>

              <section className="section">
                <div className="section-title">
                  2. Escopo do serviço e atendimento
                </div>
                <div className="grid">
                  <div>
                    <div className="label">Tipo de serviço</div>
                    <div className="value">
                      {SERVICE_TYPE_LABELS[order.serviceType]}
                    </div>
                  </div>
                  <div>
                    <div className="label">Técnico responsável</div>
                    <div className="value">
                      {order.technician?.name ?? order.team ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div className="label">Data e hora agendada</div>
                    <div className="value">
                      {formatDateTime(order.scheduledAt)}
                    </div>
                  </div>
                  <div>
                    <div className="label">Data e hora do check-in</div>
                    <div className="value">
                      {formatDateTime(signedVisit?.checkInAt)}
                    </div>
                  </div>
                  <div>
                    <div className="label">Executado em</div>
                    <div className="value">
                      {formatDateTime(order.executedAt)}
                    </div>
                  </div>
                  <div>
                    <div className="label">Valor</div>
                    <div className="value">
                      {formatCurrency(order.price)}
                    </div>
                  </div>
                  <div>
                    <div className="label">Pragas alvo</div>
                    <div className="chips">
                      {order.pestTypes.length
                        ? order.pestTypes.map((pest) => (
                            <span className="chip" key={pest}>{pest}</span>
                          ))
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="label">Áreas tratadas</div>
                    <div className="chips">
                      {order.treatedAreas.length
                        ? order.treatedAreas.map((area) => (
                            <span className="chip" key={area}>{area}</span>
                          ))
                        : "—"}
                    </div>
                  </div>
                  {order.notes && (
                    <div className="full">
                      <div className="label">Metodologia / observações</div>
                      <div className="value">{order.notes}</div>
                    </div>
                  )}
                </div>
              </section>

              <section className="section">
                <div className="section-title">3. Materiais utilizados</div>
                {order.stockMovements.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Produto</th>
                        <th>Local de aplicação</th>
                        <th>Quantidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.stockMovements.map((movement) => (
                        <tr key={movement.id}>
                          <td>{movement.stockItem?.name ?? "—"}</td>
                          <td>{movement.applicationPoint ?? "—"}</td>
                          <td>
                            {Math.abs(movement.delta).toLocaleString("pt-BR")}{" "}
                            {movement.stockItem?.unit
                              ? UNIT_LABELS[movement.stockItem.unit]
                              : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty">
                    Nenhum material registrado nesta ordem.
                  </div>
                )}
              </section>

              <section className="section">
                <div className="section-title">
                  4. Termo de encerramento e aceite
                </div>
                <p className="accept">
                  Declaro que o serviço descrito nesta ordem foi executado
                  conforme o escopo acordado, com a utilização dos produtos e
                  metodologia indicados. O cliente atesta o recebimento e a
                  conformidade do serviço prestado pela Elite Ambiental.
                </p>
                <div className="sig-grid">
                  <div>
                    <div className="sig-area">
                      {technicianSignature ? (
                        technicianSignature.startsWith("data:image") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={technicianSignature}
                            alt="Assinatura do técnico"
                            className="sig-img"
                          />
                        ) : (
                          <span className="sig-typed">
                            {technicianSignature}
                          </span>
                        )
                      ) : null}
                    </div>
                    <div className="sig-line">
                      <div className="sig-label">Assinatura do técnico</div>
                      <div className="sig-name">
                        {order.technician?.name ?? order.team ?? "—"}
                      </div>
                      <div className="sig-meta">
                        {technicianSignature && signedAt
                          ? `Assinado em ${formatDateTime(signedAt)}`
                          : "Assinatura pendente"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="sig-area">
                      {customerSignature ? (
                        customerSignature.startsWith("data:image") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={customerSignature}
                            alt="Assinatura do cliente"
                            className="sig-img"
                          />
                        ) : (
                          <span className="sig-typed">
                            {customerSignature}
                          </span>
                        )
                      ) : null}
                    </div>
                    <div className="sig-line">
                      <div className="sig-label">Assinatura do cliente</div>
                      <div className="sig-name">{customer.fullName}</div>
                      <div className="sig-meta">
                        {customerSignature && signedAt
                          ? `Assinado em ${formatDateTime(signedAt)}`
                          : "Assinatura pendente"}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <footer className="footer">
                <span>Elite Ambiental — Controle de Pragas</span>
                <span>
                  OS #{order.orderNumber ?? shortId(order.id)} —{" "}
                  {formatDate(effectiveDate(order))}
                </span>
              </footer>
            </article>
          );
        })
      )}
    </>
  );
}
