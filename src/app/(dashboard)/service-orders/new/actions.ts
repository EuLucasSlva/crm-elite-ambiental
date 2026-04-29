"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const serviceOrderSchema = z.object({
  customerId: z.string().min(1, "Selecione um cliente"),
  serviceType: z.enum(["INSPECTION", "TREATMENT", "RETURN"]),
  isFree: z.coerce.boolean().default(false),
  technicianId: z.string().optional(),
  managerId: z.string().optional(),
  pestTypes: z.string().optional(),
  scheduledAt: z.string().optional(),
  notes: z.string().optional(),
});

export type NewServiceOrderState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function createServiceOrder(
  _prev: NewServiceOrderState,
  formData: FormData
): Promise<NewServiceOrderState> {
  const session = await auth();
  if (!session?.user) {
    return { message: "Sessão expirada. Faça login novamente." };
  }

  const raw = {
    customerId: formData.get("customerId"),
    serviceType: formData.get("serviceType"),
    isFree: formData.get("isFree") === "true",
    technicianId: formData.get("technicianId") || undefined,
    managerId: formData.get("managerId") || undefined,
    pestTypes: formData.get("pestTypes") || undefined,
    scheduledAt: formData.get("scheduledAt") || undefined,
    notes: formData.get("notes") || undefined,
  };

  const parsed = serviceOrderSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  // Verify customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: data.customerId },
    select: { id: true },
  });
  if (!customer) {
    return { errors: { customerId: ["Cliente não encontrado"] } };
  }

  const pestTypesArray = data.pestTypes
    ? data.pestTypes
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  const order = await prisma.serviceOrder.create({
    data: {
      customerId: data.customerId,
      serviceType: data.serviceType,
      isFree: data.isFree,
      technicianId: data.technicianId || null,
      managerId: data.managerId || null,
      pestTypes: pestTypesArray,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      notes: data.notes || null,
      status: "LEAD_CAPTURED",
    },
    select: { id: true },
  });

  redirect(`/service-orders/${order.id}`);
}

export async function searchCustomers(query: string) {
  // Verificação de sessão — impede lookup de clientes sem autenticação.
  const session = await auth();
  if (!session?.user) return [];

  if (!query || query.trim().length < 2) return [];

  return prisma.customer.findMany({
    where: {
      OR: [
        { fullName: { contains: query, mode: "insensitive" } },
        {
          cpfCnpj: {
            contains: query.replace(/\D/g, ""),
            mode: "insensitive",
          },
        },
      ],
    },
    take: 8,
    select: { id: true, fullName: true, cpfCnpj: true, city: true, state: true },
  });
}
