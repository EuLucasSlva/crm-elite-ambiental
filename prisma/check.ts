import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [users, customers, orders] = await Promise.all([
    prisma.user.count(),
    prisma.customer.count(),
    prisma.serviceOrder.count(),
  ]);
  console.log("Usuários:", users);
  console.log("Clientes:", customers);
  console.log("Ordens de serviço:", orders);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
