import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { shortId } from "@/lib/format";
import { EditServiceOrderForm } from "./EditServiceOrderForm";
import type { Role } from "@prisma/client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditServiceOrderPage({ params }: PageProps) {
  const { id } = await params;

  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  if (role === "TECHNICIAN") redirect(`/service-orders/${id}`);

  const [order, technicians] = await Promise.all([
    prisma.serviceOrder.findUnique({
      where: { id },
      select: {
        id: true,
        serviceType: true,
        scheduledAt: true,
        technicianId: true,
        managerId: true,
        pestTypes: true,
        notes: true,
        isFree: true,
        price: true,
      },
    }),
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!order) notFound();

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/service-orders" className="hover:text-green-700 hover:underline">
            Ordens de Serviço
          </Link>
          <span>/</span>
          <Link href={`/service-orders/${id}`} className="hover:text-green-700 hover:underline font-mono text-gray-700">
            {shortId(id)}
          </Link>
          <span>/</span>
          <span className="text-gray-700">Editar</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Editar OS {shortId(id)}</h1>
      </div>

      <EditServiceOrderForm
        orderId={id}
        current={order}
        technicians={technicians}
      />
    </div>
  );
}
