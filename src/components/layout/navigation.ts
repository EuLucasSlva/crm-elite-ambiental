import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  ClipboardList,
  FileClock,
  LayoutDashboard,
  PackageSearch,
  ReceiptText,
  Settings2,
  ShieldCheck,
  Users,
  UserRoundCog,
  WalletCards,
} from "lucide-react";
import type { Role } from "@prisma/client";

export type NavGroup = {
  label: string;
  items: Array<{
    label: string;
    shortLabel?: string;
    href: string;
    icon: LucideIcon;
    roles: Role[];
  }>;
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Operação",
    items: [
      { label: "Visão geral", shortLabel: "Início", href: "/", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "TECHNICIAN"] },
      { label: "Ordens de serviço", shortLabel: "OS", href: "/service-orders", icon: ClipboardList, roles: ["ADMIN", "MANAGER", "TECHNICIAN"] },
      { label: "Garantias", href: "/warranties", icon: ShieldCheck, roles: ["ADMIN", "MANAGER"] },
      { label: "Estoque", href: "/stock", icon: PackageSearch, roles: ["ADMIN", "MANAGER"] },
    ],
  },
  {
    label: "Relacionamento",
    items: [
      { label: "Clientes", href: "/customers", icon: Users, roles: ["ADMIN", "MANAGER"] },
    ],
  },
  {
    label: "Gestão",
    items: [
      { label: "Financeiro", href: "/financeiro", icon: WalletCards, roles: ["ADMIN", "MANAGER"] },
      { label: "Despesas", href: "/financeiro/despesas", icon: ReceiptText, roles: ["ADMIN", "MANAGER"] },
      { label: "Fluxo de caixa", href: "/financeiro/fluxo", icon: FileClock, roles: ["ADMIN", "MANAGER"] },
    ],
  },
  {
    label: "Administração",
    items: [
      { label: "Catálogos", href: "/admin/pragas", icon: Boxes, roles: ["ADMIN", "MANAGER"] },
      { label: "Usuários", href: "/users", icon: UserRoundCog, roles: ["ADMIN"] },
      { label: "Auditoria", href: "/audit", icon: Settings2, roles: ["ADMIN"] },
    ],
  },
];

export function isNavItemActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/financeiro") return pathname === href;
  if (href === "/admin/pragas") return pathname.startsWith("/admin/");
  return pathname.startsWith(href);
}

