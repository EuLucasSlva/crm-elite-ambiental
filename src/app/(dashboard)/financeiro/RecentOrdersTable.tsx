"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";

const SERVICE_TYPE_PT: Record<string, string> = {
  INSPECTION: "Inspeção",
  TREATMENT: "Tratamento",
  RETURN: "Retorno",
};

export interface RecentOrderRow {
  id: string;
  orderLabel: string;
  customerName: string;
  technicianName: string | null;
  serviceType: string;
  price: number | null;
  cost: number | null;
  profit: number;
  paymentStatus: string;
  paidAt: string | null; // ISO
  dueDate: string | null; // ISO — próxima parcela a vencer
  nextVisits: string[]; // ISO dates das próximas 6 visitas
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function RecentOrdersTable({ rows }: { rows: RecentOrderRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <p className="px-2 py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
        Nenhuma OS registrada ainda.
      </p>
    );
  }

  return (
    <div className="table-scroll">
      <table className="table-hover w-full text-sm">
        <thead>
          <tr>
            {["Cliente", "Tipo", "Valor", "Custo", "Lucro", "A vencer / Pago em", "Próximas visitas"].map((h) => (
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
          {rows.map((o) => {
            const isOpen = expandedId === o.id;

            // "A vencer / Pago em" cell
            let dueDateCell: React.ReactNode;
            if (o.paymentStatus === "PAID") {
              dueDateCell = (
                <span style={{ color: "var(--text-muted)" }}>{fmt(o.paidAt)}</span>
              );
            } else if (o.paymentStatus === "OVERDUE") {
              dueDateCell = (
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{ background: "#fee2e2", color: "#dc2626" }}
                >
                  Em atraso{o.dueDate ? ` · ${fmt(o.dueDate)}` : ""}
                </span>
              );
            } else {
              dueDateCell = o.dueDate ? (
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{ background: "#fef3c7", color: "#d97706" }}
                >
                  {fmt(o.dueDate)}
                </span>
              ) : (
                <span style={{ color: "var(--text-muted)" }}>—</span>
              );
            }

            const nextVisitLabel =
              o.nextVisits.length > 0 ? fmt(o.nextVisits[0]) : "—";

            return (
              <React.Fragment key={o.id}>
                <tr
                  onClick={() => setExpandedId(isOpen ? null : o.id)}
                  className="border-b last:border-0 cursor-pointer"
                  style={{ borderColor: "#dde1ed", background: isOpen ? "#f8fafc" : undefined }}
                >
                  <td className="px-2 py-2.5 font-medium max-w-[160px]" style={{ color: "var(--text)" }}>
                    <span className="block truncate" title={o.customerName}>
                      <span className="mr-1" style={{ color: "var(--text-muted)" }}>{isOpen ? "▾" : "▸"}</span>
                      {o.customerName}
                    </span>
                  </td>
                  <td className="px-2 py-2.5">
                    <Badge variant="blue" label={SERVICE_TYPE_PT[o.serviceType] ?? o.serviceType} />
                  </td>
                  <td className="px-2 py-2.5 font-semibold" style={{ color: "var(--navy)" }}>
                    {formatCurrency(o.price)}
                  </td>
                  <td className="px-2 py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    {formatCurrency(o.cost)}
                  </td>
                  <td className="px-2 py-2.5 font-semibold" style={{ color: o.profit >= 0 ? "#059669" : "#ef4444" }}>
                    {formatCurrency(o.profit)}
                  </td>
                  <td className="px-2 py-2.5 text-xs">{dueDateCell}</td>
                  <td className="px-2 py-2.5 text-xs" style={{ color: "var(--text)" }}>
                    {nextVisitLabel}
                    {o.nextVisits.length > 1 && (
                      <span className="ml-1" style={{ color: "var(--text-muted)" }}>
                        +{o.nextVisits.length - 1}
                      </span>
                    )}
                  </td>
                </tr>

                {/* Expanded detail — tabela de inspeções futuras */}
                {isOpen && (
                  <tr style={{ background: "#f8fafc" }}>
                    <td colSpan={7} className="px-4 py-4">
                      <div className="rounded-lg border bg-white p-4" style={{ borderColor: "#e2e8f0" }}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-bold" style={{ color: "var(--text)" }}>
                            Cronograma de visitas — {o.customerName}
                          </h4>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            OS {o.orderLabel}
                          </span>
                        </div>
                        {o.nextVisits.length === 0 ? (
                          <p className="text-sm py-3 text-center" style={{ color: "var(--text-muted)" }}>
                            Nenhuma visita futura programada (defina a data de agendamento na OS).
                          </p>
                        ) : (
                          <table className="w-full text-sm">
                            <thead>
                              <tr>
                                {["Data", "Serviço programado", "Responsável técnico", "Observações", "Rubrica / Visto"].map((h) => (
                                  <th
                                    key={h}
                                    className="text-left pb-2 text-xs font-bold uppercase tracking-wide border-b px-2"
                                    style={{ color: "var(--text-muted)", borderColor: "#e2e8f0" }}
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {o.nextVisits.map((iso, idx) => (
                                <tr key={iso} className="border-b last:border-0" style={{ borderColor: "#eef1f6" }}>
                                  <td className="px-2 py-3 font-semibold" style={{ color: "var(--navy)" }}>
                                    {fmt(iso)}
                                  </td>
                                  <td className="px-2 py-3" style={{ color: "var(--text)" }}>
                                    {idx === 0 ? "Inspeção" : `Inspeção periódica ${idx + 1}`}
                                  </td>
                                  <td className="px-2 py-3" style={{ color: "var(--text-muted)" }}>
                                    {o.technicianName ?? "—"}
                                  </td>
                                  <td className="px-2 py-3" style={{ minWidth: "180px" }}>
                                    <span className="block border-b border-dashed" style={{ borderColor: "#cbd5e1", height: "20px" }} />
                                  </td>
                                  <td className="px-2 py-3" style={{ minWidth: "120px" }}>
                                    <span className="block border-b border-dashed" style={{ borderColor: "#cbd5e1", height: "20px" }} />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
