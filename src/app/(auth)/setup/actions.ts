"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Senhas não coincidem",
  path: ["confirm"],
});

export type SetupState = { error?: string };

export async function createFirstAdmin(
  _prev: SetupState,
  formData: FormData
): Promise<SetupState> {
  const count = await prisma.user.count();
  if (count > 0) redirect("/login");

  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, password } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "Este email já está em uso." };

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await prisma.$transaction(async (tx) => {
      const users = await tx.user.count();
      if (users > 0) throw new Error("SETUP_ALREADY_COMPLETE");
      await tx.user.create({ data: { name: name.trim(), email, passwordHash, role: "ADMIN" } });
    }, { isolationLevel: "Serializable" });
  } catch {
    return { error: "A configuração inicial já foi concluída ou ocorreu uma disputa. Tente entrar no sistema." };
  }

  redirect("/login?setup=1");
}
