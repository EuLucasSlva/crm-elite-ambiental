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
    // Cascade já remove ServiceOrders, e ServiceOrders cascateiam o resto
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
    return { error: e instanceof Error ? e.message : "Erro ao apagar cliente." };
  }
}

// ── ServiceOrder ──────────────────────────────────────────────────────────

export async function deleteServiceOrder(id: string): Promise<Result> {
  const auth = await requireRole(["ADMIN", "MANAGER"]);
  if (!auth.ok) return { error: auth.error };

  try {
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
    return { error: e instanceof Error ? e.message : "Erro ao apagar OS." };
  }
}

// ── StockItem ─────────────────────────────────────────────────────────────

export async function deleteStockItem(id: string): Promise<Result> {
  const auth = await requireRole(["ADMIN", "MANAGER"]);
  if (!auth.ok) return { error: auth.error };

  try {
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
    return { error: e instanceof Error ? e.message : "Erro ao apagar item de estoque." };
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
    return { error: e instanceof Error ? e.message : "Erro ao apagar lote." };
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
    return { error: e instanceof Error ? e.message : "Erro ao apagar despesa." };
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
    return { error: e instanceof Error ? e.message : "Erro ao apagar praga." };
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
    return { error: e instanceof Error ? e.message : "Erro ao apagar área." };
  }
}

// ── User ──────────────────────────────────────────────────────────────────

export async function deleteUser(id: string): Promise<Result> {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return { error: auth.error };
  if (id === auth.userId) return { error: "Você não pode apagar seu próprio usuário." };

  try {
    // Limpar dependências
    const hasOrders = await prisma.serviceOrder.count({
      where: { OR: [{ technicianId: id }, { managerId: id }] },
    });
    if (hasOrders > 0) {
      // Em vez de bloquear, fazemos soft-delete via flag active
      await prisma.user.update({ where: { id }, data: { active: false } });
      await writeAuditLog({
        entityName: "User",
        entityId: id,
        userId: auth.userId,
        changes: { active: { from: "true", to: "false" }, reason: { to: "Soft-delete (tem OS associadas)" } },
      });
      revalidatePath("/users");
      return { success: true };
    }

    await prisma.auditLog.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
    revalidatePath("/users");
    return { success: true };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Erro ao apagar usuário." };
  }
}
