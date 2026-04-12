/**
 * Simple key-mapping for payloads that don't need per-field logic (e.g. memo updates).
 * Transaction updates use their own mapping in `updateTransaction.ts` because fields
 * like `memo_id`, `budget_category`, and `is_split` need special null/type handling.
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

export const memoFieldMapping: Record<string, string> = {
  budget_category: 'budgetCategory',
}
