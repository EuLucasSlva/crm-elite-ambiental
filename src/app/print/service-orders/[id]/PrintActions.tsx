"use client";

export function PrintActions({ backUrl }: { backUrl: string }) {
  return (
    <div className="no-print" style={{ marginBottom: "12px", display: "flex", gap: "8px" }}>
      <button
        onClick={() => window.print()}
        style={{ background: "#1e3054", color: "white", border: "none", borderRadius: "6px", padding: "8px 18px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
      >
        🖨 Imprimir
      </button>
      <a
        href={backUrl}
        style={{ background: "#eee", color: "#333", borderRadius: "6px", padding: "8px 18px", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}
      >
        ← Voltar
      </a>
    </div>
  );
}
