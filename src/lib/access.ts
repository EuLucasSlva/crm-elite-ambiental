import "server-only";

import { redirect } from "next/navigation";
import type { Prisma, Role } from "@prisma/client";
import { auth } from "@/lib/auth";

export async function requireRoles(allowed: Role[], fallback = "/") {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!allowed.includes(session.user.role as Role)) redirect(fallback);
  return session;
}

export function serviceOrderScope(userId: string, role: Role): Prisma.ServiceOrderWhereInput {
  return role === "TECHNICIAN" ? { technicianId: userId } : {};
}

export function andWhere(
  scope: Prisma.ServiceOrderWhereInput,
  filters: Prisma.ServiceOrderWhereInput
): Prisma.ServiceOrderWhereInput {
  if (Object.keys(scope).length === 0) return filters;
  if (Object.keys(filters).length === 0) return scope;
  return { AND: [scope, filters] };
}

export function isPrivileged(role: Role) {
  return role === "ADMIN" || role === "MANAGER";
}

