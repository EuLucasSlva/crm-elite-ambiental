import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDate, shortId, formatCurrency } from "@/lib/format";
import { SERVICE_TYPE_LABELS } from "@/lib/labels";
import { PrintActions } from "./PrintActions";

interface PageProps {
  params: Promise<{ id: string }>;
}

const UNIT_LABELS: Record<string, string> = {
  ML: "mL", G: "g", L: "L", KG: "kg", UNIT: "un", M2: "m²",
};

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
          id: true, applicationPoint: true, delta: true,
          stockItem: { select: { name: true, unit: true } },
        },
      },
    },
  });

  if (!order) notFound();

  const orderLabel = order.orderNumber ?? shortId(order.id);

  // Assinatura do cliente coletada na execução.
  // Desenhada = data URL de imagem; digitada = texto puro (fonte cursiva).
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

  const areas = order.treatedAreas ?? [];
  const pests = order.pestTypes ?? [];

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
          padding: 12mm 13mm 10mm;
        }

        /* ── HEADER ── */
        .hdr {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding-bottom: 8px;
          margin-bottom: 12px;
          border-bottom: 2.5px solid #1e3054;
        }
        .hdr-logo { font-size: 20px; font-weight: 900; color: #1e3054; letter-spacing: -0.4px; }
        .hdr-tagline { font-size: 9px; color: #6b7280; font-weight: 500; margin-top: 1px; }
        .hdr-date { font-size: 8.5px; color: #9ca3af; margin-top: 1px; }
        .hdr-os { text-align: right; }
        .hdr-os-label { font-size: 8.5px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
        .hdr-os-num { font-size: 26px; font-weight: 900; color: #1e3054; line-height: 1; margin-top: 1px; }
        .hdr-os-type { margin-top: 4px; display: inline-block; background: #1e3054; color: white; font-size: 8.5px; font-weight: 700; border-radius: 3px; padding: 2px 8px; text-transform: uppercase; letter-spacing: 0.05em; }

        /* ── SECTION ── */
        .sec {
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          padding: 9px 12px;
          margin-bottom: 9px;
          break-inside: avoid;
        }
        .sec-title {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #1e3054;
          margin-bottom: 7px;
          padding-bottom: 5px;
          border-bottom: 1px solid #eef1f6;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .sec-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px; height: 16px;
          background: #1e3054; color: white;
          border-radius: 4px;
          font-size: 9px; font-weight: 800;
        }

        /* ── FIELDS ── */
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 24px; }
        .field { }
        .field-label { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; }
        .field-value { font-size: 12.5px; font-weight: 600; color: #111827; line-height: 1.3; }
        .field-value.big { font-size: 15px; font-weight: 800; }
        .field-full { grid-column: 1 / -1; }

        .chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px; }
        .chip { background: #eef2ff; color: #1e3054; font-size: 10.5px; font-weight: 600; border-radius: 4px; padding: 2px 7px; }

        /* ── TABLE ── */
        table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
        th { text-align: left; font-weight: 700; color: #6b7280; border-bottom: 1.5px solid #d1d5db; padding: 3px 6px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.03em; }
        td { padding: 3px 6px; border-bottom: 1px dotted #e5e7eb; color: #374151; }
        tr:last-child td { border-bottom: none; }
        .empty { font-size: 11px; color: #9ca3af; padding: 6px 0; text-align: center; }

        /* ── ACCEPT / SIGNATURES ── */
        .accept-text { font-size: 10px; color: #4b5563; line-height: 1.5; margin-bottom: 12px; }
        .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
        .sig-box { display: flex; flex-direction: column; }
        .sig-area {
          height: 66px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 3px;
          overflow: hidden;
        }
        .sig-img { max-height: 62px; max-width: 100%; object-fit: contain; }
        .sig-typed {
          font-family: 'Dancing Script', 'Segoe Script', 'Brush Script MT', cursive;
          font-size: 26px; color: #111827; line-height: 1.1; text-align: center;
        }
        .sig-line { border-top: 1.5px solid #374151; padding-top: 4px; text-align: center; }
        .sig-label { font-size: 9px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .sig-name { font-size: 11px; color: #374151; font-weight: 600; margin-top: 1px; }
        .sig-meta { font-size: 8px; color: #9ca3af; margin-top: 1px; }

        /* ── FOOTER ── */
        .ftr {
          margin-top: auto;
          padding-top: 8px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          font-size: 8px;
          color: #9ca3af;
        }
      `}</style>

      <div className="no-print">
        <PrintActions backUrl={`/service-orders/${id}`} />
      </div>

      <div className="sheet">
        {/* Header */}
        <div className="hdr">
          <div>
            <div className="hdr-logo">Elite Ambiental</div>
            <div className="hdr-tagline">Controle de Pragas e Dedetizacao</div>
            <div className="hdr-date">Emitido em: {formatDate(new Date())}</div>
          </div>
          <div className="hdr-os">
            <div className="hdr-os-label">Ordem de Servico</div>
            <div className="hdr-os-num">#{orderLabel}</div>
            <div>
              <span className="hdr-os-type">{SERVICE_TYPE_LABELS[order.serviceType]}</span>
            </div>
          </div>
        </div>

        {/* ── 1. Dados do cliente e local de atendimento ── */}
        <div className="sec">
          <div className="sec-title"><span className="sec-num">1</span> Dados do Cliente e Local de Atendimento</div>
          <div className="grid2">
            <div className="field field-full">
              <div className="field-label">Cliente</div>
              <div className="field-value big">{order.customer.fullName}</div>
            </div>
            <div className="field">
              <div className="field-label">CPF / CNPJ</div>
              <div className="field-value">{order.customer.cpfCnpj || "—"}</div>
            </div>
            <div className="field">
              <div className="field-label">Telefone / WhatsApp</div>
              <div className="field-value">{order.customer.phone || "—"}</div>
            </div>
            <div className="field field-full">
              <div className="field-label">Endereco do Atendimento</div>
              <div className="field-value">{address}</div>
            </div>
            <div className="field field-full">
              <div className="field-label">Areas Tratadas</div>
              {areas.length > 0 ? (
                <div className="chips">
                  {areas.map((a) => <span key={a} className="chip">{a}</span>)}
                </div>
              ) : (
                <div className="field-value" style={{ color: "#9ca3af" }}>Nao especificado</div>
              )}
            </div>
          </div>
        </div>

        {/* ── 2. Escopo do serviço e metodologia aplicada ── */}
        <div className="sec">
          <div className="sec-title"><span className="sec-num">2</span> Escopo do Servico e Metodologia Aplicada</div>
          <div className="grid2">
            <div className="field">
              <div className="field-label">Tipo de Servico</div>
              <div className="field-value">{SERVICE_TYPE_LABELS[order.serviceType]}</div>
            </div>
            <div className="field">
              <div className="field-label">Valor do Servico</div>
              <div className="field-value">{order.isFree ? "Gratuito" : formatCurrency(order.price)}</div>
            </div>
            <div className="field">
              <div className="field-label">Data Agendada</div>
              <div className="field-value">{scheduledDate}</div>
            </div>
            <div className="field">
              <div className="field-label">Horario</div>
              <div className="field-value">{scheduledTime}</div>
            </div>
            <div className="field field-full">
              <div className="field-label">Pragas Alvo</div>
              {pests.length > 0 ? (
                <div className="chips">
                  {pests.map((p) => <span key={p} className="chip">{p}</span>)}
                  {order.cleanWaterTank && <span className="chip">Limpeza de caixa d&apos;agua</span>}
                </div>
              ) : order.cleanWaterTank ? (
                <div className="chips"><span className="chip">Limpeza de caixa d&apos;agua</span></div>
              ) : (
                <div className="field-value" style={{ color: "#9ca3af" }}>Nao especificado</div>
              )}
            </div>
            {order.notes && (
              <div className="field field-full">
                <div className="field-label">Metodologia / Observacoes</div>
                <div className="field-value" style={{ fontWeight: 500, whiteSpace: "pre-wrap" }}>{order.notes}</div>
              </div>
            )}
          </div>
        </div>

        {/* ── 3. Materiais utilizados ── */}
        <div className="sec">
          <div className="sec-title"><span className="sec-num">3</span> Materiais Utilizados</div>
          {order.stockMovements.length === 0 ? (
            <div className="empty">Nenhum material registrado nesta ordem.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: "45%" }}>Produto</th>
                  <th style={{ width: "35%" }}>Local de Aplicacao</th>
                  <th style={{ width: "20%", textAlign: "right" }}>Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {order.stockMovements.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600, color: "#111827" }}>{m.stockItem?.name ?? "—"}</td>
                    <td>{m.applicationPoint ?? "—"}</td>
                    <td style={{ textAlign: "right" }}>
                      {Math.abs(m.delta).toLocaleString("pt-BR")} {m.stockItem?.unit ? UNIT_LABELS[m.stockItem.unit] ?? m.stockItem.unit.toLowerCase() : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── 4. Termo de encerramento e aceite ── */}
        <div className="sec">
          <div className="sec-title"><span className="sec-num">4</span> Termo de Encerramento e Aceite</div>
          <p className="accept-text">
            Declaro que o servico descrito nesta ordem foi executado conforme o escopo acordado,
            com a utilizacao dos produtos e metodologia indicados. O cliente atesta o recebimento
            e a conformidade do servico prestado pela Elite Ambiental.
          </p>
          <div className="sig-grid">
            {/* Técnico */}
            <div className="sig-box">
              <div className="sig-area" />
              <div className="sig-line">
                <div className="sig-label">Assinatura do Tecnico</div>
                <div className="sig-name">{order.technician?.name ?? "—"}</div>
              </div>
            </div>
            {/* Cliente — assinatura coletada na execução */}
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
                {signature && signedAt ? (
                  <div className="sig-meta">Assinado em {formatDate(signedAt)}</div>
                ) : (
                  <div className="sig-meta">Assinatura pendente</div>
                )}
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
