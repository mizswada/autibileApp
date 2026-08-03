/** Format a Date as YYYY-MM-DD in local timezone (avoids UTC off-by-one). */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parse YYYY-MM-DD into a local Date, or return undefined if invalid. */
export function parseLocalDate(value: string | undefined | null): Date | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return undefined;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Format an ISO or date string for display as YYYY-MM-DD in local timezone. */
export function formatDateString(dateString: string): string {
  if (!dateString) return "";
  const parsed = parseLocalDate(dateString.slice(0, 10));
  if (parsed) return formatLocalDate(parsed);
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return formatLocalDate(date);
  } catch {
    return dateString;
  }
}
