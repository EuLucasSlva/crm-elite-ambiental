/**
 * Rate limiter em memória para tentativas de login.
 *
 * AVISO DE PRODUÇÃO: Esta implementação usa um Map em memória e funciona
 * corretamente apenas em implantações de instância única (ex.: um único
 * container / servidor). Em implantações com múltiplas instâncias (Kubernetes,
 * Vercel serverless, etc.) cada instância mantém seu próprio contador, o que
 * permite que um atacante distribua tentativas entre instâncias e contorne o
 * limite. Para multi-instância, substitua o Map por um store compartilhado:
 *   - Redis com ioredis + sliding window (ex.: upstash/ratelimit)
 *   - Vercel KV (baseado em Redis) em ambientes Vercel
 *   - Supabase/Postgres com linha por identificador e timestamp
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const LOCKOUT_MS = 30 * 60 * 1000; // 30 minutos

interface RateLimitEntry {
  attempts: number;
  windowStart: number;
  lockedUntil: number | null;
}

// Map global — sobrevive entre requisições no mesmo processo Node.js.
const store = new Map<string, RateLimitEntry>();

/** Remove entradas completamente expiradas para evitar vazamento de memória. */
function cleanup(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    const windowExpired = now - entry.windowStart > WINDOW_MS;
    const lockExpired = entry.lockedUntil === null || now > entry.lockedUntil;
    if (windowExpired && lockExpired) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  /** Milliseconds restantes de bloqueio, presente apenas quando allowed=false */
  remainingMs?: number;
}

/**
 * Verifica e incrementa o contador de tentativas de login para o identificador
 * fornecido (normalmente o e-mail em lowercase).
 *
 * Retorna `{ allowed: true }` se a tentativa pode prosseguir, ou
 * `{ allowed: false, remainingMs }` se o identificador está bloqueado.
 */
export function checkLoginRateLimit(identifier: string): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(identifier);

  // ── Verificar lockout ───────────────────────────────────────────────────────
  if (entry?.lockedUntil !== null && entry?.lockedUntil !== undefined) {
    if (now < entry.lockedUntil) {
      return { allowed: false, remainingMs: entry.lockedUntil - now };
    }
    // Lockout expirou — zerar completamente
    store.delete(identifier);
  }

  // ── Criar ou reutilizar entrada de janela ───────────────────────────────────
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    // Nova janela
    store.set(identifier, { attempts: 1, windowStart: now, lockedUntil: null });
    return { allowed: true };
  }

  // Dentro da janela — incrementar
  entry.attempts += 1;

  if (entry.attempts > MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
    store.set(identifier, entry);
    return { allowed: false, remainingMs: LOCKOUT_MS };
  }

  store.set(identifier, entry);
  return { allowed: true };
}

/**
 * Reseta o contador de tentativas para o identificador após um login
 * bem-sucedido, evitando que tentativas legítimas anteriores causem lockout.
 */
export function resetLoginRateLimit(identifier: string): void {
  store.delete(identifier);
}
