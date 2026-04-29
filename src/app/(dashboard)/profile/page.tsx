import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileForm } from "./ProfileForm";
import type { Role } from "@prisma/client";

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  TECHNICIAN: "Técnico",
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Informações da sua conta e segurança
        </p>
      </div>

      {/* Profile info card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Dados da conta
          </h2>
        </div>

        <div className="px-6 py-5">
          {/* Avatar placeholder */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-14 w-14 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{user.name}</p>
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                {ROLE_LABELS[user.role]}
              </span>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <dt className="font-medium text-gray-500">Email</dt>
              <dd className="mt-0.5 text-gray-900">{user.email}</dd>
            </div>

            <div>
              <dt className="font-medium text-gray-500">Telefone</dt>
              <dd className="mt-0.5 text-gray-900">
                {user.phone ?? (
                  <span className="text-gray-400 italic">Não informado</span>
                )}
              </dd>
            </div>

            <div>
              <dt className="font-medium text-gray-500">Papel</dt>
              <dd className="mt-0.5 text-gray-900">{ROLE_LABELS[user.role]}</dd>
            </div>

            <div>
              <dt className="font-medium text-gray-500">Membro desde</dt>
              <dd className="mt-0.5 text-gray-900">{formatDate(user.createdAt)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Change password card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Alterar senha
          </h2>
        </div>

        <div className="px-6 py-5">
          <ProfileForm />
        </div>
      </div>
    </div>
  );
}
