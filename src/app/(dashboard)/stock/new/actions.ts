"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import type { StockUnit } from "@prisma/client";
import { addDaysToDateInput, parseAppDate } from "@/lib/date-time";

const VALID_UNITS: StockUnit[] = ["ML", "G", "L", "KG", "UNIT", "M2"];

const stockItemSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(120),
  activeIngredient: z.string().max(120).optional().nullable(),
  unit: z.enum(["ML", "G", "L", "KG", "UNIT", "M2"] as [StockUnit, ...StockUnit[]]),
  quantity: z.coerce
    .number()
    .min(0, "Quantidade não pode ser negativa"),
  minThreshold: z.coerce
    .number()
    .min(0, "Estoque mínimo não pode ser negativo"),
  unitCost: z.coerce
    .number()
    .min(0, "Custo não pode ser negativo")
    .default(0),
  expiryDate: z
    .string()
    .optional()
    .nullable(),
  supplier: z.string().max(120).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type CreateStockItemState = {
  errors?: Partial<Record<keyof z.infer<typeof stockItemSchema>, string[]>>;
  globalError?: string;
};

export async function createStockItem(
  _prev: CreateStockItemState,
  formData: FormData
): Promise<CreateStockItemState> {
  const session = await auth();
  if (!session?.user?.id || !["ADMIN", "MANAGER"].includes(session.user.role)) {
    return { globalError: "Sessão expirada. Faça login novamente." };
  }

  const raw = {
    name: formData.get("name"),
    activeIngredient: formData.get("activeIngredient") || null,
    unit: formData.get("unit"),
    quantity: formData.get("quantity"),
    minThreshold: formData.get("minThreshold"),
    unitCost: formData.get("unitCost") ?? "0",
    expiryDate: formData.get("expiryDate") || null,
    supplier: formData.get("supplier") || null,
    notes: formData.get("notes") || null,
  };

  const result = stockItemSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors as CreateStockItemState["errors"] };
  }

  const data = result.data;
  const expiryNextDay = data.expiryDate
    ? addDaysToDateInput(data.expiryDate, 1)
    : null;
  const expiryNextDayStart = expiryNextDay ? parseAppDate(expiryNextDay) : null;
  const expiryDate = expiryNextDayStart
    ? new Date(expiryNextDayStart.getTime() - 1)
    : null;
  if (data.expiryDate && !expiryDate) {
    return { errors: { expiryDate: ["Data inválida"] } };
  }

  const item = await prisma.stockItem.create({
    data: {
      name: data.name,
      activeIngredient: data.activeIngredient ?? null,
      unit: data.unit,
      quantity: data.quantity,
      minThreshold: data.minThreshold,
      unitCost: data.unitCost,
      expiryDate,
      supplier: data.supplier ?? null,
      notes: data.notes ?? null,
    },
  });

  await writeAuditLog({
    entityName: "StockItem",
    entityId: item.id,
    userId: session.user.id,
    changes: {
      name: { to: item.name },
      quantity: { to: item.quantity },
      unit: { to: item.unit },
    },
  });

  // Also create an initial stock movement if quantity > 0
  if (data.quantity > 0) {
    await prisma.stockMovement.create({
      data: {
        stockItemId: item.id,
        delta: data.quantity,
        unitCostSnapshot: data.unitCost,
        reason: "Estoque inicial",
        performedById: session.user.id,
      },
    });
  }

  redirect("/stock");
}
