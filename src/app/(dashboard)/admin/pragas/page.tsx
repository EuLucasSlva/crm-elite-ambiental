import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { SectionCard } from "@/components/ui/SectionCard";
import { Badge } from "@/components/ui/Badge";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deletePestType } from "@/lib/delete-actions";
import { CatalogForm } from "../CatalogForm";
import { ToggleActiveButton } from "../ToggleActiveButton";
import { togglePestTypeActive } from "../catalog/actions";
import type { Role } from "@prisma/client";

export default async function PragasPage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/");

  const pests = await prisma.pestType.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold leading-none" style={{ color: "var(--text)" }}>
          CATÁLOGO DE PRAGAS
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {pests.length} praga{pests.length !== 1 ? "s" : ""} cadastrada{pests.length !== 1 ? "s" : ""}
        </p>
      </div>

      <SectionCard title="Cadastrar nova praga">
        <CatalogForm kind="pest" />
      </SectionCard>

      <SectionCard title="Pragas cadastradas">
        <div className="table-scroll">
          <table className="table-hover w-full text-sm">
            <thead>
              <tr>
                {["Nome", "Categoria", "Status", "Ações"].map((h) => (
                  <th
                    key={h}
                    className="text-left pb-2 text-xs font-bold uppercase tracking-wide border-b px-2"
                    style={{ color: "var(--text-muted)", borderColor: "#d0d5e8" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-2 py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    Nenhuma praga cadastrada.
                  </td>
                </tr>
              ) : (
                pests.map((p) => (
                  <tr key={p.id} className="border-b last:border-0" style={{ borderColor: "#dde1ed" }}>
                    <td className="px-2 py-2.5 font-medium" style={{ color: "var(--text)" }}>{p.name}</td>
                    <td className="px-2 py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>{p.category ?? "—"}</td>
                    <td className="px-2 py-2.5">
                      <Badge variant={p.active ? "green" : "gray"} label={p.active ? "Ativa" : "Inativa"} />
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="flex gap-2">
                        <ToggleActiveButton
                          id={p.id}
                          active={p.active}
                          action={async (id, active) => {
                            "use server";
                            return togglePestTypeActive(id, active);
                          }}
                        />
                        <DeleteButton
                          size="sm"
                          action={async () => {
                            "use server";
                            return deletePestType(p.id);
                          }}
                          confirmMessage={`Apagar praga "${p.name}"?`}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
