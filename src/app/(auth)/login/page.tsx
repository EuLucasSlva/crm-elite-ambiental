import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🪲</span>
          <h1 className="mt-3 text-2xl font-bold text-white">CRM Detetização</h1>
          <p className="mt-1 text-slate-400 text-sm">Acesse sua conta</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
