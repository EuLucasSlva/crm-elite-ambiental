"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-5 text-center px-4">
      <div
        className="h-16 w-16 rounded-full flex items-center justify-center"
        style={{ background: "var(--card-bg)" }}
      >
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
          Algo deu errado
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {error.message || "Erro inesperado. Tente novamente."}
        </p>
      </div>
      <button
        onClick={reset}
        className="btn-primary"
      >
        Tentar novamente
      </button>
    </div>
  );
}
