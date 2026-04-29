import { prisma } from "@/lib/prisma";
import { NewServiceOrderForm } from "./NewServiceOrderForm";

interface PageProps {
  searchParams: Promise<{ customerId?: string }>;
}

export default async function NewServiceOrderPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const preselectedCustomerId = params.customerId;

  // Load preselected customer if provided
  const preselectedCustomer = preselectedCustomerId
    ? await prisma.customer.findUnique({
        where: { id: preselectedCustomerId },
        select: { id: true, fullName: true, cpfCnpj: true, city: true, state: true },
      })
    : null;

  // Load technicians for the select
  const technicians = await prisma.user.findMany({
    where: { active: true, role: { in: ["TECHNICIAN", "ADMIN", "MANAGER"] } },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nova Ordem de Serviço</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Preencha os dados para criar uma nova OS.
        </p>
      </div>
      <NewServiceOrderForm
        preselectedCustomer={preselectedCustomer}
        technicians={technicians}
      />
    </div>
  );
}
