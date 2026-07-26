/**
 * Central TanStack Query keys. Use builders for `useQuery` / `useInfiniteQuery`;
 * use `.all` / root tuples for prefix invalidation.
 */
export const queryKeys = {
  transactions: {
    all: ['transactions'] as const,
    infinite: (
      limit: number,
      memoKey: string,
      tf: string | undefined,
      date: string | undefined,
      budgetCategory?: string | null,
    ) => ['transactions', limit, memoKey, tf, date, budgetCategory] as const,
    csv: ['transactions', 'csv'] as const,
  },
  transactionsCount: {
    all: ['transactions-count'] as const,
    detail: (st: string, tf: unknown, date: unknown, memoKey: string, budgetCategory?: string | null) =>
      ['transactions-count', st, tf, date, memoKey, budgetCategory] as const,
  },
  transaction: {
    detail: (id: number | undefined) => ['transaction', id] as const,
  },
  memo: {
    all: ['memo'] as const,
    byIdOrName: (id: number | null, name: string | null) => ['memo', { id, name }] as const,
  },
  memoSummary: {
    all: ['memo-summary'] as const,
    detail: (memoId: number | undefined) => ['memo-summary', memoId] as const,
  },
  memos: {
    all: ['memos'] as const,
    infinite: (limit: number) => ['memos', limit] as const,
    search: (searchQuery: string) => ['memos', 'search', searchQuery] as const,
  },
  memoTransactions: {
    all: ['memo-transactions'] as const,
    page: (memoId: number | undefined, limit: number, offset: number) =>
      ['memo-transactions', memoId, limit, offset] as const,
  },
  memosCount: ['memos-count'] as const,
  pendingTransactions: {
    all: ['pending-transactions'] as const,
    list: (limit: number, memoKey: string, status: string) =>
      ['pending-transactions', limit, memoKey, status] as const,
  },
  pendingTransaction: {
    detail: (id: number | undefined) => ['pending-transaction', id] as const,
  },
  budgetCategorySummary: {
    all: ['budget-category-summary'] as const,
    detail: (timeFrame: string, date: string, memoKey: string) =>
      ['budget-category-summary', timeFrame, date, memoKey] as const,
  },
  historicalSummaryForBudgetCategory: {
    all: ['historical-summary-for-budget-category'] as const,
    detail: (budgetCategory: string, timeFrame: string, date: string, memoKey: string) =>
      ['historical-summary-for-budget-category', budgetCategory, timeFrame, date, memoKey] as const,
  },
  budgetCategories: {
    all: ['budgetCategories'] as const,
    list: (flatten: boolean, tf: string | undefined, d: string | undefined) =>
      ['budgetCategories', flatten, tf, d] as const,
  },
  weekSummary: {
    all: ['week-summary'] as const,
    detail: (week: string) => ['week-summary', week] as const,
  },
  monthSummary: {
    all: ['month-summary'] as const,
    detail: (month: string) => ['month-summary', month] as const,
  },
  timeUnits: {
    all: ['time-units'] as const,
    days: ['time-units', 'days'] as const,
    months: ['time-units', 'months'] as const,
    weeks: ['time-units', 'weeks'] as const,
    years: ['time-units', 'years'] as const,
  },
  dailyTotalAmountDebitForInterval: {
    all: ['daily-total-amount-debit-for-interval'] as const,
    detail: (interval: string, startDate: string, memoKey: string) =>
      ['daily-total-amount-debit-for-interval', interval, startDate, memoKey] as const,
  },
  sumAmountDebitByDate: {
    all: ['sum-amount-debit-by-date'] as const,
    detail: (timeFrame: string, date: string) => ['sum-amount-debit-by-date', timeFrame, date] as const,
  },
  isIntervalGreaterThanOldestDate: (interval: string) =>
    ['is-interval-greater-than-oldest-date', interval] as const,
} as const

/** TanStack mutation keys (devtools / dedupe); not used for cache invalidation prefixes. */
export const mutationKeys = {
  login: ['login'] as const,
  passwordResetRequest: ['password-reset-request'] as const,
  passwordResetConfirm: ['password-reset-confirm'] as const,
  passwordChange: ['password-change'] as const,
  createTransaction: ['create-transaction'] as const,
  createCsvImport: ['create-csv-import'] as const,
  mutateTransaction: ['mutate-transaction'] as const,
  mutatePendingTransaction: ['mutate-pending-transaction'] as const,
  mutateMemo: ['mutate-memo'] as const,
  createUser: ['create-user'] as const,
} as const
