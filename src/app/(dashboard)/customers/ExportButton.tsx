"use client";

import { formatDate } from "@/lib/format";
import { formatAppDateInput } from "@/lib/date-time";
import { escapeCsvCell } from "@/lib/csv";

interface CustomerRow {
  fullName: string;
  cpfCnpj: string;
  city: string;
  state: string;
  propertyType: string;
  leadSource: string;
  serviceOrderCount: number;
  createdAt: string; // ISO string (serialized from server)
}

interface Props {
  customers: CustomerRow[];
}

export function ExportButton({ customers }: Props) {
  function handleExport() {
    const headers = [
      "Nome",
      "CPF/CNPJ",
      "Cidade",
      "Estado",
      "Tipo de Imóvel",
      "Canal de Origem",
      "Qtd OS",
      "Data de Cadastro",
    ];

    const rows = customers.map((c) => [
      escapeCsvCell(c.fullName),
      escapeCsvCell(c.cpfCnpj),
      escapeCsvCell(c.city),
      escapeCsvCell(c.state),
      escapeCsvCell(c.propertyType),
      escapeCsvCell(c.leadSource),
      escapeCsvCell(c.serviceOrderCount),
      escapeCsvCell(formatDate(c.createdAt)),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes_${formatAppDateInput()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button onClick={handleExport} className="btn-secondary gap-1.5">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      Exportar CSV
    </button>
  );
}
