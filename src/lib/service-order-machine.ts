/**
 * Service Order State Machine
 *
 * Single source of truth for all allowed status transitions and the guards
 * that must pass before a transition is allowed. Every API route that changes
 * a ServiceOrder status must call `assertTransition` before persisting.
 */

import type { Role, ServiceOrderStatus } from "@prisma/client";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type TransitionResult =
  | { ok: true }
  | { ok: false; reason: string };

// ─────────────────────────────────────────────
// Allowed transitions map
// key   = current status
// value = set of statuses the order may move to
// ─────────────────────────────────────────────

export const ALLOWED_TRANSITIONS: Record<
  ServiceOrderStatus,
  ServiceOrderStatus[]
> = {
  LEAD_CAPTURED: ["INSPECTION_SCHEDULED", "CANCELED"],
  INSPECTION_SCHEDULED: ["VISIT_DONE", "CANCELED"],
  VISIT_DONE: ["QUOTE_CREATED", "CANCELED"],
  QUOTE_CREATED: ["QUOTE_APPROVED", "QUOTE_REJECTED", "CANCELED"],
  QUOTE_APPROVED: ["SERVICE_SCHEDULED"],
  QUOTE_REJECTED: ["QUOTE_CREATED", "CANCELED"],
  SERVICE_SCHEDULED: ["SERVICE_EXECUTED", "CANCELED"],
  SERVICE_EXECUTED: ["CERTIFICATE_ISSUED"],
  CERTIFICATE_ISSUED: ["WARRANTY_ACTIVE"],
  WARRANTY_ACTIVE: ["SERVICE_SCHEDULED", "CLOSED"],
  CLOSED: [],
  CANCELED: [],
};

// ─────────────────────────────────────────────
// Role permissions per transition
// Roles that are NOT listed cannot perform the transition.
// ─────────────────────────────────────────────

type AllowedRoles = Role[];

const TRANSITION_ROLES: Partial<
  Record<ServiceOrderStatus, Partial<Record<ServiceOrderStatus, AllowedRoles>>>
> = {
  LEAD_CAPTURED: {
    INSPECTION_SCHEDULED: ["ADMIN", "MANAGER"],
    CANCELED: ["ADMIN", "MANAGER"],
  },
  INSPECTION_SCHEDULED: {
    VISIT_DONE: ["ADMIN", "MANAGER", "TECHNICIAN"],
    CANCELED: ["ADMIN", "MANAGER"],
  },
  VISIT_DONE: {
    QUOTE_CREATED: ["ADMIN", "MANAGER"],
    CANCELED: ["ADMIN", "MANAGER"],
  },
  QUOTE_CREATED: {
    QUOTE_APPROVED: ["ADMIN", "MANAGER"],
    QUOTE_REJECTED: ["ADMIN", "MANAGER"],
    CANCELED: ["ADMIN", "MANAGER"],
  },
  QUOTE_APPROVED: {
    SERVICE_SCHEDULED: ["ADMIN", "MANAGER"],
  },
  QUOTE_REJECTED: {
    QUOTE_CREATED: ["ADMIN", "MANAGER"],
    CANCELED: ["ADMIN", "MANAGER"],
  },
  SERVICE_SCHEDULED: {
    SERVICE_EXECUTED: ["ADMIN", "MANAGER", "TECHNICIAN"],
    CANCELED: ["ADMIN", "MANAGER"],
  },
  SERVICE_EXECUTED: {
    CERTIFICATE_ISSUED: ["ADMIN", "MANAGER"],
  },
  // After CERTIFICATE_ISSUED, only ADMIN may transition (enforced via guard below).
  CERTIFICATE_ISSUED: {
    WARRANTY_ACTIVE: ["ADMIN"],
  },
  WARRANTY_ACTIVE: {
    SERVICE_SCHEDULED: ["ADMIN", "MANAGER"],
    CLOSED: ["ADMIN", "MANAGER"],
  },
};

// ─────────────────────────────────────────────
// Post-certificate lock
// After a certificate has been issued, only admins may edit the service order.
// ─────────────────────────────────────────────

const POST_CERTIFICATE_STATUSES: ServiceOrderStatus[] = [
  "CERTIFICATE_ISSUED",
  "WARRANTY_ACTIVE",
  "CLOSED",
];

export function isPostCertificate(status: ServiceOrderStatus): boolean {
  return POST_CERTIFICATE_STATUSES.includes(status);
}

// ─────────────────────────────────────────────
// Core assertion function
// ─────────────────────────────────────────────

/**
 * Validates that transitioning `from` → `to` is allowed for the given role.
 * Returns `{ ok: true }` on success or `{ ok: false, reason: string }` on failure.
 */
export function canTransition(
  from: ServiceOrderStatus,
  to: ServiceOrderStatus,
  role: Role
): TransitionResult {
  // 1. Check the transition is structurally allowed.
  const allowed = ALLOWED_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    return {
      ok: false,
      reason: `Transição inválida: ${from} → ${to}`,
    };
  }

  // 2. Check the role is permitted.
  const rolesForTransition = TRANSITION_ROLES[from]?.[to];
  if (rolesForTransition && !rolesForTransition.includes(role)) {
    return {
      ok: false,
      reason: `Perfil '${role}' não tem permissão para realizar esta transição`,
    };
  }

  return { ok: true };
}

/**
 * Same as `canTransition` but throws if the transition is not allowed.
 * Use this in API routes where a rejection should result in a 403/400.
 */
export function assertTransition(
  from: ServiceOrderStatus,
  to: ServiceOrderStatus,
  role: Role
): void {
  const result = canTransition(from, to, role);
  if (!result.ok) {
    throw new TransitionError(result.reason);
  }
}

// ─────────────────────────────────────────────
// Guard: block any write to a post-certificate order by non-admins
// ─────────────────────────────────────────────

/**
 * Call this before ANY update to a ServiceOrder (not just status changes).
 * Non-admin users cannot modify an order that has already had its certificate issued.
 */
export function assertEditAllowed(
  currentStatus: ServiceOrderStatus,
  role: Role
): void {
  if (isPostCertificate(currentStatus) && role !== "ADMIN") {
    throw new TransitionError(
      "Apenas administradores podem editar uma ordem após a emissão do certificado"
    );
  }
}

// ─────────────────────────────────────────────
// Custom error
// ─────────────────────────────────────────────

export class TransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransitionError";
  }
}
