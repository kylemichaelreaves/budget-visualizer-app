import { describe, expect, it } from 'vitest'
import { mutationErrorMessage } from '@components/budgetCategories/budgetCategoriesPageUtils'

describe('mutationErrorMessage', () => {
  it('formats Error message for add', () => {
    const op = { operation: 'add' as const, path: [] as string[], name: 'Food' }
    expect(mutationErrorMessage(op, new Error('Network down'))).toBe('Failed to add category: Network down')
  })

  it('formats rename operation', () => {
    const op = { operation: 'rename' as const, path: ['A'], newName: 'B' }
    expect(mutationErrorMessage(op, new Error('bad'))).toBe('Failed to rename category: bad')
  })

  it('uses fallback for non-Error', () => {
    const op = { operation: 'delete' as const, path: ['X'] }
    expect(mutationErrorMessage(op, 'oops')).toBe('Failed to delete category: An unexpected error occurred')
  })
})
