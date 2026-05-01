import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("elitealdo123", 12);
  const user = await prisma.user.upsert({
    where: { email: "Aldo@eliteambiental.com" },
    update: { passwordHash, role: "ADMIN", name: "Aldo" },
    create: { name: "Aldo", email: "Aldo@eliteambiental.com", passwordHash, role: "ADMIN" },
  });
  console.log("Usuário criado:", user.email, "| role:", user.role);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
