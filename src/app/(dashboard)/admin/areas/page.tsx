import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { SectionCard } from "@/components/ui/SectionCard";
import { Badge } from "@/components/ui/Badge";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteApplicationArea } from "@/lib/delete-actions";
import { CatalogForm } from "../CatalogForm";
import { ToggleActiveButton } from "../ToggleActiveButton";
import { toggleApplicationAreaActive } from "../catalog/actions";
import type { Role } from "@prisma/client";

export default async function AreasPage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/");

  const areas = await prisma.applicationArea.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold leading-none" style={{ color: "var(--text)" }}>
          ÁREAS DE APLICAÇÃO
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {areas.length} área{areas.length !== 1 ? "s" : ""} cadastrada{areas.length !== 1 ? "s" : ""}
        </p>
      </div>

      <SectionCard title="Cadastrar nova área">
        <CatalogForm kind="area" />
      </SectionCard>

      <SectionCard title="Áreas cadastradas">
        <div className="table-scroll">
          <table className="table-hover w-full text-sm">
            <thead>
              <tr>
                {["Nome", "Status", "Ações"].map((h) => (
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
              {areas.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-2 py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    Nenhuma área cadastrada.
                  </td>
                </tr>
              ) : (
                areas.map((a) => (
                  <tr key={a.id} className="border-b last:border-0" style={{ borderColor: "#dde1ed" }}>
                    <td className="px-2 py-2.5 font-medium" style={{ color: "var(--text)" }}>{a.name}</td>
                    <td className="px-2 py-2.5">
                      <Badge variant={a.active ? "green" : "gray"} label={a.active ? "Ativa" : "Inativa"} />
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="flex gap-2">
                        <ToggleActiveButton
                          id={a.id}
                          active={a.active}
                          action={async (id, active) => {
                            "use server";
                            return toggleApplicationAreaActive(id, active);
                          }}
                        />
                        <DeleteButton
                          size="sm"
                          action={async () => {
                            "use server";
                            return deleteApplicationArea(a.id);
                          }}
                          confirmMessage={`Apagar área "${a.name}"?`}
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
