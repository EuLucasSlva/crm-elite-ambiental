"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

interface MonthPoint {
  label: string;
  revenue: number;
  cost: number;
  profit: number;
  count: number;
}

interface Props {
  monthlySeries: MonthPoint[];
}

function fmtBrl(v: number): string {
  if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`;
  return `R$${v.toFixed(0)}`;
}

export function FinanceCharts({ monthlySeries }: Props) {
  const revenueRef = useRef<HTMLCanvasElement>(null);
  const profitRef = useRef<HTMLCanvasElement>(null);
  const revenueChart = useRef<Chart | null>(null);
  const profitChart = useRef<Chart | null>(null);

  useEffect(() => {
    if (!revenueRef.current || !profitRef.current) return;

    const labels = monthlySeries.map((m) => m.label);
    const revenues = monthlySeries.map((m) => m.revenue);
    const costs = monthlySeries.map((m) => m.cost);
    const profits = monthlySeries.map((m) => m.profit);

    const sharedOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 24 } },
      plugins: {
        legend: {
          display: true,
          position: "top" as const,
          align: "end" as const,
          labels: {
            boxWidth: 12, boxHeight: 3,
            font: { family: "Sora", size: 11 },
            color: "#6b7280", padding: 12,
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx: { dataset: { label?: string }; raw: unknown }) =>
              ` ${ctx.dataset.label}: R$ ${Number(ctx.raw).toLocaleString("pt-BR")}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: "Sora", size: 11 }, color: "#6b7280" },
        },
        y: {
          grid: { color: "rgba(0,0,0,0.06)" },
          ticks: {
            font: { family: "Sora", size: 11 },
            color: "#6b7280",
            callback: (v: string | number) => fmtBrl(Number(v)),
          },
        },
      },
    };

    // Revenue vs Cost chart
    revenueChart.current?.destroy();
    revenueChart.current = new Chart(revenueRef.current.getContext("2d")!, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Faturamento",
            data: revenues,
            backgroundColor: "#1e4d8c",
            hoverBackgroundColor: "#163a6b",
            borderRadius: 6,
            borderSkipped: false,
            order: 2,
          },
          {
            label: "Custo (insumos)",
            data: costs,
            backgroundColor: "#e05c3a",
            hoverBackgroundColor: "#c44a2a",
            borderRadius: 6,
            borderSkipped: false,
            order: 2,
          },
        ],
      },
      options: sharedOptions,
    });

    // Profit chart
    profitChart.current?.destroy();
    profitChart.current = new Chart(profitRef.current.getContext("2d")!, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Lucro bruto",
            data: profits,
            borderColor: "#10b981",
            backgroundColor: "rgba(16,185,129,0.12)",
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: profits.map((p) => (p >= 0 ? "#10b981" : "#ef4444")),
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
        ],
      },
      options: sharedOptions,
    });

    return () => {
      revenueChart.current?.destroy();
      profitChart.current?.destroy();
    };
  }, [monthlySeries]);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-[18px] p-6 shadow-sm" style={{ background: "var(--card-bg)" }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: "var(--text)" }}>
          Faturamento vs Custo (6 meses)
        </h2>
        <div style={{ height: "240px" }}>
          <canvas ref={revenueRef} />
        </div>
      </div>
      <div className="rounded-[18px] p-6 shadow-sm" style={{ background: "var(--card-bg)" }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: "var(--text)" }}>
          Lucro Bruto (6 meses)
        </h2>
        <div style={{ height: "240px" }}>
          <canvas ref={profitRef} />
        </div>
      </div>
    </div>
  );
}
