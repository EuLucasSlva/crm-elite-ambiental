"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserRound } from "lucide-react";
import type { Role } from "@prisma/client";
import { NAV_GROUPS, isNavItemActive } from "./navigation";

const ESSENTIAL_HREFS = ["/", "/service-orders", "/customers", "/financeiro"];

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role as Role | undefined;
  const items = NAV_GROUPS.flatMap((group) => group.items)
    .filter((item) => ESSENTIAL_HREFS.includes(item.href) && role && item.roles.includes(role));

  return (
    <nav className="bottom-nav lg:hidden" aria-label="Atalhos principais">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isNavItemActive(pathname, item.href);
        return (
          <Link key={item.href} href={item.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
            <Icon size={20} strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
            <span>{item.shortLabel ?? item.label}</span>
          </Link>
        );
      })}
      <Link href="/profile" className={pathname.startsWith("/profile") ? "active" : ""}>
        <UserRound size={20} aria-hidden="true" />
        <span>Perfil</span>
      </Link>
    </nav>
  );
}
