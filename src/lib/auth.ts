/**
 * Configuração completa do NextAuth — roda apenas no Node.js (não no Edge).
 * Importado somente em Server Components, API routes e Server Actions.
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import {
  checkLoginRateLimit,
  resetLoginRateLimit,
} from "@/lib/rate-limit";

// Mínimo aumentado de 6 para 8 caracteres (política de senha corrigida).
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        // ── Rate limiting por e-mail ──────────────────────────────────────────
        // O identificador é sempre lowercase para evitar contagens separadas
        // para "User@example.com" vs "user@example.com".
        const identifier = parsed.data.email.toLowerCase();
        const rateLimit = checkLoginRateLimit(identifier);
        if (!rateLimit.allowed) {
          // Retornar null sem vazar informação de lockout ao cliente.
          // O front-end verá apenas "Credenciais inválidas".
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            role: true,
            active: true,
          },
        });

        if (!user || !user.active) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        if (!valid) return null;

        // Login bem-sucedido — zerar contador de tentativas.
        resetLoginRateLimit(identifier);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
});
