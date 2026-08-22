import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { Leaf } from "lucide-react";

interface Props {
  searchParams: Promise<{ setup?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { setup } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(145deg, #102c29 0%, #173a36 55%, #24564f 100%)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-emerald-100"><Leaf size={25} /></span>
          <h1 className="mt-3 text-2xl font-bold text-white">Elite Ambiental</h1>
          <p className="mt-1 text-emerald-100/65 text-sm">Central operacional segura</p>
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
