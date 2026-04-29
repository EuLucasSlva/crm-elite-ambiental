"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import type { Role } from "@prisma/client";

const batchSchema = z.object({
  stockItemId: z.string().min(1),
  batchNumber: z.string().max(80).optional().nullable(),
  quantity: z.coerce.number().positive("Quantidade deve ser maior que zero"),
  expiryDate: z.string().optional().nullable(),
  unitCost: z.coerce.number().min(0).default(0),
  supplier: z.string().max(120).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type CreateBatchState = {
  errors?: Partial<Record<keyof z.infer<typeof batchSchema>, string[]>>;
  globalError?: string;
  success?: boolean;
};

export async function createBatch(
  _prev: CreateBatchState,
  formData: FormData
): Promise<CreateBatchState> {
  const session = await auth();
  if (!session?.user?.id) return { globalError: "Sessão expirada." };

  const role = session.user.role as Role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return { globalError: "Sem permissão." };
  }

  const raw = {
    stockItemId: formData.get("stockItemId"),
    batchNumber: formData.get("batchNumber") || null,
    quantity: formData.get("quantity"),
    expiryDate: formData.get("expiryDate") || null,
    unitCost: formData.get("unitCost") || "0",
    supplier: formData.get("supplier") || null,
    notes: formData.get("notes") || null,
  };

  const parsed = batchSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as CreateBatchState["errors"] };
  }

  const data = parsed.data;
  const expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
  const isExpired = expiryDate && expiryDate < new Date();

  await prisma.$transaction([
    prisma.stockBatch.create({
      data: {
        stockItemId: data.stockItemId,
        batchNumber: data.batchNumber,
        initialQuantity: data.quantity,
        quantity: data.quantity,
        expiryDate,
        unitCost: data.unitCost,
        supplier: data.supplier,
        notes: data.notes,
        status: isExpired ? "QUARANTINE" : "ACTIVE",
      },
    }),
    prisma.stockMovement.create({
      data: {
        stockItemId: data.stockItemId,
        delta: data.quantity,
        unitCostSnapshot: data.unitCost,
        reason: `Entrada de lote${data.batchNumber ? ` #${data.batchNumber}` : ""}`,
        performedById: session.user.id,
      },
    }),
  ]);

  // Recalcular quantity total do StockItem (somatório de lotes ACTIVE)
  const agg = await prisma.stockBatch.aggregate({
    where: { stockItemId: data.stockItemId, status: "ACTIVE", quantity: { gt: 0 } },
    _sum: { quantity: true },
  });
  await prisma.stockItem.update({
    where: { id: data.stockItemId },
    data: { quantity: agg._sum.quantity ?? 0 },
  });

  await writeAuditLog({
    entityName: "StockBatch",
    entityId: data.stockItemId,
    userId: session.user.id,
    changes: {
      batchNumber: { to: data.batchNumber ?? "—" },
      quantity: { to: data.quantity },
      expiryDate: { to: expiryDate?.toISOString() ?? "sem validade" },
    },
  });

  revalidatePath(`/stock/${data.stockItemId}`);
  revalidatePath("/stock");
  return { success: true };
}
