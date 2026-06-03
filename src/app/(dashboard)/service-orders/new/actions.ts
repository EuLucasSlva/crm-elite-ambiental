"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isValidCpfOrCnpj } from "@/lib/format";

const serviceOrderSchema = z.object({
  customerId: z.string().min(1, "Selecione um cliente"),
  serviceType: z.string().min(1, "Selecione um tipo"),
  isFree: z.coerce.boolean().default(false),
  cleanWaterTank: z.coerce.boolean().default(false),
  technicianId: z.string().optional(),
  managerId: z.string().optional(),
  pestTypes: z.string().optional(),
  scheduledAt: z.string().optional(),
  notes: z.string().optional(),
  price: z.coerce.number().min(0).max(9_999_999).optional().nullable(),
});

export type NewServiceOrderState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function createServiceOrder(
  _prev: NewServiceOrderState,
  formData: FormData
): Promise<NewServiceOrderState> {
  const session = await auth();
  if (!session?.user) {
    return { message: "Sessão expirada. Faça login novamente." };
  }

  const raw = {
    customerId: formData.get("customerId"),
    serviceType: formData.get("serviceType"),
    isFree: formData.get("isFree") === "true",
    cleanWaterTank: formData.get("cleanWaterTank") === "true",
    technicianId: formData.get("technicianId") || undefined,
    managerId: formData.get("managerId") || undefined,
    pestTypes: formData.get("pestTypes") || undefined,
    scheduledAt: formData.get("scheduledAt") || undefined,
    notes: formData.get("notes") || undefined,
    price: formData.get("price") || undefined,
  };

  const parsed = serviceOrderSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  // Verify customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: data.customerId },
    select: { id: true },
  });
  if (!customer) {
    return { errors: { customerId: ["Cliente não encontrado"] } };
  }

  const pestTypesArray = data.pestTypes
    ? data.pestTypes
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  // serviceType from form can be a custom string — map known values to enum, keep custom as-is
  const knownTypes = ["INSPECTION", "TREATMENT", "RETURN"];
  const serviceTypeValue = knownTypes.includes(data.serviceType)
    ? (data.serviceType as "INSPECTION" | "TREATMENT" | "RETURN")
    : "INSPECTION"; // fallback for custom types stored as notes

  // Generate sequential order number: NN + MM + YY (e.g. "060126" = 6th OS, Jan 2026)
  const count = await prisma.serviceOrder.count();
  const now = new Date();
  const orderNumber =
    String(count + 1).padStart(2, "0") +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getFullYear()).slice(-2);

  const order = await prisma.serviceOrder.create({
    data: {
      orderNumber,
      customerId: data.customerId,
      serviceType: serviceTypeValue,
      isFree: data.isFree,
      cleanWaterTank: data.cleanWaterTank,
      technicianId: data.technicianId || null,
      managerId: data.managerId || null,
      pestTypes: pestTypesArray,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      notes: data.notes || null,
      status: "LEAD_CAPTURED",
      price: data.price ?? null,
    },
    select: { id: true },
  });

  redirect(`/service-orders/${order.id}`);
}

// ── Quick customer creation (used by the inline modal in New OS form) ─────────

const quickCustomerSchema = z.object({
  type: z.enum(["PERSON", "COMPANY"]),
  fullName: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  cpfCnpj: z
    .string()
    .min(1, "CPF/CNPJ é obrigatório")
    .refine((v) => isValidCpfOrCnpj(v), "CPF ou CNPJ inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().length(2, "Use a sigla (2 letras)"),
  zip: z.string().min(8, "CEP inválido"),
  propertyType: z.enum(["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "RURAL"]),
  siteSizeM2: z.coerce.number().positive("Tamanho deve ser positivo"),
  leadSource: z.enum(["WHATSAPP", "PHONE", "REFERRAL", "PORTAL", "DOOR_TO_DOOR"]),
});

export type QuickCustomerState = {
  errors?: Record<string, string[]>;
  message?: string;
  created?: { id: string; fullName: string; cpfCnpj: string; city: string; state: string };
};

export async function createCustomerQuick(
  _prev: QuickCustomerState,
  formData: FormData
): Promise<QuickCustomerState> {
  const session = await auth();
  if (!session?.user) return { message: "Sessão expirada. Faça login novamente." };

  const parsed = quickCustomerSchema.safeParse({
    type: formData.get("type"),
    fullName: formData.get("fullName"),
    cpfCnpj: formData.get("cpfCnpj"),
    phone: formData.get("phone"),
    email: formData.get("email") || undefined,
    street: formData.get("street"),
    number: formData.get("number"),
    complement: formData.get("complement") || undefined,
    city: formData.get("city"),
    state: formData.get("state"),
    zip: formData.get("zip"),
    propertyType: formData.get("propertyType"),
    siteSizeM2: formData.get("siteSizeM2"),
    leadSource: formData.get("leadSource"),
  });

  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const cpfCnpjDigits = d.cpfCnpj.replace(/\D/g, "");

  const existing = await prisma.customer.findUnique({ where: { cpfCnpj: cpfCnpjDigits }, select: { id: true } });
  if (existing) return { errors: { cpfCnpj: ["CPF/CNPJ já cadastrado no sistema"] } };

  const customer = await prisma.customer.create({
    data: {
      type: d.type,
      fullName: d.fullName,
      cpfCnpj: cpfCnpjDigits,
      phone: d.phone.replace(/\D/g, ""),
      email: d.email || null,
      street: d.street,
      number: d.number,
      complement: d.complement || null,
      city: d.city,
      state: d.state.toUpperCase(),
      zip: d.zip.replace(/\D/g, ""),
      propertyType: d.propertyType,
      siteSizeM2: d.siteSizeM2,
      leadSource: d.leadSource,
      hadServiceBefore: false,
    },
    select: { id: true, fullName: true, cpfCnpj: true, city: true, state: true },
  });

  return { created: customer };
}

export async function searchCustomers(query: string) {
  // Verificação de sessão — impede lookup de clientes sem autenticação.
  const session = await auth();
  if (!session?.user) return [];

  if (!query || query.trim().length < 2) return [];

  return prisma.customer.findMany({
    where: {
      OR: [
        { fullName: { contains: query, mode: "insensitive" } },
        {
          cpfCnpj: {
            contains: query.replace(/\D/g, ""),
            mode: "insensitive",
          },
        },
      ],
    },
    take: 8,
    select: { id: true, fullName: true, cpfCnpj: true, city: true, state: true },
  });
}
