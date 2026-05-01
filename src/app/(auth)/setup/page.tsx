export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SetupForm } from "./SetupForm";

export default async function SetupPage() {
  const count = await prisma.user.count();
  if (count > 0) redirect("/login");

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🔐</span>
          <h1 className="mt-3 text-2xl font-bold text-white">Primeiro Acesso</h1>
          <p className="mt-1 text-slate-400 text-sm">
            Crie a conta de administrador do sistema
          </p>
        </div>
        <SetupForm />
        <p className="mt-4 text-center text-xs text-slate-500">
          Esta página só está disponível enquanto não houver usuários cadastrados.
        </p>
      </div>
    </div>
  );
}
