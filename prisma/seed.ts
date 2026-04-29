/**
 * Seed completo com dados fake realistas para demonstração ao cliente.
 * Run: npm run db:seed
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Util — pega elemento aleatório
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};
const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

async function main() {
  console.log("Limpando dados antigos...");
  // Ordem importa por causa de FKs
  await prisma.auditLog.deleteMany();
  await prisma.applicationPoint.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.stockBatch.deleteMany();
  await prisma.technicalVisit.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.warranty.deleteMany();
  await prisma.occurrence.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.recurringContract.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.stockItem.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.pestType.deleteMany();
  await prisma.applicationArea.deleteMany();
  await prisma.user.deleteMany();

  console.log("Criando usuários...");
  const password = await bcrypt.hash("senha1234", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Lucas Administrador",
      email: "admin@detetizacao.com",
      passwordHash: password,
      role: "ADMIN",
      phone: "11999990000",
    },
  });

  const manager1 = await prisma.user.create({
    data: {
      name: "Carla Gerente",
      email: "gerente@detetizacao.com",
      passwordHash: password,
      role: "MANAGER",
      phone: "11988880000",
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      name: "Roberto Comercial",
      email: "comercial@detetizacao.com",
      passwordHash: password,
      role: "MANAGER",
      phone: "11988881111",
    },
  });

  const tech1 = await prisma.user.create({
    data: {
      name: "João Silva",
      email: "joao@detetizacao.com",
      passwordHash: password,
      role: "TECHNICIAN",
      phone: "11977770001",
    },
  });

  const tech2 = await prisma.user.create({
    data: {
      name: "Pedro Santos",
      email: "pedro@detetizacao.com",
      passwordHash: password,
      role: "TECHNICIAN",
      phone: "11977770002",
    },
  });

  const tech3 = await prisma.user.create({
    data: {
      name: "Marcos Almeida",
      email: "marcos@detetizacao.com",
      passwordHash: password,
      role: "TECHNICIAN",
      phone: "11977770003",
    },
  });

  const technicians = [tech1, tech2, tech3];
  const managers = [manager1, manager2];

  console.log("Criando catálogo de pragas...");
  const pestNames = [
    { name: "Baratas", category: "barata" },
    { name: "Ratos e Camundongos", category: "rato" },
    { name: "Cupins de madeira seca", category: "cupim" },
    { name: "Cupins subterrâneos", category: "cupim" },
    { name: "Formigas", category: "formiga" },
    { name: "Pulgas", category: "pulga" },
    { name: "Carrapatos", category: "carrapato" },
    { name: "Mosquitos", category: "mosquito" },
    { name: "Aranhas", category: "aranha" },
    { name: "Escorpiões", category: "escorpiao" },
    { name: "Pombos e aves", category: "ave" },
    { name: "Morcegos", category: "morcego" },
    { name: "Percevejos", category: "percevejo" },
    { name: "Traças", category: "traca" },
    { name: "Lacraias", category: "lacraia" },
  ];
  for (const p of pestNames) {
    await prisma.pestType.create({ data: p });
  }

  console.log("Criando catálogo de áreas de aplicação...");
  const areaNames = [
    "Cozinha",
    "Banheiros",
    "Áreas externas",
    "Jardim",
    "Sótão / forro",
    "Garagem",
    "Depósito",
    "Quintal",
    "Caixa d'água",
    "Telhado",
    "Salão / sala",
    "Quartos",
    "Ralos e tubulações",
    "Lixeira",
  ];
  for (const name of areaNames) {
    await prisma.applicationArea.create({ data: { name } });
  }

  console.log("Criando clientes...");
  const customersData = [
    {
      type: "COMPANY" as const,
      fullName: "Restaurante Sabor Brasileiro Ltda",
      cpfCnpj: "12345678000195",
      street: "Rua das Flores",
      number: "123",
      city: "São Paulo",
      state: "SP",
      zip: "01310100",
      phone: "11912345678",
      email: "contato@saborbrasileiro.com.br",
      propertyType: "COMMERCIAL" as const,
      siteSizeM2: 250,
      leadSource: "WHATSAPP" as const,
      hadServiceBefore: true,
      lastServiceDate: daysAgo(180),
      notes: "Cliente recorrente. Visitas preferencialmente às terças.",
    },
    {
      type: "PERSON" as const,
      fullName: "Maria Aparecida Souza",
      cpfCnpj: "98765432100",
      street: "Av. Paulista",
      number: "1500",
      complement: "Apto 1203",
      city: "São Paulo",
      state: "SP",
      zip: "01310200",
      phone: "11987651234",
      email: "maria.souza@email.com",
      propertyType: "RESIDENTIAL" as const,
      siteSizeM2: 90,
      leadSource: "REFERRAL" as const,
      hadServiceBefore: false,
    },
    {
      type: "COMPANY" as const,
      fullName: "Padaria Pão Quente ME",
      cpfCnpj: "23456789000123",
      street: "Rua do Comércio",
      number: "456",
      city: "São Paulo",
      state: "SP",
      zip: "02310300",
      phone: "11923456789",
      email: "padaria@paoquente.com.br",
      propertyType: "COMMERCIAL" as const,
      siteSizeM2: 120,
      leadSource: "PHONE" as const,
      hadServiceBefore: true,
      lastServiceDate: daysAgo(95),
    },
    {
      type: "COMPANY" as const,
      fullName: "Hotel Boa Vista Resort SA",
      cpfCnpj: "34567890000156",
      street: "Estrada do Mar",
      number: "5000",
      city: "Guarujá",
      state: "SP",
      zip: "11440000",
      phone: "13934567890",
      email: "manutencao@hotelboavista.com.br",
      propertyType: "COMMERCIAL" as const,
      siteSizeM2: 3500,
      leadSource: "PORTAL" as const,
      hadServiceBefore: true,
      lastServiceDate: daysAgo(60),
      notes: "Contrato anual de manutenção preventiva.",
    },
    {
      type: "PERSON" as const,
      fullName: "Carlos Eduardo Pereira",
      cpfCnpj: "11122233344",
      street: "Rua Tucuruvi",
      number: "789",
      city: "São Paulo",
      state: "SP",
      zip: "02304100",
      phone: "11955667788",
      email: "carlos.pereira@email.com",
      propertyType: "RESIDENTIAL" as const,
      siteSizeM2: 180,
      leadSource: "DOOR_TO_DOOR" as const,
      hadServiceBefore: false,
    },
    {
      type: "COMPANY" as const,
      fullName: "Mercado Bom Preço Ltda",
      cpfCnpj: "45678901000178",
      street: "Av. Brasil",
      number: "2000",
      city: "Santo André",
      state: "SP",
      zip: "09100000",
      phone: "11944556677",
      email: "compras@mercadobompreco.com.br",
      propertyType: "COMMERCIAL" as const,
      siteSizeM2: 800,
      leadSource: "WHATSAPP" as const,
      hadServiceBefore: true,
      lastServiceDate: daysAgo(30),
    },
    {
      type: "COMPANY" as const,
      fullName: "Indústria Metalúrgica Forte SA",
      cpfCnpj: "56789012000189",
      street: "Rua da Indústria",
      number: "100",
      city: "Diadema",
      state: "SP",
      zip: "09900000",
      phone: "11933445566",
      email: "facilities@metalurgicaforte.com.br",
      propertyType: "INDUSTRIAL" as const,
      siteSizeM2: 5000,
      leadSource: "REFERRAL" as const,
      hadServiceBefore: true,
      lastServiceDate: daysAgo(45),
      notes: "Acesso restrito às áreas de produção.",
    },
    {
      type: "PERSON" as const,
      fullName: "Ana Beatriz Oliveira",
      cpfCnpj: "55566677788",
      street: "Rua das Acácias",
      number: "234",
      city: "São Paulo",
      state: "SP",
      zip: "05451100",
      phone: "11966778899",
      email: "ana.oliveira@email.com",
      propertyType: "RESIDENTIAL" as const,
      siteSizeM2: 65,
      leadSource: "WHATSAPP" as const,
      hadServiceBefore: false,
    },
    {
      type: "COMPANY" as const,
      fullName: "Escola Aprender Mais",
      cpfCnpj: "67890123000110",
      street: "Rua dos Educadores",
      number: "500",
      city: "São Paulo",
      state: "SP",
      zip: "04567200",
      phone: "11922334455",
      email: "diretoria@aprendermais.edu.br",
      propertyType: "COMMERCIAL" as const,
      siteSizeM2: 1200,
      leadSource: "PORTAL" as const,
      hadServiceBefore: true,
      lastServiceDate: daysAgo(75),
      notes: "Visitas apenas após o horário escolar (após 19h).",
    },
    {
      type: "PERSON" as const,
      fullName: "Roberto Mendes da Silva",
      cpfCnpj: "99988877766",
      street: "Av. dos Bandeirantes",
      number: "3300",
      complement: "Cobertura",
      city: "São Paulo",
      state: "SP",
      zip: "04571010",
      phone: "11911223344",
      email: "rmendes@email.com",
      propertyType: "RESIDENTIAL" as const,
      siteSizeM2: 320,
      leadSource: "REFERRAL" as const,
      hadServiceBefore: true,
      lastServiceDate: daysAgo(120),
    },
    {
      type: "COMPANY" as const,
      fullName: "Sítio Recanto Verde",
      cpfCnpj: "78901234000111",
      street: "Estrada Rural KM 12",
      number: "S/N",
      city: "Cotia",
      state: "SP",
      zip: "06700000",
      phone: "11900112233",
      email: "sitio@recantoverde.com.br",
      propertyType: "RURAL" as const,
      siteSizeM2: 25000,
      leadSource: "PHONE" as const,
      hadServiceBefore: false,
      notes: "Aplicação semestral em pomar e áreas externas.",
    },
    {
      type: "COMPANY" as const,
      fullName: "Clínica Saúde Total",
      cpfCnpj: "89012345000122",
      street: "Rua dos Médicos",
      number: "75",
      city: "São Paulo",
      state: "SP",
      zip: "04101300",
      phone: "11944223311",
      email: "admin@saudetotal.com.br",
      propertyType: "COMMERCIAL" as const,
      siteSizeM2: 200,
      leadSource: "WHATSAPP" as const,
      hadServiceBefore: true,
      lastServiceDate: daysAgo(15),
    },
    {
      type: "PERSON" as const,
      fullName: "Patrícia Lima",
      cpfCnpj: "44455566677",
      street: "Rua do Sol",
      number: "12",
      city: "São Paulo",
      state: "SP",
      zip: "03178040",
      phone: "11977889900",
      email: "patricia.lima@email.com",
      propertyType: "RESIDENTIAL" as const,
      siteSizeM2: 75,
      leadSource: "DOOR_TO_DOOR" as const,
      hadServiceBefore: false,
    },
    {
      type: "COMPANY" as const,
      fullName: "Condomínio Edifício Imperial",
      cpfCnpj: "90123456000133",
      street: "Av. Rebouças",
      number: "1800",
      city: "São Paulo",
      state: "SP",
      zip: "05402000",
      phone: "11900998877",
      email: "sindico@imperial.com.br",
      propertyType: "RESIDENTIAL" as const,
      siteSizeM2: 1500,
      leadSource: "PORTAL" as const,
      hadServiceBefore: true,
      lastServiceDate: daysAgo(50),
      notes: "120 apartamentos. Áreas comuns + caixa d'água.",
    },
    {
      type: "COMPANY" as const,
      fullName: "Cafeteria Grão Especial",
      cpfCnpj: "01234567000144",
      street: "Rua Augusta",
      number: "2500",
      city: "São Paulo",
      state: "SP",
      zip: "01413100",
      phone: "11922446688",
      email: "contato@graoespecial.com.br",
      propertyType: "COMMERCIAL" as const,
      siteSizeM2: 80,
      leadSource: "REFERRAL" as const,
      hadServiceBefore: false,
    },
  ];

  const customers = [];
  for (const c of customersData) {
    customers.push(await prisma.customer.create({ data: c }));
  }

  console.log("Criando estoque + lotes...");
  const stockData = [
    {
      name: "Cipermetrina 20% EC",
      activeIngredient: "Cipermetrina",
      unit: "ML" as const,
      minThreshold: 500,
      unitCost: 0.18,
      supplier: "Nufarm",
      batches: [
        { qty: 5000, expiry: daysFromNow(420), cost: 0.18, supplier: "Nufarm", batchNum: "CIP-2026-001" },
        { qty: 2000, expiry: daysFromNow(180), cost: 0.20, supplier: "Nufarm", batchNum: "CIP-2025-008" },
      ],
    },
    {
      name: "Fipronil 0,3% SC",
      activeIngredient: "Fipronil",
      unit: "ML" as const,
      minThreshold: 300,
      unitCost: 0.45,
      supplier: "BASF",
      batches: [
        { qty: 3000, expiry: daysFromNow(550), cost: 0.45, supplier: "BASF", batchNum: "FIP-2026-014" },
      ],
    },
    {
      name: "Raticida Brodifacum (bloco)",
      activeIngredient: "Brodifacum",
      unit: "G" as const,
      minThreshold: 200,
      unitCost: 0.12,
      supplier: "Huvepharma",
      batches: [
        { qty: 1500, expiry: daysFromNow(25), cost: 0.12, supplier: "Huvepharma", batchNum: "RAT-2024-099" }, // VENCENDO em breve
        { qty: 800, expiry: daysFromNow(280), cost: 0.13, supplier: "Huvepharma", batchNum: "RAT-2025-015" },
      ],
    },
    {
      name: "Imidacloprido 70% WG",
      activeIngredient: "Imidacloprido",
      unit: "G" as const,
      minThreshold: 100,
      unitCost: 1.20,
      supplier: "Bayer",
      batches: [
        { qty: 500, expiry: daysFromNow(800), cost: 1.20, supplier: "Bayer", batchNum: "IMI-2027-002" },
      ],
    },
    {
      name: "Gel Anti-Barata (Maxforce)",
      activeIngredient: "Hidrametilnona",
      unit: "G" as const,
      minThreshold: 50,
      unitCost: 0.85,
      supplier: "Bayer",
      batches: [
        { qty: 400, expiry: daysFromNow(120), cost: 0.85, supplier: "Bayer", batchNum: "GEL-2025-033" },
        { qty: 200, expiry: daysFromNow(450), cost: 0.90, supplier: "Bayer", batchNum: "GEL-2026-007" },
      ],
    },
    {
      name: "Iscas Granuladas Formicida",
      activeIngredient: "Sulfluramida",
      unit: "KG" as const,
      minThreshold: 5,
      unitCost: 28.0,
      supplier: "Atta Kill",
      batches: [
        { qty: 30, expiry: daysFromNow(600), cost: 28.0, supplier: "Atta Kill", batchNum: "FOR-2026-011" },
      ],
    },
    {
      name: "Máscara PFF2 (caixa 50un)",
      activeIngredient: null,
      unit: "UNIT" as const,
      minThreshold: 20,
      unitCost: 2.5,
      supplier: "3M",
      batches: [
        { qty: 80, expiry: null, cost: 2.5, supplier: "3M", batchNum: null },
      ],
    },
    {
      name: "Luvas de proteção nitrílica",
      activeIngredient: null,
      unit: "UNIT" as const,
      minThreshold: 30,
      unitCost: 1.20,
      supplier: "Volk",
      batches: [
        { qty: 150, expiry: null, cost: 1.20, supplier: "Volk", batchNum: null },
      ],
    },
    {
      name: "Detergente neutro (limpeza pós-aplicação)",
      activeIngredient: null,
      unit: "L" as const,
      minThreshold: 5,
      unitCost: 8.0,
      supplier: "Ypê",
      batches: [
        { qty: 25, expiry: daysFromNow(900), cost: 8.0, supplier: "Ypê", batchNum: "DET-2027-001" },
      ],
    },
    {
      name: "Deltametrina 2,5% SC",
      activeIngredient: "Deltametrina",
      unit: "ML" as const,
      minThreshold: 400,
      unitCost: 0.32,
      supplier: "Bayer",
      batches: [
        { qty: 800, expiry: daysAgo(15), cost: 0.32, supplier: "Bayer", batchNum: "DEL-2024-OLD" }, // VENCIDO!
        { qty: 2500, expiry: daysFromNow(310), cost: 0.32, supplier: "Bayer", batchNum: "DEL-2025-022" },
      ],
    },
  ];

  const stockItems = [];
  for (const s of stockData) {
    const totalQty = s.batches.reduce((acc, b) => acc + b.qty, 0);
    const item = await prisma.stockItem.create({
      data: {
        name: s.name,
        activeIngredient: s.activeIngredient,
        unit: s.unit,
        quantity: totalQty,
        minThreshold: s.minThreshold,
        unitCost: s.unitCost,
        supplier: s.supplier,
        expiryDate: null,
      },
    });
    for (const b of s.batches) {
      const isExpired = b.expiry && b.expiry < new Date();
      await prisma.stockBatch.create({
        data: {
          stockItemId: item.id,
          batchNumber: b.batchNum,
          initialQuantity: b.qty,
          quantity: b.qty,
          expiryDate: b.expiry,
          unitCost: b.cost,
          supplier: b.supplier,
          status: isExpired ? "QUARANTINE" : "ACTIVE",
        },
      });
      // Movimento de entrada
      await prisma.stockMovement.create({
        data: {
          stockItemId: item.id,
          delta: b.qty,
          unitCostSnapshot: b.cost,
          reason: "Compra inicial",
          performedById: admin.id,
          performedAt: daysAgo(randInt(5, 60)),
        },
      });
    }
    stockItems.push(item);
  }

  console.log("Criando ordens de serviço...");
  const ordersConfigs = [
    // OS Recentes pagas (geram receita)
    { customerIdx: 0, status: "CLOSED", paymentStatus: "PAID", price: 850, cost: 120, daysAgoCreated: 30, daysAgoPaid: 25, serviceType: "TREATMENT", pestTypes: ["Baratas", "Ratos e Camundongos"], technicianIdx: 0, isFree: false },
    { customerIdx: 1, status: "WARRANTY_ACTIVE", paymentStatus: "PAID", price: 320, cost: 35, daysAgoCreated: 20, daysAgoPaid: 18, serviceType: "TREATMENT", pestTypes: ["Baratas"], technicianIdx: 1, isFree: false },
    { customerIdx: 2, status: "CLOSED", paymentStatus: "PAID", price: 580, cost: 90, daysAgoCreated: 45, daysAgoPaid: 40, serviceType: "TREATMENT", pestTypes: ["Ratos e Camundongos", "Baratas"], technicianIdx: 0, isFree: false },
    { customerIdx: 3, status: "CERTIFICATE_ISSUED", paymentStatus: "PAID", price: 4500, cost: 680, daysAgoCreated: 12, daysAgoPaid: 10, serviceType: "TREATMENT", pestTypes: ["Baratas", "Ratos e Camundongos", "Mosquitos"], technicianIdx: 2, isFree: false },
    { customerIdx: 5, status: "CLOSED", paymentStatus: "PAID", price: 1200, cost: 180, daysAgoCreated: 28, daysAgoPaid: 22, serviceType: "TREATMENT", pestTypes: ["Baratas", "Formigas"], technicianIdx: 1, isFree: false },
    { customerIdx: 6, status: "WARRANTY_ACTIVE", paymentStatus: "PAID", price: 6800, cost: 950, daysAgoCreated: 40, daysAgoPaid: 35, serviceType: "TREATMENT", pestTypes: ["Ratos e Camundongos", "Cupins subterrâneos"], technicianIdx: 2, isFree: false },
    { customerIdx: 8, status: "CLOSED", paymentStatus: "PAID", price: 1800, cost: 280, daysAgoCreated: 70, daysAgoPaid: 65, serviceType: "TREATMENT", pestTypes: ["Baratas", "Formigas"], technicianIdx: 0, isFree: false },
    { customerIdx: 11, status: "CERTIFICATE_ISSUED", paymentStatus: "PAID", price: 380, cost: 45, daysAgoCreated: 14, daysAgoPaid: 10, serviceType: "TREATMENT", pestTypes: ["Pulgas"], technicianIdx: 1, isFree: false },
    { customerIdx: 13, status: "WARRANTY_ACTIVE", paymentStatus: "PAID", price: 2400, cost: 320, daysAgoCreated: 47, daysAgoPaid: 42, serviceType: "TREATMENT", pestTypes: ["Baratas", "Ratos e Camundongos"], technicianIdx: 2, isFree: false },
    { customerIdx: 0, status: "CLOSED", paymentStatus: "PAID", price: 850, cost: 110, daysAgoCreated: 90, daysAgoPaid: 85, serviceType: "TREATMENT", pestTypes: ["Baratas"], technicianIdx: 0, isFree: false },

    // OS pendentes (a receber)
    { customerIdx: 9, status: "SERVICE_EXECUTED", paymentStatus: "PENDING", price: 950, cost: 130, daysAgoCreated: 7, serviceType: "TREATMENT", pestTypes: ["Cupins de madeira seca"], technicianIdx: 0, isFree: false },
    { customerIdx: 12, status: "SERVICE_EXECUTED", paymentStatus: "PENDING", price: 480, cost: 60, daysAgoCreated: 5, serviceType: "TREATMENT", pestTypes: ["Baratas"], technicianIdx: 1, isFree: false },

    // OS em atraso
    { customerIdx: 4, status: "SERVICE_EXECUTED", paymentStatus: "OVERDUE", price: 670, cost: 95, daysAgoCreated: 60, serviceType: "TREATMENT", pestTypes: ["Aranhas", "Escorpiões"], technicianIdx: 2, isFree: false },

    // OS em andamento (kanban diversificado)
    { customerIdx: 7, status: "LEAD_CAPTURED", paymentStatus: "PENDING", price: null, cost: null, daysAgoCreated: 1, serviceType: "INSPECTION", pestTypes: ["Baratas"], technicianIdx: null, isFree: true },
    { customerIdx: 14, status: "INSPECTION_SCHEDULED", paymentStatus: "PENDING", price: null, cost: null, daysAgoCreated: 2, serviceType: "INSPECTION", pestTypes: ["Ratos e Camundongos"], technicianIdx: 0, isFree: true },
    { customerIdx: 10, status: "VISIT_DONE", paymentStatus: "PENDING", price: null, cost: null, daysAgoCreated: 3, serviceType: "INSPECTION", pestTypes: ["Cupins subterrâneos", "Formigas"], technicianIdx: 1, isFree: true },
    { customerIdx: 1, status: "QUOTE_CREATED", paymentStatus: "PENDING", price: 280, cost: null, daysAgoCreated: 4, serviceType: "TREATMENT", pestTypes: ["Pulgas"], technicianIdx: 1, isFree: false },
    { customerIdx: 5, status: "QUOTE_APPROVED", paymentStatus: "PENDING", price: 1500, cost: null, daysAgoCreated: 6, serviceType: "TREATMENT", pestTypes: ["Baratas", "Mosquitos"], technicianIdx: 2, isFree: false },
    { customerIdx: 13, status: "SERVICE_SCHEDULED", paymentStatus: "PENDING", price: 2100, cost: null, daysAgoCreated: 8, serviceType: "TREATMENT", pestTypes: ["Ratos e Camundongos", "Baratas"], technicianIdx: 0, isFree: false },

    // OS canceladas
    { customerIdx: 2, status: "CANCELED", paymentStatus: "PENDING", price: null, cost: null, daysAgoCreated: 35, serviceType: "TREATMENT", pestTypes: ["Baratas"], technicianIdx: null, isFree: false },
  ];

  const orders = [];
  for (const cfg of ordersConfigs) {
    const customer = customers[cfg.customerIdx];
    const technician = cfg.technicianIdx !== null ? technicians[cfg.technicianIdx] : null;
    const manager = pick(managers);
    const created = daysAgo(cfg.daysAgoCreated);

    const order = await prisma.serviceOrder.create({
      data: {
        customerId: customer.id,
        status: cfg.status as any,
        serviceType: cfg.serviceType as any,
        isFree: cfg.isFree,
        technicianId: technician?.id ?? null,
        managerId: manager.id,
        pestTypes: cfg.pestTypes,
        scheduledAt: cfg.status === "SERVICE_SCHEDULED" || cfg.status === "INSPECTION_SCHEDULED" ? daysFromNow(randInt(1, 7)) : null,
        executedAt: ["SERVICE_EXECUTED", "CERTIFICATE_ISSUED", "WARRANTY_ACTIVE", "CLOSED"].includes(cfg.status) ? daysAgo(cfg.daysAgoCreated - 2) : null,
        closedAt: cfg.status === "CLOSED" || cfg.status === "CANCELED" ? daysAgo(cfg.daysAgoCreated - 5) : null,
        price: cfg.price,
        cost: cfg.cost,
        paymentStatus: cfg.paymentStatus as any,
        paidAt: (cfg as any).daysAgoPaid !== undefined ? daysAgo((cfg as any).daysAgoPaid) : null,
        createdAt: created,
        updatedAt: created,
        notes: cfg.serviceType === "INSPECTION" ? "Inspeção inicial gratuita" : null,
      },
    });
    orders.push(order);

    // Cria certificado para OS de CERTIFICATE_ISSUED, WARRANTY_ACTIVE ou CLOSED
    if (["CERTIFICATE_ISSUED", "WARRANTY_ACTIVE", "CLOSED"].includes(cfg.status)) {
      await prisma.certificate.create({
        data: {
          serviceOrderId: order.id,
          technicalResponsible: "Eng. Agr. Lucas Mendes",
          licenseNumber: "CRA-SP 12345",
          pestsTargeted: cfg.pestTypes,
          productsUsed: ["Cipermetrina 20% EC", "Fipronil 0,3% SC"],
          applicationAreas: ["Cozinha", "Banheiros", "Áreas externas"],
          observations: "Aplicação realizada conforme normas técnicas vigentes.",
          issuedAt: daysAgo(cfg.daysAgoCreated - 3),
        },
      });

      // Cria garantia
      const warrantyStart = daysAgo(cfg.daysAgoCreated - 3);
      const warrantyEnd = new Date(warrantyStart);
      warrantyEnd.setDate(warrantyEnd.getDate() + 90);
      await prisma.warranty.create({
        data: {
          serviceOrderId: order.id,
          startsAt: warrantyStart,
          expiresAt: warrantyEnd,
          status: warrantyEnd < new Date() ? "EXPIRED" : "ACTIVE",
        },
      });
    }
  }

  console.log("Criando despesas (saídas do fluxo de caixa)...");
  const expensesData = [
    { category: "FUEL", description: "Combustível - frota", amount: 850, daysAgo: 2, method: "PIX", supplier: "Posto Shell Vila Olímpia" },
    { category: "FUEL", description: "Combustível semanal", amount: 720, daysAgo: 9, method: "CARD", supplier: "Posto Ipiranga" },
    { category: "FUEL", description: "Abastecimento veículos", amount: 920, daysAgo: 16, method: "CARD", supplier: "Posto Shell" },
    { category: "FUEL", description: "Combustível", amount: 780, daysAgo: 23, method: "PIX", supplier: "Posto BR" },
    { category: "PPE", description: "Compra de máscaras PFF2 (200un)", amount: 580, daysAgo: 12, method: "BOLETO", supplier: "Distribuidora 3M" },
    { category: "PPE", description: "Luvas nitrílicas (10 caixas)", amount: 480, daysAgo: 18, method: "PIX", supplier: "EPI Brasil" },
    { category: "PPE", description: "Botas de segurança", amount: 950, daysAgo: 35, method: "BOLETO", supplier: "EPI Brasil" },
    { category: "CHEMICAL", description: "Compra Cipermetrina 20% EC (5L)", amount: 900, daysAgo: 25, method: "BOLETO", supplier: "Nufarm" },
    { category: "CHEMICAL", description: "Compra Fipronil SC (3L)", amount: 1350, daysAgo: 14, method: "TRANSFER", supplier: "BASF" },
    { category: "CHEMICAL", description: "Iscas formicidas", amount: 840, daysAgo: 8, method: "PIX", supplier: "Atta Kill" },
    { category: "SALARY", description: "Salário técnico João - Mar/2026", amount: 3200, daysAgo: 25, method: "TRANSFER", supplier: null },
    { category: "SALARY", description: "Salário técnico Pedro - Mar/2026", amount: 3200, daysAgo: 25, method: "TRANSFER", supplier: null },
    { category: "SALARY", description: "Salário técnico Marcos - Mar/2026", amount: 3000, daysAgo: 25, method: "TRANSFER", supplier: null },
    { category: "SALARY", description: "Pró-labore Lucas - Mar/2026", amount: 5500, daysAgo: 25, method: "TRANSFER", supplier: null },
    { category: "RENT", description: "Aluguel sede comercial", amount: 2800, daysAgo: 5, method: "BOLETO", supplier: "Imobiliária Vila Verde" },
    { category: "RENT", description: "Conta de luz", amount: 380, daysAgo: 7, method: "BOLETO", supplier: "Enel" },
    { category: "RENT", description: "Conta de água", amount: 95, daysAgo: 11, method: "BOLETO", supplier: "Sabesp" },
    { category: "RENT", description: "Internet + telefone", amount: 220, daysAgo: 4, method: "PIX", supplier: "Vivo" },
    { category: "ADMIN", description: "Honorários contador - Mar/2026", amount: 850, daysAgo: 20, method: "PIX", supplier: "Contador José" },
    { category: "ADMIN", description: "Material escritório", amount: 175, daysAgo: 30, method: "CARD", supplier: "Kalunga" },
    { category: "MAINTENANCE", description: "Revisão Fiat Strada", amount: 580, daysAgo: 22, method: "CARD", supplier: "Oficina Auto Center" },
    { category: "MAINTENANCE", description: "Pneu novo veículo 02", amount: 480, daysAgo: 40, method: "BOLETO", supplier: "Pneus Plus" },
    { category: "MARKETING", description: "Anúncios Google Ads", amount: 600, daysAgo: 6, method: "CARD", supplier: "Google" },
    { category: "MARKETING", description: "Cartões de visita (1000un)", amount: 180, daysAgo: 15, method: "PIX", supplier: "Gráfica Express" },
    { category: "TAXES", description: "Simples Nacional - Mar/2026", amount: 1850, daysAgo: 19, method: "BOLETO", supplier: "Receita Federal" },
    { category: "OTHER", description: "Cafezinho da equipe", amount: 95, daysAgo: 3, method: "CASH", supplier: null },
  ];

  for (const e of expensesData) {
    await prisma.expense.create({
      data: {
        category: e.category as any,
        description: e.description,
        amount: e.amount,
        paidAt: daysAgo(e.daysAgo),
        paymentMethod: e.method as any,
        supplier: e.supplier,
        createdById: admin.id,
      },
    });
  }

  console.log("\n✅ Seed concluído com sucesso!");
  console.log("\n👥 Usuários criados (senha: senha1234):");
  console.log("  - admin@detetizacao.com (ADMIN)");
  console.log("  - gerente@detetizacao.com (MANAGER)");
  console.log("  - comercial@detetizacao.com (MANAGER)");
  console.log("  - joao@detetizacao.com (TECHNICIAN)");
  console.log("  - pedro@detetizacao.com (TECHNICIAN)");
  console.log("  - marcos@detetizacao.com (TECHNICIAN)");
  console.log(`\n📊 Dados gerados: ${customers.length} clientes, ${orders.length} OS, ${stockItems.length} produtos, ${expensesData.length} despesas, ${pestNames.length} pragas, ${areaNames.length} áreas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
