"use client";

interface StockRow {
  name: string;
  activeIngredient: string;
  unit: string;
  quantity: number;
  minThreshold: number;
  expiryDate: string | null;
  supplier: string;
  status: string;
}

interface Props {
  items: StockRow[];
}

function escapeCell(value: string | number | null): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function StockExportButton({ items }: Props) {
  function handleExport() {
    const headers = ["Nome", "Princípio Ativo", "Unidade", "Quantidade", "Mínimo", "Validade", "Fornecedor", "Status"];

    const rows = items.map((item) => [
      escapeCell(item.name),
      escapeCell(item.activeIngredient),
      escapeCell(item.unit),
      escapeCell(item.quantity),
      escapeCell(item.minThreshold),
      escapeCell(item.expiryDate ? new Date(item.expiryDate).toLocaleDateString("pt-BR") : "—"),
      escapeCell(item.supplier),
      escapeCell(item.status),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `estoque_${new Date().toISOString().slice(0, 10)}.csv`;
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
