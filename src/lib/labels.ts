import type {
  ServiceOrderStatus,
  ServiceType,
  LeadSource,
  PropertyType,
  CustomerType,
  OccurrenceType,
  Role,
  PaymentStatus,
} from "@prisma/client";

export const STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  LEAD_CAPTURED: "Lead Captado",
  INSPECTION_SCHEDULED: "Inspeção Agendada",
  VISIT_DONE: "Visita Realizada",
  QUOTE_CREATED: "Orçamento Criado",
  QUOTE_APPROVED: "Orçamento Aprovado",
  QUOTE_REJECTED: "Orçamento Recusado",
  SERVICE_SCHEDULED: "Serviço Agendado",
  SERVICE_EXECUTED: "Serviço Executado",
  CERTIFICATE_ISSUED: "Certificado Emitido",
  WARRANTY_ACTIVE: "Garantia Ativa",
  CLOSED: "Encerrado",
  CANCELED: "Cancelado",
};

export const STATUS_COLORS: Record<ServiceOrderStatus, string> = {
  LEAD_CAPTURED: "bg-blue-100 text-blue-800",
  INSPECTION_SCHEDULED: "bg-blue-100 text-blue-800",
  VISIT_DONE: "bg-yellow-100 text-yellow-800",
  QUOTE_CREATED: "bg-yellow-100 text-yellow-800",
  QUOTE_APPROVED: "bg-yellow-100 text-yellow-800",
  QUOTE_REJECTED: "bg-yellow-100 text-yellow-800",
  SERVICE_SCHEDULED: "bg-green-100 text-green-800",
  SERVICE_EXECUTED: "bg-green-100 text-green-800",
  CERTIFICATE_ISSUED: "bg-purple-100 text-purple-800",
  WARRANTY_ACTIVE: "bg-purple-100 text-purple-800",
  CLOSED: "bg-gray-100 text-gray-600",
  CANCELED: "bg-gray-100 text-gray-600",
};

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  INSPECTION: "Inspeção",
  TREATMENT: "Tratamento",
  RETURN: "Retorno",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  WHATSAPP: "WhatsApp",
  PHONE: "Telefone",
  REFERRAL: "Indicação",
  PORTAL: "Portal",
  DOOR_TO_DOOR: "Porta a Porta",
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  RESIDENTIAL: "Residencial",
  COMMERCIAL: "Comercial",
  INDUSTRIAL: "Industrial",
  RURAL: "Rural",
};

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  PERSON: "Pessoa Física",
  COMPANY: "Pessoa Jurídica",
};

export const OCCURRENCE_TYPE_LABELS: Record<OccurrenceType, string> = {
  RESCHEDULED: "Reagendado",
  DELAYED: "Atrasado",
  CANCELED: "Cancelado",
  NOT_EXECUTED: "Não Executado",
  CUSTOMER_UNAVAILABLE: "Cliente Ausente",
  UNSAFE_CONDITIONS: "Condições Inseguras",
  WEATHER: "Problema Climático",
  OTHER: "Outro",
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  TECHNICIAN: "Técnico",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  OVERDUE: "Inadimplente",
  WAIVED: "Isento",
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  WAIVED: "bg-gray-100 text-gray-600",
};
