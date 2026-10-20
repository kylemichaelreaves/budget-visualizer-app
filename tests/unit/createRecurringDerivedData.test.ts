import { describe, expect, it } from 'vitest'
import type { Frequency, RecurringAmountPoint, RecurringSeries } from '@types'
import {
  burnByCategory,
  formatSeriesDate,
  monthlyBurn,
  needsReviewCount,
  monthlyAmount,
  stoppedSavings,
  triageState,
} from '@components/recurring/createRecurringDerivedData'

const TODAY = '2026-10-20'

let nextId = 1

/** A healthy, active, non-conflicting series; override only what a test cares about. */
function makeSeries(overrides: Partial<RecurringSeries> = {}): RecurringSeries {
  const id = nextId++
  return {
    id,
    memoId: id,
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

function withHistory(...amounts: number[]): Partial<RecurringSeries> {
  const amountHistory: RecurringAmountPoint[] = amounts.map((amount, i) => ({
    date: `2026-0${i + 1}-15`,
    amount,
  }))
  return { amountHistory, latestAmount: amounts[amounts.length - 1] }
}

/** A weekly series that crossed into `stopped` at nextExpected + 14 days. */
function stoppedWeekly(nextExpectedDate: string, overrides: Partial<RecurringSeries> = {}): RecurringSeries {
  return makeSeries({
    cadence: 'weekly',
    memoFrequency: 'weekly',
    status: 'stopped',
    nextExpectedDate,
    ...overrides,
  })
}

describe('triageState', () => {
  it('returns null for a healthy active series', () => {
    expect(triageState(makeSeries(), TODAY)).toBeNull()
  })

  describe('price steps', () => {
    it('returns price-up when the latest amount step increased', () => {
      expect(triageState(makeSeries(withHistory(9.99, 12.99)), TODAY)).toBe('price-up')
    })

    it('returns price-down when the latest amount step decreased', () => {
      // A price cut must not read as a rise.
      expect(triageState(makeSeries(withHistory(12.99, 9.99)), TODAY)).toBe('price-down')
    })

    it('judges only the last step: a rise followed by a cut is price-down', () => {
      expect(triageState(makeSeries(withHistory(8, 12, 10)), TODAY)).toBe('price-down')
    })

    it('judges only the last step: a cut followed by a rise is price-up', () => {
      expect(triageState(makeSeries(withHistory(12, 8, 10)), TODAY)).toBe('price-up')
    })

    it('returns null when the last step is flat even if an earlier step moved', () => {
      expect(triageState(makeSeries(withHistory(8, 10, 10)), TODAY)).toBeNull()
    })

    it('returns null for a single-point history', () => {
      expect(triageState(makeSeries(withHistory(10)), TODAY)).toBeNull()
    })

    it('returns null for an empty history', () => {
      expect(triageState(makeSeries({ amountHistory: [] }), TODAY)).toBeNull()
    })

    it('ignores sub-cent float noise between steps', () => {
      // Both are 435 cents; as doubles they differ, and 4.35 * 100 is 434.99999999999994.
      expect(triageState(makeSeries(withHistory(4.35, 4.350000000000001)), TODAY)).toBeNull()
      expect(triageState(makeSeries(withHistory(4.350000000000001, 4.35)), TODAY)).toBeNull()
    })

    it('treats a one-cent change as a price step', () => {
      expect(triageState(makeSeries(withHistory(9.99, 10)), TODAY)).toBe('price-up')
      expect(triageState(makeSeries(withHistory(10, 9.99)), TODAY)).toBe('price-down')
    })

    it('orders the history by date rather than trusting array order', () => {
      const s = makeSeries({
        amountHistory: [
          { date: '2026-10-15', amount: 12 },
          { date: '2026-09-15', amount: 10 },
        ],
      })
      expect(triageState(s, TODAY)).toBe('price-up')
    })
  })

  describe('late', () => {
    it('returns late for an overdue series', () => {
      expect(triageState(makeSeries({ status: 'overdue' }), TODAY)).toBe('late')
    })
  })

  describe('conflict', () => {
    it('returns conflict when memoFrequency disagrees with the detected cadence', () => {
      expect(triageState(makeSeries({ cadence: 'monthly', memoFrequency: 'weekly' }), TODAY)).toBe('conflict')
    })

    it('returns conflict when a series exists but memoRecurring is false', () => {
      expect(triageState(makeSeries({ memoRecurring: false }), TODAY)).toBe('conflict')
    })

    it('flags the recurring-flag conflict for every cadence', () => {
      const cadences: Array<[RecurringSeries['cadence'], Frequency]> = [
        ['weekly', 'weekly'],
        ['biweekly', 'biweekly'],
        ['monthly', 'monthly'],
        ['quarterly', 'quarterly'],
        ['yearly', 'yearly'],
      ]
      for (const [cadence, memoFrequency] of cadences) {
        expect(triageState(makeSeries({ cadence, memoFrequency, memoRecurring: false }), TODAY)).toBe(
          'conflict',
        )
      }
    })

    it('does not flag a matching memoFrequency, for every cadence', () => {
      const cadences: RecurringSeries['cadence'][] = ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']
      for (const cadence of cadences) {
        expect(triageState(makeSeries({ cadence, memoFrequency: cadence }), TODAY)).toBeNull()
      }
    })

    it('flags a biweekly or quarterly series whose memo says something else', () => {
      expect(triageState(makeSeries({ cadence: 'biweekly', memoFrequency: 'weekly' }), TODAY)).toBe(
        'conflict',
      )
      expect(triageState(makeSeries({ cadence: 'quarterly', memoFrequency: 'monthly' }), TODAY)).toBe(
        'conflict',
      )
    })

    it('does not guess when memoFrequency is null', () => {
      expect(triageState(makeSeries({ memoFrequency: null }), TODAY)).toBeNull()
    })

    it("does not flag a memoFrequency of 'daily', which has no detected equivalent", () => {
      expect(triageState(makeSeries({ memoFrequency: 'daily' }), TODAY)).toBeNull()
    })

    it.each([
      'fortnightly',
      'Monthly',
      ' monthly',
      '',
      'every 2 weeks',
      'constructor',
      '__proto__',
      'toString',
    ])('does not flag an unrecognised memoFrequency (%j)', (legacy) => {
      const s = makeSeries({ cadence: 'weekly', memoFrequency: legacy as unknown as Frequency })
      expect(triageState(s, TODAY)).toBeNull()
    })

    it('still flags the recurring-flag conflict when memoFrequency is unrecognised', () => {
      const s = makeSeries({ memoRecurring: false, memoFrequency: 'fortnightly' as unknown as Frequency })
      expect(triageState(s, TODAY)).toBe('conflict')
    })

    it('flags memoRecurring false even when memoFrequency is null', () => {
      expect(triageState(makeSeries({ memoRecurring: false, memoFrequency: null }), TODAY)).toBe('conflict')
    })

    it('does not read a missing memoRecurring as false', () => {
      const legacy = makeSeries({ memoRecurring: undefined as unknown as boolean, memoFrequency: null })
      expect(triageState(legacy, TODAY)).toBeNull()
    })

    it('does not flag the recurring-flag conflict when memoRecurring is true', () => {
      expect(triageState(makeSeries({ memoRecurring: true }), TODAY)).toBeNull()
    })
  })

  describe('stopped', () => {
    // Weekly: crosses into stopped at nextExpected + 14 days; recent through nextExpected + 28 days.
    it('returns stopped on the day the series is still within two cadences of crossing', () => {
      expect(triageState(stoppedWeekly('2026-09-22'), '2026-10-20')).toBe('stopped') // 28 days past
    })

    it('drops out of the lane one day after the two-cadence window', () => {
      expect(triageState(stoppedWeekly('2026-09-21'), '2026-10-20')).toBeNull() // 29 days past
    })

    it('returns stopped immediately after crossing', () => {
      expect(triageState(stoppedWeekly('2026-10-05'), '2026-10-20')).toBe('stopped') // 15 days past
    })

    it('scales the window by the cadence length', () => {
      // Quarterly: window is 4 x 91.31 = 365.24 days past nextExpected.
      const recent = makeSeries({
        cadence: 'quarterly',
        memoFrequency: 'quarterly',
        status: 'stopped',
        nextExpectedDate: '2025-10-20', // 365 days past
      })
      const old = makeSeries({
        cadence: 'quarterly',
        memoFrequency: 'quarterly',
        status: 'stopped',
        nextExpectedDate: '2025-10-19', // 366 days past
      })
      expect(triageState(recent, TODAY)).toBe('stopped')
      expect(triageState(old, TODAY)).toBeNull()
    })

    it('does not let a stale stopped series back into the lane through a conflict', () => {
      expect(triageState(stoppedWeekly('2026-01-05', { memoRecurring: false }), TODAY)).toBeNull()
    })

    it('reports stopped rather than a price step for a recently stopped series', () => {
      expect(triageState(stoppedWeekly('2026-10-05', withHistory(8, 12)), TODAY)).toBe('stopped')
    })

    it('falls back to lastDate + one cadence when nextExpectedDate is null', () => {
      // Weekly: derived next = lastDate + 7 days, and the lane window is 28 days past that.
      const fallback = (lastDate: string) => stoppedWeekly('2026-10-05', { nextExpectedDate: null, lastDate })
      // 35 days since the last payment = 28 days past the derived next: the last day inside.
      expect(triageState(fallback('2026-09-15'), TODAY)).toBe('stopped')
      // 36 days since = 29 past. Without the + cadence offset, 35 days would already be out.
      expect(triageState(fallback('2026-09-14'), TODAY)).toBeNull()
    })

    it('returns null for a stopped series with neither a usable next date nor last date', () => {
      expect(triageState(stoppedWeekly('x', { nextExpectedDate: null, lastDate: 'x' }), TODAY)).toBeNull()
    })

    it('measures day gaps on the calendar, unaffected by the DST change in America/New_York', () => {
      // DST ended on 2026-11-01 in New York, so a span crossing it is 28 days + 1 hour in
      // milliseconds. Calendar arithmetic must still call it exactly 28 days.
      expect(triageState(stoppedWeekly('2026-10-05'), '2026-11-02')).toBe('stopped') // exactly 28 days
      expect(triageState(stoppedWeekly('2026-10-04'), '2026-11-02')).toBeNull() // 29 days
    })
  })

  describe('dismissed', () => {
    it('returns null for dismissed series whatever their state', () => {
      const dismissedAt = '2026-10-10T12:00:00.000Z'
      expect(triageState(makeSeries({ dismissedAt, ...withHistory(9, 12) }), TODAY)).toBeNull()
      expect(triageState(makeSeries({ dismissedAt, status: 'overdue' }), TODAY)).toBeNull()
      expect(triageState(makeSeries({ dismissedAt, memoRecurring: false }), TODAY)).toBeNull()
      expect(triageState(stoppedWeekly('2026-10-05', { dismissedAt }), TODAY)).toBeNull()
    })

    it('is the dismissal alone that silences each state', () => {
      const dismissedAt = '2026-10-10T12:00:00.000Z'
      const cases: Array<[Partial<RecurringSeries>, string]> = [
        [withHistory(9, 12), 'price-up'],
        [withHistory(12, 9), 'price-down'],
        [{ status: 'overdue' }, 'late'],
        [{ memoRecurring: false }, 'conflict'],
      ]
      for (const [overrides, expected] of cases) {
        expect(triageState(makeSeries(overrides), TODAY)).toBe(expected)
        expect(triageState(makeSeries({ ...overrides, dismissedAt }), TODAY)).toBeNull()
      }
      expect(triageState(stoppedWeekly('2026-10-05'), TODAY)).toBe('stopped')
      expect(triageState(stoppedWeekly('2026-10-05', { dismissedAt }), TODAY)).toBeNull()
    })

    it('keeps a conflict-kept series in the burn: the lane hint says it still counts', () => {
      const conflict = makeSeries({ cadence: 'yearly', memoFrequency: 'monthly', monthlyNormalized: 8 })
      const kept = { ...conflict, dismissedAt: '2026-10-10T12:00:00.000Z' }
      expect(triageState(conflict, TODAY)).toBe('conflict')
      expect(needsReviewCount([conflict], TODAY)).toBe(1)
      // Keep = dismiss: the lane goes quiet, the ledger does not move.
      expect(triageState(kept, TODAY)).toBeNull()
      expect(needsReviewCount([kept], TODAY)).toBe(0)
      expect(monthlyBurn([kept])).toBe(monthlyBurn([conflict]))
      expect(monthlyBurn([kept])).toBe(8)
    })
  })

  describe('precedence', () => {
    it('prefers a price step over late, and late over conflict', () => {
      expect(
        triageState(makeSeries({ status: 'overdue', memoRecurring: false, ...withHistory(8, 12) }), TODAY),
      ).toBe('price-up')
      expect(triageState(makeSeries({ status: 'overdue', memoRecurring: false }), TODAY)).toBe('late')
    })
  })
})

describe('needsReviewCount', () => {
  it('counts price-up, price-down, late and conflict but not stopped', () => {
    const list = [
      makeSeries(withHistory(8, 12)), // price-up
      makeSeries(withHistory(12, 8)), // price-down
      makeSeries({ status: 'overdue' }), // late
      makeSeries({ memoRecurring: false }), // conflict
      stoppedWeekly('2026-10-05'), // stopped (recent), has its own card
      makeSeries(), // healthy
    ]
    expect(needsReviewCount(list, TODAY)).toBe(4)
  })

  it('does not count dismissed series, however they would otherwise be flagged', () => {
    const dismissedAt = '2026-10-10T12:00:00.000Z'
    const list = [
      makeSeries({ status: 'overdue', dismissedAt }),
      makeSeries({ memoRecurring: false, dismissedAt }),
      makeSeries({ ...withHistory(8, 12), dismissedAt }),
      makeSeries(),
    ]
    expect(needsReviewCount(list, TODAY)).toBe(0)
  })

  it('counts the same flagged series once it is not dismissed, so dismissal is what removed it', () => {
    expect(needsReviewCount([makeSeries({ status: 'overdue' })], TODAY)).toBe(1)
    expect(
      needsReviewCount([makeSeries({ status: 'overdue', dismissedAt: '2026-10-10T12:00:00.000Z' })], TODAY),
    ).toBe(0)
  })

  it('counts one per series even when several issues apply', () => {
    expect(
      needsReviewCount(
        [makeSeries({ status: 'overdue', memoRecurring: false, ...withHistory(8, 12) })],
        TODAY,
      ),
    ).toBe(1)
  })

  it('returns 0 for an empty list', () => {
    expect(needsReviewCount([], TODAY)).toBe(0)
  })
})

describe('monthlyAmount', () => {
  const amount = (monthlyNormalized: number) => monthlyAmount(makeSeries({ monthlyNormalized }))

  it('rounds half up on the decimal the API shows, not the binary double', () => {
    expect(amount(1.005)).toBe(1.01) // 1.005 * 100 is 100.49999999999999
    expect(amount(2.675)).toBe(2.68)
    expect(amount(0.334)).toBe(0.33)
    expect(amount(0.1 + 0.2)).toBe(0.3)
  })

  it('handles zero, negatives and non-finite input', () => {
    expect(amount(0)).toBe(0)
    expect(Object.is(amount(0), 0)).toBe(true)
    expect(Object.is(amount(-0.001), 0)).toBe(true) // rounds to zero cents; must not render as -0
    expect(amount(-1.005)).toBe(-1.01)
    expect(amount(Number.NaN)).toBe(0)
    expect(amount(Number.POSITIVE_INFINITY)).toBe(0)
  })

  it('sums, across a set of rows, to exactly monthlyBurn', () => {
    const list = [(9.99 * 30.44) / 7, (15.49 * 30.44) / 14, 0.334, 0.334, 1.005, 0.1, 0.2].map(
      (monthlyNormalized) => makeSeries({ monthlyNormalized }),
    )
    const rowsInCents = list.reduce((sum, s) => sum + Math.round(monthlyAmount(s) * 100), 0)
    expect(monthlyBurn(list)).toBe(rowsInCents / 100)
    // Each row is itself a whole number of cents.
    for (const s of list) expect(monthlyAmount(s)).toBe(Number(monthlyAmount(s).toFixed(2)))
  })
})

describe('monthlyBurn', () => {
  it('excludes stopped series but still counts dismissed ones', () => {
    const list = [
      makeSeries({ monthlyNormalized: 10 }),
      makeSeries({ monthlyNormalized: 5.5 }),
      stoppedWeekly('2026-10-05', { monthlyNormalized: 100 }),
      makeSeries({ monthlyNormalized: 1000, dismissedAt: '2026-10-10T12:00:00.000Z' }),
    ]
    expect(monthlyBurn(list)).toBe(1015.5)
  })

  it('counts a dismissed-but-active series: dismissal silences the lane, not the ledger', () => {
    const dismissedAt = '2026-10-10T12:00:00.000Z'
    expect(monthlyBurn([makeSeries({ monthlyNormalized: 12 })])).toBe(12)
    expect(monthlyBurn([makeSeries({ monthlyNormalized: 12, dismissedAt })])).toBe(12)
    expect(monthlyBurn([makeSeries({ monthlyNormalized: 12, status: 'overdue', dismissedAt })])).toBe(12)
  })

  it('does not count a dismissed-but-stopped series, because it is stopped', () => {
    const dismissedAt = '2026-10-10T12:00:00.000Z'
    expect(monthlyBurn([stoppedWeekly('2026-10-05', { monthlyNormalized: 12, dismissedAt })])).toBe(0)
  })

  it('includes overdue series, which are still live subscriptions', () => {
    expect(monthlyBurn([makeSeries({ status: 'overdue', monthlyNormalized: 7 })])).toBe(7)
  })

  it('equals the sum of the displayed per-month figures', () => {
    // Each row shows its figure to the cent; the headline must be the sum of what is shown.
    const list = [0.334, 0.334, 0.334].map((monthlyNormalized) => makeSeries({ monthlyNormalized }))
    const displayedCents = list.reduce((sum, s) => sum + Math.round(monthlyAmount(s) * 100), 0)
    expect(displayedCents).toBe(99)
    expect(monthlyBurn(list)).toBe(0.99) // not 1.00, which rounding the raw sum would give
  })

  it('is not subject to float drift', () => {
    const tenths = Array.from({ length: 10 }, () => makeSeries({ monthlyNormalized: 0.1 }))
    expect(monthlyBurn(tenths)).toBe(1)
    expect(
      monthlyBurn([makeSeries({ monthlyNormalized: 0.1 }), makeSeries({ monthlyNormalized: 0.2 })]),
    ).toBe(0.3)
  })

  it('rounds the realistic many-decimal normalisation of each row first', () => {
    // 9.99 * 30.44 / 7 and friends are never clean cents.
    const list = [(9.99 * 30.44) / 7, (15.49 * 30.44) / 14, (120 * 30.44) / 365.25].map((monthlyNormalized) =>
      makeSeries({ monthlyNormalized }),
    )
    const expected = list.reduce((sum, s) => sum + Math.round(monthlyAmount(s) * 100), 0) / 100
    expect(monthlyBurn(list)).toBe(expected)
    expect(Number.isInteger(Math.round(monthlyBurn(list) * 100))).toBe(true)
    expect(monthlyBurn(list)).toBe(Number(monthlyBurn(list).toFixed(2)))
  })

  it('returns 0 for an empty list', () => {
    expect(monthlyBurn([])).toBe(0)
  })
})

describe('stoppedSavings', () => {
  it('totals the monthly figures of stopped series, cent-exact, however long ago they stopped', () => {
    const list = [
      stoppedWeekly('2026-10-05', { monthlyNormalized: 0.1 }),
      stoppedWeekly('2025-01-05', { monthlyNormalized: 0.2 }), // long stopped, out of the lane, still saved
      makeSeries({ monthlyNormalized: 50 }),
      makeSeries({ status: 'overdue', monthlyNormalized: 60 }),
    ]
    expect(stoppedSavings(list)).toBe(0.3)
  })

  it('includes dismissed-but-stopped series: it is still money no longer going out', () => {
    const list = [
      stoppedWeekly('2026-10-05', { monthlyNormalized: 4 }),
      stoppedWeekly('2026-10-05', { monthlyNormalized: 90, dismissedAt: '2026-10-10T12:00:00.000Z' }),
    ]
    expect(stoppedSavings(list)).toBe(94)
  })

  it('does not count a dismissed-but-active series as a saving', () => {
    const list = [makeSeries({ monthlyNormalized: 90, dismissedAt: '2026-10-10T12:00:00.000Z' })]
    expect(stoppedSavings(list)).toBe(0)
  })

  it('returns 0 when nothing has stopped', () => {
    expect(stoppedSavings([makeSeries()])).toBe(0)
  })
})

describe('burnByCategory', () => {
  it('groups a null budgetCategory under Uncategorized', () => {
    const rows = burnByCategory([makeSeries({ budgetCategory: null, monthlyNormalized: 10 })])
    expect(rows).toEqual([{ category: 'Uncategorized', amount: 10, pct: 100 }])
  })

  it('merges null with other uncategorised rows and sums per category', () => {
    const rows = burnByCategory([
      makeSeries({ budgetCategory: 'Media', monthlyNormalized: 30 }),
      makeSeries({ budgetCategory: 'Media', monthlyNormalized: 10 }),
      makeSeries({ budgetCategory: null, monthlyNormalized: 10 }),
    ])
    expect(rows).toEqual([
      { category: 'Media', amount: 40, pct: 80 },
      { category: 'Uncategorized', amount: 10, pct: 20 },
    ])
  })

  it('sorts by amount descending, then by name', () => {
    const rows = burnByCategory([
      makeSeries({ budgetCategory: 'B', monthlyNormalized: 5 }),
      makeSeries({ budgetCategory: 'A', monthlyNormalized: 5 }),
      makeSeries({ budgetCategory: 'C', monthlyNormalized: 9 }),
    ])
    expect(rows.map((r) => r.category)).toEqual(['C', 'A', 'B'])
  })

  it('excludes stopped series but keeps dismissed ones, so the rows sum to monthlyBurn', () => {
    const list = [
      makeSeries({ budgetCategory: 'Media', monthlyNormalized: 0.334 }),
      makeSeries({ budgetCategory: 'Media', monthlyNormalized: 0.334 }),
      makeSeries({ budgetCategory: 'Tools', monthlyNormalized: 0.334 }),
      stoppedWeekly('2026-10-05', { budgetCategory: 'Gone', monthlyNormalized: 40 }),
      makeSeries({
        budgetCategory: 'Hidden',
        monthlyNormalized: 40,
        dismissedAt: '2026-10-10T12:00:00.000Z',
      }),
    ]
    const rows = burnByCategory(list)
    expect(rows.map((r) => r.category)).toEqual(['Hidden', 'Media', 'Tools'])
    const summedCents = rows.reduce((sum, r) => sum + Math.round(r.amount * 100), 0)
    expect(summedCents / 100).toBe(monthlyBurn(list))
    expect(rows.find((r) => r.category === 'Media')?.amount).toBe(0.66)
    expect(rows.find((r) => r.category === 'Hidden')?.amount).toBe(40)
  })

  it('keeps the rows summing to monthlyBurn with dismissed series present, active and stopped', () => {
    const dismissedAt = '2026-10-10T12:00:00.000Z'
    const list = [
      makeSeries({ budgetCategory: 'Media', monthlyNormalized: 0.334 }),
      makeSeries({ budgetCategory: 'Media', monthlyNormalized: 0.334, dismissedAt }),
      makeSeries({ budgetCategory: null, monthlyNormalized: 0.334, dismissedAt }),
      makeSeries({ budgetCategory: 'Tools', monthlyNormalized: 20, status: 'overdue', dismissedAt }),
      stoppedWeekly('2026-10-05', { budgetCategory: 'Gone', monthlyNormalized: 40, dismissedAt }),
    ]
    const rows = burnByCategory(list)
    expect(rows.map((r) => r.category)).toEqual(['Tools', 'Media', 'Uncategorized'])
    const summedCents = rows.reduce((sum, r) => sum + Math.round(r.amount * 100), 0)
    expect(summedCents / 100).toBe(monthlyBurn(list))
    expect(monthlyBurn(list)).toBe(20.99)
    expect(rows.reduce((sum, r) => sum + r.pct, 0)).toBeCloseTo(100, 10)
  })

  it('computes pct as a share of the total', () => {
    const rows = burnByCategory([
      makeSeries({ budgetCategory: 'A', monthlyNormalized: 1 }),
      makeSeries({ budgetCategory: 'B', monthlyNormalized: 3 }),
    ])
    expect(rows).toEqual([
      { category: 'B', amount: 3, pct: 75 },
      { category: 'A', amount: 1, pct: 25 },
    ])
  })

  it('leaves pct unrounded', () => {
    const rows = burnByCategory([
      makeSeries({ budgetCategory: 'A', monthlyNormalized: 1 }),
      makeSeries({ budgetCategory: 'B', monthlyNormalized: 2 }),
    ])
    expect(rows[0].pct).toBeCloseTo(66.666666667, 8) // 66.67 would fail
    expect(rows[1].pct).toBeCloseTo(33.333333333, 8) // 33.33 would fail
  })

  it('returns no rows, and no NaN pct, when there is nothing to total', () => {
    expect(burnByCategory([])).toEqual([])
    expect(burnByCategory([makeSeries({ monthlyNormalized: 0 })])).toEqual([
      { category: 'Entertainment', amount: 0, pct: 0 },
    ])
  })
})

describe('formatSeriesDate', () => {
  it('renders the calendar date, not the UTC instant', () => {
    // new Date('2026-10-03') is UTC midnight, which is 2 Oct in America/New_York.
    expect(formatSeriesDate('2026-10-03')).toBe('3 Oct')
  })

  it('renders every month of the year', () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    months.forEach((name, i) => {
      expect(formatSeriesDate(`2026-${String(i + 1).padStart(2, '0')}-09`)).toBe(`9 ${name}`)
    })
  })

  it('does not shift the first or last day of a month or year', () => {
    expect(formatSeriesDate('2026-01-01')).toBe('1 Jan')
    expect(formatSeriesDate('2026-12-31')).toBe('31 Dec')
    expect(formatSeriesDate('2026-03-01')).toBe('1 Mar')
  })

  it('does not strip or pad the day number', () => {
    expect(formatSeriesDate('2026-10-09')).toBe('9 Oct')
    expect(formatSeriesDate('2026-10-10')).toBe('10 Oct')
  })

  it('returns an unparseable value unchanged rather than throwing or showing Invalid Date', () => {
    expect(formatSeriesDate('')).toBe('')
    expect(formatSeriesDate('not a date')).toBe('not a date')
    expect(formatSeriesDate('2026-13-01')).toBe('2026-13-01')
    expect(formatSeriesDate('2026-00-10')).toBe('2026-00-10')
    expect(formatSeriesDate('2026-02-31')).toBe('2026-02-31') // not a real calendar date
    expect(formatSeriesDate('2026-04-31')).toBe('2026-04-31')
  })

  it('runs under America/New_York, as the npm script guarantees', () => {
    expect(process.env.TZ).toBe('America/New_York')
    expect(new Date('2026-10-03').getDate()).toBe(2) // the trap this function exists to avoid
  })
})
