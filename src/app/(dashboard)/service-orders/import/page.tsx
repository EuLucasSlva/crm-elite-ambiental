import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ImportForm } from "./ImportForm";
import type { Role } from "@prisma/client";

export default async function ImportLeadsPage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/service-orders");

  const customers = await prisma.customer.findMany({
    orderBy: { fullName: "asc" },
    take: 500,
    select: { id: true, fullName: true, cpfCnpj: true, city: true, state: true },
  });

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/service-orders" className="hover:text-green-700 hover:underline">
            Ordens de Serviço
          </Link>
          <span>/</span>
          <span className="text-gray-700">Importar em lote</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Importar Leads em Lote</h1>
        <p className="text-sm text-gray-500 mt-1">
          Suba uma planilha (CSV) para criar várias inspeções de uma vez, todas vinculadas a um mesmo cliente.
          Cada linha vira um lead na coluna &quot;Lead&quot; do Kanban.
        </p>
      </div>

      <ImportForm customers={customers} />
    </div>
  );
}
