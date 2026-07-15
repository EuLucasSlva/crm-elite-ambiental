import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDate, shortId } from "@/lib/format";
import { PrintActions } from "../PrintActions";

interface PageProps {
  params: Promise<{ id: string }>;
}

const INTERVAL_LABEL: Record<number, string> = {
  15: "a cada 15 dias",
  20: "a cada 20 dias",
  30: "a cada 30 dias",
  60: "a cada 60 dias",
  90: "a cada 90 dias (trimestral)",
  180: "a cada 180 dias (semestral)",
};

export default async function PrintVisitsPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const order = await prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          fullName: true, phone: true,
          city: true, state: true, street: true, number: true, complement: true,
        },
      },
      technician: { select: { name: true } },
    },
  });

  if (!order) notFound();

  const orderLabel = order.orderNumber ?? shortId(order.id);
  const interval = order.visitIntervalDays || 90;

  // Próximas 6 visitas FUTURAS a partir do agendamento, no intervalo definido.
  const visits: Date[] = [];
  if (order.scheduledAt) {
    const base = new Date(order.scheduledAt);
    const now = Date.now();
    // Pula as ocorrências que já passaram para começar sempre na primeira futura.
    let i = 1;
    while (visits.length < 6 && i <= 240) {
      const d = new Date(base);
      d.setDate(d.getDate() + interval * i);
      if (d.getTime() >= now) visits.push(d);
      i++;
    }
  }

  const address = [
    `${order.customer.street}, ${order.customer.number}`,
    order.customer.complement,
    `${order.customer.city} — ${order.customer.state}`,
  ]
    .filter(Boolean)
    .join(" / ");

  // Se não houver agendamento, mostra 6 linhas em branco para preencher à mão.
  const rows = visits.length > 0 ? visits : new Array(6).fill(null);

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
          background: white;
          padding: 14mm 14mm 12mm;
        }

        .hdr {
          display: flex; align-items: flex-start; justify-content: space-between;
          padding-bottom: 9px; margin-bottom: 14px;
          border-bottom: 2.5px solid #1e3054;
        }
        .hdr-logo { font-size: 21px; font-weight: 900; color: #1e3054; letter-spacing: -0.4px; }
        .hdr-tagline { font-size: 9px; color: #6b7280; font-weight: 500; margin-top: 1px; }
        .hdr-os { text-align: right; }
        .hdr-os-label { font-size: 8.5px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
        .hdr-os-num { font-size: 24px; font-weight: 900; color: #1e3054; line-height: 1; }

        .title { font-size: 15px; font-weight: 800; color: #111827; margin-bottom: 3px; }
        .subtitle { font-size: 11px; color: #6b7280; margin-bottom: 14px; }

        .info { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 24px; margin-bottom: 16px; }
        .info-label { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; }
        .info-value { font-size: 12px; font-weight: 600; color: #111827; }
        .info-full { grid-column: 1 / -1; }

        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th {
          text-align: left; font-weight: 700; color: #fff; background: #1e3054;
          padding: 7px 8px; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.03em;
        }
        th:first-child { border-top-left-radius: 6px; }
        th:last-child { border-top-right-radius: 6px; }
        td { padding: 12px 8px; border-bottom: 1px solid #e5e7eb; color: #374151; vertical-align: bottom; }
        tr:nth-child(even) td { background: #f8fafc; }
        .date-cell { font-weight: 700; color: #1e3054; font-size: 12.5px; }
        .blank { border-bottom: 1px dashed #cbd5e1; display: block; height: 14px; min-width: 70px; }

        .note { margin-top: 14px; font-size: 9.5px; color: #6b7280; line-height: 1.5; }
        .ftr { margin-top: 18px; padding-top: 8px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 8px; color: #9ca3af; }
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
          </div>
          <div className="hdr-os">
            <div className="hdr-os-label">Ordem de Servico</div>
            <div className="hdr-os-num">#{orderLabel}</div>
          </div>
        </div>

        <div className="title">Cronograma de Proximas Visitas</div>
        <div className="subtitle">
          Programacao de visitas periodicas {INTERVAL_LABEL[interval] ?? `a cada ${interval} dias`}.
        </div>

        {/* Cliente */}
        <div className="info">
          <div className="info-full">
            <div className="info-label">Cliente</div>
            <div className="info-value">{order.customer.fullName}</div>
          </div>
          <div className="info-full">
            <div className="info-label">Endereco</div>
            <div className="info-value">{address}</div>
          </div>
          <div>
            <div className="info-label">Telefone</div>
            <div className="info-value">{order.customer.phone || "—"}</div>
          </div>
          <div>
            <div className="info-label">Tecnico Responsavel</div>
            <div className="info-value">{order.technician?.name ?? "—"}</div>
          </div>
        </div>

        {/* Tabela de visitas */}
        <table>
          <thead>
            <tr>
              <th style={{ width: "16%" }}>Data</th>
              <th style={{ width: "26%" }}>Servico Programado</th>
              <th style={{ width: "24%" }}>Responsavel Tecnico</th>
              <th style={{ width: "20%" }}>Observacoes</th>
              <th style={{ width: "14%" }}>Rubrica / Visto</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d: Date | null, idx: number) => (
              <tr key={idx}>
                <td className="date-cell">{d ? formatDate(d) : <span className="blank" />}</td>
                <td>{idx === 0 ? "Inspecao" : `Inspecao periodica ${idx + 1}`}</td>
                <td>{order.technician?.name ?? <span className="blank" />}</td>
                <td><span className="blank" /></td>
                <td><span className="blank" /></td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="note">
          As datas acima sao uma previsao com base na periodicidade contratada e podem ser ajustadas
          conforme disponibilidade. A cada visita realizada, o responsavel deve registrar observacoes
          e colher a rubrica do cliente para controle.
        </p>

        <div className="ftr">
          <span>Elite Ambiental — Controle de Pragas e Dedetizacao</span>
          <span>OS #{orderLabel} — {formatDate(new Date())}</span>
        </div>
      </div>
    </>
  );
}
