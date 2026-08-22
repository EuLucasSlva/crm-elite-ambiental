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
const isDevelopment = process.env.NODE_ENV === "development";
const securityHeaders = [
  // Habilita prefetch de DNS — pequena melhora de performance sem risco.
  { key: "X-DNS-Prefetch-Control", value: "on" },

  // HTTP Strict Transport Security — força HTTPS por 2 anos.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },

  // Impede clickjacking via iframe (alinhado ao CSP frame-ancestors 'none').
  { key: "X-Frame-Options", value: "DENY" },

  // Impede MIME-type sniffing — reduz risco de XSS via upload de conteúdo.
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Desativa o filtro XSS legado; a proteção moderna é fornecida pelo CSP.
  { key: "X-XSS-Protection", value: "0" },

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
      `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
    ].join("; "),
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
