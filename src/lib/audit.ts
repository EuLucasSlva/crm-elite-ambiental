/**
 * Audit helper for Prisma v7.
 *
 * Prisma v7 removed `$use` middleware. Instead, call `writeAuditLog` explicitly
 * from API routes that mutate audited entities. The function is a thin wrapper
 * that writes to AuditLog without blocking the caller.
 *
 * Usage in an API route:
 *   await writeAuditLog(prisma, {
 *     entityName: "ServiceOrder",
 *     entityId: order.id,
 *     userId: session.user.id,
 *     changes: { status: { from: "LEAD_CAPTURED", to: "INSPECTION_SCHEDULED" } },
 *   });
 */

import { prisma } from "@/lib/prisma";

export interface AuditChange {
  from?: unknown;
  to?: unknown;
}

export interface WriteAuditLogOptions {
  entityName: string;
  entityId: string;
  userId: string;
  changes: Record<string, AuditChange>;
  serviceOrderId?: string | null;
}

/**
 * Writes one AuditLog row per changed field. Fire-and-forget — failures
 * are silenced so they never break the primary operation.
 */
export async function writeAuditLog(options: WriteAuditLogOptions): Promise<void> {
  const { entityName, entityId, userId, changes, serviceOrderId } = options;

  const rows = Object.entries(changes).map(([field, { from, to }]) => ({
    entityName,
    entityId,
    userId,
    field,
    oldValue: sanitizeAuditValue(field, from),
    newValue: sanitizeAuditValue(field, to),
    serviceOrderId: serviceOrderId ?? null,
  }));

  if (rows.length === 0) return;

  await prisma.auditLog.createMany({ data: rows }).catch(() => {
    // Audit failures must never break the primary operation.
  });
}

const SENSITIVE_FIELDS = /password|token|secret|signature|cpf|cnpj|email|phone/i;

function sanitizeAuditValue(field: string, value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (SENSITIVE_FIELDS.test(field)) return "[REDACTED]";
  const serialized = Array.isArray(value) ? value.join(", ") : String(value);
  return serialized.length > 500 ? `${serialized.slice(0, 497)}...` : serialized;
}

/**
 * Computes the diff between `before` and `after` records and
 * returns a `changes` map suitable for `writeAuditLog`.
 *
 * Only fields present in `after` are compared.
 */
export function diffRecords(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Record<string, AuditChange> {
  const changes: Record<string, AuditChange> = {};

  for (const [key, newValue] of Object.entries(after)) {
    if (key === "updatedAt" || key === "createdAt") continue;
    const oldValue = before[key];
    if (oldValue !== newValue) {
      changes[key] = { from: oldValue, to: newValue };
    }
  }

  return changes;
}
