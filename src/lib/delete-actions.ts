"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import type { Role } from "@prisma/client";

type Result = { success?: boolean; error?: string };

async function requireRole(allowed: Role[]): Promise<{ ok: true; userId: string; role: Role } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Sessão expirada." };
  const role = session.user.role as Role;
  if (!allowed.includes(role)) return { ok: false, error: "Sem permissão para apagar." };
  return { ok: true, userId: session.user.id, role };
}

// ── Customer ──────────────────────────────────────────────────────────────

export async function deleteCustomer(id: string): Promise<Result> {
  const auth = await requireRole(["ADMIN", "MANAGER"]);
  if (!auth.ok) return { error: auth.error };

  try {
    const orderCount = await prisma.serviceOrder.count({ where: { customerId: id } });
    if (orderCount > 0) {
      return { error: "Este cliente possui histórico de ordens de serviço e não pode ser apagado. Preserve o cadastro para manter a rastreabilidade." };
    }
    await prisma.customer.delete({ where: { id } });
    await writeAuditLog({
      entityName: "Customer",
      entityId: id,
      userId: auth.userId,
      changes: { deleted: { to: "true" } },
    });
    revalidatePath("/customers");
    return { success: true };
  } catch (e: unknown) {
    return { error: "Não foi possível apagar o cliente. Verifique os vínculos existentes." };
  }
}

// ── ServiceOrder ──────────────────────────────────────────────────────────

export async function deleteServiceOrder(id: string): Promise<Result> {
  const auth = await requireRole(["ADMIN", "MANAGER"]);
  if (!auth.ok) return { error: auth.error };

  try {
    const linkedRecords = await prisma.serviceOrder.findUnique({
      where: { id },
      select: {
        _count: { select: { technicalVisits: true, installments: true, stockMovements: true, expenses: true, auditLogs: true } },
        certificate: { select: { id: true } },
        warranty: { select: { id: true } },
      },
    });
    if (!linkedRecords) return { error: "OS não encontrada." };
    const hasHistory = Object.values(linkedRecords._count).some((count) => count > 0) || linkedRecords.certificate || linkedRecords.warranty;
    if (hasHistory) {
      return { error: "Esta OS já possui execução, movimentação financeira ou trilha de auditoria e não pode ser apagada." };
    }
    // Limpar dependentes que não têm cascade no schema
    await prisma.$transaction([
      prisma.applicationPoint.deleteMany({
        where: { visit: { serviceOrderId: id } },
      }),
      prisma.technicalVisit.deleteMany({ where: { serviceOrderId: id } }),
      prisma.certificate.deleteMany({ where: { serviceOrderId: id } }),
      prisma.warranty.deleteMany({ where: { serviceOrderId: id } }),
      prisma.occurrence.deleteMany({ where: { serviceOrderId: id } }),
      prisma.quoteItem.deleteMany({ where: { quote: { serviceOrderId: id } } }),
      prisma.quote.deleteMany({ where: { serviceOrderId: id } }),
      prisma.auditLog.deleteMany({ where: { serviceOrderId: id } }),
      prisma.stockMovement.updateMany({
        where: { serviceOrderId: id },
        data: { serviceOrderId: null },
      }),
      prisma.expense.updateMany({
        where: { serviceOrderId: id },
        data: { serviceOrderId: null },
      }),
      prisma.serviceOrder.delete({ where: { id } }),
    ]);

    await writeAuditLog({
      entityName: "ServiceOrder",
      entityId: id,
      userId: auth.userId,
      changes: { deleted: { to: "true" } },
    });
    revalidatePath("/service-orders");
    revalidatePath("/financeiro");
    return { success: true };
  } catch (e: unknown) {
    return { error: "Não foi possível apagar a OS. Verifique os registros vinculados." };
  }
}

// ── StockItem ─────────────────────────────────────────────────────────────

