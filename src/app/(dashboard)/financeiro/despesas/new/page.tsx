import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewExpenseForm } from "./NewExpenseForm";
import type { Role } from "@prisma/client";

export default async function NewExpensePage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/");

  const recentOrders = await prisma.serviceOrder.findMany({
    where: { status: { notIn: ["CANCELED"] } },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      customer: { select: { fullName: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold leading-none" style={{ color: "var(--text)" }}>
            NOVA DESPESA
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Registre saídas do fluxo de caixa
          </p>
        </div>
        <Link
          href="/financeiro/despesas"
          className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-bold transition-opacity hover:opacity-80"
          style={{ background: "var(--card-bg)", border: "1px solid #d0d5e8", color: "var(--text-muted)" }}
        >
          ← Voltar
        </Link>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm" style={{ borderColor: "#dde1ed" }}>
        <NewExpenseForm orders={recentOrders} />
      </div>
    </div>
  );
}
