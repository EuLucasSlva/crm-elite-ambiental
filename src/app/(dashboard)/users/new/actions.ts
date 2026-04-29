"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import type { Role } from "@prisma/client";

const VALID_ROLES: Role[] = ["ADMIN", "MANAGER", "TECHNICIAN"];

const createUserSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(100),
    email: z.string().email("E-mail inválido").max(150),
    password: z
      .string()
      .min(8, "Senha deve ter ao menos 8 caracteres")
      .max(100)
      .regex(/\d/, "Senha deve conter ao menos um número"),
    confirmPassword: z.string(),
    role: z.enum(["ADMIN", "MANAGER", "TECHNICIAN"] as [Role, ...Role[]]),
    phone: z.string().max(20).optional().nullable(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type CreateUserState = {
  errors?: Partial<
    Record<
      "name" | "email" | "password" | "confirmPassword" | "role" | "phone",
      string[]
    >
  >;
  globalError?: string;
};

export async function createUser(
  _prev: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { globalError: "Acesso negado. Apenas administradores podem criar usuários." };
  }

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    role: formData.get("role"),
    phone: formData.get("phone") || null,
  };

  const result = createUserSchema.safeParse(raw);
  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors as CreateUserState["errors"],
    };
  }

  const data = result.data;

  // Check email uniqueness
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });

  if (existing) {
    return {
      errors: { email: ["Este e-mail já está em uso."] },
    };
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      phone: data.phone ?? null,
      active: true,
    },
  });

  await writeAuditLog({
    entityName: "User",
    entityId: user.id,
    userId: session.user.id,
    changes: {
      name: { to: user.name },
      email: { to: user.email },
      role: { to: user.role },
    },
  });

  redirect("/users");
}