export async function deleteStockItem(id: string): Promise<Result> {
  const auth = await requireRole(["ADMIN", "MANAGER"]);
  if (!auth.ok) return { error: auth.error };

  try {
    const links = await prisma.stockItem.findUnique({
      where: { id },
      select: { _count: { select: { movements: true, batches: true, applicationPoints: true } } },
    });
    if (!links) return { error: "Item não encontrado." };
    if (Object.values(links._count).some((count) => count > 0)) {
      return { error: "Este item possui lotes ou movimentações e não pode ser apagado sem comprometer o histórico." };
    }
    await prisma.stockItem.delete({ where: { id } });
    await writeAuditLog({
      entityName: "StockItem",
      entityId: id,
      userId: auth.userId,
      changes: { deleted: { to: "true" } },
    });
    revalidatePath("/stock");
    return { success: true };
  } catch (e: unknown) {
    return { error: "Não foi possível apagar o item de estoque. Verifique os vínculos existentes." };
  }
}

// ── StockBatch ────────────────────────────────────────────────────────────

export async function deleteStockBatch(id: string): Promise<Result> {
  const auth = await requireRole(["ADMIN", "MANAGER"]);
  if (!auth.ok) return { error: auth.error };

  try {
    const batch = await prisma.stockBatch.findUnique({
      where: { id },
      select: { stockItemId: true, quantity: true },
    });
    if (!batch) return { error: "Lote não encontrado." };

    await prisma.$transaction([
      prisma.stockMovement.updateMany({
        where: { batchId: id },
        data: { batchId: null },
      }),
      prisma.stockBatch.delete({ where: { id } }),
    ]);

    // Recalcular quantity do StockItem
    const remaining = await prisma.stockBatch.aggregate({
      where: { stockItemId: batch.stockItemId, quantity: { gt: 0 }, status: "ACTIVE" },
      _sum: { quantity: true },
    });
    await prisma.stockItem.update({
      where: { id: batch.stockItemId },
      data: { quantity: remaining._sum.quantity ?? 0 },
    });

    revalidatePath(`/stock/${batch.stockItemId}`);
    revalidatePath("/stock");
    return { success: true };
  } catch (e: unknown) {
    return { error: "Não foi possível apagar o lote." };
  }
}

// ── Expense ───────────────────────────────────────────────────────────────

export async function deleteExpense(id: string): Promise<Result> {
  const auth = await requireRole(["ADMIN", "MANAGER"]);
  if (!auth.ok) return { error: auth.error };

  try {
    await prisma.expense.delete({ where: { id } });
    await writeAuditLog({
      entityName: "Expense",
      entityId: id,
      userId: auth.userId,
      changes: { deleted: { to: "true" } },
    });
    revalidatePath("/financeiro");
    revalidatePath("/financeiro/despesas");
    revalidatePath("/financeiro/fluxo");
    return { success: true };
  } catch (e: unknown) {
    return { error: "Não foi possível apagar a despesa." };
  }
}

// ── PestType ──────────────────────────────────────────────────────────────

export async function deletePestType(id: string): Promise<Result> {
  const auth = await requireRole(["ADMIN", "MANAGER"]);
  if (!auth.ok) return { error: auth.error };

  try {
    await prisma.pestType.delete({ where: { id } });
    revalidatePath("/admin/pragas");
    return { success: true };
  } catch (e: unknown) {
    return { error: "Não foi possível apagar a praga." };
  }
}

// ── ApplicationArea ───────────────────────────────────────────────────────

export async function deleteApplicationArea(id: string): Promise<Result> {
  const auth = await requireRole(["ADMIN", "MANAGER"]);
  if (!auth.ok) return { error: auth.error };

  try {
    await prisma.applicationArea.delete({ where: { id } });
    revalidatePath("/admin/areas");
    return { success: true };
  } catch (e: unknown) {
    return { error: "Não foi possível apagar a área." };
  }
}

// ── User ──────────────────────────────────────────────────────────────────

export async function deleteUser(id: string): Promise<Result> {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return { error: auth.error };
  if (id === auth.userId) return { error: "Você não pode apagar seu próprio usuário." };

  try {
    const user = await prisma.user.findUnique({ where: { id }, select: { active: true } });
    if (!user) return { error: "Usuário não encontrado." };
    await prisma.user.update({ where: { id }, data: { active: false } });
    await writeAuditLog({
      entityName: "User",
      entityId: id,
      userId: auth.userId,
      changes: { active: { from: user.active, to: false }, reason: { to: "Conta desativada; histórico preservado" } },
    });
    revalidatePath("/users");
    return { success: true };
  } catch (e: unknown) {
    return { error: "Não foi possível apagar o usuário." };
  }
}
