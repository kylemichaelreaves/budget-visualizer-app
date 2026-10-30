import type { Frequency } from '@types'

/**
 * Every frequency the UI offers, and the only values that satisfy the recurring
 * half of the database's `recurring_frequency_check`.
 */
export const FREQUENCY_VALUES: Frequency[] = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']

/** The blank `<option>` both frequency dropdowns render. It means "not recurring". */
export const NOT_RECURRING_VALUE = ''

export type MemoRecurrence = { recurring: boolean; frequency: Frequency | null }

/**
 * Build the `recurring` / `frequency` pair together, from the frequency alone.
 *
 * The `memos` table has a `recurring_frequency_check` CHECK constraint tying the
 * two columns: a recurring memo must carry a frequency, and a non-recurring one
 * must not. PATCH applies only the fields it is sent, so writing half the pair
 * leaves the other half stale and Postgres rejects the row. `recurring` holds no
 * information `frequency` doesn't — it is exactly `frequency IS NOT NULL` — so it
 * is derived here rather than driven by a second control that can disagree.
 */
export function recurrenceFields(frequency: Frequency | null): MemoRecurrence {
  return frequency === null ? { recurring: false, frequency: null } : { recurring: true, frequency }
}

/**
 * Read a frequency `<select>` value. Blank means "not recurring" (`null`), a known
 * frequency means itself, and anything else is `undefined` so callers can ignore
 * it instead of writing a value the constraint would reject.
 */
export function parseFrequencySelection(value: string): Frequency | null | undefined {
  const v = value.trim()
  if (v === NOT_RECURRING_VALUE) return null
  return FREQUENCY_VALUES.includes(v as Frequency) ? (v as Frequency) : undefined
}
