import { describe, expect, it } from 'vitest'
import type { Frequency } from '@types'
import {
  FREQUENCY_VALUES,
  NOT_RECURRING_VALUE,
  parseFrequencySelection,
  recurrenceFields,
} from '@components/memos/memoRecurrence'

/**
 * Mirrors the `recurring_frequency_check` CHECK constraint on the production
 * `memos` table:
 *
 *   (recurring = false AND frequency IS NULL)
 *   OR (recurring = true AND frequency IS NOT NULL)
 *
 * The unit suite mocks the API, so nothing here reaches a database. Asserting
 * against the constraint directly is what keeps that gap from hiding a write
 * Postgres would reject.
 */
function satisfiesRecurringFrequencyCheck(row: { recurring: boolean; frequency: Frequency | null }): boolean {
  return (
    (row.recurring === false && row.frequency === null) || (row.recurring === true && row.frequency !== null)
  )
}

describe('recurrenceFields', () => {
  it('pairs a frequency with recurring true', () => {
    expect(recurrenceFields('monthly')).toEqual({ recurring: true, frequency: 'monthly' })
  })

  it('pairs no frequency with recurring false', () => {
    expect(recurrenceFields(null)).toEqual({ recurring: false, frequency: null })
  })

  it('never produces a pair the database would reject', () => {
    for (const frequency of [...FREQUENCY_VALUES, null]) {
      expect(satisfiesRecurringFrequencyCheck(recurrenceFields(frequency))).toBe(true)
    }
  })
})

describe('parseFrequencySelection', () => {
  it('reads the blank option as "not recurring"', () => {
    expect(parseFrequencySelection(NOT_RECURRING_VALUE)).toBeNull()
  })

  it('reads a blank-but-padded value as "not recurring"', () => {
    expect(parseFrequencySelection('   ')).toBeNull()
  })

  it.each(FREQUENCY_VALUES)('reads %s as itself', (frequency) => {
    expect(parseFrequencySelection(frequency)).toBe(frequency)
  })

  it('returns undefined for an unrecognised value so callers can ignore it', () => {
    expect(parseFrequencySelection('fortnightly')).toBeUndefined()
  })

  it('every select value the UI can emit round-trips to a valid pair', () => {
    for (const value of [NOT_RECURRING_VALUE, ...FREQUENCY_VALUES]) {
      const parsed = parseFrequencySelection(value)
      expect(parsed).not.toBeUndefined()
      expect(satisfiesRecurringFrequencyCheck(recurrenceFields(parsed as Frequency | null))).toBe(true)
    }
  })
})
