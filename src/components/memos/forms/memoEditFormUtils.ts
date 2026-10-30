import type { Frequency, Memo, MemoUpdateInput } from '@types'
import { FREQUENCY_VALUES, NOT_RECURRING_VALUE, recurrenceFields } from '@components/memos/memoRecurrence'

export type MemoEditFormState = {
  id: number
  name: string
  necessary: boolean
  ambiguous: boolean
  frequency: Frequency | ''
  budget_category: string | null
}

const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
}

/**
 * Blank first. There is no separate recurring checkbox: picking a frequency is
 * what makes a memo recurring, and choosing the blank option is what stops it.
 */
export const MEMO_EDIT_FREQUENCY_OPTIONS: { value: Frequency | ''; label: string }[] = [
  { value: NOT_RECURRING_VALUE, label: 'Not recurring' },
  ...FREQUENCY_VALUES.map((value) => ({ value, label: FREQUENCY_LABELS[value] })),
]

export function memoToFormState(memo: Memo): MemoEditFormState {
  return {
    id: memo.id,
    name: memo.name,
    necessary: memo.necessary,
    ambiguous: memo.ambiguous,
    frequency: memo.frequency ?? '',
    budget_category: memo.budget_category ?? null,
  }
}

export function buildMemoUpdateInput(form: MemoEditFormState, trimmedName: string): MemoUpdateInput {
  return {
    id: form.id,
    name: trimmedName,
    necessary: form.necessary,
    ambiguous: form.ambiguous,
    ...recurrenceFields(form.frequency === NOT_RECURRING_VALUE ? null : form.frequency),
    budgetCategory: form.budget_category,
  }
}
