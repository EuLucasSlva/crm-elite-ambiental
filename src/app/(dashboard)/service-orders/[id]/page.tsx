import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  formatDate,
  formatDateTime,
  shortId,
  formatCpfCnpj,
} from "@/lib/format";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  SERVICE_TYPE_LABELS,
  OCCURRENCE_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
} from "@/lib/labels";
import { formatCurrency } from "@/lib/format";
import {
  ALLOWED_TRANSITIONS,
  canTransition,
} from "@/lib/service-order-machine";
import { TransitionButtons } from "./TransitionButtons";
import { PaymentButton } from "./PaymentButton";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteServiceOrder } from "@/lib/delete-actions";
import type { ServiceOrderStatus, Role } from "@prisma/client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ServiceOrderDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [session, order] = await Promise.all([
    auth(),
    prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            cpfCnpj: true,
            phone: true,
            city: true,
            state: true,
            street: true,
            number: true,
            complement: true,
            propertyType: true,
            siteSizeM2: true,
          },
        },
        technician: { select: { name: true } },
        manager: { select: { name: true } },
        occurrences: {
          orderBy: { recordedAt: "desc" },
          include: { recordedBy: { select: { name: true } } },
        },
        technicalVisits: {
          orderBy: { scheduledAt: "asc" },
          select: {
            id: true,
            scheduledAt: true,
            checkInAt: true,
            checkOutAt: true,
            technician: { select: { name: true } },
            notes: true,
          },
        },
        certificate: { select: { issuedAt: true, technicalResponsible: true } },
        warranty: { select: { startsAt: true, expiresAt: true, status: true } },
      },
    }),
  ]);

  if (!order) notFound();

  const userRole = session?.user?.role as Role | undefined;

  // Determine which transitions are available for the current user
  const nextStatuses = userRole
    ? (ALLOWED_TRANSITIONS[order.status] as ServiceOrderStatus[]).filter(
        (to) => canTransition(order.status, to, userRole).ok
      )
    : [];

  return (
    <div className="space-y-5">
      {/* Breadcrumb + header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link
              href="/service-orders"
              className="hover:text-green-700 hover:underline"
            >
              Ordens de Serviço
            </Link>
            <span>/</span>
            <span className="font-mono text-gray-700">{shortId(order.id)}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">
              OS {shortId(order.id)}
            </h1>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${STATUS_COLORS[order.status]}`}
            >
              {STATUS_LABELS[order.status]}
            </span>
            {order.isFree && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                Gratuita
              </span>
            )}
          </div>
        </div>
        {(userRole === "ADMIN" || userRole === "MANAGER") && (
          <DeleteButton
            action={async () => {
              "use server";
              return deleteServiceOrder(order.id);
            }}
            confirmMessage={`Apagar OS ${shortId(order.id)}?\n\nTodos os dados desta OS (visitas, certificado, garantia, despesas vinculadas) serão removidos. Esta ação não pode ser desfeita.`}
            redirectTo="/service-orders"
            label="Apagar OS"
          />
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left column — main info */}
        <div className="lg:col-span-2 space-y-5">
          {/* OS details */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Dados da Ordem
            </h2>
            <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Tipo</dt>
                <dd className="font-medium text-gray-800">
                  {SERVICE_TYPE_LABELS[order.serviceType]}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Criado em</dt>
                <dd className="font-medium text-gray-800">
                  {formatDate(order.createdAt)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Agendado para</dt>
                <dd className="font-medium text-gray-800">
                  {formatDate(order.scheduledAt)}
                </dd>
              </div>
              {order.executedAt && (
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Executado em</dt>
                  <dd className="font-medium text-gray-800">
                    {formatDate(order.executedAt)}
                  </dd>
                </div>
              )}
              {order.closedAt && (
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Encerrado em</dt>
                  <dd className="font-medium text-gray-800">
                    {formatDate(order.closedAt)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Técnico</dt>
                <dd className="font-medium text-gray-800">
                  {order.technician?.name ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Gerente</dt>
                <dd className="font-medium text-gray-800">
                  {order.manager?.name ?? "—"}
                </dd>
              </div>
              {order.pestTypes.length > 0 && (
                <div className="sm:col-span-2 flex justify-between gap-2">
                  <dt className="text-gray-500">Pragas</dt>
                  <dd className="font-medium text-gray-800">
                    {order.pestTypes.join(", ")}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* Financial panel */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Financeiro
              </h2>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PAYMENT_STATUS_COLORS[order.paymentStatus]}`}>
                {PAYMENT_STATUS_LABELS[order.paymentStatus]}
              </span>
            </div>
            <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-3 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Valor cobrado</dt>
                <dd className="font-semibold text-gray-800">{formatCurrency(order.price)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Custo (insumos)</dt>
                <dd className="font-medium text-gray-800">{formatCurrency(order.cost)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Lucro bruto</dt>
                <dd className={`font-semibold ${order.price != null && order.cost != null && order.price - order.cost >= 0 ? "text-green-700" : "text-red-700"}`}>
                  {order.price != null ? formatCurrency((order.price ?? 0) - (order.cost ?? 0)) : "—"}
                </dd>
              </div>
              {order.paidAt && (
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Pago em</dt>
                  <dd className="font-medium text-gray-800">{formatDate(order.paidAt)}</dd>
                </div>
              )}
            </dl>
            {order.isFree && (
              <p className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                Este serviço foi marcado como gratuito.
              </p>
            )}
            {(userRole === "ADMIN" || userRole === "MANAGER") && (
              <PaymentButton
                orderId={order.id}
                currentStatus={order.paymentStatus}
                currentPrice={order.price}
                isFree={order.isFree}
              />
            )}
          </section>

          {order.notes && (
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
                Observações
              </h2>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{order.notes}</p>
            </section>
          )}

          {/* Customer info */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Cliente
              </h2>
              <Link
                href={`/customers/${order.customer.id}`}
                className="text-xs font-medium text-green-700 hover:underline"
              >
                Ver perfil
              </Link>
            </div>
            <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2 text-sm">
              <div className="flex justify-between gap-2 sm:col-span-2">
                <dt className="text-gray-500">Nome</dt>
                <dd className="font-medium text-gray-800">
                  {order.customer.fullName}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">CPF/CNPJ</dt>
                <dd className="font-mono font-medium text-gray-800">
                  {formatCpfCnpj(order.customer.cpfCnpj)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Cidade</dt>
                <dd className="font-medium text-gray-800">
                  {order.customer.city}/{order.customer.state}
                </dd>
              </div>
              <div className="flex justify-between gap-2 sm:col-span-2">
                <dt className="text-gray-500">Endereço</dt>
                <dd className="font-medium text-gray-800">
                  {order.customer.street}, {order.customer.number}
                  {order.customer.complement
                    ? ` — ${order.customer.complement}`
                    : ""}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Área</dt>
                <dd className="font-medium text-gray-800">
                  {order.customer.siteSizeM2.toLocaleString("pt-BR")} m²
                </dd>
              </div>
            </dl>
          </section>

          {/* Technical visits */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Visitas Técnicas ({order.technicalVisits.length})
            </h2>
            {order.technicalVisits.length === 0 ? (
              <p className="text-sm text-gray-400">
                Nenhuma visita técnica registrada.
              </p>
            ) : (
              <div className="space-y-3">
                {order.technicalVisits.map((visit) => (
                  <div
                    key={visit.id}
                    className="rounded-lg bg-gray-50 p-3 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">
                        {formatDateTime(visit.scheduledAt)}
                      </span>
                      <span className="text-gray-500">
                        {visit.technician.name}
                      </span>
                    </div>
                    {(visit.checkInAt || visit.checkOutAt) && (
                      <div className="mt-1 flex gap-4 text-xs text-gray-500">
                        {visit.checkInAt && (
                          <span>
                            Entrada: {formatDateTime(visit.checkInAt)}
                          </span>
                        )}
                        {visit.checkOutAt && (
                          <span>Saída: {formatDateTime(visit.checkOutAt)}</span>
                        )}
                      </div>
                    )}
                    {visit.notes && (
                      <p className="mt-1 text-xs text-gray-500">{visit.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Certificate & Warranty */}
          {(order.certificate || order.warranty) && (
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
                Certificado e Garantia
              </h2>
              <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2 text-sm">
                {order.certificate && (
                  <>
                    <div className="flex justify-between gap-2">
                      <dt className="text-gray-500">Certificado emitido</dt>
                      <dd className="font-medium text-gray-800">
                        {formatDate(order.certificate.issuedAt)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-gray-500">Responsável técnico</dt>
                      <dd className="font-medium text-gray-800">
                        {order.certificate.technicalResponsible}
                      </dd>
                    </div>
                  </>
                )}
                {order.warranty && (
                  <>
                    <div className="flex justify-between gap-2">
                      <dt className="text-gray-500">Garantia início</dt>
                      <dd className="font-medium text-gray-800">
                        {formatDate(order.warranty.startsAt)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-gray-500">Garantia vencimento</dt>
                      <dd className="font-medium text-gray-800">
                        {formatDate(order.warranty.expiresAt)}
                      </dd>
                    </div>
                  </>
                )}
              </dl>
            </section>
          )}

          {/* Transition buttons */}
          {nextStatuses.length > 0 && (
            <TransitionButtons orderId={order.id} nextStatuses={nextStatuses} />
          )}
        </div>

        {/* Right column — occurrences timeline */}
        <div className="space-y-5">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
              Histórico de Ocorrências
            </h2>

            {order.occurrences.length === 0 ? (
              <p className="text-sm text-gray-400">
                Nenhuma ocorrência registrada.
              </p>
            ) : (
              <ol className="relative border-l border-gray-200 ml-2 space-y-4">
                {order.occurrences.map((occ) => (
                  <li key={occ.id} className="ml-4">
                    <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-white bg-gray-400" />
                    <p className="text-xs text-gray-400">
                      {formatDateTime(occ.recordedAt)}
                    </p>
                    <p className="text-sm font-medium text-gray-800">
                      {OCCURRENCE_TYPE_LABELS[occ.type]}
                    </p>
                    {occ.reason && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {occ.reason}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      por {occ.recordedBy.name}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
