/**
 * Regras de data e hora do sistema.
 *
 * O banco continua armazenando instantes UTC. Valores vindos de inputs HTML
 * (`date` e `datetime-local`) são interpretados explicitamente no fuso da
 * operação, sem depender do fuso configurado no servidor ou no navegador.
 */
export const APP_TIME_ZONE = "America/Sao_Paulo";

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function partsInAppTimeZone(date: Date): DateParts {
  const values = Object.fromEntries(
    dateTimeFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

function appTimeZoneOffsetMs(date: Date): number {
  const parts = partsInAppTimeZone(date);
  const representedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  const instantWithoutMilliseconds = Math.floor(date.getTime() / 1000) * 1000;
  return representedAsUtc - instantWithoutMilliseconds;
}

function dateFromAppParts(parts: DateParts): Date {
  const wallClockAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  // Duas passagens também cobrem mudanças históricas de offset/DST.
  let instant = wallClockAsUtc;
  for (let i = 0; i < 2; i += 1) {
    instant = wallClockAsUtc - appTimeZoneOffsetMs(new Date(instant));
  }
  return new Date(instant);
}

function isSameParts(actual: DateParts, expected: DateParts): boolean {
  return (
    actual.year === expected.year &&
    actual.month === expected.month &&
    actual.day === expected.day &&
    actual.hour === expected.hour &&
    actual.minute === expected.minute &&
    actual.second === expected.second
  );
}

/** Converte YYYY-MM-DDTHH:mm(:ss) de São Paulo para um instante UTC. */
export function parseAppDateTime(value: string): Date | null {
  const match = value
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;

  const expected: DateParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? 0),
  };
  const date = dateFromAppParts(expected);
  return isSameParts(partsInAppTimeZone(date), expected) ? date : null;
}

/** Converte YYYY-MM-DD para o início desse dia em São Paulo. */
export function parseAppDate(value: string): Date | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const expected: DateParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: 0,
    minute: 0,
    second: 0,
  };
  const date = dateFromAppParts(expected);
  return isSameParts(partsInAppTimeZone(date), expected) ? date : null;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Formato correto para preencher um input type=date. */
export function formatAppDateInput(date: Date = new Date()): string {
  const parts = partsInAppTimeZone(date);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

/** Formato correto para preencher um input type=datetime-local. */
export function formatAppDateTimeInput(date: Date): string {
  const parts = partsInAppTimeZone(date);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

/** Soma dias civis a uma data YYYY-MM-DD, sem depender do fuso do dispositivo. */
export function addDaysToDateInput(value: string, days: number): string | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Intervalo [início, início do dia seguinte) para consultas sem erro de virada. */
export function appDateRange(from: string, to: string): { start: Date; endExclusive: Date } | null {
  const start = parseAppDate(from);
  const nextDay = addDaysToDateInput(to, 1);
  const endExclusive = nextDay ? parseAppDate(nextDay) : null;
  if (!start || !endExclusive || start >= endExclusive) return null;
  return { start, endExclusive };
}

export function currentAppDayRange(now: Date = new Date()): { start: Date; endExclusive: Date } {
  const today = formatAppDateInput(now);
  const range = appDateRange(today, today);
  if (!range) throw new Error("Não foi possível calcular o dia atual.");
  return range;
}

export function currentAppMonthRange(now: Date = new Date()): { start: Date; endExclusive: Date } {
  const parts = partsInAppTimeZone(now);
  const startInput = `${parts.year}-${pad(parts.month)}-01`;
  const nextMonthUtc = new Date(Date.UTC(parts.year, parts.month, 1));
  const endInput = `${nextMonthUtc.getUTCFullYear()}-${pad(nextMonthUtc.getUTCMonth() + 1)}-01`;
  const start = parseAppDate(startInput);
  const endExclusive = parseAppDate(endInput);
  if (!start || !endExclusive) throw new Error("Não foi possível calcular o mês atual.");
  return { start, endExclusive };
}
