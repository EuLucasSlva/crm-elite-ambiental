import type { ExpenseCategory, PaymentMethod, BatchStatus } from "@prisma/client";

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  FUEL: "Combustível",
  PPE: "EPI",
  CHEMICAL: "Insumos / Químicos",
  SALARY: "Salários / Pró-labore",
  RENT: "Aluguel / Contas fixas",
  ADMIN: "Administrativo",
  MAINTENANCE: "Manutenção",
  MARKETING: "Marketing",
  TAXES: "Impostos",
  OTHER: "Outros",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  PIX: "PIX",
  CASH: "Dinheiro",
  CARD: "Cartão",
  TRANSFER: "Transferência",
  BOLETO: "Boleto",
};

export const BATCH_STATUS_LABELS: Record<BatchStatus, string> = {
  ACTIVE: "Ativo",
  EXHAUSTED: "Esgotado",
  QUARANTINE: "Quarentena",
};

export function getBatchBadge(expiryDate: Date | null): { label: string; color: string; bg: string } {
  if (!expiryDate) return { label: "Sem validade", color: "#475569", bg: "#e2e8f0" };
  const now = new Date();
  const days = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: `Vencido há ${Math.abs(days)}d`, color: "#fff", bg: "#dc2626" };
  if (days <= 7) return { label: `Vence em ${days}d`, color: "#fff", bg: "#dc2626" };
  if (days <= 30) return { label: `Vence em ${days}d`, color: "#7c2d12", bg: "#fed7aa" };
  return { label: `${days}d para vencer`, color: "#166534", bg: "#dcfce7" };
}
