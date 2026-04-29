"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import bcrypt from "bcryptjs";

export interface ChangePasswordResult {
  success: boolean;
  error?: string;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<ChangePasswordResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Sessão inválida. Faça login novamente." };
  }

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: "Preencha todos os campos." };
  }

  if (newPassword.length < 8) {
    return { success: false, error: "A nova senha deve ter pelo menos 8 caracteres." };
  }

  if (!/\d/.test(newPassword)) {
    return { success: false, error: "A nova senha deve conter ao menos um número." };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "A nova senha e a confirmação não coincidem." };
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) {
    return { success: false, error: "Usuário não encontrado." };
  }

  const isCorrect = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isCorrect) {
    return { success: false, error: "Senha atual incorreta." };
  }

  const newHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  await writeAuditLog({
    entityName: "User",
    entityId: userId,
    userId,
    changes: {
      passwordHash: { from: "***", to: "***" },
    },
  });

  return { success: true };
}
