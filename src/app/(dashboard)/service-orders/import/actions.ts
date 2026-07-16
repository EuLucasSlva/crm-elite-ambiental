"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const rowSchema = z.object({
  serviceFor: z.string().min(1).max(200),
  serviceAddress: z.string().max(300).optional().nullable(),
  team: z.string().max(80).optional().nullable(),
  price: z.number().min(0).max(9_999_999).optional().nullable(),
  scheduledAt: z.string().optional().nullable(), // ISO
});

const importSchema = z.object({
  customerId: z.string().min(1),
  rows: z.array(rowSchema).min(1).max(500),
});

export type ImportLeadsState = { error?: string; createdCount?: number };

export async function importLeads(
  customerId: string,
  rows: z.infer<typeof rowSchema>[]
): Promise<ImportLeadsState> {
  const session = await auth();
  if (!session?.user) return { error: "Sessão expirada." };

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return { error: "Sem permissão para importar leads." };
  }

  const parsed = importSchema.safeParse({ customerId, rows });
  if (!parsed.success) return { error: "Dados inválidos na planilha." };

  const customer = await prisma.customer.findUnique({
    where: { id: parsed.data.customerId },
    select: { id: true },
  });
  if (!customer) return { error: "Cliente não encontrado." };

  // Gera orderNumber sequencial (NN + MM + AA) a partir da contagem atual.
  const baseCount = await prisma.serviceOrder.count();
  const now = new Date();
  const mmYY =
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getFullYear()).slice(-2);

  const data = parsed.data.rows.map((r, i) => ({
    orderNumber: String(baseCount + 1 + i).padStart(2, "0") + mmYY,
    customerId: parsed.data.customerId,
    status: "LEAD_CAPTURED" as const,
    serviceType: "INSPECTION" as const,
    serviceFor: r.serviceFor,
    serviceAddress: r.serviceAddress || null,
    team: r.team || null,
    price: r.price ?? null,
    scheduledAt: r.scheduledAt ? new Date(r.scheduledAt) : null,
  }));

  const result = await prisma.serviceOrder.createMany({ data });

  return { createdCount: result.count };
}
