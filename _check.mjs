import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const cleanUrl = (process.env.DATABASE_URL ?? "")
  .replace(/[?&]pgbouncer=[^&]*/g, "")
  .replace(/[?&]connection_limit=[^&]*/g, "")
  .replace(/\?&/, "?")
  .replace(/[?&]$/, "");

const pool = new Pool({ connectionString: cleanUrl, max: 2, connectionTimeoutMillis: 15000 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const users = await prisma.user.findMany({
  select: { name: true, email: true, role: true, active: true, createdAt: true, passwordHash: true },
  orderBy: { createdAt: "asc" },
});

console.log(`=== USUARIOS: ${users.length} ===\n`);
for (const u of users) {
  console.log(`"${u.email}"  [${u.role}]  ativo=${u.active}`);
  console.log(`   nome: ${u.name}  |  criado: ${u.createdAt.toLocaleString("pt-BR")}`);
}

// Testa a senha do Aldo contra qualquer usuario cujo email contenha "aldo"
console.log(`\n=== TESTE DE LOGIN: Aldo ===`);
const alvo = users.find((u) => u.email.toLowerCase().includes("aldo"));
if (!alvo) {
  console.log(">>> NAO EXISTE nenhum usuario com 'aldo' no email.");
} else {
  console.log(`Email no banco: "${alvo.email}"`);
  console.log(`Email digitado: "Aldo@eliteambiental.com"`);
  console.log(`Iguais (case-sensitive)? ${alvo.email === "Aldo@eliteambiental.com"}`);
  const senhaOk = await bcrypt.compare("elitealdo123", alvo.passwordHash);
  console.log(`Senha "elitealdo123" confere? ${senhaOk}`);
  console.log(`Usuario ativo? ${alvo.active}`);
}

// Log de auditoria recente
const logs = await prisma.auditLog.findMany({
  orderBy: { timestamp: "desc" },
  take: 15,
  select: { entityName: true, timestamp: true, user: { select: { name: true, email: true } } },
});
console.log(`\n=== ULTIMAS ${logs.length} ACOES AUDITADAS ===`);
for (const l of logs) {
  console.log(`${l.timestamp.toLocaleString("pt-BR")}  ${l.entityName.padEnd(14)}  por ${l.user?.email ?? "?"}`);
}

await pool.end();
