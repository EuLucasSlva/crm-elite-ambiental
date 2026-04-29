import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDate, shortId } from "@/lib/format";
import { STATUS_LABELS, SERVICE_TYPE_LABELS } from "@/lib/labels";
import { ExecutionForm } from "./ExecutionForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ExecutionPage({ params }: PageProps) {
  const { id } = await params;

  const [session, order] = await Promise.all([
    auth(),
    prisma.serviceOrder.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        serviceType: true,
        scheduledAt: true,
        pestTypes: true,
        notes: true,
        technicianId: true,
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            street: true,
            number: true,
            complement: true,
            city: true,
            state: true,
            zip: true,
            propertyType: true,
            siteSizeM2: true,
          },
        },
        technician: {
          select: { id: true, name: true },
        },
      },
    }),
  ]);

  if (!order) notFound();

  // Only ADMIN, MANAGER, or the assigned technician can access execution
  const userRole = session?.user?.role;
  const userId = session?.user?.id;

  if (!session?.user) {
    redirect("/login");
  }

  if (
    userRole === "TECHNICIAN" &&
    order.technicianId !== userId
  ) {
    redirect(`/service-orders/${id}`);
  }

  // Must be in a valid state for execution
  const validStatuses = [
    "SERVICE_SCHEDULED",
    "QUOTE_APPROVED",
    "VISIT_DONE",
  ];

  const isAlreadyExecuted =
    order.status === "SERVICE_EXECUTED" ||
    order.status === "CERTIFICATE_ISSUED" ||
    order.status === "WARRANTY_ACTIVE" ||
    order.status === "CLOSED";

  const effectiveTechnicianId =
    order.technicianId ?? session.user.id;

  const scheduledAt =
    order.scheduledAt?.toISOString() ?? new Date().toISOString();

  return (
    <div className="max-w-xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link
          href="/service-orders"
          className="hover:text-green-700 hover:underline"
        >
          OS
        </Link>
        <span>/</span>
        <Link
          href={`/service-orders/${id}`}
          className="hover:text-green-700 hover:underline font-mono"
        >
          {shortId(id)}
        </Link>
        <span>/</span>
        <span className="text-gray-700">Execucao</span>
      </div>

      {/* OS summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm mb-6">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Execucao — OS {shortId(id)}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {SERVICE_TYPE_LABELS[order.serviceType]}
            </p>
          </div>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            {STATUS_LABELS[order.status]}
          </span>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          {/* Customer */}
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              Cliente
            </p>
            <p className="font-semibold text-gray-900">
              {order.customer.fullName}
            </p>
            <p className="text-gray-600 mt-0.5">
              {order.customer.street}, {order.customer.number}
              {order.customer.complement
                ? ` — ${order.customer.complement}`
                : ""}
            </p>
            <p className="text-gray-600">
              {order.customer.city}/{order.customer.state} — CEP:{" "}
              {order.customer.zip}
            </p>
            <p className="text-gray-600 mt-0.5">
              Tel: {order.customer.phone}
            </p>
            <p className="text-gray-500 mt-0.5 text-xs">
              Area: {order.customer.siteSizeM2.toLocaleString("pt-BR")} m²
            </p>
          </div>

          {/* Pests */}
          {order.pestTypes.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Pragas Alvo
              </p>
              <div className="flex flex-wrap gap-1.5">
                {order.pestTypes.map((pest) => (
                  <span
                    key={pest}
                    className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700"
                  >
                    {pest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Scheduled + technician */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
            {order.scheduledAt && (
              <span>
                Agendado:{" "}
                <span className="font-medium text-gray-800">
                  {formatDate(order.scheduledAt)}
                </span>
              </span>
            )}
            {order.technician && (
              <span>
                Tecnico:{" "}
                <span className="font-medium text-gray-800">
                  {order.technician.name}
                </span>
              </span>
            )}
          </div>

          {order.notes && (
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
              {order.notes}
            </p>
          )}
        </div>
      </div>

      {/* Already executed notice */}
      {isAlreadyExecuted ? (
        <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-5 text-center">
          <p className="font-semibold text-yellow-800">
            Esta OS ja foi executada.
          </p>
          <p className="text-sm text-yellow-700 mt-1">
            Status atual: {STATUS_LABELS[order.status]}
          </p>
          <Link
            href={`/service-orders/${id}`}
            className="mt-3 inline-block rounded-lg bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700 transition-colors"
          >
            Voltar para a OS
          </Link>
        </div>
      ) : !validStatuses.includes(order.status) ? (
        <div className="rounded-xl border border-red-300 bg-red-50 p-5 text-center">
          <p className="font-semibold text-red-800">
            Esta OS nao pode ser executada no status atual.
          </p>
          <p className="text-sm text-red-700 mt-1">
            Status atual: {STATUS_LABELS[order.status]}
          </p>
          <Link
            href={`/service-orders/${id}`}
            className="mt-3 inline-block rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
          >
            Voltar para a OS
          </Link>
        </div>
      ) : (
        <ExecutionForm
          serviceOrderId={id}
          technicianId={effectiveTechnicianId}
          scheduledAt={scheduledAt}
        />
      )}
    </div>
  );
}
