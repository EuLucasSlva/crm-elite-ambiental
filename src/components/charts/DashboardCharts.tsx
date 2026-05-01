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

const PERIOD_DOT: Record<Period, string> = {
  semana: "#10b981",
  mes: "#0ea5e9",
  ano: "#f59e0b",
};

const CHART_HEIGHT = "min(270px, 40vw)";

function fmtBrl(v: number): string {
  if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`;
  return `R$${v}`;
}

const datalabelsPlugin = {
  id: "inlineDatalabels",
  afterDatasetsDraw(chart: Chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, datasetIndex) => {
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
        if (value === 0) return;
        const isBar = (chart.config as { type?: string }).type === "bar";
        const label = isBar ? fmtBrl(value) : String(value);

        let fillStyle = isBar ? "#1e4d8c" : "#059669";
        if (isBar) {
          const metaDataset = chart.data.datasets[1];
          const metaVal = metaDataset ? Number(metaDataset.data[index]) : Infinity;
          if (value < metaVal) fillStyle = "#c44a2a";
        }

        ctx.fillStyle = fillStyle;
        ctx.fillText(label, element.x, element.y - 6);
      });

      ctx.restore();
    });
  },
};

// ── Types ─────────────────────────────────────────────────────────

export interface PeriodSeries {
  labels: string[];
  data: number[];
}

export interface FaturamentoChartProps {
  semana: PeriodSeries;
  mes: PeriodSeries;
  ano: PeriodSeries;
}

export interface OsChartProps {
  semana: PeriodSeries;
  mes: PeriodSeries;
  ano: PeriodSeries;
}

// ── FaturamentoChart ──────────────────────────────────────────────

export function FaturamentoChart({ semana, mes, ano }: FaturamentoChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [period, setPeriod] = useState<Period>("semana");

  const seriesMap: Record<Period, PeriodSeries> = { semana, mes, ano };

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    chartRef.current?.destroy();
    const d = seriesMap[period];
    const avg = d.data.length > 0 ? d.data.reduce((a, b) => a + b, 0) / d.data.length : 0;
    const metaData = d.labels.map(() => avg);

    const barColors = d.data.map((v) => (v < avg && avg > 0 ? "#e05c3a" : "#1e4d8c"));
    const barHoverColors = d.data.map((v) => (v < avg && avg > 0 ? "#c44a2a" : "#163a6b"));

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
            label: "Média",
            data: avg > 0 ? metaData : [],
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
            display: avg > 0,
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
                return ` Média: R$ ${v.toLocaleString("pt-BR")}`;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, semana, mes, ano]);

  return (
    <ChartCard title="Faturamento por Período" period={period} onPeriod={setPeriod}>
      <div style={{ height: CHART_HEIGHT }}>
        <canvas ref={canvasRef} />
      </div>
    </ChartCard>
  );
}

// ── OsChart ───────────────────────────────────────────────────────

export function OsChart({ semana, mes, ano }: OsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [period, setPeriod] = useState<Period>("ano");

  const seriesMap: Record<Period, PeriodSeries> = { semana, mes, ano };

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    chartRef.current?.destroy();
    const d = seriesMap[period];

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
              label: (ctx) => ` ${Number(ctx.raw)} OS`,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, semana, mes, ano]);

  return (
    <ChartCard title="OS Atendidas" period={period} onPeriod={setPeriod}>
      <div style={{ height: CHART_HEIGHT }}>
        <canvas ref={canvasRef} />
      </div>
    </ChartCard>
  );
}

// ── ChartCard wrapper ─────────────────────────────────────────────

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
