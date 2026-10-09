"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronDown, Menu, UserRound } from "lucide-react";
import type { Role } from "@prisma/client";
import { NAV_GROUPS, isNavItemActive } from "./navigation";

export function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role as Role | undefined;
  return (
    <header className="mobile-topbar lg:hidden">
      <Link href="/" className="mobile-brand" aria-label="Elite Ambiental — início">
        <Image
          src="/brand/icone-app.png"
          alt=""
          width={36}
          height={36}
          priority
          className="brand-icon brand-icon--mobile"
          aria-hidden="true"
        />
        <span className="brand-name brand-name--mobile"><strong>elite</strong> ambiental</span>
      </Link>

      <details className="mobile-menu">
        <summary aria-label="Abrir menu">
          <Menu size={20} aria-hidden="true" />
          <span>Menu</span>
          <ChevronDown size={14} aria-hidden="true" />
        </summary>
        <div className="mobile-menu-panel">
          {NAV_GROUPS.map((group) => {
            const items = group.items.filter((item) => role && item.roles.includes(role));
            if (!items.length) return null;
            return (
              <div key={group.label}>
                <p>{group.label}</p>
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = isNavItemActive(pathname, item.href);
                  return (
                    <Link key={item.href} href={item.href} className={active ? "active" : ""}>
                      <Icon size={17} /> {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
          <Link href="/profile" className="mobile-profile-link">
            <UserRound size={17} /> Meu perfil
          </Link>
        </div>
      </details>
    </header>
  );
}
