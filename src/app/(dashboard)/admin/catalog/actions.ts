"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import type { Role } from "@prisma/client";

async function requireManager() {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Sessão expirada." };
  const role = session.user.role as Role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return { ok: false as const, error: "Sem permissão." };
  }
  return { ok: true as const, userId: session.user.id };
}

// ── PestType ──────────────────────────────────────────────────────────────

const pestSchema = z.object({
  name: z.string().min(2, "Nome obrigatório").max(80),
  category: z.string().max(40).optional().nullable(),
});

export type PestState = {
  errors?: Partial<Record<"name" | "category", string[]>>;
  globalError?: string;
  success?: boolean;
};

export async function createPestType(
  _prev: PestState,
  formData: FormData
): Promise<PestState> {
  const a = await requireManager();
  if (!a.ok) return { globalError: a.error };

  const parsed = pestSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category") || null,
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as PestState["errors"] };
  }

  try {
    const created = await prisma.pestType.create({ data: parsed.data });
    await writeAuditLog({
      entityName: "PestType",
      entityId: created.id,
      userId: a.userId,
      changes: { name: { to: created.name } },
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique")) {
      return { errors: { name: ["Já existe uma praga com este nome."] } };
    }
    return { globalError: "Erro ao cadastrar." };
  }

  revalidatePath("/admin/pragas");
  return { success: true };
}

export async function togglePestTypeActive(id: string, active: boolean) {
  const a = await requireManager();
  if (!a.ok) return { error: a.error };

  await prisma.pestType.update({ where: { id }, data: { active } });
  revalidatePath("/admin/pragas");
  return { success: true };
}

// ── ApplicationArea ───────────────────────────────────────────────────────

const areaSchema = z.object({
  name: z.string().min(2, "Nome obrigatório").max(80),
});

export type AreaState = {
  errors?: Partial<Record<"name", string[]>>;
  globalError?: string;
  success?: boolean;
};

export async function createApplicationArea(
  _prev: AreaState,
  formData: FormData
): Promise<AreaState> {
  const a = await requireManager();
  if (!a.ok) return { globalError: a.error };

  const parsed = areaSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as AreaState["errors"] };
  }

  try {
    await prisma.applicationArea.create({ data: parsed.data });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique")) {
      return { errors: { name: ["Já existe uma área com este nome."] } };
    }
    return { globalError: "Erro ao cadastrar." };
  }

  revalidatePath("/admin/areas");
  return { success: true };
}

export async function toggleApplicationAreaActive(id: string, active: boolean) {
  const a = await requireManager();
  if (!a.ok) return { error: a.error };

  await prisma.applicationArea.update({ where: { id }, data: { active } });
  revalidatePath("/admin/areas");
  return { success: true };
}
