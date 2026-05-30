import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDate, shortId, formatCpfCnpj, formatCurrency } from "@/lib/format";
import { STATUS_LABELS, SERVICE_TYPE_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/labels";
import { PrintActions } from "./PrintActions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PrintServiceOrderPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const order = await prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          fullName: true, cpfCnpj: true, phone: true,
          city: true, state: true, street: true, number: true,
          complement: true, propertyType: true, siteSizeM2: true,
        },
      },
      technician: { select: { name: true } },
      manager: { select: { name: true } },
      certificate: { select: { issuedAt: true, technicalResponsible: true } },
      warranty: { select: { startsAt: true, expiresAt: true } },
      stockMovements: {
        where: { delta: { lt: 0 } },
        orderBy: { performedAt: "asc" },
        select: {
          id: true, applicationPoint: true, delta: true, unitCostSnapshot: true,
          stockItem: { select: { name: true, unit: true } },
        },
      },
    },
  });

  if (!order) notFound();

  const totalInsumos = order.stockMovements.reduce(
    (sum, m) => sum + Math.abs(m.delta) * m.unitCostSnapshot, 0
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        @page { size: A4 portrait; margin: 12mm 14mm; }
        body { font-family: Inter, Arial, sans-serif; font-size: 10px; color: #111; background: white; }
        .page { max-width: 180mm; margin: 0 auto; }
        .header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 2px solid #1e3054; padding-bottom: 6px; margin-bottom: 8px; }
        .company { font-size: 16px; font-weight: 800; color: #1e3054; }
        .company-sub { font-size: 9px; color: #555; margin-top: 2px; }
        .os-id { text-align: right; }
        .os-num { font-size: 22px; font-weight: 800; color: #1e3054; }
        .os-status { display: inline-block; margin-top: 3px; font-size: 9px; font-weight: 700; border: 1px solid #1e3054; border-radius: 3px; padding: 1px 6px; color: #1e3054; }
        .badge-free { background: #fef3c7; color: #92400e; font-size: 8px; font-weight: 700; border-radius: 3px; padding: 1px 5px; margin-top: 2px; display: inline-block; }
        .sec { border: 1px solid #d1d5db; border-radius: 3px; padding: 6px 8px; margin-bottom: 5px; break-inside: avoid; }
        .sec-title { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; margin-bottom: 4px; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
        .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0 12px; }
        .row { display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px dotted #e5e7eb; }
        .row:last-child { border-bottom: none; }
        .lbl { color: #6b7280; }
        .val { font-weight: 600; text-align: right; }
        table { width: 100%; border-collapse: collapse; font-size: 9px; }
        th { text-align: left; font-weight: 700; color: #6b7280; border-bottom: 1px solid #d1d5db; padding: 2px 4px; }
        td { padding: 2px 4px; border-bottom: 1px dotted #e5e7eb; }
        tr:last-child td { border-bottom: none; }
        .total-row td { font-weight: 700; background: #f0f4ff; }
        .sig-area { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 12px; }
        .sig-box { border-top: 1px solid #555; padding-top: 4px; font-size: 9px; color: #6b7280; text-align: center; }
        .footer { margin-top: 8px; display: flex; justify-content: space-between; font-size: 8px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 4px; }
        .no-print { margin-bottom: 16px; }
        @media print { .no-print { display: none !important; } body { background: white; } }
        @media screen { body { background: #f3f4f6; padding: 20px; } .page { background: white; padding: 14mm; box-shadow: 0 4px 20px rgba(0,0,0,.12); } }
      `}</style>

      <div className="page">
        <PrintActions backUrl={`/service-orders/${id}`} />

        {/* Header */}
        <div className="header">
          <div>
            <div className="company">Elite Ambiental</div>
            <div className="company-sub">Controle de Pragas e Dedetização</div>
            <div className="company-sub">Emitido em: {formatDate(new Date())}</div>
          </div>
          <div className="os-id">
            <div className="os-num">OS #{shortId(order.id)}</div>
            <div className="os-status">{STATUS_LABELS[order.status]}</div>
            {order.isFree && <div className="badge-free">GRATUITA</div>}
          </div>
        </div>

        {/* Cliente + OS lado a lado */}
        <div className="grid2">
          <div className="sec">
            <div className="sec-title">Cliente</div>
            <div className="row"><span className="lbl">Nome</span><span className="val">{order.customer.fullName}</span></div>
            <div className="row"><span className="lbl">CPF/CNPJ</span><span className="val">{formatCpfCnpj(order.customer.cpfCnpj)}</span></div>
            {order.customer.phone && <div className="row"><span className="lbl">Telefone</span><span className="val">{order.customer.phone}</span></div>}
            <div className="row"><span className="lbl">Endereço</span><span className="val">{order.customer.street}, {order.customer.number}{order.customer.complement ? ` — ${order.customer.complement}` : ""}</span></div>
            <div className="row"><span className="lbl">Cidade/UF</span><span className="val">{order.customer.city}/{order.customer.state}</span></div>
            <div className="row"><span className="lbl">Área</span><span className="val">{order.customer.siteSizeM2.toLocaleString("pt-BR")} m²</span></div>
          </div>

          <div className="sec">
            <div className="sec-title">Dados da Ordem</div>
            <div className="row"><span className="lbl">Tipo de serviço</span><span className="val">{SERVICE_TYPE_LABELS[order.serviceType]}</span></div>
            {order.pestTypes.length > 0 && <div className="row"><span className="lbl">Pragas</span><span className="val">{order.pestTypes.join(", ")}</span></div>}
            <div className="row"><span className="lbl">Criado em</span><span className="val">{formatDate(order.createdAt)}</span></div>
            {order.scheduledAt && <div className="row"><span className="lbl">Agendado para</span><span className="val">{formatDate(order.scheduledAt)}</span></div>}
            {order.executedAt && <div className="row"><span className="lbl">Executado em</span><span className="val">{formatDate(order.executedAt)}</span></div>}
            <div className="row"><span className="lbl">Técnico</span><span className="val">{order.technician?.name ?? "—"}</span></div>
            <div className="row"><span className="lbl">Gerente</span><span className="val">{order.manager?.name ?? "—"}</span></div>
          </div>
        </div>

        {/* Financeiro */}
        <div className="sec">
          <div className="sec-title">Financeiro</div>
          <div className="grid3">
            <div className="row"><span className="lbl">Valor cobrado</span><span className="val">{formatCurrency(order.price)}</span></div>
            <div className="row"><span className="lbl">Custo insumos</span><span className="val">{formatCurrency(order.cost ?? 0)}</span></div>
            <div className="row"><span className="lbl">Lucro bruto</span><span className="val">{order.price != null ? formatCurrency(order.price - (order.cost ?? 0)) : "—"}</span></div>
            <div className="row"><span className="lbl">Pagamento</span><span className="val">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</span></div>
            {order.paidAt && <div className="row"><span className="lbl">Pago em</span><span className="val">{formatDate(order.paidAt)}</span></div>}
          </div>
        </div>

        {/* Insumos */}
        {order.stockMovements.length > 0 && (
          <div className="sec">
            <div className="sec-title">Insumos Utilizados</div>
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Local de aplicação</th>
                  <th style={{ textAlign: "right" }}>Qtd</th>
                  <th style={{ textAlign: "right" }}>Custo</th>
                </tr>
              </thead>
              <tbody>
                {order.stockMovements.map((m) => (
                  <tr key={m.id}>
                    <td>{m.stockItem?.name ?? "—"}</td>
                    <td>{m.applicationPoint ?? "—"}</td>
                    <td style={{ textAlign: "right" }}>{Math.abs(m.delta).toLocaleString("pt-BR")} {m.stockItem?.unit?.toLowerCase()}</td>
                    <td style={{ textAlign: "right" }}>{m.unitCostSnapshot > 0 ? formatCurrency(Math.abs(m.delta) * m.unitCostSnapshot) : "—"}</td>
                  </tr>
                ))}
                {totalInsumos > 0 && (
                  <tr className="total-row">
                    <td colSpan={3}>Total insumos</td>
                    <td style={{ textAlign: "right" }}>{formatCurrency(totalInsumos)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Observações */}
        {order.notes && (
          <div className="sec">
            <div className="sec-title">Observações</div>
            <p style={{ fontSize: "9px", lineHeight: "1.4", whiteSpace: "pre-wrap" }}>{order.notes}</p>
          </div>
        )}

        {/* Certificado e Garantia */}
        {(order.certificate || order.warranty) && (
          <div className="sec">
            <div className="sec-title">Certificado e Garantia</div>
            <div className="grid2">
              {order.certificate && (
                <>
                  <div className="row"><span className="lbl">Certificado emitido</span><span className="val">{formatDate(order.certificate.issuedAt)}</span></div>
                  <div className="row"><span className="lbl">Responsável técnico</span><span className="val">{order.certificate.technicalResponsible}</span></div>
                </>
              )}
              {order.warranty && (
                <>
                  <div className="row"><span className="lbl">Garantia início</span><span className="val">{formatDate(order.warranty.startsAt)}</span></div>
                  <div className="row"><span className="lbl">Garantia vencimento</span><span className="val">{formatDate(order.warranty.expiresAt)}</span></div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Assinaturas */}
        <div className="sig-area">
          <div className="sig-box">Assinatura do Cliente</div>
          <div className="sig-box">Assinatura do Técnico Responsável</div>
        </div>

        <div className="footer">
          <span>Elite Ambiental — Controle de Pragas</span>
          <span>OS {shortId(order.id)} — Gerado em {formatDate(new Date())}</span>
        </div>
      </div>
    </>
  );
}
