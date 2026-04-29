/**
 * Format a CPF (000.000.000-00) or CNPJ (00.000.000/0001-00) for display.
 * Input may be raw digits or already formatted.
 */
export function formatCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  if (digits.length === 14) {
    return digits.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    );
  }
  return value;
}

/**
 * Format a phone number (XX) XXXXX-XXXX or (XX) XXXX-XXXX.
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return value;
}

/**
 * Format a date to pt-BR locale string (DD/MM/YYYY).
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Format a datetime to pt-BR locale string (DD/MM/YYYY HH:mm).
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Shorten a CUID to 8 characters for display (#abc12345).
 */
export function shortId(id: string): string {
  return `#${id.slice(-8).toUpperCase()}`;
}

/**
 * Format a number as Brazilian Real currency (R$ 1.234,56).
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Validate CPF digits */
export function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(digits[10]);
}

/** Validate CNPJ digits */
export function isValidCnpj(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const calc = (d: string, weights: number[]) => {
    const sum = weights.reduce(
      (acc, w, i) => acc + parseInt(d[i]) * w,
      0
    );
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  return (
    calc(digits, w1) === parseInt(digits[12]) &&
    calc(digits, w2) === parseInt(digits[13])
  );
}

export function isValidCpfOrCnpj(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) return isValidCpf(value);
  if (digits.length === 14) return isValidCnpj(value);
  return false;
}
