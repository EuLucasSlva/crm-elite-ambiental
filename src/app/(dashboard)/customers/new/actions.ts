"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isValidCpfOrCnpj } from "@/lib/format";
import { auth } from "@/lib/auth";

const customerSchema = z.object({
  type: z.enum(["PERSON", "COMPANY"]),
  fullName: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  cpfCnpj: z
    .string()
    .min(1, "CPF/CNPJ é obrigatório")
    .refine((v) => isValidCpfOrCnpj(v), "CPF ou CNPJ inválido"),
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().length(2, "Use a sigla do estado (2 letras)"),
  zip: z.string().min(8, "CEP inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  propertyType: z.enum(["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "RURAL"]),
  siteSizeM2: z.coerce.number().positive("Tamanho deve ser positivo"),
  hadServiceBefore: z.coerce.boolean().default(false),
  lastServiceDate: z.string().optional(),
  leadSource: z.enum([
    "WHATSAPP",
    "PHONE",
    "REFERRAL",
    "PORTAL",
    "DOOR_TO_DOOR",
  ]),
  notes: z.string().optional(),
});

export type CustomerFormState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function createCustomer(
  _prev: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  // Verificação de sessão — impede invocação não autenticada da Server Action.
  const session = await auth();
  if (!session?.user) {
    return { errors: {}, message: "Sessão expirada. Faça login novamente." };
  }

  const raw = {
    type: formData.get("type"),
    fullName: formData.get("fullName"),
    cpfCnpj: formData.get("cpfCnpj"),
    street: formData.get("street"),
    number: formData.get("number"),
    complement: formData.get("complement") || undefined,
    city: formData.get("city"),
    state: formData.get("state"),
    zip: formData.get("zip"),
    phone: formData.get("phone"),
    email: formData.get("email") || undefined,
    propertyType: formData.get("propertyType"),
    siteSizeM2: formData.get("siteSizeM2"),
    hadServiceBefore: formData.get("hadServiceBefore") === "true",
    lastServiceDate: formData.get("lastServiceDate") || undefined,
    leadSource: formData.get("leadSource"),
    notes: formData.get("notes") || undefined,
  };

  const parsed = customerSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  // Strip non-digits from CPF/CNPJ for storage
  const cpfCnpjDigits = data.cpfCnpj.replace(/\D/g, "");

  // Check uniqueness
  const existing = await prisma.customer.findUnique({
    where: { cpfCnpj: cpfCnpjDigits },
    select: { id: true },
  });
  if (existing) {
    return {
      errors: { cpfCnpj: ["CPF/CNPJ já cadastrado no sistema"] },
    };
  }

  const customer = await prisma.customer.create({
    data: {
      type: data.type,
      fullName: data.fullName,
      cpfCnpj: cpfCnpjDigits,
      street: data.street,
      number: data.number,
      complement: data.complement || null,
      city: data.city,
      state: data.state.toUpperCase(),
      zip: data.zip.replace(/\D/g, ""),
      phone: data.phone.replace(/\D/g, ""),
      email: data.email || null,
      propertyType: data.propertyType,
      siteSizeM2: data.siteSizeM2,
      hadServiceBefore: data.hadServiceBefore,
      lastServiceDate: data.lastServiceDate
        ? new Date(data.lastServiceDate)
        : null,
      leadSource: data.leadSource,
      notes: data.notes || null,
    },
    select: { id: true },
  });

  redirect(`/customers/${customer.id}`);
}
