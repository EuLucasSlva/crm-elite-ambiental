"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import {
  assertTransition,
  assertEditAllowed,
  TransitionError,
} from "@/lib/service-order-machine";
import type { ServiceOrderStatus, Role, PaymentStatus } from "@prisma/client";

export type TransitionState = {
  error?: string;
  success?: boolean;
};

export async function transitionServiceOrder(
  _prev: TransitionState,
  formData: FormData
): Promise<TransitionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  // Validação estrita via Zod — impede injeção de valores arbitrários no enum.
  const transitionSchema = z.object({
    id: z.string().min(1).max(40),
    toStatus: z.enum([
      "LEAD_CAPTURED",
      "INSPECTION_SCHEDULED",
      "VISIT_DONE",
      "QUOTE_CREATED",
      "QUOTE_APPROVED",
      "QUOTE_REJECTED",
      "SERVICE_SCHEDULED",
      "SERVICE_EXECUTED",
      "CERTIFICATE_ISSUED",
      "WARRANTY_ACTIVE",
      "CLOSED",
      "CANCELED",
    ] as [ServiceOrderStatus, ...ServiceOrderStatus[]]),
  });

  const transitionParsed = transitionSchema.safeParse({
    id: formData.get("id"),
    toStatus: formData.get("toStatus"),
  });
  if (!transitionParsed.success) return { error: "Dados inválidos." };

  const { id, toStatus } = transitionParsed.data;
  const role = session.user.role as Role;

  const order = await prisma.serviceOrder.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!order) {
    return { error: "Ordem de serviço não encontrada." };
  }

  try {
    assertEditAllowed(order.status, role);
    assertTransition(order.status, toStatus, role);
  } catch (err) {
    if (err instanceof TransitionError) {
      return { error: err.message };
    }
    return { error: "Erro ao validar transição." };
  }

  const fromStatus = order.status;
  const now = new Date();
  const extra: Record<string, unknown> = {};
  if (toStatus === "SERVICE_EXECUTED") extra.executedAt = now;
  if (toStatus === "CLOSED" || toStatus === "CANCELED") extra.closedAt = now;

  await prisma.serviceOrder.update({
    where: { id },
    data: { status: toStatus, ...extra, updatedAt: now },
  });

  // Audit every status transition
  await writeAuditLog({
    entityName: "ServiceOrder",
    entityId: id,
    userId: session.user.id,
    changes: { status: { from: fromStatus, to: toStatus } },
    serviceOrderId: id,
  });

  revalidatePath(`/service-orders/${id}`);
  revalidatePath("/service-orders");

  return { success: true };
}

export type PaymentState = { error?: string; success?: boolean };

export async function updatePaymentStatus(
  _prev: PaymentState,
  formData: FormData
): Promise<PaymentState> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const role = session.user.role as Role;
  if (role === "TECHNICIAN") return { error: "Sem permissão." };

  // Validação estrita via Zod — impede injeção de valores arbitrários no enum
  // e garante que price seja um número dentro de um intervalo aceitável.
  const paymentSchema = z.object({
    id: z.string().min(1).max(40),
    paymentStatus: z.enum([
      "PENDING",
      "PAID",
      "OVERDUE",
      "WAIVED",
    ] as [PaymentStatus, ...PaymentStatus[]]),
    price: z.coerce.number().min(0).max(9_999_999).optional().nullable(),
  });

  const paymentParsed = paymentSchema.safeParse({
    id: formData.get("id"),
    paymentStatus: formData.get("paymentStatus"),
    price: formData.get("price") || undefined,
  });
  if (!paymentParsed.success) return { error: "Dados inválidos." };

  const { id, paymentStatus: newStatus } = paymentParsed.data;

  const order = await prisma.serviceOrder.findUnique({
    where: { id },
    select: { paymentStatus: true, price: true },
  });
  if (!order) return { error: "OS não encontrada." };

  const now = new Date();
  const data: Record<string, unknown> = { paymentStatus: newStatus, updatedAt: now };

  if (newStatus === "PAID") data.paidAt = now;
  if (paymentParsed.data.price !== undefined && paymentParsed.data.price !== null) {
    data.price = paymentParsed.data.price;
  }

  await prisma.serviceOrder.update({ where: { id }, data });

  await writeAuditLog({
    entityName: "ServiceOrder",
    entityId: id,
    userId: session.user.id,
    changes: {
      paymentStatus: { from: order.paymentStatus, to: newStatus },
      ...(data.price !== undefined ? { price: { from: order.price, to: data.price } } : {}),
    },
    serviceOrderId: id,
  });

  revalidatePath(`/service-orders/${id}`);
  revalidatePath("/financeiro");

  return { success: true };
}
