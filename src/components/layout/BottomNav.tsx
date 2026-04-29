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

// Mobile bottom nav shows only the most essential items.
const BOTTOM_NAV_ITEMS: NavItem[] = [
  {
    label: "Início",
    href: "/",
    icon: "⊞",
    roles: ["ADMIN", "MANAGER", "TECHNICIAN"],
  },
  {
    label: "OS",
    href: "/service-orders",
    icon: "📋",
    roles: ["ADMIN", "MANAGER", "TECHNICIAN"],
  },
  {
    label: "Clientes",
    href: "/customers",
    icon: "👥",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Estoque",
    href: "/stock",
    icon: "🧪",
    roles: ["ADMIN", "MANAGER"],
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role as Role | undefined;

  const visibleItems = BOTTOM_NAV_ITEMS.filter(
    (item) => !role || item.roles.includes(role)
  );

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 safe-bottom z-40"
      style={{
        background: "var(--card-bg)",
        borderTop: "1px solid var(--card-border)",
        boxShadow: "0 -4px 16px rgba(30,48,84,0.08)",
      }}
    >
      <div className="flex">
        {visibleItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center py-2.5 min-h-[56px] font-medium transition-colors"
              style={{
                fontSize: "0.6875rem",
                color: isActive ? "var(--navy)" : "var(--text-muted)",
                letterSpacing: "0.02em",
              }}
            >
              <span
                className="text-lg mb-0.5 leading-none"
                style={{ opacity: isActive ? 1 : 0.65 }}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
