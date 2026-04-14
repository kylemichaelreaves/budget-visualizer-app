import type { Frequency, Memo, MemoUpdateInput } from '@types'

export type MemoEditFormState = {
  id: number
  name: string
  recurring: boolean
  necessary: boolean
  ambiguous: boolean
  frequency: Frequency | ''
  budget_category: string | null
}

export const MEMO_EDIT_FREQUENCY_OPTIONS: { value: Frequency | ''; label: string }[] = [
  { value: '', label: '\u2014' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

export function memoToFormState(memo: Memo): MemoEditFormState {
  return {
    id: memo.id,
    name: memo.name,
    recurring: memo.recurring,
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
    recurring: form.recurring,
    necessary: form.necessary,
    ambiguous: form.ambiguous,
    frequency: form.frequency === '' ? null : form.frequency,
    budgetCategory: form.budget_category,
  }
}
