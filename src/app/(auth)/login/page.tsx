import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";

interface Props {
  searchParams: Promise<{ setup?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { setup } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🪲</span>
          <h1 className="mt-3 text-2xl font-bold text-white">Elite Ambiental</h1>
          <p className="mt-1 text-slate-400 text-sm">Acesse sua conta</p>
        </div>
        {setup === "1" && (
          <div className="mb-4 rounded-lg bg-green-900/40 border border-green-700 px-4 py-3 text-sm text-green-300 text-center">
            Conta criada com sucesso! Faça login para continuar.
          </div>
        )}
        <LoginForm />
      </div>
    </div>
  );
}
