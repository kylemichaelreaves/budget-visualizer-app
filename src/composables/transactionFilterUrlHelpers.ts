import { urlHasTimeframe } from '@composables/activePeriodFromStore'
import { parsePositiveIntId } from '@utils/parsePositiveIntId'

/** Query keys written by store→URL sync; keep aligned with filter UI. */
export const TRANSACTION_TABLE_FILTER_URL_PARAMS = [
  'day',
  'week',
  'month',
  'year',
  'memoId',
  'memoName',
  /** Legacy alias; migrated to `memoId` or `memoName` and dropped from the URL. */
  'memo',
  'budgetCategory',
] as const

export function isBareTransactionsRoute(pathname: string): boolean {
  return /\/transactions\/?$/.test(pathname)
}

/** Month/week summary routes embed the period in the path; filter query strings belong on the main transactions list. */
const TRANSACTIONS_SUMMARY_FILTER_PATH = /\/transactions\/(?:months|weeks)\/[^/]+\/summary\/?$/

export function pathForTransactionFilterSync(pathname: string): string {
  if (TRANSACTIONS_SUMMARY_FILTER_PATH.test(pathname)) {
    return pathname.replace(TRANSACTIONS_SUMMARY_FILTER_PATH, '/transactions')
  }
  return pathname
}

/** Reject empty, NaN, non-positive, or non-integer IDs (`?memoId=` is meaningless; absent param is `null`). */
export function memoIdQueryParamInvalid(raw: string | null): boolean {
  if (raw == null) return false
  return parsePositiveIntId(raw) == null
}

/**
 * If `memo` is present, remove it and set `memoId` or `memoName` when appropriate
 * (same rules as URL sync). Mutates `sp`.
 */
export function applyLegacyMemoParamMigration(sp: URLSearchParams): void {
  const legacyMemoParam = sp.get('memo')
  if (legacyMemoParam === null) return

  sp.delete('memo')
  const hasTimeframe = urlHasTimeframe(sp)
  const existingMemoId = sp.get('memoId')
  const hasMemoId = existingMemoId != null && existingMemoId !== ''
  const existingMemoName = (sp.get('memoName') ?? '').trim()
  if (!hasTimeframe && !hasMemoId && !existingMemoName) {
    const t = legacyMemoParam.trim()
    if (t) {
      const id = parsePositiveIntId(t)
      if (id != null && String(id) === t) sp.set('memoId', String(id))
      else sp.set('memoName', t)
    }
  }
}
