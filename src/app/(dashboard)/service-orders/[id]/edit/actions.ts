"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import type { Role, ServiceType } from "@prisma/client";
import { parseAppDateTime } from "@/lib/date-time";
import { assertEditAllowed, TransitionError } from "@/lib/service-order-machine";
import {
  canBeAssignedAsManager,
  canBeAssignedAsTechnician,
} from "@/lib/service-order-assignees";

const SERVICE_TYPES: [ServiceType, ...ServiceType[]] = [
  "INSPECTION", "TREATMENT", "RETURN",
];

const editSchema = z.object({
  serviceType: z.enum(SERVICE_TYPES),
  scheduledAt: z.string().optional().nullable(),
  technicianId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  pestTypes: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  isFree: z.enum(["true", "false"]).optional(),
  price: z.coerce.number().min(0).max(9_999_999).optional().nullable(),
});

export type EditServiceOrderState = {
  errors?: Partial<Record<string, string[]>>;
  globalError?: string;
};

export async function updateServiceOrder(
  orderId: string,
  _prev: EditServiceOrderState,
  formData: FormData
): Promise<EditServiceOrderState> {
  const session = await auth();
  if (!session?.user?.id) return { globalError: "Sessão expirada." };

  const role = session.user.role as Role;
  if (role === "TECHNICIAN") return { globalError: "Sem permissão para editar." };

  const raw = {
    serviceType: formData.get("serviceType"),
    scheduledAt: formData.get("scheduledAt") || null,
    technicianId: formData.get("technicianId") || null,
    managerId: formData.get("managerId") || null,
    pestTypes: formData.get("pestTypes") || null,
    notes: formData.get("notes") || null,
    isFree: formData.get("isFree") ?? "false",
    price: formData.get("price") || null,
  };

  const parsed = editSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const scheduledAt = parsed.data.scheduledAt
    ? parseAppDateTime(parsed.data.scheduledAt)
    : null;
  if (parsed.data.scheduledAt && !scheduledAt) {
    return { errors: { scheduledAt: ["Data ou horário inválido"] } };
  }

  const [technician, manager] = await Promise.all([
    parsed.data.technicianId ? prisma.user.findUnique({ where: { id: parsed.data.technicianId }, select: { role: true, active: true } }) : null,
    parsed.data.managerId ? prisma.user.findUnique({ where: { id: parsed.data.managerId }, select: { role: true, active: true } }) : null,
  ]);
  if (parsed.data.technicianId && !canBeAssignedAsTechnician(technician)) {
    return { errors: { technicianId: ["Técnico inválido ou inativo"] } };
  }
  if (parsed.data.managerId && !canBeAssignedAsManager(manager)) {
    return { errors: { managerId: ["Responsável inválido ou inativo"] } };
  }

  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    select: { status: true, serviceType: true, scheduledAt: true, technicianId: true, managerId: true, pestTypes: true, notes: true, isFree: true, price: true },
  });
  if (!order) return { globalError: "OS não encontrada." };
  try {
    assertEditAllowed(order.status, role);
  } catch (error) {
    return { globalError: error instanceof TransitionError ? error.message : "Alteração não permitida." };
  }

  const pestArr = parsed.data.pestTypes
    ? parsed.data.pestTypes.split(",").map((p) => p.trim()).filter(Boolean)
    : [];

  await prisma.serviceOrder.update({
    where: { id: orderId },
    data: {
      serviceType: parsed.data.serviceType,
      scheduledAt,
      technicianId: parsed.data.technicianId,
      managerId: parsed.data.managerId,
      pestTypes: pestArr,
      notes: parsed.data.notes,
      isFree: parsed.data.isFree === "true",
      price: parsed.data.price ?? null,
      updatedAt: new Date(),
    },
  });

  await writeAuditLog({
    entityName: "ServiceOrder",
    entityId: orderId,
    userId: session.user.id,
    changes: {
      serviceType: { from: order.serviceType, to: parsed.data.serviceType },
      pestTypes: { from: order.pestTypes, to: pestArr },
      notes: { from: order.notes, to: parsed.data.notes },
    },
    serviceOrderId: orderId,
  });

  revalidatePath(`/service-orders/${orderId}`);
  revalidatePath("/service-orders");
  redirect(`/service-orders/${orderId}`);
}
