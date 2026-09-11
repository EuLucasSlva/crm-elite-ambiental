import type { Role } from "@prisma/client";

type AssignableUser = {
  active: boolean;
  role: Role;
};

/**
 * Any active user can be assigned to perform a service. A user's system role
 * controls permissions, not the operational function they may have in an OS.
 */
export function canBeAssignedAsTechnician(user: AssignableUser | null | undefined) {
  return user?.active === true;
}

export function canBeAssignedAsManager(user: AssignableUser | null | undefined) {
  return user?.active === true && (user.role === "ADMIN" || user.role === "MANAGER");
}
