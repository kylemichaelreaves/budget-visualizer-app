import { DateTime } from 'luxon'

/**
 * `<input type="date">` value for a local date. `toISOString()` would give the
 * UTC day, which is tomorrow in New York after 8 pm.
 */
export function formatLoanDateInput(d: Date): string {
  if (Number.isNaN(d.getTime())) return ''
  return DateTime.fromJSDate(d).toISODate() ?? ''
}

/** Local midnight of a `YYYY-MM-DD` input value; an Invalid Date when empty or malformed. */
export function parseLoanDateInput(value: string): Date {
  const dt = DateTime.fromISO(value)
  return dt.isValid && /^\d{4}-\d{2}-\d{2}$/.test(value) ? dt.toJSDate() : new Date(NaN)
}
