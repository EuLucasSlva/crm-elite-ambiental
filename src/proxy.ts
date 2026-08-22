import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

// Rotas públicas que não precisam de autenticação
const PUBLIC_PATHS = ["/login", "/setup", "/api/auth"];

// Rotas restritas por role — bloqueadas no edge antes dos Server Components
const ROLE_PROTECTED: { prefix: string; allowedRoles: string[] }[] = [
  { prefix: "/audit", allowedRoles: ["ADMIN"] },
  { prefix: "/users", allowedRoles: ["ADMIN"] },
  { prefix: "/customers", allowedRoles: ["ADMIN", "MANAGER"] },
  { prefix: "/stock", allowedRoles: ["ADMIN", "MANAGER"] },
  { prefix: "/warranties", allowedRoles: ["ADMIN", "MANAGER"] },
  { prefix: "/financeiro", allowedRoles: ["ADMIN", "MANAGER"] },
  { prefix: "/admin", allowedRoles: ["ADMIN", "MANAGER"] },
];

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export default auth(function proxy(req: NextRequest & { auth?: any }) {
  const { pathname } = req.nextUrl;

  // Permitir rotas públicas
  if (PUBLIC_PATHS.some((p) => matchesPrefix(pathname, p))) {
    return NextResponse.next();
  }

  // Redirecionar para login se não autenticado
  if (!req.auth?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar restrições de role no edge
  const userRole: string | undefined = req.auth.user.role;
  for (const { prefix, allowedRoles } of ROLE_PROTECTED) {
    if (matchesPrefix(pathname, prefix) && (!userRole || !allowedRoles.includes(userRole))) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
