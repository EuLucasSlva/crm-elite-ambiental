"use client";

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

function escapeCell(value: string | number): string {
  const str = String(value);
  // Wrap in quotes if contains comma, quote, or newline
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
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
      escapeCell(c.fullName),
      escapeCell(c.cpfCnpj),
      escapeCell(c.city),
      escapeCell(c.state),
      escapeCell(c.propertyType),
      escapeCell(c.leadSource),
      escapeCell(c.serviceOrderCount),
      escapeCell(new Date(c.createdAt).toLocaleDateString("pt-BR")),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`;
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
