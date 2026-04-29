/**
 * seed-financial.ts
 * Populates financial fields on existing ServiceOrders and StockItems.
 * Safe to run multiple times (upserts / updates).
 *
 * Run with:
 *   npx tsx prisma/seed-financial.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function rand(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// Price tables per service type (BRL — realistic pest control values)
// ─────────────────────────────────────────────────────────────────────────────

const PRICE_RANGE: Record<string, [number, number]> = {
  INSPECTION: [200, 400],     // free inspection won't be priced
  TREATMENT:  [800, 3500],
  RETURN:     [300, 800],
};

const COST_RATIO = [0.25, 0.40]; // cost is 25–40% of price

// ─────────────────────────────────────────────────────────────────────────────
// main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  seed-financial: starting…");

  // ── 1. Update StockItem unitCosts ─────────────────────────────────────────

  const stockCosts: Record<string, number> = {
    // common pest control products with realistic BRL costs per unit
    "Demand CS":           38.50,
    "Ficam W":             45.00,
    "Termidor SC":        120.00,
    "Maxforce Gel":        28.00,
    "Bifentrina":          32.00,
    "Cipermetrina":        18.00,
    "Deltametrina":        22.00,
    "Imidacloprid":        55.00,
    "K-Othrine":           42.00,
    "Talstar":             36.00,
  };

  const allStock = await prisma.stockItem.findMany({ select: { id: true, name: true, unitCost: true } });
  console.log(`  Found ${allStock.length} stock items`);

  for (const item of allStock) {
    // Try to match by name keyword, else assign a random realistic cost
    let cost = 0;
    for (const [key, val] of Object.entries(stockCosts)) {
      if (item.name.toLowerCase().includes(key.toLowerCase())) {
        cost = val;
        break;
      }
    }
    if (cost === 0) cost = rand(15, 90); // fallback random

    if (item.unitCost === 0 || item.unitCost !== cost) {
      await prisma.stockItem.update({ where: { id: item.id }, data: { unitCost: cost } });
    }
  }
  console.log("  ✅ Stock unitCosts updated");

  // ── 2. Update ServiceOrders with financial data ───────────────────────────

  const orders = await prisma.serviceOrder.findMany({
    select: {
      id: true,
      serviceType: true,
      isFree: true,
      status: true,
      price: true,
      paymentStatus: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`  Found ${orders.length} service orders`);

  // Distribute paid dates across the last 6 months to get nice charts
  const paidOrders = orders.filter(
    (o) => !o.isFree && ["SERVICE_EXECUTED", "CERTIFICATE_ISSUED", "WARRANTY_ACTIVE", "CLOSED"].includes(o.status)
  );
  const pendingOrders = orders.filter(
    (o) => !o.isFree && ["QUOTE_APPROVED", "SERVICE_SCHEDULED"].includes(o.status)
  );
  const overdueOrders = orders.filter(
    (o) => !o.isFree && o.status === "QUOTE_REJECTED"
  );

  // Spread paid orders across last 6 months evenly
  for (let i = 0; i < paidOrders.length; i++) {
    const order = paidOrders[i];
    const [minP, maxP] = PRICE_RANGE[order.serviceType] ?? [500, 1500];
    const price = rand(minP, maxP);
    const costRatio = rand(COST_RATIO[0], COST_RATIO[1]);
    const cost = Math.round(price * costRatio * 100) / 100;

    // Spread across last 6 months: oldest order gets 5 months ago, newest gets this month
    const monthsAgo = Math.max(0, 5 - Math.floor((i / Math.max(paidOrders.length - 1, 1)) * 5));
    const daysOffset = rand(0, 25);
    const paidAt = new Date();
    paidAt.setMonth(paidAt.getMonth() - monthsAgo);
    paidAt.setDate(Math.max(1, paidAt.getDate() - daysOffset));

    await prisma.serviceOrder.update({
      where: { id: order.id },
      data: { price, cost, paymentStatus: "PAID", paidAt },
    });
  }

  // Pending orders
  for (const order of pendingOrders) {
    const [minP, maxP] = PRICE_RANGE[order.serviceType] ?? [500, 1500];
    const price = rand(minP, maxP);
    await prisma.serviceOrder.update({
      where: { id: order.id },
      data: { price, cost: null, paymentStatus: "PENDING" },
    });
  }

  // Overdue (use rejected quotes as inadimplentes)
  for (const order of overdueOrders) {
    const price = rand(500, 2000);
    await prisma.serviceOrder.update({
      where: { id: order.id },
      data: { price, cost: null, paymentStatus: "OVERDUE" },
    });
  }

  // Free orders
  for (const order of orders.filter((o) => o.isFree)) {
    await prisma.serviceOrder.update({
      where: { id: order.id },
      data: { price: 0, cost: 0, paymentStatus: "WAIVED" },
    });
  }

  console.log(`  ✅ Orders updated: ${paidOrders.length} paid, ${pendingOrders.length} pending, ${overdueOrders.length} overdue`);

  // ── 3. Add extra paid orders for richer chart data ────────────────────────
  // Check if we already have enough data points (skip if already seeded)

  const paidCount = await prisma.serviceOrder.count({ where: { paymentStatus: "PAID" } });
  console.log(`  Total paid orders after update: ${paidCount}`);

  // If we have fewer than 15 paid orders, generate synthetic ones from existing customers/technicians
  if (paidCount < 15) {
    const customers = await prisma.customer.findMany({ select: { id: true }, take: 5 });
    const technicians = await prisma.user.findMany({
      where: { role: { in: ["TECHNICIAN", "MANAGER"] } },
      select: { id: true },
    });

    if (customers.length > 0 && technicians.length > 0) {
      const serviceTypes = ["TREATMENT", "TREATMENT", "TREATMENT", "INSPECTION", "RETURN"] as const;
      const needed = 18 - paidCount;

      for (let i = 0; i < needed; i++) {
        const customer = customers[i % customers.length];
        const tech = technicians[i % technicians.length];
        const sType = serviceTypes[i % serviceTypes.length];
        const [minP, maxP] = PRICE_RANGE[sType];
        const price = rand(minP, maxP);
        const cost = Math.round(price * rand(0.25, 0.40) * 100) / 100;

        // Spread across last 6 months
        const monthsAgo = Math.floor((i / needed) * 6);
        const paidAt = new Date();
        paidAt.setMonth(paidAt.getMonth() - (5 - monthsAgo));
        paidAt.setDate(rand(1, 25));

        const executedAt = new Date(paidAt);
        executedAt.setDate(executedAt.getDate() - rand(1, 5));

        await prisma.serviceOrder.create({
          data: {
            customerId: customer.id,
            technicianId: tech.id,
            serviceType: sType,
            status: "CLOSED",
            isFree: false,
            price,
            cost,
            paymentStatus: "PAID",
            paidAt,
            executedAt,
            closedAt: paidAt,
            pestTypes: ["Baratas", "Formigas"],
          },
        });
      }
      console.log(`  ✅ Created ${needed} extra paid orders for chart richness`);
    }
  }

  console.log("🎉  seed-financial: done!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
