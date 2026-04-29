/**
 * Demo seed — inserts rich fictitious data to simulate real operational state.
 * Run with: npx tsx prisma/seed-demo.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  console.log("🌱 Iniciando seed de demonstração...\n");

  const password = await bcrypt.hash("senha123", 12);

  // ── USERS ──────────────────────────────────────────────────────────────────

  const admin = await prisma.user.upsert({
    where: { email: "admin@detetizacao.com" },
    update: {},
    create: {
      name: "Roberto Almeida",
      email: "admin@detetizacao.com",
      passwordHash: password,
      role: "ADMIN",
      phone: "11999990000",
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "gerente@detetizacao.com" },
    update: {},
    create: {
      name: "Carla Mendes",
      email: "gerente@detetizacao.com",
      passwordHash: password,
      role: "MANAGER",
      phone: "11988880000",
    },
  });

  const tec1 = await prisma.user.upsert({
    where: { email: "tecnico@detetizacao.com" },
    update: {},
    create: {
      name: "João Silva",
      email: "tecnico@detetizacao.com",
      passwordHash: password,
      role: "TECHNICIAN",
      phone: "11977770000",
    },
  });

  const tec2 = await prisma.user.upsert({
    where: { email: "tecnico2@detetizacao.com" },
    update: {},
    create: {
      name: "Marcos Pereira",
      email: "tecnico2@detetizacao.com",
      passwordHash: password,
      role: "TECHNICIAN",
      phone: "11966660000",
    },
  });

  console.log("✓ Usuários criados (4)");

  // ── STOCK ITEMS ────────────────────────────────────────────────────────────

  const cipermMetrina = await prisma.stockItem.upsert({
    where: { id: "stock-cipermetrina" },
    update: {},
    create: {
      id: "stock-cipermetrina",
      name: "Cipermetrina 20% EC",
      activeIngredient: "Cipermetrina",
      unit: "ML",
      quantity: 4200,
      minThreshold: 500,
      expiryDate: new Date("2027-06-30"),
      supplier: "Nufarm",
      notes: "Inseticida piretróide para baratas e formigas",
    },
  });

  const fipronil = await prisma.stockItem.upsert({
    where: { id: "stock-fipronil" },
    update: {},
    create: {
      id: "stock-fipronil",
      name: "Fipronil 0,3% SC",
      activeIngredient: "Fipronil",
      unit: "ML",
      quantity: 280,
      minThreshold: 300,
      expiryDate: new Date("2026-09-30"),
      supplier: "BASF",
      notes: "Estoque abaixo do mínimo — reposição urgente",
    },
  });

  const brodifacum = await prisma.stockItem.upsert({
    where: { id: "stock-brodifacum" },
    update: {},
    create: {
      id: "stock-brodifacum",
      name: "Raticida Brodifacum 0,005%",
      activeIngredient: "Brodifacum",
      unit: "G",
      quantity: 1800,
      minThreshold: 200,
      expiryDate: new Date("2025-10-31"),
      supplier: "Huvepharma",
      notes: "Validade próxima — verificar lote",
    },
  });

  const deltametrina = await prisma.stockItem.upsert({
    where: { id: "stock-deltametrina" },
    update: {},
    create: {
      id: "stock-deltametrina",
      name: "Deltametrina 2,5% EC",
      activeIngredient: "Deltametrina",
      unit: "ML",
      quantity: 6000,
      minThreshold: 600,
      expiryDate: new Date("2027-12-31"),
      supplier: "Bayer",
    },
  });

  const imidacloprido = await prisma.stockItem.upsert({
    where: { id: "stock-imidacloprido" },
    update: {},
    create: {
      id: "stock-imidacloprido",
      name: "Imidacloprido 10% SC",
      activeIngredient: "Imidacloprido",
      unit: "ML",
      quantity: 2500,
      minThreshold: 400,
      expiryDate: new Date("2026-03-31"),
      supplier: "Adama",
    },
  });

  const gelCucaracha = await prisma.stockItem.upsert({
    where: { id: "stock-gel-barata" },
    update: {},
    create: {
      id: "stock-gel-barata",
      name: "Gel Atrativo para Baratas",
      activeIngredient: "Indoxacarbe",
      unit: "G",
      quantity: 450,
      minThreshold: 100,
      expiryDate: new Date("2026-08-31"),
      supplier: "Syngenta",
    },
  });

  const mascaraPFF2 = await prisma.stockItem.upsert({
    where: { id: "stock-mascara" },
    update: {},
    create: {
      id: "stock-mascara",
      name: "Máscara PFF2",
      activeIngredient: null,
      unit: "UNIT",
      quantity: 35,
      minThreshold: 10,
      expiryDate: null,
      supplier: "3M",
    },
  });

  const luvasNitrilo = await prisma.stockItem.upsert({
    where: { id: "stock-luvas" },
    update: {},
    create: {
      id: "stock-luvas",
      name: "Luvas de Nitrilo (par)",
      activeIngredient: null,
      unit: "UNIT",
      quantity: 60,
      minThreshold: 20,
      supplier: "Danny",
    },
  });

  const vencidoCipermetrina = await prisma.stockItem.upsert({
    where: { id: "stock-vencido" },
    update: {},
    create: {
      id: "stock-vencido",
      name: "Cipermetrina 5% EC (lote antigo)",
      activeIngredient: "Cipermetrina",
      unit: "ML",
      quantity: 800,
      minThreshold: 200,
      expiryDate: new Date("2024-12-31"),
      supplier: "Nufarm",
      notes: "VENCIDO — aguardando descarte",
    },
  });

  console.log("✓ Estoque criado (9 itens)");

  // ── CUSTOMERS ─────────────────────────────────────────────────────────────

  const c1 = await prisma.customer.upsert({
    where: { cpfCnpj: "12345678000195" },
    update: {},
    create: {
      type: "COMPANY",
      fullName: "Restaurante Sabor Certo Ltda",
      cpfCnpj: "12345678000195",
      street: "Rua das Flores",
      number: "123",
      complement: "Térreo",
      city: "São Paulo",
      state: "SP",
      zip: "01310100",
      phone: "11912345678",
      email: "contato@saborcerto.com.br",
      propertyType: "COMMERCIAL",
      siteSizeM2: 320,
      hadServiceBefore: true,
      lastServiceDate: daysAgo(120),
      leadSource: "WHATSAPP",
      notes: "Cliente recorrente. Preferência por visitas às terças-feiras pela manhã. Infestação recorrente de baratas na cozinha industrial.",
    },
  });

  const c2 = await prisma.customer.upsert({
    where: { cpfCnpj: "98765432000155" },
    update: {},
    create: {
      type: "COMPANY",
      fullName: "Supermercado Família SA",
      cpfCnpj: "98765432000155",
      street: "Avenida Paulista",
      number: "1500",
      complement: "Loja 3",
      city: "São Paulo",
      state: "SP",
      zip: "01310200",
      phone: "11956781234",
      email: "manutencao@superfamilia.com.br",
      propertyType: "COMMERCIAL",
      siteSizeM2: 1200,
      hadServiceBefore: true,
      lastServiceDate: daysAgo(90),
      leadSource: "REFERRAL",
      notes: "Grande cliente. Contrato semestral. Exige laudo técnico para anvisa.",
    },
  });

  const c3 = await prisma.customer.upsert({
    where: { cpfCnpj: "11122233344" },
    update: {},
    create: {
      type: "PERSON",
      fullName: "Maria Aparecida Santos",
      cpfCnpj: "11122233344",
      street: "Rua Alameda dos Pinheiros",
      number: "87",
      complement: "Apto 42",
      city: "Guarulhos",
      state: "SP",
      zip: "07190000",
      phone: "11987654321",
      email: "mapinha@gmail.com",
      propertyType: "RESIDENTIAL",
      siteSizeM2: 80,
      hadServiceBefore: false,
      leadSource: "WHATSAPP",
      notes: "Problema grave com formigas e cupins. Indicada por vizinha.",
    },
  });

  const c4 = await prisma.customer.upsert({
    where: { cpfCnpj: "55566677788" },
    update: {},
    create: {
      type: "PERSON",
      fullName: "Carlos Eduardo Rodrigues",
      cpfCnpj: "55566677788",
      street: "Rua dos Ipês",
      number: "210",
      city: "Santo André",
      state: "SP",
      zip: "09040000",
      phone: "11923456789",
      propertyType: "RESIDENTIAL",
      siteSizeM2: 150,
      hadServiceBefore: true,
      lastServiceDate: daysAgo(200),
      leadSource: "PHONE",
    },
  });

  const c5 = await prisma.customer.upsert({
    where: { cpfCnpj: "33344455566" },
    update: {},
    create: {
      type: "PERSON",
      fullName: "Ana Paula Ferreira",
      cpfCnpj: "33344455566",
      street: "Rua Brigadeiro Faria Lima",
      number: "45",
      complement: "Casa",
      city: "Osasco",
      state: "SP",
      zip: "06020000",
      phone: "11934567890",
      email: "anapaula.ferreira@hotmail.com",
      propertyType: "RESIDENTIAL",
      siteSizeM2: 120,
      hadServiceBefore: false,
      leadSource: "PORTAL",
      notes: "Encontrou pelo site. Urgência com ratos no telhado.",
    },
  });

  const c6 = await prisma.customer.upsert({
    where: { cpfCnpj: "77788899900" },
    update: {},
    create: {
      type: "PERSON",
      fullName: "Pedro Henrique Costa",
      cpfCnpj: "77788899900",
      street: "Alameda Santos",
      number: "600",
      complement: "Apto 151",
      city: "São Paulo",
      state: "SP",
      zip: "01419100",
      phone: "11945678901",
      email: "ph.costa@empresa.com",
      propertyType: "RESIDENTIAL",
      siteSizeM2: 65,
      hadServiceBefore: false,
      leadSource: "REFERRAL",
    },
  });

  const c7 = await prisma.customer.upsert({
    where: { cpfCnpj: "44455566677" },
    update: {},
    create: {
      type: "COMPANY",
      fullName: "Escola Municipal Padre Anchieta",
      cpfCnpj: "44455566677",
      street: "Rua Visconde de Parnaíba",
      number: "3200",
      city: "São Paulo",
      state: "SP",
      zip: "03164000",
      phone: "11931234567",
      email: "secretaria@escolaanchieta.sp.gov.br",
      propertyType: "COMMERCIAL",
      siteSizeM2: 2500,
      hadServiceBefore: true,
      lastServiceDate: daysAgo(365),
      leadSource: "DOOR_TO_DOOR",
      notes: "Licitação anual. Precisa de ART e laudo sanitário. Tratar apenas no período de férias.",
    },
  });

  const c8 = await prisma.customer.upsert({
    where: { cpfCnpj: "22233344455" },
    update: {},
    create: {
      type: "COMPANY",
      fullName: "Hotel Estrela do Sul",
      cpfCnpj: "22233344455",
      street: "Rua Augusta",
      number: "800",
      city: "São Paulo",
      state: "SP",
      zip: "01305100",
      phone: "11922345678",
      email: "manutencao@hotelestrelasul.com.br",
      propertyType: "COMMERCIAL",
      siteSizeM2: 3000,
      hadServiceBefore: true,
      lastServiceDate: daysAgo(60),
      leadSource: "REFERRAL",
      notes: "Hotel de médio porte. Tratamento mensal. Foco em baratas e ratos. Acesso noturno após 23h.",
    },
  });

  const c9 = await prisma.customer.upsert({
    where: { cpfCnpj: "66677788899" },
    update: {},
    create: {
      type: "PERSON",
      fullName: "Fernanda Lima Nascimento",
      cpfCnpj: "66677788899",
      street: "Estrada do Capão Redondo",
      number: "1100",
      complement: "Sobrado",
      city: "São Paulo",
      state: "SP",
      zip: "05882000",
      phone: "11956789012",
      propertyType: "RESIDENTIAL",
      siteSizeM2: 200,
      hadServiceBefore: false,
      leadSource: "WHATSAPP",
      notes: "Novo cliente. Problema com cupins na madeiramento do teto.",
    },
  });

  const c10 = await prisma.customer.upsert({
    where: { cpfCnpj: "99988877766" },
    update: {},
    create: {
      type: "COMPANY",
      fullName: "Clínica Médica Saúde Total",
      cpfCnpj: "99988877766",
      street: "Rua Padre João",
      number: "52",
      city: "Diadema",
      state: "SP",
      zip: "09941000",
      phone: "11912378456",
      email: "administracao@saudetotal.med.br",
      propertyType: "COMMERCIAL",
      siteSizeM2: 400,
      hadServiceBefore: true,
      lastServiceDate: daysAgo(180),
      leadSource: "PORTAL",
      notes: "Clínica médica. Exige certificado sanitário. Somente produtos aprovados pela ANVISA.",
    },
  });

  console.log("✓ Clientes criados (10)");

  // ── SERVICE ORDERS ─────────────────────────────────────────────────────────
  // We create orders in various lifecycle states

  // OS 1 — Restaurante Sabor Certo — WARRANTY_ACTIVE (tratamento concluído há 30 dias)
  const so1 = await prisma.serviceOrder.create({
    data: {
      customerId: c1.id,
      status: "WARRANTY_ACTIVE",
      serviceType: "TREATMENT",
      isFree: false,
      technicianId: tec1.id,
      managerId: manager.id,
      pestTypes: ["cockroach", "rat"],
      scheduledAt: daysAgo(35),
      executedAt: daysAgo(33),
      notes: "Tratamento completo da cozinha industrial e depósito. Uso de gel e inseticida líquido.",
      createdAt: daysAgo(40),
    },
  });

  // Quote for SO1
  const q1 = await prisma.quote.create({
    data: {
      serviceOrderId: so1.id,
      status: "APPROVED",
      totalAmount: 890.0,
      validUntil: daysAgo(10),
      approvedAt: daysAgo(38),
      approvedById: manager.id,
      notes: "Aprovado pelo responsável do restaurante via WhatsApp.",
      createdAt: daysAgo(39),
      items: {
        create: [
          { description: "Desinsetização cozinha industrial (80m²)", quantity: 1, unitPrice: 450 },
          { description: "Desratização depósito (40m²)", quantity: 1, unitPrice: 280 },
          { description: "Retorno garantia (90 dias)", quantity: 1, unitPrice: 160 },
        ],
      },
    },
  });

  // Technical Visit for SO1
  const tv1 = await prisma.technicalVisit.create({
    data: {
      serviceOrderId: so1.id,
      technicianId: tec1.id,
      scheduledAt: daysAgo(35),
      checkInAt: daysAgo(35),
      checkOutAt: daysAgo(35),
      customerSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      notes: "Aplicação realizada em todos os pontos. Cliente assinou o laudo.",
      applicationPoints: {
        create: [
          { location: "Cozinha - Sob pia", productName: "Cipermetrina 20% EC", doseApplied: 200, unit: "ML" },
          { location: "Cozinha - Atrás dos fogões", productName: "Gel Atrativo para Baratas", doseApplied: 15, unit: "G" },
          { location: "Depósito - Perímetro", productName: "Fipronil 0,3% SC", doseApplied: 150, unit: "ML" },
          { location: "Área externa - Bueiros", productName: "Raticida Brodifacum 0,005%", doseApplied: 200, unit: "G" },
        ],
      },
    },
  });

  // Certificate for SO1
  await prisma.certificate.create({
    data: {
      serviceOrderId: so1.id,
      technicalResponsible: "Eng. Biólogo Ricardo Nunes",
      licenseNumber: "CRBIO-12345/01-D",
      pestsTargeted: ["Blattodea (baratas)", "Rattus norvegicus (rato de esgoto)"],
      productsUsed: ["Cipermetrina 20% EC - Reg. MAPA 012345", "Fipronil 0,3% SC - Reg. MAPA 067890", "Gel Indoxacarbe - Reg. MAPA 098765"],
      applicationAreas: ["Cozinha industrial", "Depósito", "Área de serviço", "Área externa"],
      observations: "Tratamento realizado com EPIs adequados. Produto com baixa toxicidade para mamíferos. Retornar em 90 dias.",
      issuedAt: daysAgo(33),
    },
  });

  // Warranty for SO1 (active, expires in ~57 days)
  await prisma.warranty.create({
    data: {
      serviceOrderId: so1.id,
      startsAt: daysAgo(33),
      expiresAt: daysFromNow(57),
      status: "ACTIVE",
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // OS 2 — Supermercado Família — SERVICE_SCHEDULED (grande cliente)
  const so2 = await prisma.serviceOrder.create({
    data: {
      customerId: c2.id,
      status: "SERVICE_SCHEDULED",
      serviceType: "TREATMENT",
      isFree: false,
      technicianId: tec1.id,
      managerId: manager.id,
      pestTypes: ["cockroach", "rat", "fly"],
      scheduledAt: daysFromNow(3),
      notes: "Tratamento geral do supermercado. Acesso somente após as 22h. Área de hortifruti prioritária.",
      createdAt: daysAgo(15),
    },
  });

  const q2 = await prisma.quote.create({
    data: {
      serviceOrderId: so2.id,
      status: "APPROVED",
      totalAmount: 3200.0,
      validUntil: daysFromNow(15),
      approvedAt: daysAgo(5),
      approvedById: manager.id,
      createdAt: daysAgo(10),
      items: {
        create: [
          { description: "Desinsetização completa (1200m²)", quantity: 1, unitPrice: 1800 },
          { description: "Desratização externa e interna", quantity: 1, unitPrice: 900 },
          { description: "Monitoramento 6 meses", quantity: 6, unitPrice: 83.33 },
        ],
      },
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // OS 3 — Maria Aparecida Santos — INSPECTION_SCHEDULED
  const so3 = await prisma.serviceOrder.create({
    data: {
      customerId: c3.id,
      status: "INSPECTION_SCHEDULED",
      serviceType: "INSPECTION",
      isFree: true,
      technicianId: tec2.id,
      managerId: manager.id,
      pestTypes: ["ant", "termite"],
      scheduledAt: daysFromNow(2),
      notes: "Inspeção gratuita. Cliente relatou formigas na cozinha e cupins no rodapé do quarto.",
      createdAt: daysAgo(3),
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // OS 4 — Carlos Eduardo Rodrigues — QUOTE_CREATED (aguardando aprovação)
  const so4 = await prisma.serviceOrder.create({
    data: {
      customerId: c4.id,
      status: "QUOTE_CREATED",
      serviceType: "TREATMENT",
      isFree: false,
      technicianId: tec2.id,
      managerId: manager.id,
      pestTypes: ["cockroach"],
      scheduledAt: daysAgo(8),
      executedAt: null,
      notes: "Visita de inspeção realizada. Orçamento enviado aguardando retorno.",
      createdAt: daysAgo(12),
    },
  });

  const q4 = await prisma.quote.create({
    data: {
      serviceOrderId: so4.id,
      status: "SENT",
      totalAmount: 420.0,
      validUntil: daysFromNow(7),
      createdAt: daysAgo(7),
      items: {
        create: [
          { description: "Desinsetização residência (150m²)", quantity: 1, unitPrice: 350 },
          { description: "Retorno de verificação (30 dias)", quantity: 1, unitPrice: 70 },
        ],
      },
    },
  });

  // Occurrence — visita foi reagendada
  await prisma.occurrence.create({
    data: {
      serviceOrderId: so4.id,
      type: "RESCHEDULED",
      reason: "Cliente solicitou reagendamento da visita de inspeção por compromisso de trabalho.",
      recordedById: manager.id,
      recordedAt: daysAgo(10),
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // OS 5 — Ana Paula Ferreira — LEAD_CAPTURED (novo lead)
  const so5 = await prisma.serviceOrder.create({
    data: {
      customerId: c5.id,
      status: "LEAD_CAPTURED",
      serviceType: "INSPECTION",
      isFree: true,
      managerId: manager.id,
      pestTypes: ["rat"],
      notes: "Lead recebido pelo portal. Urgência com ratos no telhado. Aguardando agendamento.",
      createdAt: daysAgo(1),
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // OS 6 — Pedro Henrique Costa — VISIT_DONE
  const so6 = await prisma.serviceOrder.create({
    data: {
      customerId: c6.id,
      status: "VISIT_DONE",
      serviceType: "INSPECTION",
      isFree: true,
      technicianId: tec1.id,
      managerId: manager.id,
      pestTypes: ["cockroach", "ant"],
      scheduledAt: daysAgo(5),
      executedAt: daysAgo(5),
      notes: "Inspeção concluída. Encontradas baratas nas paredes da cozinha. Aguardando elaboração de orçamento.",
      createdAt: daysAgo(7),
    },
  });

  const tv6 = await prisma.technicalVisit.create({
    data: {
      serviceOrderId: so6.id,
      technicianId: tec1.id,
      scheduledAt: daysAgo(5),
      checkInAt: daysAgo(5),
      checkOutAt: daysAgo(5),
      notes: "Inspeção realizada em toda a unidade. Identificados focos nas paredes hidráulicas.",
      applicationPoints: {
        create: [],
      },
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // OS 7 — Escola Municipal — CLOSED (contrato encerrado)
  const so7 = await prisma.serviceOrder.create({
    data: {
      customerId: c7.id,
      status: "CLOSED",
      serviceType: "TREATMENT",
      isFree: false,
      technicianId: tec2.id,
      managerId: manager.id,
      pestTypes: ["cockroach", "rat", "ant"],
      scheduledAt: daysAgo(200),
      executedAt: daysAgo(198),
      closedAt: daysAgo(100),
      notes: "Tratamento realizado no período de férias escolares. Laudo entregue para a secretaria de saúde.",
      createdAt: daysAgo(210),
    },
  });

  const q7 = await prisma.quote.create({
    data: {
      serviceOrderId: so7.id,
      status: "APPROVED",
      totalAmount: 5800.0,
      validUntil: daysAgo(180),
      approvedAt: daysAgo(205),
      approvedById: admin.id,
      createdAt: daysAgo(207),
      items: {
        create: [
          { description: "Desinsetização escolar completa (2500m²)", quantity: 1, unitPrice: 3500 },
          { description: "Desratização - perímetro externo e interno", quantity: 1, unitPrice: 1800 },
          { description: "ART e laudo sanitário", quantity: 1, unitPrice: 500 },
        ],
      },
    },
  });

  await prisma.certificate.create({
    data: {
      serviceOrderId: so7.id,
      technicalResponsible: "Eng. Biólogo Ricardo Nunes",
      licenseNumber: "CRBIO-12345/01-D",
      pestsTargeted: ["Blattodea", "Rodentia", "Hymenoptera"],
      productsUsed: ["Deltametrina 2,5% EC - Reg. MAPA 034567", "Raticida Brodifacum - Reg. MAPA 045678"],
      applicationAreas: ["Refeitório", "Cozinha", "Corredores", "Banheiros", "Pátio externo"],
      observations: "Tratamento realizado em conformidade com a RDC 52/2009. Todos os produtos registrados no MAPA.",
      issuedAt: daysAgo(196),
    },
  });

  await prisma.warranty.create({
    data: {
      serviceOrderId: so7.id,
      startsAt: daysAgo(198),
      expiresAt: daysAgo(108),
      status: "EXPIRED",
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // OS 8 — Hotel Estrela do Sul — CERTIFICATE_ISSUED
  const so8 = await prisma.serviceOrder.create({
    data: {
      customerId: c8.id,
      status: "CERTIFICATE_ISSUED",
      serviceType: "TREATMENT",
      isFree: false,
      technicianId: tec1.id,
      managerId: manager.id,
      pestTypes: ["cockroach", "rat"],
      scheduledAt: daysAgo(10),
      executedAt: daysAgo(8),
      notes: "Tratamento noturno. Acesso após 23h. Coordenado com a gerência do hotel.",
      createdAt: daysAgo(20),
    },
  });

  const q8 = await prisma.quote.create({
    data: {
      serviceOrderId: so8.id,
      status: "APPROVED",
      totalAmount: 4200.0,
      approvedAt: daysAgo(15),
      approvedById: manager.id,
      createdAt: daysAgo(18),
      items: {
        create: [
          { description: "Desinsetização hotel (3000m²)", quantity: 1, unitPrice: 2800 },
          { description: "Desratização área externa e subsolo", quantity: 1, unitPrice: 1100 },
          { description: "Relatório técnico para vigilância sanitária", quantity: 1, unitPrice: 300 },
        ],
      },
    },
  });

  const tv8 = await prisma.technicalVisit.create({
    data: {
      serviceOrderId: so8.id,
      technicianId: tec1.id,
      scheduledAt: daysAgo(10),
      checkInAt: daysAgo(10),
      checkOutAt: daysAgo(10),
      customerSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      notes: "Tratamento concluído. 42 quartos tratados. Áreas comuns e cozinha tratadas.",
      applicationPoints: {
        create: [
          { location: "Cozinha profissional - Todas as áreas", productName: "Cipermetrina 20% EC", doseApplied: 500, unit: "ML" },
          { location: "Subsolo - Depósito de alimentos", productName: "Fipronil 0,3% SC", doseApplied: 200, unit: "ML" },
          { location: "Área externa - 8 pontos de isca", productName: "Raticida Brodifacum 0,005%", doseApplied: 400, unit: "G" },
        ],
      },
    },
  });

  await prisma.certificate.create({
    data: {
      serviceOrderId: so8.id,
      technicalResponsible: "Eng. Biólogo Ricardo Nunes",
      licenseNumber: "CRBIO-12345/01-D",
      pestsTargeted: ["Blattodea", "Rattus norvegicus"],
      productsUsed: ["Cipermetrina 20% EC - Reg. MAPA 012345", "Fipronil 0,3% SC - Reg. MAPA 067890"],
      applicationAreas: ["Cozinha", "Subsolo", "Áreas comuns", "Área externa"],
      observations: "Tratamento de desinsetização e desratização. Produto de baixa toxicidade. Autorizado pela Vigilância Sanitária.",
      issuedAt: daysAgo(8),
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // OS 9 — Fernanda Lima Nascimento — QUOTE_APPROVED (aguardando agendamento)
  const so9 = await prisma.serviceOrder.create({
    data: {
      customerId: c9.id,
      status: "QUOTE_APPROVED",
      serviceType: "TREATMENT",
      isFree: false,
      managerId: manager.id,
      pestTypes: ["termite"],
      notes: "Cupins no madeiramento. Cliente aprovou orçamento. Aguardar agendamento com técnico.",
      createdAt: daysAgo(6),
    },
  });

  await prisma.quote.create({
    data: {
      serviceOrderId: so9.id,
      status: "APPROVED",
      totalAmount: 1100.0,
      validUntil: daysFromNow(20),
      approvedAt: daysAgo(2),
      approvedById: manager.id,
      createdAt: daysAgo(5),
      items: {
        create: [
          { description: "Tratamento anti-cupim madeiramento (200m²)", quantity: 1, unitPrice: 900 },
          { description: "Garantia 1 ano com retorno", quantity: 1, unitPrice: 200 },
        ],
      },
    },
  });

  // Occurrence — cliente não estava disponível na primeira tentativa
  await prisma.occurrence.create({
    data: {
      serviceOrderId: so9.id,
      type: "CUSTOMER_UNAVAILABLE",
      reason: "Cliente não estava em casa no horário combinado (14h). Reagendado para semana seguinte.",
      recordedById: tec2.id,
      recordedAt: daysAgo(4),
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // OS 10 — Clínica Médica — CANCELED
  const so10 = await prisma.serviceOrder.create({
    data: {
      customerId: c10.id,
      status: "CANCELED",
      serviceType: "INSPECTION",
      isFree: true,
      technicianId: tec2.id,
      managerId: manager.id,
      pestTypes: ["cockroach"],
      scheduledAt: daysAgo(25),
      notes: "Cancelado pelo cliente. Reformas em andamento na clínica.",
      createdAt: daysAgo(30),
    },
  });

  await prisma.occurrence.create({
    data: {
      serviceOrderId: so10.id,
      type: "CANCELED",
      reason: "Cliente cancelou por conta de obras de reforma na clínica. Retornar contato em 60 dias.",
      recordedById: manager.id,
      recordedAt: daysAgo(25),
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // OS 11 — Restaurante Sabor Certo — RETURN durante garantia (nova OS na mesma garantia)
  const so11 = await prisma.serviceOrder.create({
    data: {
      customerId: c1.id,
      status: "INSPECTION_SCHEDULED",
      serviceType: "RETURN",
      isFree: true,
      technicianId: tec1.id,
      managerId: manager.id,
      pestTypes: ["cockroach"],
      scheduledAt: daysFromNow(5),
      notes: "Retorno de garantia. Cliente relatou aparecimento de baratas próximo ao forno. Dentro do prazo de 90 dias.",
      createdAt: daysAgo(2),
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // OS 12 — Hotel Estrela do Sul — WARRANTY_ACTIVE (vencendo em 25 dias)
  const so12 = await prisma.serviceOrder.create({
    data: {
      customerId: c8.id,
      status: "WARRANTY_ACTIVE",
      serviceType: "TREATMENT",
      isFree: false,
      technicianId: tec2.id,
      managerId: manager.id,
      pestTypes: ["cockroach"],
      scheduledAt: daysAgo(66),
      executedAt: daysAgo(64),
      notes: "Tratamento anterior — garantia vencendo em breve.",
      createdAt: daysAgo(70),
    },
  });

  // Certificate for SO12
  await prisma.certificate.create({
    data: {
      serviceOrderId: so12.id,
      technicalResponsible: "Eng. Biólogo Ricardo Nunes",
      licenseNumber: "CRBIO-12345/01-D",
      pestsTargeted: ["Blattodea"],
      productsUsed: ["Gel Indoxacarbe - Reg. MAPA 098765"],
      applicationAreas: ["Cozinha", "Bar", "Almoxarifado"],
      issuedAt: daysAgo(64),
    },
  });

  // Warranty expiring in 25 days
  await prisma.warranty.create({
    data: {
      serviceOrderId: so12.id,
      startsAt: daysAgo(64),
      expiresAt: daysFromNow(25),
      alertSentAt45: daysAgo(19),
      status: "ACTIVE",
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // OS 13 — Supermercado Família — WARRANTY_ACTIVE (garantia vencendo em 8 dias — crítica)
  const so13 = await prisma.serviceOrder.create({
    data: {
      customerId: c2.id,
      status: "WARRANTY_ACTIVE",
      serviceType: "TREATMENT",
      isFree: false,
      technicianId: tec1.id,
      managerId: manager.id,
      pestTypes: ["rat", "cockroach"],
      scheduledAt: daysAgo(82),
      executedAt: daysAgo(80),
      notes: "Primeiro ciclo do contrato semestral.",
      createdAt: daysAgo(90),
    },
  });

  await prisma.certificate.create({
    data: {
      serviceOrderId: so13.id,
      technicalResponsible: "Eng. Biólogo Ricardo Nunes",
      licenseNumber: "CRBIO-12345/01-D",
      pestsTargeted: ["Rodentia", "Blattodea"],
      productsUsed: ["Deltametrina 2,5% EC - Reg. MAPA 034567", "Raticida Brodifacum - Reg. MAPA 045678"],
      applicationAreas: ["Toda a loja", "Depósito", "Câmara fria", "Área externa"],
      issuedAt: daysAgo(80),
    },
  });

  await prisma.warranty.create({
    data: {
      serviceOrderId: so13.id,
      startsAt: daysAgo(80),
      expiresAt: daysFromNow(8),
      alertSentAt45: daysAgo(35),
      alertSentAt30: daysAgo(20),
      status: "ACTIVE",
    },
  });

  console.log("✓ Ordens de serviço criadas (13)");

  // ── RECURRING CONTRACTS ────────────────────────────────────────────────────

  await prisma.recurringContract.create({
    data: {
      customerId: c2.id,
      intervalDays: 180,
      nextOrderDate: daysFromNow(95),
      serviceType: "TREATMENT",
      active: true,
      notes: "Contrato semestral Supermercado Família. Renovação automática.",
    },
  });

  await prisma.recurringContract.create({
    data: {
      customerId: c8.id,
      intervalDays: 30,
      nextOrderDate: daysFromNow(30),
      serviceType: "TREATMENT",
      active: true,
      notes: "Contrato mensal Hotel Estrela do Sul.",
    },
  });

  console.log("✓ Contratos recorrentes criados (2)");

  // ── STOCK MOVEMENTS ────────────────────────────────────────────────────────

  await prisma.stockMovement.createMany({
    data: [
      {
        stockItemId: cipermMetrina.id,
        serviceOrderId: so1.id,
        visitId: tv1.id,
        applicationPoint: "Cozinha e depósito",
        delta: -200,
        reason: "Aplicação OS " + so1.id.slice(0, 8),
        performedById: tec1.id,
        performedAt: daysAgo(33),
      },
      {
        stockItemId: fipronil.id,
        serviceOrderId: so1.id,
        visitId: tv1.id,
        applicationPoint: "Depósito",
        delta: -150,
        reason: "Aplicação OS " + so1.id.slice(0, 8),
        performedById: tec1.id,
        performedAt: daysAgo(33),
      },
      {
        stockItemId: brodifacum.id,
        serviceOrderId: so1.id,
        visitId: tv1.id,
        applicationPoint: "Bueiros externos",
        delta: -200,
        reason: "Aplicação OS " + so1.id.slice(0, 8),
        performedById: tec1.id,
        performedAt: daysAgo(33),
      },
      {
        stockItemId: cipermMetrina.id,
        serviceOrderId: so8.id,
        visitId: tv8.id,
        applicationPoint: "Cozinha hotel",
        delta: -500,
        reason: "Aplicação Hotel Estrela",
        performedById: tec1.id,
        performedAt: daysAgo(8),
      },
      {
        stockItemId: fipronil.id,
        serviceOrderId: so8.id,
        visitId: tv8.id,
        applicationPoint: "Subsolo",
        delta: -200,
        reason: "Aplicação Hotel Estrela",
        performedById: tec1.id,
        performedAt: daysAgo(8),
      },
      {
        stockItemId: fipronil.id,
        delta: 500,
        reason: "Compra de reposição — NF 7821",
        performedById: admin.id,
        performedAt: daysAgo(20),
      },
    ],
  });

  console.log("✓ Movimentações de estoque criadas");

  // ── AUDIT LOGS ─────────────────────────────────────────────────────────────

  await prisma.auditLog.createMany({
    data: [
      {
        entityName: "ServiceOrder",
        entityId: so1.id,
        userId: manager.id,
        field: "status",
        oldValue: "LEAD_CAPTURED",
        newValue: "INSPECTION_SCHEDULED",
        timestamp: daysAgo(40),
        serviceOrderId: so1.id,
      },
      {
        entityName: "ServiceOrder",
        entityId: so1.id,
        userId: tec1.id,
        field: "status",
        oldValue: "INSPECTION_SCHEDULED",
        newValue: "VISIT_DONE",
        timestamp: daysAgo(39),
        serviceOrderId: so1.id,
      },
      {
        entityName: "ServiceOrder",
        entityId: so1.id,
        userId: manager.id,
        field: "status",
        oldValue: "VISIT_DONE",
        newValue: "QUOTE_CREATED",
        timestamp: daysAgo(39),
        serviceOrderId: so1.id,
      },
      {
        entityName: "Quote",
        entityId: q1.id,
        userId: manager.id,
        field: "status",
        oldValue: "DRAFT",
        newValue: "APPROVED",
        timestamp: daysAgo(38),
        serviceOrderId: so1.id,
      },
      {
        entityName: "ServiceOrder",
        entityId: so1.id,
        userId: manager.id,
        field: "status",
        oldValue: "QUOTE_APPROVED",
        newValue: "SERVICE_SCHEDULED",
        timestamp: daysAgo(38),
        serviceOrderId: so1.id,
      },
      {
        entityName: "ServiceOrder",
        entityId: so1.id,
        userId: tec1.id,
        field: "status",
        oldValue: "SERVICE_SCHEDULED",
        newValue: "SERVICE_EXECUTED",
        timestamp: daysAgo(33),
        serviceOrderId: so1.id,
      },
      {
        entityName: "ServiceOrder",
        entityId: so1.id,
        userId: admin.id,
        field: "status",
        oldValue: "SERVICE_EXECUTED",
        newValue: "CERTIFICATE_ISSUED",
        timestamp: daysAgo(33),
        serviceOrderId: so1.id,
      },
      {
        entityName: "ServiceOrder",
        entityId: so1.id,
        userId: admin.id,
        field: "status",
        oldValue: "CERTIFICATE_ISSUED",
        newValue: "WARRANTY_ACTIVE",
        timestamp: daysAgo(33),
        serviceOrderId: so1.id,
      },
      {
        entityName: "ServiceOrder",
        entityId: so2.id,
        userId: manager.id,
        field: "status",
        oldValue: "QUOTE_APPROVED",
        newValue: "SERVICE_SCHEDULED",
        timestamp: daysAgo(5),
        serviceOrderId: so2.id,
      },
      {
        entityName: "ServiceOrder",
        entityId: so4.id,
        userId: manager.id,
        field: "status",
        oldValue: "INSPECTION_SCHEDULED",
        newValue: "VISIT_DONE",
        timestamp: daysAgo(8),
        serviceOrderId: so4.id,
      },
      {
        entityName: "ServiceOrder",
        entityId: so4.id,
        userId: manager.id,
        field: "status",
        oldValue: "VISIT_DONE",
        newValue: "QUOTE_CREATED",
        timestamp: daysAgo(7),
        serviceOrderId: so4.id,
      },
      {
        entityName: "ServiceOrder",
        entityId: so10.id,
        userId: manager.id,
        field: "status",
        oldValue: "INSPECTION_SCHEDULED",
        newValue: "CANCELED",
        timestamp: daysAgo(25),
        serviceOrderId: so10.id,
      },
      {
        entityName: "Customer",
        entityId: c1.id,
        userId: manager.id,
        field: "notes",
        oldValue: null,
        newValue: "Cliente recorrente. Preferência por visitas às terças-feiras pela manhã.",
        timestamp: daysAgo(45),
      },
      {
        entityName: "StockItem",
        entityId: cipermMetrina.id,
        userId: admin.id,
        field: "quantity",
        oldValue: "4900",
        newValue: "4200",
        timestamp: daysAgo(8),
      },
      {
        entityName: "User",
        entityId: tec2.id,
        userId: admin.id,
        field: "active",
        oldValue: "false",
        newValue: "true",
        timestamp: daysAgo(60),
      },
    ],
  });

  console.log("✓ Logs de auditoria criados (15 entradas)");

  // ── SUMMARY ────────────────────────────────────────────────────────────────
  console.log("\n🎉 Seed de demonstração concluído com sucesso!");
  console.log("\n📊 Resumo dos dados inseridos:");
  console.log("   • 4 usuários (1 admin, 1 gerente, 2 técnicos)");
  console.log("   • 10 clientes (pessoas físicas e jurídicas)");
  console.log("   • 13 ordens de serviço (todos os estados do ciclo)");
  console.log("   • 9 itens de estoque (normal, baixo, vencido)");
  console.log("   • Cotações, certificados, garantias, ocorrências");
  console.log("   • Movimentações de estoque");
  console.log("   • 15 entradas de log de auditoria");
  console.log("   • 2 contratos recorrentes");
  console.log("\n🔑 Acesso:");
  console.log("   Admin:   admin@detetizacao.com / senha123");
  console.log("   Gerente: gerente@detetizacao.com / senha123");
  console.log("   Técnico: tecnico@detetizacao.com / senha123");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
