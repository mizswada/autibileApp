/** User-facing date format: DD-MM-YYYY */
export function formatDisplayDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/** API / storage format: YYYY-MM-DD (avoids UTC off-by-one). */
export function formatApiDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** @deprecated Use formatApiDate for API values or formatDisplayDate for UI. */
export const formatLocalDate = formatApiDate;

function dateFromParts(day: number, month: number, year: number): Date | undefined {
  const date = new Date(year, month - 1, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }
  return date;
}

/** Parse DD-MM-YYYY. */
export function parseDisplayDate(value: string | undefined | null): Date | undefined {
  if (!value) return undefined;
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim());
  if (!match) return undefined;
  const [, d, m, y] = match;
  return dateFromParts(Number(d), Number(m), Number(y));
}

/** Parse YYYY-MM-DD. */
export function parseApiDate(value: string | undefined | null): Date | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return undefined;
  const [, y, m, d] = match;
  return dateFromParts(Number(d), Number(m), Number(y));
}

function parseIsoDate(value: string): Date | undefined {
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  } catch {
    return undefined;
  }
}

/** Parse DD-MM-YYYY, YYYY-MM-DD, or ISO datetime strings. */
export function parseAnyLocalDate(value: string | undefined | null): Date | undefined {
  if (!value) return undefined;
  return parseDisplayDate(value) ?? parseApiDate(value) ?? parseIsoDate(value);
}

/** @deprecated Use parseAnyLocalDate, parseDisplayDate, or parseApiDate. */
export const parseLocalDate = parseAnyLocalDate;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Validate typed DD-MM-YYYY and return a normalized display string. */
export function normalizeDisplayDateString(
  value: string,
  options?: { minimumDate?: Date; maximumDate?: Date },
): string | undefined {
  const parsed = parseDisplayDate(value.trim());
  if (!parsed) return undefined;

  const day = startOfDay(parsed);
  if (options?.maximumDate && day > startOfDay(options.maximumDate)) {
    return undefined;
  }
  if (options?.minimumDate && day < startOfDay(options.minimumDate)) {
    return undefined;
  }

  return formatDisplayDate(day);
}

/** Convert DD-MM-YYYY to YYYY-MM-DD for API calls. */
export function displayDateToApi(value: string): string | undefined {
  const parsed = parseDisplayDate(value);
  return parsed ? formatApiDate(parsed) : undefined;
}

/** Format any stored/API date string for display as DD-MM-YYYY. */
export function formatDateString(dateString: string): string {
  if (!dateString) return "";
  const parsed = parseAnyLocalDate(dateString);
  if (parsed) return formatDisplayDate(parsed);
  return dateString;
}

/** App-wide display helper for optional date strings. */
export function formatAppDate(dateString?: string | null): string {
  if (!dateString) return "N/A";
  const formatted = formatDateString(dateString);
  return formatted || "N/A";
}

/** Format a Date object for display as DD-MM-YYYY. */
export function formatAppDateFromDate(date: Date): string {
  return formatDisplayDate(date);
}
