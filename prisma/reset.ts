/**
 * Limpa todos os dados do banco mantendo a estrutura.
 * Run: npm run db:reset
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Apagando todos os dados...");

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

  console.log("Banco limpo. Crie o primeiro usuário admin pelo sistema.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
