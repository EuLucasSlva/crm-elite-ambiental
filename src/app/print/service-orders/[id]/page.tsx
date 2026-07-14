import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDate, shortId, formatCurrency } from "@/lib/format";
import { SERVICE_TYPE_LABELS } from "@/lib/labels";
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
          complement: true, zip: true,
        },
      },
      technician: { select: { name: true } },
      manager: { select: { name: true } },
      certificate: { select: { issuedAt: true, technicalResponsible: true } },
      warranty: { select: { startsAt: true, expiresAt: true } },
      technicalVisits: {
        where: { customerSignature: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { customerSignature: true, checkOutAt: true },
      },
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

  const orderLabel = order.orderNumber ?? shortId(order.id);

  // Assinatura do cliente coletada na execução.
  // Desenhada = data URL de imagem; digitada = texto puro (renderizado em fonte cursiva).
  const signature = order.technicalVisits[0]?.customerSignature ?? null;
  const signedAt = order.technicalVisits[0]?.checkOutAt ?? null;
  const isDrawnSignature = signature?.startsWith("data:image") ?? false;

  const scheduledDate = order.scheduledAt
    ? order.scheduledAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";
  const scheduledTime = order.scheduledAt
    ? order.scheduledAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "—";

  const address = [
    `${order.customer.street}, ${order.customer.number}`,
    order.customer.complement,
    `${order.customer.city} — ${order.customer.state}`,
    order.customer.zip ? `CEP ${order.customer.zip}` : null,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @page { size: A4 portrait; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Inter, Arial, sans-serif; background: white; color: #111; }
        .no-print { padding: 16px 20px; background: #f3f4f6; display: flex; gap: 8px; }
        @media print { .no-print { display: none !important; } }
        @media screen { body { background: #e5e7eb; } .sheet { margin: 20px auto; box-shadow: 0 8px 32px rgba(0,0,0,.15); } }

        .sheet {
          width: 210mm;
          min-height: 297mm;
          background: white;
          display: flex;
          flex-direction: column;
          padding: 18mm 16mm 14mm;
        }

        /* ── HEADER ── */
        .hdr {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding-bottom: 14px;
          margin-bottom: 20px;
          border-bottom: 3px solid #1e3054;
        }
        .hdr-brand { display: flex; flex-direction: column; gap: 3px; }
        .hdr-logo { font-size: 26px; font-weight: 900; color: #1e3054; letter-spacing: -0.5px; }
        .hdr-tagline { font-size: 11px; color: #6b7280; font-weight: 500; }
        .hdr-date { font-size: 10px; color: #9ca3af; margin-top: 2px; }
        .hdr-os { text-align: right; }
        .hdr-os-label { font-size: 11px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; }
        .hdr-os-num { font-size: 36px; font-weight: 900; color: #1e3054; line-height: 1; margin-top: 2px; }
        .hdr-os-type { margin-top: 6px; display: inline-block; background: #1e3054; color: white; font-size: 10px; font-weight: 700; border-radius: 4px; padding: 3px 10px; text-transform: uppercase; letter-spacing: 0.06em; }
        .hdr-os-free { margin-top: 4px; display: inline-block; background: #fef3c7; color: #92400e; font-size: 10px; font-weight: 700; border-radius: 4px; padding: 3px 10px; }

        /* ── CARD ── */
        .card {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px 24px;
          margin-bottom: 16px;
          break-inside: avoid;
        }
        .card-title {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #9ca3af;
          margin-bottom: 14px;
          padding-bottom: 8px;
          border-bottom: 1px solid #f3f4f6;
        }

        /* ── CLIENT NAME ── */
        .client-name {
          font-size: 28px;
          font-weight: 800;
          color: #111827;
          line-height: 1.15;
          margin-bottom: 10px;
        }
        .client-address {
          font-size: 15px;
          color: #374151;
          font-weight: 500;
          line-height: 1.5;
        }

        /* ── INFO GRID ── */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px 32px;
        }
        .info-item {}
        .info-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: #9ca3af;
          margin-bottom: 4px;
        }
        .info-value {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          line-height: 1.2;
        }
        .info-value.lg {
          font-size: 22px;
        }
        .info-value.accent {
          color: #1e3054;
        }

        /* ── SIGNATURES ── */
        .sig-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-top: 8px;
        }
        .sig-box { display: flex; flex-direction: column; }
        .sig-area {
          height: 90px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 4px;
          overflow: hidden;
        }
        .sig-img { max-height: 84px; max-width: 100%; object-fit: contain; }
        .sig-typed {
          font-family: 'Dancing Script', 'Segoe Script', 'Brush Script MT', cursive;
          font-size: 30px;
          color: #111827;
          line-height: 1.2;
          text-align: center;
        }
        .sig-line { border-top: 1.5px solid #374151; padding-top: 6px; text-align: center; }
        .sig-label { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; }
        .sig-name { font-size: 12px; color: #374151; font-weight: 600; margin-top: 2px; }
        .sig-meta { font-size: 9px; color: #9ca3af; margin-top: 2px; }

        /* ── FOOTER ── */
        .ftr {
          padding-top: 14px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 9px;
          color: #9ca3af;
        }
      `}</style>

      <div className="no-print">
        <PrintActions backUrl={`/service-orders/${id}`} />
      </div>

      <div className="sheet">
        {/* Header */}
        <div className="hdr">
          <div className="hdr-brand">
            <div className="hdr-logo">Elite Ambiental</div>
            <div className="hdr-tagline">Controle de Pragas e Dedetizacao</div>
            <div className="hdr-date">Emitido em: {formatDate(new Date())}</div>
          </div>
          <div className="hdr-os">
            <div className="hdr-os-label">Ordem de Servico</div>
            <div className="hdr-os-num">#{orderLabel}</div>
            <div style={{ textAlign: "right" }}>
              <span className="hdr-os-type">{SERVICE_TYPE_LABELS[order.serviceType]}</span>
            </div>
            {order.isFree && (
              <div style={{ textAlign: "right" }}>
                <span className="hdr-os-free">GRATUITA</span>
              </div>
            )}
          </div>
        </div>

        {/* Client card */}
        <div className="card">
          <div className="card-title">Cliente</div>
          <div className="client-name">{order.customer.fullName}</div>
          <div className="client-address">{address}</div>
          {order.customer.phone && (
            <div style={{ marginTop: "10px", fontSize: "15px", color: "#374151", fontWeight: 500 }}>
              📱 {order.customer.phone}
            </div>
          )}
        </div>

        {/* Service details grid */}
        <div className="card">
          <div className="card-title">Detalhes do Servico</div>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Tipo de Servico</div>
              <div className="info-value">{SERVICE_TYPE_LABELS[order.serviceType]}</div>
            </div>
            {order.pestTypes.length > 0 && (
              <div className="info-item">
                <div className="info-label">Pragas</div>
                <div className="info-value">{order.pestTypes.join(", ")}</div>
              </div>
            )}
            <div className="info-item">
              <div className="info-label">Data Agendada</div>
              <div className="info-value lg accent">{scheduledDate}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Horario</div>
              <div className="info-value lg accent">{scheduledTime}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Tecnico Responsavel</div>
              <div className="info-value">{order.technician?.name ?? "—"}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Valor Cobrado</div>
              <div className="info-value lg">{formatCurrency(order.price)}</div>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="card">
            <div className="card-title">Observacoes</div>
            <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#374151", whiteSpace: "pre-wrap" }}>{order.notes}</p>
          </div>
        )}

        {/* Assinaturas */}
        <div className="card" style={{ marginTop: "auto" }}>
          <div className="card-title">Assinaturas</div>
          <div className="sig-grid">
            {/* Cliente — usa a assinatura coletada na execução, se houver */}
            <div className="sig-box">
              <div className="sig-area">
                {signature ? (
                  isDrawnSignature ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={signature} alt="Assinatura do cliente" className="sig-img" />
                  ) : (
                    <span className="sig-typed">{signature}</span>
                  )
                ) : null}
              </div>
              <div className="sig-line">
                <div className="sig-label">Assinatura do Cliente</div>
                <div className="sig-name">{order.customer.fullName}</div>
                {signature && signedAt && (
                  <div className="sig-meta">Assinado em {formatDate(signedAt)}</div>
                )}
                {!signature && (
                  <div className="sig-meta">Assinatura pendente</div>
                )}
              </div>
            </div>

            {/* Técnico — espaço para assinar a caneta */}
            <div className="sig-box">
              <div className="sig-area" />
              <div className="sig-line">
                <div className="sig-label">Tecnico Responsavel</div>
                <div className="sig-name">{order.technician?.name ?? "—"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="ftr">
          <span>Elite Ambiental — Controle de Pragas e Dedetizacao</span>
          <span>OS #{orderLabel} — {formatDate(new Date())}</span>
        </div>
      </div>
    </>
  );
}
