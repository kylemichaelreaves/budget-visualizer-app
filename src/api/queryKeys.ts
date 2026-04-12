/**
 * Central TanStack Query keys. Use builders for `useQuery` / `useInfiniteQuery`;
 * use `.all` / root tuples for prefix invalidation.
 */
export const queryKeys = {
  transactions: {
    all: ['transactions'] as const,
    infinite: (limit: number, memoKey: string, tf: string, date: string) =>
      ['transactions', limit, memoKey, tf, date] as const,
    summaries: (tf: string, summary: boolean, summaryType: string) =>
      ['transactions', 'summaries', tf, summary, summaryType] as const,
  },
  transactionsCount: {
    all: ['transactions-count'] as const,
    detail: (st: string, tf: unknown, date: unknown, memoKey: string) =>
      ['transactions-count', st, tf, date, memoKey] as const,
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
  weekSummary: (week: string) => ['week-summary', week] as const,
  monthSummary: (month: string) => ['month-summary', month] as const,
  user: ['user'] as const,
  userDetail: (userId: number | undefined) => ['user', userId] as const,
  address: (id: string, fetchURL: string) => ['address', id, fetchURL] as const,
} as const
