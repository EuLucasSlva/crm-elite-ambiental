"use client";

import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

type Period = "semana" | "mes" | "ano";

const PERIOD_LABELS: Record<Period, string> = {
  semana: "Esta semana",
  mes: "Este mês",
  ano: "Este ano",
};

// Subtle dot colors per period for the selector indicator
const PERIOD_DOT: Record<Period, string> = {
  semana: "#10b981",
  mes: "#0ea5e9",
  ano: "#f59e0b",
};

// Faturamento mock data — realistic values for a Brazilian pest control business (BRL)
const FAT_MOCK: Record<Period, { labels: string[]; data: number[] }> = {
  semana: {
    labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
    data: [1200, 2800, 1950, 3200, 2100, 1400],
  },
  mes: {
    labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
    data: [8400, 11200, 9800, 13600],
  },
  ano: {
    labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
    data: [9200, 8100, 11400, 10800, 13200, 12500, 14800, 13100, 15600, 16200, 14900, 17800],
  },
};

// Meta (target) values per period for the Faturamento chart (dashed amber line)
const FAT_META: Record<Period, number[]> = {
  semana: [2000, 2000, 2000, 2000, 2000, 2000],      // R$ 12.000 / semana ÷ 6 dias
  mes: [11250, 11250, 11250, 11250],                   // R$ 45.000 / mes ÷ 4 semanas
  ano: [11667, 11667, 11667, 11667, 11667, 11667, 11667, 11667, 11667, 11667, 11667, 11667], // R$ 140.000 ÷ 12
};

// OS (service orders) mock data
const OS_STATIC: Record<"semana" | "mes", { labels: string[]; data: number[] }> = {
  semana: {
    labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
    data: [2, 5, 3, 7, 4, 2],
  },
  mes: {
    labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
    data: [11, 14, 9, 16],
  },
};

// Meta (target) values per period for the OS chart
const OS_META: Record<Period, number | null> = {
  semana: 5,   // 5 per day
  mes: 15,     // 15 per week
  ano: 12,     // 12 per month
};

// Responsive chart height
const CHART_HEIGHT = "min(270px, 40vw)";

