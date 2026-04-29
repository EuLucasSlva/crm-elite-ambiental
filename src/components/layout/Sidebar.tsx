"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import type { Role } from "@prisma/client";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: "⊞",
    roles: ["ADMIN", "MANAGER", "TECHNICIAN"],
  },
  {
    label: "Clientes",
    href: "/customers",
    icon: "👥",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Ordens de Serviço",
    href: "/service-orders",
    icon: "📋",
    roles: ["ADMIN", "MANAGER", "TECHNICIAN"],
  },
  {
    label: "Financeiro",
    href: "/financeiro",
    icon: "💰",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Despesas",
    href: "/financeiro/despesas",
    icon: "💸",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Fluxo de Caixa",
    href: "/financeiro/fluxo",
    icon: "📊",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Estoque",
    href: "/stock",
    icon: "🧪",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Garantias",
    href: "/warranties",
    icon: "🛡",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Cat. Pragas",
    href: "/admin/pragas",
    icon: "🐀",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Cat. Áreas",
    href: "/admin/areas",
    icon: "📍",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Usuários",
    href: "/users",
    icon: "🔐",
    roles: ["ADMIN"],
  },
  {
    label: "Auditoria",
    href: "/audit",
    icon: "📜",
    roles: ["ADMIN"],
  },
  {
    label: "Meu Perfil",
    href: "/profile",
    icon: "👤",
    roles: ["ADMIN", "MANAGER", "TECHNICIAN"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role as Role | undefined;

  const visibleItems = NAV_ITEMS.filter(
    (item) => !role || item.roles.includes(role)
  );

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 bg-slate-900 text-white">
      {/* Logo */}
      <div className="px-4 pt-6 pb-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">Elite Ambiental</p>
            <p className="text-xs text-slate-400">Sistema de Gestão</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info */}
      {session?.user && (
        <div className="border-t border-slate-700 p-4">
          <p className="text-sm font-medium text-white truncate">
            {session.user.name}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {roleLabel(session.user.role as Role)}
          </p>
        </div>
      )}
    </aside>
  );
}

function roleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    ADMIN: "Administrador",
    MANAGER: "Gerente",
    TECHNICIAN: "Técnico",
  };
  return labels[role] ?? role;
}
