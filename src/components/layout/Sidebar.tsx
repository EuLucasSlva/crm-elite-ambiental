"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import type { Role } from "@prisma/client";
import { ChevronRight, UserRound } from "lucide-react";
import { NAV_GROUPS, isNavItemActive } from "./navigation";
import { ROLE_LABELS } from "@/lib/labels";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role as Role | undefined;

  return (
    <aside className="app-sidebar hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0">
      <Link href="/" className="sidebar-brand">
        <Image
          src="/brand/icone-app.png"
          alt=""
          width={42}
          height={42}
          priority
          className="brand-icon"
          aria-hidden="true"
        />
        <span className="brand-name"><strong>elite</strong> ambiental</span>
      </Link>

      <nav className="sidebar-nav" aria-label="Navegação principal">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => role && item.roles.includes(role));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label} className="sidebar-group">
              <p className="sidebar-group-label">{group.label}</p>
              <ul>
                {visibleItems.map((item) => {
                  const active = isNavItemActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link href={item.href} className={`sidebar-link${active ? " sidebar-link--active" : ""}`} aria-current={active ? "page" : undefined}>
                        <Icon size={18} strokeWidth={2} aria-hidden="true" />
                        <span>{item.label}</span>
                        {active && <ChevronRight size={15} className="ml-auto" aria-hidden="true" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {session?.user && (
        <Link href="/profile" className="sidebar-profile">
          <span className="sidebar-avatar"><UserRound size={17} /></span>
          <span className="min-w-0">
            <strong className="block truncate">{session.user.name}</strong>
            <small>{ROLE_LABELS[session.user.role as Role]}</small>
          </span>
          <ChevronRight size={15} className="ml-auto shrink-0" />
        </Link>
      )}
    </aside>
  );
}
