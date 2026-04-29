import type { NextConfig } from "next";

/**
 * Headers de segurança aplicados em todas as rotas da aplicação.
 *
 * Notas:
 * - script-src inclui 'unsafe-inline' e 'unsafe-eval' para compatibilidade
 *   com Next.js App Router (inline scripts de hidratação). Em produção avaliada,
 *   substitua por nonces/hashes assim que o framework suportar.
 * - frame-ancestors 'none' impede que a aplicação seja embutida em iframes
 *   (equivalente a X-Frame-Options: DENY, mas via CSP — mais amplo).
 * - HSTS com 2 anos + preload: envie o domínio para o preload list do Chrome
 *   em https://hstspreload.org/ após validar que HTTPS está estável.
 */
const securityHeaders = [
  // Habilita prefetch de DNS — pequena melhora de performance sem risco.
  { key: "X-DNS-Prefetch-Control", value: "on" },

  // HTTP Strict Transport Security — força HTTPS por 2 anos.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },

  // Impede clickjacking via iframe (complementar ao CSP frame-ancestors).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },

  // Impede MIME-type sniffing — reduz risco de XSS via upload de conteúdo.
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Filtro XSS legado (navegadores antigos sem suporte a CSP).
  { key: "X-XSS-Protection", value: "1; mode=block" },

  // Controla informações enviadas no header Referer.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Desabilita APIs de hardware desnecessárias para este CRM.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },

  // Content Security Policy — principal defesa contra XSS.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Aplica os headers a todas as rotas.
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
