"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatAppDateInput, parseAppDateTime } from "@/lib/date-time";

const rowSchema = z.object({
  serviceFor: z.string().min(1).max(200),
  serviceAddress: z.string().max(300).optional().nullable(),
  team: z.string().max(80).optional().nullable(),
  price: z.number().min(0).max(9_999_999).optional().nullable(),
  scheduledAt: z.string().optional().nullable(),
});

const importSchema = z.object({
  customerId: z.string().min(1),
  rows: z.array(rowSchema).min(1).max(500),
});

export type ImportLeadsState = { error?: string; createdCount?: number };

function parseImportedDateTime(value: string): Date | null {
  const localDate = parseAppDateTime(value);
  if (localDate) return localDate;
  const legacyIsoDate = new Date(value);
  return Number.isNaN(legacyIsoDate.getTime()) ? null : legacyIsoDate;
}

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
  const [appYear, appMonth] = formatAppDateInput(now).split("-");
  const mmYY = appMonth + appYear.slice(-2);

  const data = parsed.data.rows.map((r, i) => ({
    orderNumber: String(baseCount + 1 + i).padStart(2, "0") + mmYY,
    customerId: parsed.data.customerId,
    status: "LEAD_CAPTURED" as const,
    serviceType: "INSPECTION" as const,
    serviceFor: r.serviceFor,
    serviceAddress: r.serviceAddress || null,
    team: r.team || null,
    price: r.price ?? null,
    scheduledAt: r.scheduledAt ? parseImportedDateTime(r.scheduledAt) : null,
  }));

  if (parsed.data.rows.some((row, index) => row.scheduledAt && !data[index].scheduledAt)) {
    return { error: "Há uma data ou horário inválido na planilha." };
  }

  const result = await prisma.serviceOrder.createMany({ data });

  return { createdCount: result.count };
}
