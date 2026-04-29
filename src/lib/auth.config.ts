/**
 * Configuração leve do NextAuth — sem imports Node.js.
 * Usado no proxy (Edge Runtime) apenas para leitura de sessão/JWT.
 */
import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
    };
  }
  interface User {
    role: Role;
  }
}

export const authConfig: NextAuthConfig = {
  providers: [], // providers completos ficam em auth.ts (Node.js)
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    // Reduzido de 30 dias para 24 horas — adequado para sistema de negócio.
    // Sessões longas aumentam a janela de exploração de tokens roubados.
    maxAge: 24 * 60 * 60,
  },
};
