import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime, shortId, formatCurrency } from "@/lib/format";
import { StockAdjustmentForm } from "./StockAdjustmentForm";
import { NewBatchForm } from "./batches/NewBatchForm";
import { Badge } from "@/components/ui/Badge";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteStockItem, deleteStockBatch } from "@/lib/delete-actions";
import { getBatchBadge, BATCH_STATUS_LABELS } from "@/lib/labels-extras";
import type { StockUnit } from "@prisma/client";

const UNIT_LABELS: Record<StockUnit, string> = {
  ML: "mL",
  G: "g",
  L: "L",
  KG: "kg",
  UNIT: "unidade",
  M2: "m²",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StockItemDetailPage({ params }: PageProps) {
  const { id } = await params;

  const item = await prisma.stockItem.findUnique({
    where: { id },
    include: {
      batches: {
        orderBy: [{ expiryDate: "asc" }, { receivedAt: "asc" }],
      },
      movements: {
        orderBy: { performedAt: "desc" },
        take: 20,
        include: {
          performedBy: { select: { name: true } },
          serviceOrder: {
            select: { id: true },
          },
        },
      },
    },
  });

  if (!item) notFound();

  const now = new Date();
  const isExpired = item.expiryDate ? item.expiryDate < now : false;
  const isBelowMin = item.quantity <= item.minThreshold;

  const unitLabel = UNIT_LABELS[item.unit];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/stock" className="hover:text-green-700 hover:underline">
          Estoque
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{item.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
          {item.activeIngredient && (
            <p className="text-sm text-gray-500 mt-0.5">{item.activeIngredient}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {isExpired && (
            <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
              Vencido
            </span>
          )}
          {isBelowMin && !isExpired && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              Abaixo do mínimo
            </span>
          )}
          <DeleteButton
            action={async () => {
              "use server";
              return deleteStockItem(item.id);
            }}
            confirmMessage={`Apagar item de estoque "${item.name}"?\n\nTodos os lotes e movimentações serão removidos. Esta ação não pode ser desfeita.`}
            redirectTo="/stock"
            label="Apagar Item"
          />
        </div>
      </div>

      {/* Seção de Lotes */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            📦 Lotes do produto ({item.batches.length})
          </h2>
          <span className="text-xs text-gray-500">
            FEFO — consumo automático pelo lote mais próximo do vencimento
          </span>
        </div>
        <div className="p-4">
          <NewBatchForm stockItemId={item.id} unit={unitLabel} />
        </div>
        {item.batches.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400">
            Nenhum lote cadastrado. Adicione o primeiro lote acima.
          </p>
        ) : (
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2">Nº Lote</th>
                  <th className="px-3 py-2 text-right">Qtd Inicial</th>
                  <th className="px-3 py-2 text-right">Qtd Restante</th>
                  <th className="px-3 py-2">Validade</th>
                  <th className="px-3 py-2 text-right">Custo</th>
                  <th className="px-3 py-2">Fornecedor</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Recebido</th>
                  <th className="px-3 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {item.batches.map((b) => {
                  const badge = getBatchBadge(b.expiryDate);
                  return (
                    <tr key={b.id}>
                      <td className="px-3 py-2 font-mono text-xs">{b.batchNumber ?? "—"}</td>
                      <td className="px-3 py-2 text-right">{b.initialQuantity.toLocaleString("pt-BR")} {unitLabel}</td>
                      <td className="px-3 py-2 text-right font-semibold">{b.quantity.toLocaleString("pt-BR")} {unitLabel}</td>
                      <td className="px-3 py-2 text-xs">
                        {b.expiryDate ? formatDate(b.expiryDate) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-gray-600">{formatCurrency(b.unitCost)}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{b.supplier ?? "—"}</td>
                      <td className="px-3 py-2">
                        <span
                          className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: badge.bg, color: badge.color }}
                        >
                          {b.status === "ACTIVE" ? badge.label : BATCH_STATUS_LABELS[b.status]}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500">{formatDate(b.receivedAt)}</td>
                      <td className="px-3 py-2 text-right">
                        <DeleteButton
                          size="sm"
                          action={async () => {
                            "use server";
                            return deleteStockBatch(b.id);
                          }}
                          confirmMessage={`Apagar lote ${b.batchNumber ?? "(sem número)"}?`}
                          label=""
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left — item info + adjustment */}
        <div className="lg:col-span-1 space-y-5">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
              Dados do Produto
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Unidade</dt>
                <dd className="font-medium text-gray-800">{unitLabel}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Quantidade</dt>
                <dd
                  className={`font-semibold ${isBelowMin ? "text-red-700" : "text-gray-800"}`}
                >
                  {item.quantity.toLocaleString("pt-BR")} {unitLabel}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Estoque Mínimo</dt>
                <dd className="font-medium text-gray-800">
                  {item.minThreshold.toLocaleString("pt-BR")} {unitLabel}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Custo unitário</dt>
                <dd className="font-semibold text-gray-800">
                  {formatCurrency(item.unitCost)} / {unitLabel}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Valor em estoque</dt>
                <dd className="font-semibold text-green-700">
                  {formatCurrency(item.unitCost * item.quantity)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Validade</dt>
                <dd
                  className={`font-medium ${isExpired ? "text-gray-400 line-through" : "text-gray-800"}`}
                >
                  {formatDate(item.expiryDate)}
                </dd>
              </div>
              {item.supplier && (
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Fornecedor</dt>
                  <dd className="font-medium text-gray-800 text-right">
                    {item.supplier}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Cadastrado em</dt>
                <dd className="font-medium text-gray-800">
                  {formatDate(item.createdAt)}
                </dd>
              </div>
            </dl>
            {item.notes && (
              <div className="mt-4 rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-semibold text-gray-500 mb-1">
                  Observações
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {item.notes}
                </p>
              </div>
            )}
          </section>

          <StockAdjustmentForm
            stockItemId={item.id}
            currentQuantity={item.quantity}
            unit={unitLabel}
          />
        </div>

        {/* Right — movements */}
        <div className="lg:col-span-2">
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Últimas Movimentações
              </h2>
            </div>

            {item.movements.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-gray-400">
                Nenhuma movimentação registrada.
              </div>
            ) : (
              <div className="table-scroll">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Data/Hora</th>
                      <th className="px-4 py-3 text-right">Quantidade</th>
                      <th className="px-4 py-3">Motivo</th>
                      <th className="px-4 py-3">OS</th>
                      <th className="px-4 py-3">Usuário</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {item.movements.map((mov) => (
                      <tr key={mov.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {formatDateTime(mov.performedAt)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-semibold font-mono ${
                            mov.delta > 0
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {mov.delta > 0 ? "+" : ""}
                          {mov.delta.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {mov.reason ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          {mov.serviceOrder ? (
                            <Link
                              href={`/service-orders/${mov.serviceOrder.id}`}
                              className="font-mono text-xs font-semibold text-green-700 hover:underline"
                            >
                              {shortId(mov.serviceOrder.id)}
                            </Link>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {mov.performedBy.name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
