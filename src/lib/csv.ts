/** Neutralizes spreadsheet formulas and applies RFC 4180-style CSV quoting. */
export function escapeCsvCell(value: string | number | null | undefined): string {
  let text = String(value ?? "");
  if (/^[\t\r ]*[=+\-@]/.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