// ─── Helper: abbreviate BRL values for data labels ───────────────
function fmtBrl(v: number): string {
  if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`;
  return `R$${v}`;
}

// ─── Inline datalabels plugin ────────────────────────────────────
// Only labels the first dataset (real data); skips the meta line.
const datalabelsPlugin = {
  id: "inlineDatalabels",
  afterDatasetsDraw(chart: Chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      // Only draw labels for dataset index 0 (real data)
      if (datasetIndex !== 0) return;
      const meta = chart.getDatasetMeta(datasetIndex);
      if (!meta || meta.hidden) return;

      ctx.save();
      ctx.font = "600 10px Sora, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";

      meta.data.forEach((element, index) => {
        const raw = dataset.data[index];
        if (raw == null) return;
        const value = Number(raw);
        const isBar = (chart.config as { type?: string }).type === "bar";
        const label = isBar ? fmtBrl(value) : String(value);

        // For bars: match label color to bar color
        let fillStyle = isBar ? "#1e4d8c" : "#059669";
        if (isBar) {
          const metaDataset = chart.data.datasets[1];
          const metaVal = metaDataset ? Number(metaDataset.data[index]) : Infinity;
          if (value < metaVal) fillStyle = "#c44a2a";
        }

        ctx.fillStyle = fillStyle;
        const x = element.x;
        const y = element.y - 6;
        ctx.fillText(label, x, y);
      });

      ctx.restore();
    });
  },
};

// ─── FaturamentoChart ────────────────────────────────────────────
export function FaturamentoChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [period, setPeriod] = useState<Period>("semana");

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    chartRef.current?.destroy();
    const d = FAT_MOCK[period];
    const metaData = FAT_META[period];

    // Bar color: deep coral/orange if below meta, deep navy-blue otherwise
    const barColors = d.data.map((v, i) =>
      v < metaData[i] ? "#e05c3a" : "#1e4d8c"
    );
    const barHoverColors = d.data.map((v, i) =>
      v < metaData[i] ? "#c44a2a" : "#163a6b"
    );

    chartRef.current = new Chart(ctx, {
      type: "bar",
      plugins: [datalabelsPlugin],
      data: {
        labels: d.labels,
        datasets: [
          {
            label: "Faturamento",
            data: d.data,
            backgroundColor: barColors,
            hoverBackgroundColor: barHoverColors,
            borderRadius: 7,
            borderSkipped: false,
            order: 2,
          },
          {
            label: "Meta",
            data: metaData,
            type: "line" as const,
            borderColor: "#f59e0b",
            borderWidth: 2,
            borderDash: [6, 4],
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
            tension: 0,
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 20 } },
        plugins: {
          legend: {
            display: true,
            position: "top",
            align: "end",
            labels: {
              boxWidth: 12,
              boxHeight: 3,
              font: { family: "Sora", size: 11 },
              color: "#6b7280",
              padding: 12,
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = Number(ctx.raw);
                if (ctx.datasetIndex === 0) return ` R$ ${v.toLocaleString("pt-BR")}`;
                return ` Meta: R$ ${v.toLocaleString("pt-BR")}`;
              },
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
              callback: (v) => `R$ ${Number(v).toLocaleString("pt-BR")}`,
            },
          },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [period]);

  return (
    <ChartCard title="Faturamento por Período" period={period} onPeriod={setPeriod}>
      <div style={{ height: CHART_HEIGHT }}>
        <canvas ref={canvasRef} />
      </div>
    </ChartCard>
  );
}

// ─── OsChart ─────────────────────────────────────────────────────
export function OsChart({ monthlyData }: { monthlyData: { label: string; count: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [period, setPeriod] = useState<Period>("ano");

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    let d: { labels: string[]; data: number[] };
    if (period === "ano") {
      d = {
        labels: monthlyData.map((item) => item.label),
        data: monthlyData.map((item) => item.count),
      };
    } else {
      d = OS_STATIC[period];
    }

    const metaValue = OS_META[period];
    const metaData = metaValue !== null ? d.labels.map(() => metaValue) : [];

    chartRef.current?.destroy();
    chartRef.current = new Chart(ctx, {
      type: "line",
      plugins: [datalabelsPlugin],
      data: {
        labels: d.labels,
        datasets: [
          {
            label: "OS Atendidas",
            data: d.data,
            borderColor: "#10b981",
            backgroundColor: "rgba(16,185,129,0.12)",
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "#10b981",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            order: 2,
          },
          {
            label: "Meta",
            data: metaData,
            borderColor: "#f59e0b",
            borderWidth: 2,
            borderDash: [6, 4],
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
            tension: 0,
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 20 } },
        plugins: {
          legend: {
            display: true,
            position: "top",
            align: "end",
            labels: {
              boxWidth: 12,
              boxHeight: 3,
              font: { family: "Sora", size: 11 },
              color: "#6b7280",
              padding: 12,
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                if (ctx.datasetIndex === 0) return ` ${Number(ctx.raw)} OS`;
                return ` Meta: ${Number(ctx.raw)} OS`;
              },
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
            ticks: { font: { family: "Sora", size: 11 }, color: "#6b7280", stepSize: 1 },
          },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [period, monthlyData]);

  return (
    <ChartCard title="OS Atendidas" period={period} onPeriod={setPeriod}>
      <div style={{ height: CHART_HEIGHT }}>
        <canvas ref={canvasRef} />
      </div>
    </ChartCard>
  );
}

// ─── ChartCard wrapper ────────────────────────────────────────────
function ChartCard({
  title,
  period,
  onPeriod,
  children,
}: {
  title: string;
  period: Period;
  onPeriod: (p: Period) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[18px] p-6 shadow-sm" style={{ background: "var(--card-bg)" }}>
      <h2 className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>
        {title}
      </h2>
      <div className="flex gap-2 mb-4 flex-wrap">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => onPeriod(p)}
            className="flex items-center gap-1.5 text-sm font-semibold rounded-full px-5 py-2 transition-colors cursor-pointer"
            style={
              period === p
                ? { background: "var(--navy)", color: "#fff" }
                : { background: "#d4d9e8", color: "var(--text)" }
            }
          >
            <span
              style={{
                display: "inline-block",
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: period === p ? "rgba(255,255,255,0.75)" : PERIOD_DOT[p],
                flexShrink: 0,
              }}
            />
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
