import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const rawUrl = process.env.DATABASE_URL ?? "";
const cleanUrl = rawUrl
  .replace(/[?&]pgbouncer=[^&]*/g, "")
  .replace(/[?&]connection_limit=[^&]*/g, "")
  .replace(/\?&/, "?")
  .replace(/[?&]$/, "");

const pool = new Pool({ connectionString: cleanUrl, max: 2 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ITEMS = [
  // ── INSETICIDAS BARATAS / FORMIGAS / MOSQUITOS ─────────────────────────────
  { name: "Cipermetrina 200 CE", activeIngredient: "Cipermetrina 20%", unit: "ML", quantity: 1000, minThreshold: 200, unitCost: 0.055, supplier: "Fersol" },
  { name: "Cipermetrina 300 CE", activeIngredient: "Cipermetrina 30%", unit: "ML", quantity: 1000, minThreshold: 200, unitCost: 0.095, supplier: "Fersol" },
  { name: "Deltametrina 25 CE", activeIngredient: "Deltametrina 2,5%", unit: "ML", quantity: 1000, minThreshold: 200, unitCost: 0.107, supplier: "Fersol" },
  { name: "K-Othrine 2P (pó deltametrina)", activeIngredient: "Deltametrina 0,2%", unit: "G", quantity: 1000, minThreshold: 100, unitCost: 0.220, supplier: "Envu (Bayer)" },
  { name: "Fipronil 2,5% CE", activeIngredient: "Fipronil 2,5%", unit: "ML", quantity: 300, minThreshold: 50, unitCost: 0.067, supplier: "Genérico" },
  { name: "Alfacipermetrina 50 SC", activeIngredient: "Alfa-cipermetrina 5%", unit: "ML", quantity: 1000, minThreshold: 200, unitCost: 0.072, supplier: "Fersol" },
  // ── ISCAS GEL ──────────────────────────────────────────────────────────────
  { name: "Maxforce Prime Gel (seringa 30g)", activeIngredient: "Imidacloprido 2,15%", unit: "G", quantity: 300, minThreshold: 60, unitCost: 0.93, supplier: "Envu" },
  { name: "Maxforce Quantum Gel (seringa 30g)", activeIngredient: "Imidacloprido", unit: "G", quantity: 120, minThreshold: 30, unitCost: 2.50, supplier: "Envu" },
  // ── RATICIDAS ──────────────────────────────────────────────────────────────
  { name: "Raticida Brodifacoum em Grãos 1kg", activeIngredient: "Brodifacoum 0,005%", unit: "G", quantity: 2000, minThreshold: 500, unitCost: 0.042, supplier: "Adama/Kolbirat" },
  { name: "Raticida Bromadiolona Bloco Parafinado", activeIngredient: "Bromadiolona 0,005%", unit: "G", quantity: 2000, minThreshold: 500, unitCost: 0.084, supplier: "Ratol" },
  { name: "Raticida Brodifacoum Pasta Fresca 1kg", activeIngredient: "Brodifacoum 0,005%", unit: "G", quantity: 1000, minThreshold: 200, unitCost: 0.051, supplier: "Kolbirat" },
  // ── CUPINICIDAS ────────────────────────────────────────────────────────────
  { name: "Termidor 25 CE (Fipronil cupinicida)", activeIngredient: "Fipronil 2,5%", unit: "ML", quantity: 1000, minThreshold: 200, unitCost: 0.125, supplier: "BASF" },
  { name: "Premise SC 200 (Imidacloprido)", activeIngredient: "Imidacloprido 20%", unit: "ML", quantity: 250, minThreshold: 50, unitCost: 0.600, supplier: "Envu" },
  { name: "Kellthine SC25 (Bifentrina)", activeIngredient: "Bifentrina 0,06%", unit: "ML", quantity: 400, minThreshold: 80, unitCost: 0.100, supplier: "Kelldrin" },
  // ── MOSQUITOS ──────────────────────────────────────────────────────────────
  { name: "Permetrina 384 CE", activeIngredient: "Permetrina 38,4%", unit: "ML", quantity: 1000, minThreshold: 200, unitCost: 0.100, supplier: "Fersol" },
  { name: "Deltametrina SC 25 (mosquitos)", activeIngredient: "Deltametrina 2,5%", unit: "ML", quantity: 1000, minThreshold: 200, unitCost: 0.105, supplier: "Deltamax" },
  { name: "Malationa 1000 CE", activeIngredient: "Malationa 100%", unit: "ML", quantity: 200, minThreshold: 50, unitCost: 0.075, supplier: "Fersol" },
  // ── ESCORPIÕES ─────────────────────────────────────────────────────────────
  { name: "Lankron 2,5 ME (Lambda-cialotrina)", activeIngredient: "Lambda-cialotrina 2,5%", unit: "ML", quantity: 1000, minThreshold: 200, unitCost: 0.182, supplier: "Ourofino" },
  { name: "Scorpmax Spray Pronto 500ml", activeIngredient: "Lambda-cialotrina 0,075%", unit: "ML", quantity: 500, minThreshold: 100, unitCost: 0.086, supplier: "Insetimax" },
  // ── POMBOS / AVES ──────────────────────────────────────────────────────────
  { name: "Xô Pombo Gel Repelente 250g", activeIngredient: "Poliisobutileno (gel físico)", unit: "G", quantity: 500, minThreshold: 100, unitCost: 0.120, supplier: "Quimiagri" },
  // ── FORMICIDAS ─────────────────────────────────────────────────────────────
  { name: "Alfamurom (formicida microencapsulado)", activeIngredient: "Alfacipermetrina + Deltametrina", unit: "ML", quantity: 1000, minThreshold: 200, unitCost: 0.017, supplier: "Iharabras" },
  // ── EPIs ───────────────────────────────────────────────────────────────────
  { name: "Máscara PFF2 com válvula", activeIngredient: null, unit: "UNIT", quantity: 50, minThreshold: 10, unitCost: 5.50, supplier: "EPI Store" },
  { name: "Luva Nitrílica Descartável (par)", activeIngredient: null, unit: "UNIT", quantity: 100, minThreshold: 20, unitCost: 0.45, supplier: "EPI Store" },
  { name: "Macacão Tyvek Descartável", activeIngredient: null, unit: "UNIT", quantity: 20, minThreshold: 5, unitCost: 22.00, supplier: "SuperEPI" },
  { name: "Óculos de Segurança Ampla Visão", activeIngredient: null, unit: "UNIT", quantity: 10, minThreshold: 3, unitCost: 11.00, supplier: "EPI Store" },
];

async function main() {
  console.log("Populando estoque com produtos de dedetização...");

  for (const item of ITEMS) {
    const existing = await prisma.stockItem.findFirst({
      where: { name: item.name },
      select: { id: true },
    });

    if (existing) {
      console.log(`  Já existe: ${item.name}`);
      continue;
    }

    await prisma.stockItem.create({
      data: {
        name: item.name,
        activeIngredient: item.activeIngredient,
        unit: item.unit as any,
        quantity: item.quantity,
        minThreshold: item.minThreshold,
        unitCost: item.unitCost,
        supplier: item.supplier,
      },
    });
    console.log(`  Criado: ${item.name}`);
  }

  console.log(`\nConcluído. ${ITEMS.length} produtos processados.`);
}

main()
  .catch(console.error)
  .finally(() => pool.end());
