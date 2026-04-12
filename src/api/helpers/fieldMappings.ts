/**
 * Canonical snake_case ↔ camelCase field pairs for the API boundary.
 * Each entry is [snakeCase, camelCase]. Keys not listed here are
 * identical in both conventions (e.g. "date", "memo", "id").
 *
 * Used by updateTransaction (snake→camel), E2E mocks (camel→snake),
 * and any future mapping needs. Defined once to prevent drift.
 */
export const FIELD_PAIRS: ReadonlyArray<readonly [snake: string, camel: string]> = [
  ['transaction_number', 'transactionNumber'],
  ['amount_debit', 'amountDebit'],
  ['amount_credit', 'amountCredit'],
  ['check_number', 'checkNumber'],
  ['memo_id', 'memoId'],
  ['budget_category', 'budgetCategory'],
  ['is_split', 'isSplit'],
  ['total_amount_debit', 'totalAmountDebit'],
  ['transactions_count', 'transactionsCount'],
  ['avatar_s3_url', 'avatarS3Url'],
]

/** Lookup: snake_case → camelCase */
export const snakeToCamelMap: ReadonlyMap<string, string> = new Map(FIELD_PAIRS.map(([s, c]) => [s, c]))

/** Lookup: camelCase → snake_case */
export const camelToSnakeMap: ReadonlyMap<string, string> = new Map(FIELD_PAIRS.map(([s, c]) => [c, s]))

/** Map object keys from snake_case to camelCase. Unmapped keys pass through. */
export function mapSnakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    out[snakeToCamelMap.get(key) ?? key] = value
  }
  return out
}

/** Map object keys from camelCase to snake_case. Unmapped keys pass through. */
export function mapCamelToSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    out[camelToSnakeMap.get(key) ?? key] = value
  }
  return out
}
