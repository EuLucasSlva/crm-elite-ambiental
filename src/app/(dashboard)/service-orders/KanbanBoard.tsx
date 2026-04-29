"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { STATUS_LABELS, SERVICE_TYPE_LABELS } from "@/lib/labels";
import { shortId, formatDate } from "@/lib/format";
import type { ServiceOrderStatus, ServiceType } from "@prisma/client";

export type KanbanOrder = {
  id: string;
  status: ServiceOrderStatus;
  serviceType: ServiceType;
  isFree: boolean;
  scheduledAt: Date | null;
  customer: { fullName: string };
  technician: { name: string } | null;
};

interface KanbanColumn {
  key: string;
  label: string;
  statuses: ServiceOrderStatus[];
  accentColor: string;
  headerBg: string;
  headerText: string;
}

const COLUMNS: KanbanColumn[] = [
  { key: "lead",      label: "Lead",      statuses: ["LEAD_CAPTURED"],                                         accentColor: "#6b7280", headerBg: "#6b7280", headerText: "#fff" },
  { key: "inspecao",  label: "Inspeção",  statuses: ["INSPECTION_SCHEDULED", "VISIT_DONE"],                    accentColor: "#3b82f6", headerBg: "#3b82f6", headerText: "#fff" },
  { key: "orcamento", label: "Orçamento", statuses: ["QUOTE_CREATED", "QUOTE_APPROVED", "QUOTE_REJECTED"],     accentColor: "#f59e0b", headerBg: "#f59e0b", headerText: "#78350f" },
  { key: "agendado",  label: "Agendado",  statuses: ["SERVICE_SCHEDULED"],                                     accentColor: "#22c55e", headerBg: "#22c55e", headerText: "#fff" },
  { key: "executado", label: "Executado", statuses: ["SERVICE_EXECUTED", "CERTIFICATE_ISSUED"],                 accentColor: "#15803d", headerBg: "#15803d", headerText: "#fff" },
  { key: "encerrado", label: "Encerrado", statuses: ["WARRANTY_ACTIVE", "CLOSED", "CANCELED"],                 accentColor: "#9ca3af", headerBg: "#9ca3af", headerText: "#fff" },
];

function getColKey(status: ServiceOrderStatus): string {
  return COLUMNS.find((c) => c.statuses.includes(status))?.key ?? "lead";
}

// board state: colKey → ordered list of order ids
function buildInitialCols(orders: KanbanOrder[]): Record<string, string[]> {
  const cols: Record<string, string[]> = {};
  COLUMNS.forEach((c) => (cols[c.key] = []));
  orders.forEach((o) => cols[getColKey(o.status)].push(o.id));
  return cols;
}

interface KanbanBoardProps {
  orders: KanbanOrder[];
}

