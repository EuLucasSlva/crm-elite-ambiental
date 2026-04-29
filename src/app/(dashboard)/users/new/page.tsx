import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { NewUserForm } from "./NewUserForm";

export default async function NewUserPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/users" className="hover:text-green-700 hover:underline">
          Usuários
        </Link>
        <span>/</span>
        <span className="text-gray-700">Novo Usuário</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Novo Usuário</h1>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <NewUserForm />
      </div>
    </div>
  );
}
