import type { RecurringSeries } from '@types'

let nextId = 1

/**
 * A healthy, active, non-conflicting series; override only what a test cares about.
 *
 * `memoId` is offset from `id` so a component that reads one where it means the
 * other renders a visibly wrong value instead of passing by coincidence.
 */
export function makeRecurringSeries(overrides: Partial<RecurringSeries> = {}): RecurringSeries {
  const id = nextId++
  return {
    id,
    memoId: id + 1000,
    memoName: `Memo ${id}`,
    avatarS3Url: null,
    cadence: 'monthly',
    confidence: 0.9,
    occurrenceCount: 6,
    firstDate: '2026-04-15',
    lastDate: '2026-10-15',
    nextExpectedDate: '2026-11-15',
    latestAmount: 10,
    monthlyNormalized: 10,
    amountHistory: [
      { date: '2026-09-15', amount: 10 },
      { date: '2026-10-15', amount: 10 },
    ],
    budgetCategory: 'Entertainment',
    status: 'active',
    dismissedAt: null,
    detectedAt: '2026-10-19T03:00:00.000Z',
    memoRecurring: true,
    memoFrequency: 'monthly',
    ...overrides,
  }
}
