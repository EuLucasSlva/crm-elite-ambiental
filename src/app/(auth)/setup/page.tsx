export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SetupForm } from "./SetupForm";
import Image from "next/image";

export default async function SetupPage() {
  const count = await prisma.user.count();
  if (count > 0) redirect("/login");

  return (
    <div className="auth-shell brand-dot-field min-h-screen flex items-center justify-center px-4 py-10">
      <div className="relative z-10 w-full max-w-[410px]">
        <div className="mb-7 flex flex-col items-center text-center">
          <Image
            src="/brand/logo-horizontal-descritivo-negativo.png"
            alt="Elite Ambiental — Controle Integrado de Pragas"
            width={710}
            height={144}
            priority
            className="auth-logo"
          />
          <p className="auth-kicker mt-5">Configuração segura</p>
          <h1 className="auth-title">Primeiro acesso</h1>
          <p className="mt-2 text-sm text-[#aab8b1]">
            Crie a conta de administrador do sistema
          </p>
        </div>
        <SetupForm />
        <p className="mt-4 text-center text-xs text-[#81918b]">
          Esta página só está disponível enquanto não houver usuários cadastrados.
        </p>
      </div>
    </div>
  );
}
