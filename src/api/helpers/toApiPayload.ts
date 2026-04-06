/**
 * Converts an object's keys from frontend snake_case to the camelCase keys the API expects,
 * using the provided field mapping. Keys not in the mapping are passed through unchanged.
 */
export function toApiPayload(
  data: Record<string, unknown>,
  fieldMapping: Record<string, string>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    const mappedKey = fieldMapping[key] ?? key
    payload[mappedKey] = value
  }
  return payload
}

export const transactionFieldMapping: Record<string, string> = {
  transaction_number: 'transactionNumber',
  amount_debit: 'amountDebit',
  amount_credit: 'amountCredit',
  check_number: 'checkNumber',
  memo_id: 'memoId',
  budget_category: 'budgetCategory',
  is_split: 'isSplit',
}

export const memoFieldMapping: Record<string, string> = {
  budget_category: 'budgetCategory',
}
