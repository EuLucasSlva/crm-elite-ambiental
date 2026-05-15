import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json([], { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const items = await prisma.stockItem.findMany({
    where: {
      name: { contains: q, mode: "insensitive" },
      quantity: { gt: 0 },
    },
    orderBy: { name: "asc" },
    take: 10,
    select: { id: true, name: true, quantity: true, unit: true, unitCost: true, activeIngredient: true },
  });

  return NextResponse.json(items);
}
