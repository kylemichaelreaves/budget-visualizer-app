import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library'
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

function renderNode(onMutate = vi.fn().mockResolvedValue({ ok: true })) {
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

// #84: a failed rename or add used to close its editor and throw away what was typed.
describe('BudgetCategoryTreeNode editors on a failed save', () => {
  const failure = { ok: false, message: 'A category with that name already exists.' }

  it('keeps the rename editor open with the typed name and shows the reason', async () => {
    const onMutate = renderNode(vi.fn().mockResolvedValue(failure))
    fireEvent.click(screen.getByRole('button', { name: 'Rename Restaurants' }))
    const input = screen.getByDisplayValue('Restaurants')
    fireEvent.input(input, { target: { value: 'Dining' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm rename' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(failure.message))
    expect(onMutate).toHaveBeenCalledExactlyOnceWith({
      operation: 'rename',
      path: ['Food', 'Restaurants'],
      newName: 'Dining',
    })
    expect(screen.getByDisplayValue('Dining')).toBeInTheDocument()
  })

  it('closes the rename editor once the save succeeds', async () => {
    renderNode()
    fireEvent.click(screen.getByRole('button', { name: 'Rename Restaurants' }))
    fireEvent.input(screen.getByDisplayValue('Restaurants'), { target: { value: 'Dining' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm rename' }))

    await waitFor(() => expect(screen.queryByDisplayValue('Dining')).not.toBeInTheDocument())
  })

  it('keeps the add-child form open with the typed name and shows the reason', async () => {
    renderNode(vi.fn().mockResolvedValue(failure))
    fireEvent.click(screen.getByRole('button', { name: 'Add child to Restaurants' }))
    const input = screen.getByPlaceholderText('New subcategory of Restaurants...')
    fireEvent.input(input, { target: { value: 'Takeout' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm add' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(failure.message))
    expect(screen.getByDisplayValue('Takeout')).toBeInTheDocument()
  })

  it('closes the add-child form once the save succeeds', async () => {
    renderNode()
    fireEvent.click(screen.getByRole('button', { name: 'Add child to Restaurants' }))
    fireEvent.input(screen.getByPlaceholderText('New subcategory of Restaurants...'), {
      target: { value: 'Takeout' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm add' }))

    await waitFor(() =>
      expect(screen.queryByPlaceholderText('New subcategory of Restaurants...')).not.toBeInTheDocument(),
    )
  })
})
