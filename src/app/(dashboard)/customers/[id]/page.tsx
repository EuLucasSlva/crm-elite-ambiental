import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  formatCpfCnpj,
  formatPhone,
  formatDate,
  shortId,
} from "@/lib/format";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  LEAD_SOURCE_LABELS,
  PROPERTY_TYPE_LABELS,
  CUSTOMER_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
} from "@/lib/labels";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteCustomer } from "@/lib/delete-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      serviceOrders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          serviceType: true,
          isFree: true,
          scheduledAt: true,
          createdAt: true,
          technician: { select: { name: true } },
        },
      },
    },
  });

  if (!customer) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/customers" className="hover:text-green-700 hover:underline">
              Clientes
            </Link>
            <span>/</span>
            <span className="text-gray-700">{customer.fullName}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {customer.fullName}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {CUSTOMER_TYPE_LABELS[customer.type]} •{" "}
            {formatCpfCnpj(customer.cpfCnpj)}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/service-orders/new?customerId=${customer.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition-colors whitespace-nowrap min-h-[40px]"
          >
            <span className="text-lg leading-none">+</span>
            Nova OS
          </Link>
          <DeleteButton
            action={async () => {
              "use server";
              return deleteCustomer(customer.id);
            }}
            confirmMessage={`Apagar cliente "${customer.fullName}"?\n\nTODAS as OS, certificados e garantias deste cliente também serão apagados. Esta ação não pode ser desfeita.`}
            redirectTo="/customers"
            label="Apagar Cliente"
          />
        </div>
      </div>

      {/* Info grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Contato */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Contato
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-gray-500">Telefone</dt>
              <dd className="font-medium text-gray-800">
                {formatPhone(customer.phone)}
              </dd>
            </div>
            {customer.email && (
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">E-mail</dt>
                <dd className="font-medium text-gray-800">{customer.email}</dd>
              </div>
            )}
            <div className="flex justify-between gap-2">
              <dt className="text-gray-500">Canal</dt>
              <dd className="font-medium text-gray-800">
                {LEAD_SOURCE_LABELS[customer.leadSource]}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-gray-500">Cadastro</dt>
              <dd className="font-medium text-gray-800">
                {formatDate(customer.createdAt)}
              </dd>
            </div>
          </dl>
        </section>

        {/* Endereço */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Endereço
          </h2>
          <p className="text-sm text-gray-800">
            {customer.street}, {customer.number}
            {customer.complement ? ` — ${customer.complement}` : ""}
          </p>
          <p className="text-sm text-gray-800">
            {customer.city} / {customer.state} — CEP {customer.zip}
          </p>
        </section>

        {/* Imóvel */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Imóvel
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-gray-500">Tipo</dt>
              <dd className="font-medium text-gray-800">
                {PROPERTY_TYPE_LABELS[customer.propertyType]}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-gray-500">Área</dt>
              <dd className="font-medium text-gray-800">
                {customer.siteSizeM2.toLocaleString("pt-BR")} m²
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-gray-500">Serviço anterior</dt>
              <dd className="font-medium text-gray-800">
                {customer.hadServiceBefore
                  ? customer.lastServiceDate
                    ? `Sim — ${formatDate(customer.lastServiceDate)}`
                    : "Sim"
                  : "Não"}
              </dd>
            </div>
          </dl>
        </section>

        {/* Notas */}
        {customer.notes && (
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Observações
            </h2>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">
              {customer.notes}
            </p>
          </section>
        )}
      </div>

      {/* Service orders */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Ordens de Serviço ({customer.serviceOrders.length})
          </h2>
          <Link
            href={`/service-orders/new?customerId=${customer.id}`}
            className="text-sm font-medium text-green-700 hover:underline"
          >
            + Nova OS
          </Link>
        </div>

        {customer.serviceOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <p className="text-gray-500 text-sm">
              Nenhuma ordem de serviço cadastrada.
            </p>
            <Link
              href={`/service-orders/new?customerId=${customer.id}`}
              className="mt-3 inline-block text-sm font-medium text-green-700 hover:underline"
            >
              Criar primeira OS
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">OS</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Técnico</th>
                    <th className="px-4 py-3">Agendado</th>
                    <th className="px-4 py-3">Criado em</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customer.serviceOrders.map((os) => (
                    <tr key={os.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/service-orders/${os.id}`}
                          className="font-mono text-xs font-semibold text-green-700 hover:underline"
                        >
                          {shortId(os.id)}
                        </Link>
                        {os.isFree && (
                          <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                            Grátis
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {SERVICE_TYPE_LABELS[os.serviceType]}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[os.status]}`}
                        >
                          {STATUS_LABELS[os.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {os.technician?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatDate(os.scheduledAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatDate(os.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {customer.serviceOrders.map((os) => (
                <Link
                  key={os.id}
                  href={`/service-orders/${os.id}`}
                  className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-green-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-green-700">
                      {shortId(os.id)}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[os.status]}`}
                    >
                      {STATUS_LABELS[os.status]}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-3 text-sm text-gray-600">
                    <span>{SERVICE_TYPE_LABELS[os.serviceType]}</span>
                    {os.technician && <span>— {os.technician.name}</span>}
                  </div>
                  {os.scheduledAt && (
                    <p className="mt-1 text-xs text-gray-400">
                      Agendado: {formatDate(os.scheduledAt)}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
