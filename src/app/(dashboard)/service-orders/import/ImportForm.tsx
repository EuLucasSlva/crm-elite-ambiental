"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { importLeads } from "./actions";

interface Customer {
  id: string;
  fullName: string;
  cpfCnpj: string;
  city: string;
  state: string;
}

interface ParsedRow {
  serviceFor: string;
  serviceAddress: string | null;
  team: string | null;
  price: number | null;
  scheduledAt: string | null; // ISO
  dateLabel: string; // para exibir no preview
}

interface Props {
  customers: Customer[];
}

const HEADER = "DATA;HORÁRIO;EQUIPE;UNIDADE (ESCOLA/POSTO);ENDEREÇO;MAPA;STATUS;Preco;Cliente";

// Extrai DD/MM/YYYY + HH:MM e monta um ISO local.
function buildDate(dateCell: string, timeCell: string): { iso: string | null; label: string } {
  const dm = dateCell.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  const tm = timeCell.match(/(\d{1,2}):(\d{2})/);
  if (!dm) return { iso: null, label: "—" };
  const [, dd, mm, yyyy] = dm;
  const hh = tm ? tm[1] : "08";
  const min = tm ? tm[2] : "00";
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min));
  if (isNaN(d.getTime())) return { iso: null, label: "—" };
  const label = `${dd}/${mm}/${yyyy}${tm ? ` ${hh}:${min}` : ""}`;
  return { iso: d.toISOString(), label };
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows: ParsedRow[] = [];
  for (const line of lines) {
    const cells = line.split(";").map((c) => c.trim());
    // Pula linhas de cabeçalho (podem se repetir no meio do arquivo)
    if (cells[0]?.toUpperCase().startsWith("DATA")) continue;
    const serviceFor = cells[3] ?? "";
    if (!serviceFor) continue; // sem unidade não é uma linha válida
    const { iso, label } = buildDate(cells[0] ?? "", cells[1] ?? "");
    const priceRaw = (cells[7] ?? "").replace(/[^\d,.-]/g, "").replace(",", ".");
    const price = priceRaw ? parseFloat(priceRaw) : null;
    rows.push({
      serviceFor,
      serviceAddress: cells[4] || null,
      team: cells[2] || null,
      price: price != null && !isNaN(price) ? price : null,
      scheduledAt: iso,
      dateLabel: label,
    });
  }
  return rows;
}

export function ImportForm({ customers }: Props) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState("");
  const [raw, setRaw] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId]
  );

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setRaw(text);
      setRows(parseCsv(text));
      setError(null);
      setDone(null);
    };
    reader.readAsText(file, "UTF-8");
  }

  function handleParse() {
    setRows(parseCsv(raw));
    setError(null);
    setDone(null);
  }

  function downloadTemplate() {
    const example =
      "30/07/2026 (Quinta-feira);08:00;Equipe 1;NOME DA ESCOLA/UNIDADE;RUA EXEMPLO, 123 CEP 00000-000;Abrir no Maps;Agendado;130;NOME DO CLIENTE";
    const content = "﻿" + HEADER + "\n" + example + "\n";
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-importacao-leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    if (!customerId) { setError("Selecione o cliente."); return; }
    if (rows.length === 0) { setError("Nenhuma linha válida para importar."); return; }
    setError(null);
    startTransition(async () => {
      const res = await importLeads(customerId, rows.map(({ dateLabel: _dateLabel, ...r }) => r));
      if (res.error) { setError(res.error); return; }
      setDone(res.createdCount ?? 0);
      setRows([]);
      setRaw("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {/* 1. Cliente */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">1. Cliente de destino</h2>
        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
        >
          <option value="">Selecione o cliente...</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName} — {c.city}/{c.state}
            </option>
          ))}
        </select>
        {selectedCustomer && (
          <p className="mt-2 text-xs text-green-700">
            Todas as {rows.length > 0 ? rows.length : ""} inspeções serão criadas para{" "}
            <strong>{selectedCustomer.fullName}</strong>.
          </p>
        )}
      </section>

      {/* 2. Planilha */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-800">2. Planilha (CSV)</h2>
          <button
            type="button"
            onClick={downloadTemplate}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            ⬇ Baixar modelo
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-2">
          Colunas esperadas (separadas por ponto-e-vírgula): <br />
          <code className="text-[11px] text-gray-600">{HEADER}</code>
        </p>

        <div className="flex flex-col gap-3">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            className="text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-800 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-gray-900"
          />
          <p className="text-xs text-gray-400">ou cole os dados abaixo:</p>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onBlur={handleParse}
            rows={5}
            placeholder="Cole aqui as linhas da planilha..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-mono text-gray-700 focus:border-green-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleParse}
            className="self-start rounded-lg bg-gray-100 px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
          >
            Processar linhas
          </button>
        </div>
      </section>

      {/* 3. Preview */}
      {rows.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">
            3. Pré-visualização — {rows.length} linha{rows.length !== 1 ? "s" : ""}
          </h2>
          <div className="overflow-x-auto max-h-80 overflow-y-auto rounded-lg border border-gray-100">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  {["#", "Data", "Equipe", "Unidade", "Endereço", "Valor"].map((h) => (
                    <th key={h} className="text-left px-2 py-2 font-bold text-gray-500 border-b">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-2 py-1.5 text-gray-400">{i + 1}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap font-medium text-gray-700">{r.dateLabel}</td>
                    <td className="px-2 py-1.5 text-gray-600">{r.team ?? "—"}</td>
                    <td className="px-2 py-1.5 font-medium text-gray-800">{r.serviceFor}</td>
                    <td className="px-2 py-1.5 text-gray-500 max-w-[220px] truncate" title={r.serviceAddress ?? ""}>{r.serviceAddress ?? "—"}</td>
                    <td className="px-2 py-1.5 text-gray-700 whitespace-nowrap">{r.price != null ? `R$ ${r.price.toFixed(2)}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {done != null && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          ✓ {done} lead{done !== 1 ? "s" : ""} criado{done !== 1 ? "s" : ""} com sucesso!{" "}
          <button onClick={() => router.push("/service-orders")} className="underline font-semibold">
            Ver no Kanban
          </button>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          disabled={pending || rows.length === 0 || !customerId}
          onClick={handleImport}
          className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "Importando..." : `Importar ${rows.length > 0 ? rows.length : ""} leads`}
        </button>
      </div>
    </div>
  );
}
