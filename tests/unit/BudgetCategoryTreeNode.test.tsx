import { fireEvent, render, screen } from '@solidjs/testing-library'
import { describe, expect, it, vi } from 'vitest'
import type { CategoryNode } from '@types'
import BudgetCategoryTreeNode from '@components/budgetCategories/BudgetCategoryTreeNode'
import { countDescendants } from '@components/budgetCategories/budgetCategoryTreeUtils'

const food: CategoryNode = {
  label: 'Food',
  value: 'Food',
  children: [
    {
      label: 'Groceries',
      value: 'Food - Groceries',
      children: [{ label: 'Produce', value: 'Food - Groceries - Produce' }],
    },
    { label: 'Restaurants', value: 'Food - Restaurants' },
  ],
}

function renderNode(onMutate = vi.fn().mockResolvedValue(undefined)) {
  render(() => <BudgetCategoryTreeNode node={food} depth={0} onMutate={onMutate} mutatingPaths={new Set()} />)
  return onMutate
}

describe('countDescendants', () => {
  it('counts every node below, at any depth', () => {
    expect(countDescendants(food)).toBe(3)
    expect(countDescendants({ label: 'Leaf', value: 'Leaf' })).toBe(0)
  })
})

// #71: the backend cascades a delete to the whole subtree and un-categorises
// every memo and transaction in it, so the trash button must only ask.
describe('BudgetCategoryTreeNode delete', () => {
  it('opens a confirmation instead of deleting', () => {
    const onMutate = renderNode()
    fireEvent.click(screen.getByRole('button', { name: 'Delete Food' }))

    expect(onMutate).not.toHaveBeenCalled()
    expect(screen.getByTestId('budget-category-delete-dialog')).toHaveTextContent(
      /also deletes its 3 subcategories.*uncategorized/,
    )
  })

  it('deletes the subtree once confirmed', () => {
    const onMutate = renderNode()
    fireEvent.click(screen.getByRole('button', { name: 'Delete Food' }))
    fireEvent.click(screen.getByTestId('budget-category-delete-confirm'))

    expect(onMutate).toHaveBeenCalledExactlyOnceWith({ operation: 'delete', path: ['Food'] })
    expect(screen.queryByTestId('budget-category-delete-dialog')).not.toBeInTheDocument()
  })

  it('does nothing when cancelled', () => {
    const onMutate = renderNode()
    fireEvent.click(screen.getByRole('button', { name: 'Delete Food' }))
    fireEvent.click(screen.getByTestId('budget-category-delete-cancel'))

    expect(onMutate).not.toHaveBeenCalled()
    expect(screen.queryByTestId('budget-category-delete-dialog')).not.toBeInTheDocument()
  })

  it('does nothing on Escape', () => {
    const onMutate = renderNode()
    fireEvent.click(screen.getByRole('button', { name: 'Delete Food' }))
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    expect(onMutate).not.toHaveBeenCalled()
    expect(screen.queryByTestId('budget-category-delete-dialog')).not.toBeInTheDocument()
  })

  it('confirms a leaf delete without mentioning subcategories', () => {
    const onMutate = renderNode()
    fireEvent.click(screen.getByRole('button', { name: 'Delete Restaurants' }))
    const dialog = screen.getByTestId('budget-category-delete-dialog')
    expect(dialog).not.toHaveTextContent(/subcategor/)
    fireEvent.click(screen.getByTestId('budget-category-delete-confirm'))
    expect(onMutate).toHaveBeenCalledExactlyOnceWith({ operation: 'delete', path: ['Food', 'Restaurants'] })
  })
})
