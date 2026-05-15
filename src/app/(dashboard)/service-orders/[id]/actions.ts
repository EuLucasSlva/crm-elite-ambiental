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

// ─── Add insumo to existing OS (works regardless of status) ─────────────────

export type AddInsumoState = { error?: string; success?: boolean };

export async function addInsumo(
  orderId: string,
  point: {
    stockItemId: string;
    productName: string;
    location: string;
    doseApplied: number;
    unit: import("@prisma/client").StockUnit;
  }
): Promise<AddInsumoState> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const schema = z.object({
    orderId: z.string().min(1).max(40),
    stockItemId: z.string().min(1),
    productName: z.string().min(1),
    location: z.string().min(1),
    doseApplied: z.number().positive(),
    unit: z.enum(["ML", "G", "L", "KG", "UNIT", "M2"] as [import("@prisma/client").StockUnit, ...import("@prisma/client").StockUnit[]]),
  });

  const parsed = schema.safeParse({ orderId, ...point });
  if (!parsed.success) return { error: "Dados inválidos." };

  const { stockItemId, productName, location, doseApplied, unit } = parsed.data;

  const [order, stockItem] = await Promise.all([
    prisma.serviceOrder.findUnique({ where: { id: orderId }, select: { id: true, cost: true, technicianId: true } }),
    prisma.stockItem.findUnique({ where: { id: stockItemId }, select: { quantity: true, unitCost: true, expiryDate: true, name: true } }),
  ]);

  if (!order) return { error: "OS não encontrada." };
  if (!stockItem) return { error: "Produto não encontrado no estoque." };
  if (stockItem.expiryDate && stockItem.expiryDate < new Date()) return { error: `Produto "${productName}" está vencido.` };
  if (stockItem.quantity < doseApplied) return { error: `Estoque insuficiente. Disponível: ${stockItem.quantity}, necessário: ${doseApplied}.` };

  const now = new Date();
  const unitCost = stockItem.unitCost;
  const movementCost = doseApplied * unitCost;
  const techId = order.technicianId ?? session.user.id;

  await prisma.$transaction(async (tx) => {
    // Find or create a TechnicalVisit for this OS to attach the application point
    let visit = await tx.technicalVisit.findFirst({
      where: { serviceOrderId: orderId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (!visit) {
      visit = await tx.technicalVisit.create({
        data: {
          serviceOrderId: orderId,
          technicianId: techId,
          scheduledAt: now,
          checkInAt: now,
          checkOutAt: now,
        },
        select: { id: true },
      });
    }

    await tx.applicationPoint.create({
      data: { visitId: visit.id, stockItemId, location, productName, doseApplied, unit },
    });

    await tx.stockMovement.create({
      data: {
        stockItemId,
        serviceOrderId: orderId,
        visitId: visit.id,
        applicationPoint: location,
        delta: -doseApplied,
        unitCostSnapshot: unitCost,
        reason: `Adicionado manualmente à OS`,
        performedById: session.user.id,
      },
    });

    await tx.stockItem.update({
      where: { id: stockItemId },
      data: { quantity: { decrement: doseApplied } },
    });

    await tx.serviceOrder.update({
      where: { id: orderId },
      data: { cost: (order.cost ?? 0) + movementCost, updatedAt: now },
    });
  });

  revalidatePath(`/service-orders/${orderId}`);
  return { success: true };
}

// ─── Update price only (no payment status change) ────────────────────────────

export type UpdatePriceState = { error?: string; success?: boolean };

export async function updatePrice(
  orderId: string,
  price: number | null
): Promise<UpdatePriceState> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const role = session.user.role as Role;
  if (role === "TECHNICIAN") return { error: "Sem permissão." };

  const schema = z.object({
    orderId: z.string().min(1).max(40),
    price: z.number().min(0).max(9_999_999).nullable(),
  });
  const parsed = schema.safeParse({ orderId, price });
  if (!parsed.success) return { error: "Valor inválido." };

  await prisma.serviceOrder.update({
    where: { id: parsed.data.orderId },
    data: { price: parsed.data.price, updatedAt: new Date() },
  });

  revalidatePath(`/service-orders/${parsed.data.orderId}`);
  return { success: true };
}

// ─── Move Kanban Card ────────────────────────────────────────────────────────

const STATUS_ENUM = [
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
] as [ServiceOrderStatus, ...ServiceOrderStatus[]];

export type MoveKanbanState = { error?: string; success?: boolean };

export async function moveKanbanCard(
  orderId: string,
  toStatus: ServiceOrderStatus
): Promise<MoveKanbanState> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const schema = z.object({
    orderId: z.string().min(1).max(40),
    toStatus: z.enum(STATUS_ENUM),
  });
  const parsed = schema.safeParse({ orderId, toStatus });
  if (!parsed.success) return { error: "Dados inválidos." };

  const role = session.user.role as Role;
  if (role === "TECHNICIAN") return { error: "Sem permissão para mover cards." };

  const order = await prisma.serviceOrder.findUnique({
    where: { id: parsed.data.orderId },
    select: { status: true },
  });
  if (!order) return { error: "OS não encontrada." };

  // Same status — nothing to do
  if (order.status === parsed.data.toStatus) return { success: true };

  const now = new Date();
  const extra: Record<string, unknown> = {};
  if (parsed.data.toStatus === "SERVICE_EXECUTED") extra.executedAt = now;
  if (parsed.data.toStatus === "CLOSED" || parsed.data.toStatus === "CANCELED") extra.closedAt = now;

  await prisma.serviceOrder.update({
    where: { id: parsed.data.orderId },
    data: { status: parsed.data.toStatus, ...extra, updatedAt: now },
  });

  await writeAuditLog({
    entityName: "ServiceOrder",
    entityId: parsed.data.orderId,
    userId: session.user.id,
    changes: { status: { from: order.status, to: parsed.data.toStatus } },
    serviceOrderId: parsed.data.orderId,
  });

  revalidatePath("/service-orders");
  revalidatePath(`/service-orders/${parsed.data.orderId}`);

  return { success: true };
}

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

  const paymentSchema = z.object({
    id: z.string().min(1).max(40),
    paymentStatus: z.enum([
      "PENDING",
      "PAID",
      "OVERDUE",
      "WAIVED",
    ] as [PaymentStatus, ...PaymentStatus[]]),
    price: z.coerce.number().min(0).max(9_999_999).optional().nullable(),
    installments: z.coerce.number().int().min(1).max(60).optional().nullable(),
    firstDueDate: z.string().optional().nullable(),
  });

  const paymentParsed = paymentSchema.safeParse({
    id: formData.get("id"),
    paymentStatus: formData.get("paymentStatus"),
    price: formData.get("price") || undefined,
    installments: formData.get("installments") || undefined,
    firstDueDate: formData.get("firstDueDate") || undefined,
  });
  if (!paymentParsed.success) return { error: "Dados inválidos." };

  const { id, paymentStatus: newStatus, installments, firstDueDate } = paymentParsed.data;
  const price = paymentParsed.data.price;

  const order = await prisma.serviceOrder.findUnique({
    where: { id },
    select: { paymentStatus: true, price: true },
  });
  if (!order) return { error: "OS não encontrada." };

  const now = new Date();
  const isParcelado = installments && installments > 1 && firstDueDate;

  const data: Record<string, unknown> = {
    paymentStatus: newStatus,
    updatedAt: now,
  };

  if (price !== undefined && price !== null) data.price = price;

  if (isParcelado) {
    data.installmentCount = installments;
    // For installment payment, OS is only fully paid when all installments paid
    // Keep paidAt null until all installments are paid
  } else {
    if (newStatus === "PAID") data.paidAt = now;
  }

  const effectivePrice = (price !== null && price !== undefined ? price : order.price) ?? 0;

  await prisma.$transaction(async (tx) => {
    await tx.serviceOrder.update({ where: { id }, data });

    // Create installments if parcelado and not already created
    if (isParcelado && newStatus === "PAID" && firstDueDate) {
      // Remove existing installments first
      await tx.installment.deleteMany({ where: { serviceOrderId: id } });

      const installmentAmount = effectivePrice / installments;
      const baseDate = new Date(firstDueDate);

      for (let i = 0; i < installments; i++) {
        const dueDate = new Date(baseDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        await tx.installment.create({
          data: {
            serviceOrderId: id,
            number: i + 1,
            amount: installmentAmount,
            dueDate,
            status: "PENDING",
          },
        });
      }
    } else if (newStatus !== "PAID") {
      // Reset installments if reverting payment
      await tx.installment.deleteMany({ where: { serviceOrderId: id } });
    }
  });

  await writeAuditLog({
    entityName: "ServiceOrder",
    entityId: id,
    userId: session.user.id,
    changes: {
      paymentStatus: { from: order.paymentStatus, to: newStatus },
      ...(price !== undefined ? { price: { from: order.price, to: price } } : {}),
      ...(isParcelado ? { installments: { to: installments } } : {}),
    },
    serviceOrderId: id,
  });

  revalidatePath(`/service-orders/${id}`);
  revalidatePath("/financeiro");

  return { success: true };
}

