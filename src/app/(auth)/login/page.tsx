import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import Image from "next/image";

interface Props {
  searchParams: Promise<{ setup?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { setup } = await searchParams;

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
          <p className="auth-kicker mt-5">Central operacional</p>
          <h1 className="auth-title">Acesso ao CRM</h1>
        </div>
        {setup === "1" && (
          <div className="mb-4 rounded-lg border border-[#2FC283]/35 bg-[#2FC283]/10 px-4 py-3 text-center text-sm text-[#b9f2d8]">
            Conta criada com sucesso! Faça login para continuar.
          </div>
        )}
        <LoginForm />
      </div>
    </div>
  );
}
