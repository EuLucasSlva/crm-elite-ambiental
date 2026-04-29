"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

const adjustmentSchema = z.object({
  stockItemId: z.string().min(1),
  delta: z.coerce
    .number()
    .refine((v) => v !== 0, "A quantidade não pode ser zero"),
  reason: z.string().min(1, "Motivo é obrigatório").max(200),
});

export type StockAdjustmentState = {
  errors?: Partial<Record<"delta" | "reason", string[]>>;
  globalError?: string;
  success?: boolean;
};

export async function adjustStock(
  _prev: StockAdjustmentState,
  formData: FormData
): Promise<StockAdjustmentState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { globalError: "Sessão expirada. Faça login novamente." };
  }

  const raw = {
    stockItemId: formData.get("stockItemId"),
    delta: formData.get("delta"),
    reason: formData.get("reason"),
  };

  const result = adjustmentSchema.safeParse(raw);
  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors as StockAdjustmentState["errors"],
    };
  }

  const { stockItemId, delta, reason } = result.data;

  const item = await prisma.stockItem.findUnique({
    where: { id: stockItemId },
    select: { id: true, quantity: true, name: true },
  });

  if (!item) {
    return { globalError: "Item de estoque não encontrado." };
  }

  const newQuantity = item.quantity + delta;
  if (newQuantity < 0) {
    return {
      errors: {
        delta: [
          `Quantidade insuficiente. Estoque atual: ${item.quantity.toLocaleString("pt-BR")}`,
        ],
      },
    };
  }

  await prisma.$transaction([
    prisma.stockMovement.create({
      data: {
        stockItemId,
        delta,
        reason,
        performedById: session.user.id,
      },
    }),
    prisma.stockItem.update({
      where: { id: stockItemId },
      data: { quantity: newQuantity },
    }),
  ]);

  await writeAuditLog({
    entityName: "StockItem",
    entityId: stockItemId,
    userId: session.user.id,
    changes: {
      quantity: { from: item.quantity, to: newQuantity },
    },
  });

  revalidatePath(`/stock/${stockItemId}`);
  revalidatePath("/stock");

  return { success: true };
}
