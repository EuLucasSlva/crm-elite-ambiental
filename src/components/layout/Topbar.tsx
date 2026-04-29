"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import type { Role } from "@prisma/client";

interface NavItem {
  label: string;
  href: string;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", roles: ["ADMIN", "MANAGER", "TECHNICIAN"] },
  { label: "Financeiro", href: "/financeiro", roles: ["ADMIN", "MANAGER"] },
  { label: "Ordens de Serviço", href: "/service-orders", roles: ["ADMIN", "MANAGER", "TECHNICIAN"] },
  { label: "Clientes", href: "/customers", roles: ["ADMIN", "MANAGER"] },
  { label: "Estoque", href: "/stock", roles: ["ADMIN", "MANAGER"] },
  { label: "Garantias", href: "/warranties", roles: ["ADMIN", "MANAGER"] },
  { label: "Usuários", href: "/users", roles: ["ADMIN"] },
  { label: "Auditoria", href: "/audit", roles: ["ADMIN"] },
];

export function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role as Role | undefined;

  const visibleItems = NAV_ITEMS.filter(
    (item) => !role || item.roles.includes(role)
  );

  const initials = (session?.user?.name ?? "U")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <header
      className="sticky top-0 z-50 flex items-center gap-2 px-4 sm:px-6 h-[58px]"
      style={{
        background: "var(--header-bg)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.22)",
      }}
    >
      {/* Brand */}
      <Link
        href="/"
        className="shrink-0 flex items-center gap-2 mr-2 no-underline"
        style={{ textDecoration: "none" }}
      >
        <span
          className="text-white font-extrabold tracking-widest"
          style={{ fontSize: "0.75rem", letterSpacing: "0.12em" }}
        >
          ELITE AMBIENTAL
        </span>
      </Link>

      {/* Divider */}
      <div className="topbar-divider mr-1" />

      {/* Nav links — scrollable horizontally on small screens */}
      <nav className="topbar-nav flex items-center gap-0.5 flex-1 overflow-x-auto">
        {visibleItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`topbar-link${isActive ? " topbar-link--active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Profile avatar */}
      <Link
        href="/profile"
        className="ml-2 shrink-0 flex items-center gap-2 group"
        style={{ textDecoration: "none" }}
      >
        <div
          className="flex items-center justify-center rounded-full text-xs font-bold transition-opacity group-hover:opacity-80"
          style={{
            width: 32,
            height: 32,
            background: "rgba(255,255,255,0.18)",
            border: "1.5px solid rgba(255,255,255,0.30)",
            color: "#fff",
            letterSpacing: "0.04em",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <span
          className="hidden sm:block text-white font-medium whitespace-nowrap group-hover:opacity-80 transition-opacity"
          style={{ fontSize: "0.8rem" }}
        >
          {session?.user?.name ?? "Meu Perfil"}
        </span>
      </Link>
    </header>
  );
}
