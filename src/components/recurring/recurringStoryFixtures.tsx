/**
 * Shared Storybook fixtures for the recurring-payments components. Not used by the app.
 *
 * The data is built relative to a `today`, so the page story stays meaningful whenever it is
 * opened: a "late" series is always a few days overdue, and a recently stopped one is always
 * inside the review lane. The component stories pin `FIXTURE_TODAY` so they never drift.
 *
 * Date shapes follow `RecurringSeries`: `firstDate` / `lastDate` / `nextExpectedDate` and
 * `amountHistory[].date` are plain `YYYY-MM-DD` calendar strings; `dismissedAt` / `detectedAt`
 * are ISO-8601 instants.
 */
import type { JSX } from 'solid-js'
import { MemoryRouter, Route } from '@solidjs/router'
import type { RecurringAmountPoint, RecurringCadence, RecurringSeries } from '@types'

/** The clock pinned by the component stories. The page story uses the real one. */
export const FIXTURE_TODAY = '2026-10-20'

const MS_PER_DAY = 86_400_000

function parts(isoDate: string): { year: number; month: number; day: number } {
  const [year, month, day] = isoDate.split('-').map(Number)
  return { year, month, day }
}

function format(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Calendar-day arithmetic in UTC, so it is independent of the viewer's timezone and DST. */
export function addDays(isoDate: string, days: number): string {
  const { year, month, day } = parts(isoDate)
  return format(new Date(Date.UTC(year, month - 1, day) + days * MS_PER_DAY))
}

/** Calendar-month arithmetic that clamps to the end of a short month (31 Jan + 1 month = 28 Feb). */
export function addMonths(isoDate: string, months: number): string {
  const { year, month, day } = parts(isoDate)
  const firstOfTarget = new Date(Date.UTC(year, month - 1 + months, 1))
  const lastDayOfTarget = new Date(
    Date.UTC(firstOfTarget.getUTCFullYear(), firstOfTarget.getUTCMonth() + 1, 0),
  ).getUTCDate()
  return format(
    new Date(
      Date.UTC(firstOfTarget.getUTCFullYear(), firstOfTarget.getUTCMonth(), Math.min(day, lastDayOfTarget)),
    ),
  )
}

/** One point per month, oldest first, the last on `lastDate`. */
export function monthlyHistory(lastDate: string, amounts: number[]): RecurringAmountPoint[] {
  return amounts.map((amount, i) => ({ date: addMonths(lastDate, i - (amounts.length - 1)), amount }))
}

const PER_MONTH: Record<RecurringCadence, number> = {
  weekly: 52 / 12,
  biweekly: 26 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
}

const toCents = (n: number) => Math.round(n * 100) / 100

interface SeriesSpec {
  id: number
  memoName: string | null
  budgetCategory: string | null
  cadence: RecurringCadence
  /** Oldest first; the last entry is the latest charge. */
  amounts: number[]
  /** Calendar date of the latest charge. */
  lastDate: string
  confidence: number
  status?: RecurringSeries['status']
  dismissedAt?: string | null
  memoRecurring?: boolean
  memoFrequency?: RecurringSeries['memoFrequency']
}

/** The date `n` cadences before `lastDate`, for building a history at any cadence. */
function stepBack(lastDate: string, cadence: RecurringCadence, n: number): string {
  switch (cadence) {
    case 'weekly':
      return addDays(lastDate, -7 * n)
    case 'biweekly':
      return addDays(lastDate, -14 * n)
    case 'monthly':
      return addMonths(lastDate, -n)
    case 'quarterly':
      return addMonths(lastDate, -3 * n)
    case 'yearly':
      return addMonths(lastDate, -12 * n)
  }
}

function build(spec: SeriesSpec, detectedAt: string): RecurringSeries {
  const { cadence, amounts, lastDate } = spec
  const history = amounts.map((amount, i) => ({
    date: stepBack(lastDate, cadence, amounts.length - 1 - i),
    amount,
  }))
  const latestAmount = amounts[amounts.length - 1]
  return {
    id: spec.id,
    memoId: 100 + spec.id,
    memoName: spec.memoName,
    avatarS3Url: null,
    cadence,
    confidence: spec.confidence,
    occurrenceCount: amounts.length,
    firstDate: history[0].date,
    lastDate,
    nextExpectedDate: stepBack(lastDate, cadence, -1),
    latestAmount,
    monthlyNormalized: toCents(latestAmount * PER_MONTH[cadence]),
    amountHistory: history,
    budgetCategory: spec.budgetCategory,
    status: spec.status ?? 'active',
    dismissedAt: spec.dismissedAt ?? null,
    detectedAt,
    memoRecurring: spec.memoRecurring ?? true,
    memoFrequency: spec.memoFrequency === undefined ? cadence : spec.memoFrequency,
  }
}

export interface RecurringFixture {
  /** Every row, in the API's order (largest monthly amount first), stopped rows interleaved. */
  all: RecurringSeries[]
  /** One series per triage state, for the lane stories. */
  priceUp: RecurringSeries
  priceDown: RecurringSeries
  late: RecurringSeries
  /** Detected yearly, memo says monthly. */
  conflictCadence: RecurringSeries
  /** Detected as recurring, memo says it is not. */
  conflictNotRecurring: RecurringSeries
  /** Conflict whose memo has no name, so accepting is disabled. */
  conflictNoName: RecurringSeries
  /** Stopped, still inside the review window. */
  stopped: RecurringSeries
}

/**
 * A realistic spread: live, late, stopped (one in the lane, one aged out of it), dismissed,
 * weak confidence, a nameless memo, and every cadence. `scannedAt` is the ISO instant of the
 * scan that wrote every row.
 */
export function buildRecurringFixture(today: string, scannedAt = `${today}T03:00:00.000Z`): RecurringFixture {
  const ago = (days: number) => addDays(today, -days)
  const make = (spec: SeriesSpec) => build(spec, scannedAt)

  const rent = make({
    id: 1,
    memoName: 'RENT PAYMENT',
    budgetCategory: 'Housing - Rent',
    cadence: 'monthly',
    amounts: [1650, 1650, 1650, 1650, 1650, 1650],
    lastDate: ago(5),
    confidence: 0.99,
  })
  const mealKit = make({
    id: 2,
    memoName: 'HELLOFRESH',
    budgetCategory: 'Food - Groceries',
    cadence: 'weekly',
    amounts: [71.88, 71.88, 71.88, 71.88, 71.88, 71.88],
    lastDate: ago(2),
    confidence: 0.91,
    memoRecurring: false,
    memoFrequency: null,
  })
  const autoInsurance = make({
    id: 3,
    memoName: 'STATE FARM AUTO',
    budgetCategory: 'Insurance - Auto',
    cadence: 'quarterly',
    amounts: [312.4, 312.4, 312.4, 312.4],
    lastDate: ago(41),
    confidence: 0.9,
  })
  const phone = make({
    id: 4,
    memoName: 'VERIZON WIRELESS',
    budgetCategory: 'Bills - Phone',
    cadence: 'monthly',
    amounts: [85, 85, 85, 85, 85, 85],
    lastDate: ago(14),
    confidence: 0.97,
  })
  const utilities = make({
    id: 5,
    memoName: 'CON EDISON',
    budgetCategory: 'Bills - Utilities',
    cadence: 'monthly',
    amounts: [94.2, 118.75, 141.3, 88.65, 102.4, 97.15],
    lastDate: ago(9),
    confidence: 0.88,
  })
  const adobe = make({
    id: 6,
    memoName: 'ADOBE CREATIVE CLOUD',
    budgetCategory: 'Software',
    cadence: 'monthly',
    amounts: [59.99, 59.99, 59.99, 59.99, 29.99],
    lastDate: ago(20),
    confidence: 0.95,
  })
  const gym = make({
    id: 7,
    memoName: 'PLANET FITNESS',
    budgetCategory: 'Health - Fitness',
    cadence: 'monthly',
    amounts: [24.99, 24.99, 24.99, 24.99, 24.99, 24.99],
    lastDate: ago(41),
    confidence: 0.93,
    status: 'overdue',
  })
  const netflix = make({
    id: 8,
    memoName: 'NETFLIX.COM',
    budgetCategory: 'Entertainment - Streaming',
    cadence: 'monthly',
    amounts: [13.99, 13.99, 15.49, 15.49, 17.99],
    lastDate: ago(12),
    confidence: 0.97,
  })
  const dropbox = make({
    id: 9,
    memoName: 'DROPBOX',
    budgetCategory: 'Software',
    cadence: 'monthly',
    amounts: [11.99, 11.99, 11.99, 11.99, 13.99],
    lastDate: ago(14),
    confidence: 0.96,
    dismissedAt: `${ago(6)}T09:14:00.000Z`,
  })
  const prime = make({
    id: 10,
    memoName: 'AMAZON PRIME*MEMBERSHIP',
    budgetCategory: 'Shopping',
    cadence: 'yearly',
    amounts: [139, 139],
    lastDate: ago(120),
    confidence: 0.81,
    memoFrequency: 'monthly',
  })
  const coffee = make({
    id: 11,
    memoName: 'BLUE BOTTLE COFFEE',
    budgetCategory: 'Food - Coffee',
    cadence: 'weekly',
    amounts: [5.25, 6.5, 5.25, 7.75, 6, 5.75, 4.95, 6.5],
    lastDate: ago(3),
    confidence: 0.52,
  })
  const spotify = make({
    id: 12,
    memoName: 'SPOTIFY USA',
    budgetCategory: 'Entertainment - Music',
    cadence: 'monthly',
    amounts: [11.99, 11.99, 11.99, 11.99, 11.99, 11.99],
    lastDate: ago(9),
    confidence: 0.98,
  })
  const disney = make({
    id: 13,
    memoName: 'DISNEY PLUS',
    budgetCategory: 'Entertainment - Streaming',
    cadence: 'monthly',
    amounts: [5.99, 5.99, 7.99, 10.99],
    lastDate: ago(97),
    confidence: 0.94,
    status: 'stopped',
  })
  const headspace = make({
    id: 14,
    memoName: 'HEADSPACE',
    budgetCategory: 'Health - Wellness',
    cadence: 'monthly',
    amounts: [12.99, 12.99, 12.99, 12.99, 12.99],
    lastDate: ago(250),
    confidence: 0.92,
    status: 'stopped',
  })
  const unnamed = make({
    id: 15,
    memoName: null,
    budgetCategory: null,
    cadence: 'monthly',
    amounts: [9.99, 9.99, 9.99, 9.99],
    lastDate: ago(17),
    confidence: 0.55,
    memoRecurring: false,
    memoFrequency: null,
  })

  const all = [
    rent,
    mealKit,
    autoInsurance,
    phone,
    utilities,
    adobe,
    gym,
    netflix,
    dropbox,
    prime,
    coffee,
    spotify,
    disney,
    headspace,
    unnamed,
  ].sort((a, b) => b.monthlyNormalized - a.monthlyNormalized)

  return {
    all,
    priceUp: netflix,
    priceDown: adobe,
    late: gym,
    conflictCadence: prime,
    conflictNotRecurring: mealKit,
    conflictNoName: unnamed,
    stopped: disney,
  }
}

/** The fixture at the pinned clock, for the component stories. */
export const fixture = buildRecurringFixture(FIXTURE_TODAY)

function WithRouter(props: { children: JSX.Element }) {
  return (
    <MemoryRouter root={(r) => r.children}>
      <Route path="/" component={() => props.children} />
    </MemoryRouter>
  )
}

/** Decorator for stories whose components render router links (the nameless conflict card). */
export const withRecurringRouter = (Story: () => JSX.Element) => (
  <WithRouter>
    <Story />
  </WithRouter>
)