// ─── Mark installment as paid ────────────────────────────────────────────────

export type MarkInstallmentState = { error?: string; success?: boolean };

export async function markInstallmentPaid(
  installmentId: string
): Promise<MarkInstallmentState> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const role = session.user.role as Role;
  if (role === "TECHNICIAN") return { error: "Sem permissão." };

  const installment = await prisma.installment.findUnique({
    where: { id: installmentId },
    include: { serviceOrder: { select: { id: true, installmentCount: true } } },
  });
  if (!installment) return { error: "Parcela não encontrada." };

  const now = new Date();

  await prisma.installment.update({
    where: { id: installmentId },
    data: { status: "PAID", paidAt: now },
  });

  // Check if all installments are paid — if so, mark OS as fully paid
  const allInstallments = await prisma.installment.findMany({
    where: { serviceOrderId: installment.serviceOrderId },
    select: { status: true },
  });

  const allPaid = allInstallments.every((i) => i.status === "PAID");
  if (allPaid) {
    await prisma.serviceOrder.update({
      where: { id: installment.serviceOrderId },
      data: { paidAt: now, paymentStatus: "PAID" },
    });
  }

  revalidatePath(`/service-orders/${installment.serviceOrderId}`);
  revalidatePath("/financeiro");

  return { success: true };
}