export function KanbanBoard({ orders }: KanbanBoardProps) {
  const orderMap = Object.fromEntries(orders.map((o) => [o.id, o]));
  const [cols, setCols] = useState<Record<string, string[]>>(() => buildInitialCols(orders));

  // drag state — plain refs, no re-renders needed during drag
  const dragId = useRef<string | null>(null);
  const dragFromCol = useRef<string | null>(null);
  const ghostRef = useRef<HTMLElement | null>(null);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function getAfterEl(container: HTMLElement, clientY: number): HTMLElement | null {
    const cards = [...container.querySelectorAll<HTMLElement>("[data-card-id]:not(.opacity-20)")];
    let closest: HTMLElement | null = null;
    let closestOffset = -Infinity;
    for (const el of cards) {
      const box = el.getBoundingClientRect();
      const offset = clientY - box.top - box.height / 2;
      if (offset < 0 && offset > closestOffset) {
        closestOffset = offset;
        closest = el;
      }
    }
    return closest;
  }

  // ── Drag handlers ──────────────────────────────────────────────────────────

  function onDragStart(e: React.DragEvent, id: string, colKey: string) {
    dragId.current = id;
    dragFromCol.current = colKey;
    e.dataTransfer.effectAllowed = "move";
    // slight delay so the browser renders the drag image before we fade the card
    setTimeout(() => setDraggingId(id), 0);
  }

  function onDragEnd() {
    if (ghostRef.current) { ghostRef.current.remove(); ghostRef.current = null; }
    setDraggingId(null);
    setOverCol(null);
    dragId.current = null;
    dragFromCol.current = null;
  }

  function onDragOver(e: React.DragEvent, colKey: string, cardsEl: HTMLElement) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverCol(colKey);

    // move ghost placeholder
    if (ghostRef.current) ghostRef.current.remove();
    const ghost = document.createElement("div");
    ghost.className = "kanban-ghost";
    ghost.style.cssText = `height:56px;border-radius:10px;border:2px dashed ${COLUMNS.find(c=>c.key===colKey)?.accentColor ?? "#6b7280"};opacity:0.5;margin-bottom:0;pointer-events:none;`;
    ghostRef.current = ghost;

    const afterEl = getAfterEl(cardsEl, e.clientY);
    if (!afterEl) cardsEl.appendChild(ghost);
    else cardsEl.insertBefore(ghost, afterEl);
  }

  function onDragLeave(e: React.DragEvent, colEl: HTMLElement) {
    if (!colEl.contains(e.relatedTarget as Node)) {
      if (ghostRef.current) { ghostRef.current.remove(); ghostRef.current = null; }
      setOverCol(null);
    }
  }

  function onDrop(e: React.DragEvent, toColKey: string, cardsEl: HTMLElement) {
    e.preventDefault();
    const id = dragId.current;
    const fromCol = dragFromCol.current;
    if (!id || !fromCol) return;

    const afterEl = ghostRef.current?.nextElementSibling as HTMLElement | null;
    if (ghostRef.current) { ghostRef.current.remove(); ghostRef.current = null; }

    const afterId = afterEl?.dataset.cardId ?? null;

    setCols((prev) => {
      const next = { ...prev };
      // remove from source
      next[fromCol] = next[fromCol].filter((i) => i !== id);
      // insert into target
      const target = [...next[toColKey].filter((i) => i !== id)];
      const afterIdx = afterId ? target.indexOf(afterId) : -1;
      if (afterIdx === -1) target.push(id);
      else target.splice(afterIdx, 0, id);
      next[toColKey] = target;
      return next;
    });

    setDraggingId(null);
    setOverCol(null);
    dragId.current = null;
    dragFromCol.current = null;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const colGrid = (
    <div className="flex gap-4">
      {COLUMNS.map((col) => {
        const colOrders = cols[col.key].map((id) => orderMap[id]).filter(Boolean);
        const visibleCount = col.key === overCol
          ? colOrders.filter((o) => o.id !== draggingId).length
          : colOrders.length;

        return (
          <KanbanColWrapper
            key={col.key}
            col={col}
            orders={colOrders}
            draggingId={draggingId}
            isOver={overCol === col.key}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            visibleCount={visibleCount}
          />
        );
      })}
    </div>
  );

  return (
    <div className="overflow-x-auto pb-4">
      {/* Desktop */}
      <div className="hidden lg:block">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(200px, 1fr))", gap: "1rem" }}>
          {COLUMNS.map((col) => {
            const colOrders = cols[col.key].map((id) => orderMap[id]).filter(Boolean);
            return (
              <KanbanColWrapper
                key={col.key}
                col={col}
                orders={colOrders}
                draggingId={draggingId}
                isOver={overCol === col.key}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                visibleCount={colOrders.filter(o => o.id !== draggingId).length}
              />
            );
          })}
        </div>
      </div>
      {/* Mobile */}
      <div className="flex lg:hidden gap-4 min-w-max">
        {COLUMNS.map((col) => {
          const colOrders = cols[col.key].map((id) => orderMap[id]).filter(Boolean);
          return (
            <div key={col.key} className="w-72 flex-shrink-0">
              <KanbanColWrapper
                col={col}
                orders={colOrders}
                draggingId={draggingId}
                isOver={overCol === col.key}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                visibleCount={colOrders.filter(o => o.id !== draggingId).length}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── KanbanColWrapper ─────────────────────────────────────────────────────────

interface ColWrapperProps {
  col: KanbanColumn;
  orders: KanbanOrder[];
  draggingId: string | null;
  isOver: boolean;
  visibleCount: number;
  onDragStart: (e: React.DragEvent, id: string, col: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent, col: string, el: HTMLElement) => void;
  onDragLeave: (e: React.DragEvent, el: HTMLElement) => void;
  onDrop: (e: React.DragEvent, col: string, el: HTMLElement) => void;
}

function KanbanColWrapper({
  col, orders, draggingId, isOver, visibleCount,
  onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
}: ColWrapperProps) {
  const cardsRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col" data-col-key={col.key}>
      {/* Header */}
      <div
        className="flex items-center justify-between rounded-t-[14px] px-4 py-2.5"
        style={{ background: col.headerBg }}
      >
        <span className="font-bold text-xs tracking-wider uppercase" style={{ color: col.headerText }}>
          {col.label}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-extrabold"
          style={{ background: "rgba(0,0,0,0.15)", color: col.headerText }}
        >
          {visibleCount}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={cardsRef}
        data-col-key={col.key}
        className="flex flex-col gap-2.5 rounded-b-[14px] p-2.5 flex-1 transition-colors duration-150"
        style={{
          minHeight: "9rem",
          background: isOver ? "rgba(30,48,84,0.07)" : "var(--card-bg)",
          boxShadow: isOver ? `inset 0 0 0 2px ${col.accentColor}55` : undefined,
        }}
        onDragOver={(e) => cardsRef.current && onDragOver(e, col.key, cardsRef.current)}
        onDragLeave={(e) => cardsRef.current && onDragLeave(e, cardsRef.current)}
        onDrop={(e) => cardsRef.current && onDrop(e, col.key, cardsRef.current)}
      >
        {orders.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-20 text-xs select-none" style={{ color: "var(--text-muted)" }}>
            Sem ordens
          </div>
        )}

        {orders.map((order) => {
          const isDragging = draggingId === order.id;
          return (
            <div
              key={order.id}
              data-card-id={order.id}
              draggable
              onDragStart={(e) => onDragStart(e, order.id, col.key)}
              onDragEnd={onDragEnd}
              className="group relative rounded-[12px] shadow-sm select-none transition-all duration-100"
              style={{
                background: "var(--white)",
                borderLeft: `3px solid ${col.accentColor}`,
                opacity: isDragging ? 0.2 : 1,
                cursor: isDragging ? "grabbing" : "grab",
              }}
            >
              <Link
                href={`/service-orders/${order.id}`}
                className="block p-3"
                draggable={false}
                onClick={(e) => { if (draggingId) e.preventDefault(); }}
              >
                {/* Top: ID + badges */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold" style={{ color: "var(--navy)" }}>
                    {shortId(order.id)}
                  </span>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {order.isFree && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        Grátis
                      </span>
                    )}
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ background: `${col.accentColor}22`, color: col.accentColor }}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>
                </div>

                {/* Customer name */}
                <p className="text-sm font-semibold leading-tight truncate" style={{ color: "var(--text)" }}>
                  {order.customer.fullName}
                </p>

                {/* Service type */}
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {SERVICE_TYPE_LABELS[order.serviceType]}
                </p>

                {/* Footer */}
                <div className="mt-2.5 pt-2 border-t flex items-center justify-between gap-2" style={{ borderColor: "#e8ebf2" }}>
                  <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                    {order.technician ? (
                      <>
                        <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle" style={{ background: col.accentColor }} />
                        {order.technician.name}
                      </>
                    ) : (
                      <span style={{ color: "#d1d5db" }}>Sem técnico</span>
                    )}
                  </span>
                  {order.scheduledAt && (
                    <span className="text-xs whitespace-nowrap flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                      {formatDate(order.scheduledAt)}
                    </span>
                  )}
                </div>
              </Link>

              {/* Drag handle */}
              <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none">
                <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" style={{ color: "#9ca3af" }}>
                  <circle cx="2" cy="2" r="1.5" /><circle cx="8" cy="2" r="1.5" />
                  <circle cx="2" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" />
                  <circle cx="2" cy="14" r="1.5" /><circle cx="8" cy="14" r="1.5" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
