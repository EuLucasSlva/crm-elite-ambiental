"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import type { Role } from "@prisma/client";

const CATEGORIES = ["FUEL", "PPE", "CHEMICAL", "SALARY", "RENT", "ADMIN", "MAINTENANCE", "MARKETING", "TAXES", "OTHER"] as const;
const METHODS = ["PIX", "CASH", "CARD", "TRANSFER", "BOLETO"] as const;

const expenseSchema = z.object({
  category: z.enum(CATEGORIES),
  description: z.string().min(2, "Descrição obrigatória").max(200),
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  paidAt: z.string().min(1, "Data obrigatória"),
  paymentMethod: z.enum(METHODS),
  supplier: z.string().max(120).optional().nullable(),
  serviceOrderId: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type CreateExpenseState = {
  errors?: Partial<Record<keyof z.infer<typeof expenseSchema>, string[]>>;
  globalError?: string;
};

export async function createExpense(
  _prev: CreateExpenseState,
  formData: FormData
): Promise<CreateExpenseState> {
  const session = await auth();
  if (!session?.user?.id) return { globalError: "Sessão expirada." };

  const role = session.user.role as Role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return { globalError: "Sem permissão para registrar despesas." };
  }

  const raw = {
    category: formData.get("category"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    paidAt: formData.get("paidAt"),
    paymentMethod: formData.get("paymentMethod"),
    supplier: formData.get("supplier") || null,
    serviceOrderId: formData.get("serviceOrderId") || null,
    notes: formData.get("notes") || null,
  };

  const parsed = expenseSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as CreateExpenseState["errors"] };
  }

  const expense = await prisma.expense.create({
    data: {
      category: parsed.data.category,
      description: parsed.data.description,
      amount: parsed.data.amount,
      paidAt: new Date(parsed.data.paidAt),
      paymentMethod: parsed.data.paymentMethod,
      supplier: parsed.data.supplier,
      serviceOrderId: parsed.data.serviceOrderId,
      notes: parsed.data.notes,
      createdById: session.user.id,
    },
  });

  await writeAuditLog({
    entityName: "Expense",
    entityId: expense.id,
    userId: session.user.id,
    changes: {
      category: { to: expense.category },
      amount: { to: expense.amount },
      description: { to: expense.description },
    },
  });

  revalidatePath("/financeiro");
  revalidatePath("/financeiro/despesas");
  revalidatePath("/financeiro/fluxo");
  redirect("/financeiro/despesas");
}
