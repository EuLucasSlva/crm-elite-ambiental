import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/labels";
import { KpiCard } from "@/components/ui/KpiCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { Badge } from "@/components/ui/Badge";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteUser } from "@/lib/delete-actions";
import type { Role } from "@prisma/client";

const ROLE_BADGE_VARIANT: Record<Role, "blue" | "navy" | "green"> = {
  ADMIN: "navy",
  MANAGER: "blue",
  TECHNICIAN: "green",
};

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, phone: true, role: true, active: true, createdAt: true },
  });

  const activeCount = users.filter((u) => u.active).length;
  const technicianCount = users.filter((u) => u.role === "TECHNICIAN").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold leading-none" style={{ color: "var(--text)" }}>
            USUÁRIOS
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Gerenciamento de usuários e permissões
          </p>
        </div>
        <Link
          href="/users/new"
          className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: "var(--navy)" }}
        >
          <span className="text-base leading-none">+</span>
          Novo Usuário
        </Link>
      </div>

      {/* KPI row */}
      <div className="kpi-row">
        <KpiCard label="Total de usuários" value={users.length} />
        <KpiCard label="Ativos" value={activeCount} />
        <KpiCard label="Técnicos" value={technicianCount} />
      </div>

      {/* Table */}
      <SectionCard title="Usuários Cadastrados">
        <div className="hidden md:block table-scroll">
          <table className="table-hover w-full text-sm">
            <thead>
              <tr>
                {["Nome", "E-mail", "Telefone", "Perfil", "Ativo", "Cadastro", "Ações"].map((h) => (
                  <th
                    key={h}
                    className="text-left pb-3 text-xs font-bold uppercase tracking-wide border-b px-2"
                    style={{ color: "var(--text-muted)", borderColor: "#d0d5e8" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b last:border-0"
                    style={{ borderColor: "#dde1ed", opacity: user.active ? 1 : 0.5 }}
                  >
                    <td className="px-2 py-3 font-semibold" style={{ color: "var(--text)" }}>{user.name}</td>
                    <td className="px-2 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{user.email}</td>
                    <td className="px-2 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{user.phone ?? "—"}</td>
                    <td className="px-2 py-3">
                      <Badge variant={ROLE_BADGE_VARIANT[user.role]} label={ROLE_LABELS[user.role]} />
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span
                        className="inline-flex h-5 w-9 items-center rounded-full transition-colors"
                        style={{ background: user.active ? "#22c55e" : "#d1d5db" }}
                        title={user.active ? "Ativo" : "Inativo"}
                      >
                        <span
                          className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                          style={{ transform: user.active ? "translateX(16px)" : "translateX(2px)" }}
                        />
                      </span>
                    </td>
                    <td className="px-2 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{formatDate(user.createdAt)}</td>
                    <td className="px-2 py-3">
                      {user.id !== session.user.id && (
                        <DeleteButton
                          size="sm"
                          action={async () => {
                            "use server";
                            return deleteUser(user.id);
                          }}
                          confirmMessage={`Apagar usuário "${user.name}"?\n\nSe ele tiver OS associadas, será apenas desativado (soft-delete).`}
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="rounded-[14px] border p-4 shadow-sm"
              style={{ background: "var(--white)", borderColor: "#dde1ed", opacity: user.active ? 1 : 0.5 }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold" style={{ color: "var(--text)" }}>{user.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{user.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge variant={ROLE_BADGE_VARIANT[user.role]} label={ROLE_LABELS[user.role]} />
                  <span
                    className="inline-flex h-5 w-9 items-center rounded-full"
                    style={{ background: user.active ? "#22c55e" : "#d1d5db" }}
                  >
                    <span
                      className="inline-block h-4 w-4 rounded-full bg-white shadow"
                      style={{ transform: user.active ? "translateX(16px)" : "translateX(2px)" }}
                    />
                  </span>
                </div>
              </div>
              {user.phone && <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{user.phone}</p>}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
