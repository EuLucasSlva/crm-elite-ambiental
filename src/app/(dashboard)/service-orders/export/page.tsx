import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCpfCnpj } from "@/lib/format";
import {
  currentAppMonthRange,
  formatAppDateInput,
} from "@/lib/date-time";
import type { Role } from "@prisma/client";

export default async function ExportServiceOrdersPage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/service-orders");

  const customers = await prisma.customer.findMany({
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, cpfCnpj: true },
  });
  const month = currentAppMonthRange();

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/service-orders" className="hover:underline">
            Ordens de Serviço
          </Link>
          <span>/</span>
          <span>Exportar por cliente</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Exportar ordens em lote
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Escolha o cliente pelo nome/CNPJ e o período. O relatório pode ser
          impresso ou salvo como PDF pelo navegador.
        </p>
      </div>

      <form
        action="/print/service-orders/batch"
        method="GET"
        target="_blank"
        className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label htmlFor="customerId" className="mb-1 block text-sm font-semibold text-gray-700">
            Cliente / CNPJ
          </label>
          <select
            id="customerId"
            name="customerId"
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">Selecione um cliente...</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.fullName} — {formatCpfCnpj(customer.cpfCnpj)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="from" className="mb-1 block text-sm font-semibold text-gray-700">
              Data inicial
            </label>
            <input
              id="from"
              name="from"
              type="date"
              required
              defaultValue={formatAppDateInput(month.start)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="to" className="mb-1 block text-sm font-semibold text-gray-700">
              Data final
            </label>
            <input
              id="to"
              name="to"
              type="date"
              required
              defaultValue={formatAppDateInput()}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="scope" className="mb-1 block text-sm font-semibold text-gray-700">
            Situação das OS
          </label>
          <select
            id="scope"
            name="scope"
            defaultValue="treatment"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
          >
            <option value="treatment">
              Do tratamento agendado até as concluídas
            </option>
            <option value="all">
              Todas (inclusive leads, orçamentos e canceladas)
            </option>
          </select>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
          Para uma OS executada, o período considera a data da execução. Para
          as demais, considera o agendamento e, quando ele não existe, a data
          de criação.
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/service-orders"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700"
          >
            Voltar
          </Link>
          <button
            type="submit"
            className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-800"
          >
            Gerar relatório / PDF
          </button>
        </div>
      </form>
    </div>
  );
}
