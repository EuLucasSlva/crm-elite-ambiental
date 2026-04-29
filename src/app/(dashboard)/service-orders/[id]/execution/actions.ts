"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import type { StockUnit, Role } from "@prisma/client";

// ─── Search stock products (autocomplete) ───────────────────────────────────

export type StockSearchResult = {
  id: string;
  name: string;
  quantity: number;
  unit: StockUnit;
  activeIngredient: string | null;
};

export async function searchStockItems(
  query: string
): Promise<StockSearchResult[]> {
  // Verificação de sessão — impede lookup de estoque sem autenticação.
  const stockSession = await auth();
  if (!stockSession?.user) return [];

  if (!query || query.trim().length < 2) return [];

  return prisma.stockItem.findMany({
    where: {
      name: { contains: query.trim(), mode: "insensitive" },
      quantity: { gt: 0 },
    },
    orderBy: { name: "asc" },
    take: 10,
    select: {
      id: true,
      name: true,
      quantity: true,
      unit: true,
      activeIngredient: true,
    },
  });
}

// ─── Finalize execution ──────────────────────────────────────────────────────

const applicationPointSchema = z.object({
  location: z.string().min(1),
  productName: z.string().min(1),
  doseApplied: z.coerce.number().min(0.001),
  unit: z.enum(["ML", "G", "L", "KG", "UNIT", "M2"] as [StockUnit, ...StockUnit[]]),
  stockItemId: z.string().optional().nullable(),
});

export type FinalizeExecutionState = {
  error?: string;
  success?: boolean;
};

export async function finalizeExecution(
  _prev: FinalizeExecutionState,
  formData: FormData
): Promise<FinalizeExecutionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const serviceOrderId = formData.get("serviceOrderId") as string;
  const technicianId = formData.get("technicianId") as string;
  const scheduledAt = formData.get("scheduledAt") as string;
  const checkInAt = formData.get("checkInAt") as string | null;
  const notes = (formData.get("notes") as string) || null;
  const customerSignature = (formData.get("customerSignature") as string) || null;
  const pointsJson = formData.get("applicationPoints") as string;

  if (!serviceOrderId || !technicianId || !scheduledAt) {
    return { error: "Dados obrigatórios ausentes." };
  }

  // Parse application points
  let rawPoints: unknown[] = [];
  try {
    rawPoints = JSON.parse(pointsJson || "[]");
  } catch {
    return { error: "Dados dos pontos de aplicação inválidos." };
  }

  const parsedPoints = z.array(applicationPointSchema).safeParse(rawPoints);
  if (!parsedPoints.success) {
    return { error: "Pontos de aplicação com dados inválidos." };
  }

  const points = parsedPoints.data;

  // Verify service order exists and is in a valid state
  const order = await prisma.serviceOrder.findUnique({
    where: { id: serviceOrderId },
    select: { status: true, technicianId: true },
  });

  if (!order) {
    return { error: "Ordem de serviço não encontrada." };
  }

  if (
    order.status !== "SERVICE_SCHEDULED" &&
    order.status !== "QUOTE_APPROVED" &&
    order.status !== "VISIT_DONE"
  ) {
    return { error: "Esta OS não está em um estado válido para execução." };
  }

  // Verificação de ownership — TECHNICIAN só pode finalizar OS atribuída a ele.
  // ADMIN e MANAGER podem finalizar qualquer OS.
  const role = session.user.role as Role;
  if (role === "TECHNICIAN" && order.technicianId !== session.user.id) {
    return { error: "Você não está designado para esta ordem de serviço." };
  }

  const now = new Date();
  const checkIn = checkInAt ? new Date(checkInAt) : now;

  // Check stock availability for all points that reference a stock item
  const stockChecks: { itemId: string; dose: number; name: string }[] = [];
  for (const point of points) {
    if (point.stockItemId) {
      stockChecks.push({
        itemId: point.stockItemId,
        dose: point.doseApplied,
        name: point.productName,
      });
    }
  }

  if (stockChecks.length > 0) {
    // Group by stock item id
    const grouped = stockChecks.reduce<Record<string, { total: number; name: string }>>(
      (acc, check) => {
        if (!acc[check.itemId]) {
          acc[check.itemId] = { total: 0, name: check.name };
        }
        acc[check.itemId].total += check.dose;
        return acc;
      },
      {}
    );

    for (const [itemId, { total, name }] of Object.entries(grouped)) {
      const item = await prisma.stockItem.findUnique({
        where: { id: itemId },
        select: { quantity: true, expiryDate: true },
      });

      if (!item) {
        return { error: `Produto "${name}" não encontrado no estoque.` };
      }

      if (item.expiryDate && item.expiryDate < now) {
        return { error: `Produto "${name}" está vencido e não pode ser utilizado.` };
      }

      if (item.quantity < total) {
        return {
          error: `Estoque insuficiente para "${name}". Disponível: ${item.quantity}, Necessário: ${total}.`,
        };
      }
    }
  }

  // All good — run in transaction
  await prisma.$transaction(async (tx) => {
    // 1. Create the TechnicalVisit
    const visit = await tx.technicalVisit.create({
      data: {
        serviceOrderId,
        technicianId,
        scheduledAt: new Date(scheduledAt),
        checkInAt: checkIn,
        checkOutAt: now,
        customerSignature: customerSignature || null,
        notes,
        applicationPoints: {
          create: points.map((p) => ({
            location: p.location,
            productName: p.productName,
            doseApplied: p.doseApplied,
            unit: p.unit,
          })),
        },
      },
    });

    // 2. Create stock movements for items with stockItemId
    for (const point of points) {
      if (point.stockItemId) {
        await tx.stockMovement.create({
          data: {
            stockItemId: point.stockItemId,
            serviceOrderId,
            visitId: visit.id,
            applicationPoint: point.location,
            delta: -point.doseApplied,
            reason: `Uso em OS — ${point.location}`,
            performedById: session.user.id,
          },
        });

        await tx.stockItem.update({
          where: { id: point.stockItemId },
          data: { quantity: { decrement: point.doseApplied } },
        });
      }
    }

    // 3. Update service order status
    await tx.serviceOrder.update({
      where: { id: serviceOrderId },
      data: {
        status: "SERVICE_EXECUTED",
        executedAt: now,
      },
    });
  });

  await writeAuditLog({
    entityName: "ServiceOrder",
    entityId: serviceOrderId,
    userId: session.user.id,
    changes: {
      status: { from: order.status, to: "SERVICE_EXECUTED" },
      executedAt: { to: now.toISOString() },
    },
    serviceOrderId,
  });

  revalidatePath(`/service-orders/${serviceOrderId}`);
  revalidatePath("/service-orders");

  return { success: true };
}
