import type { JSX } from 'solid-js'
import { Button } from '@components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog'

/**
 * Confirms a category delete. The backend removes the whole subtree and sets
 * `budget_category = NULL` on every memo and transaction under it, with no undo,
 * so a single click must never get there.
 */
export default function BudgetCategoryDeleteDialog(props: {
  open: boolean
  nodeLabel: string
  descendantCount: number
  onConfirm: () => void
  onCancel: () => void
}): JSX.Element {
  const subcategories = () =>
    props.descendantCount === 1 ? '1 subcategory' : `${props.descendantCount} subcategories`

  return (
    <Dialog open={props.open} onOpenChange={(open) => !open && props.onCancel()}>
      <DialogContent class="sm:max-w-md bg-card text-foreground" data-testid="budget-category-delete-dialog">
        <DialogHeader>
          <DialogTitle>Delete “{props.nodeLabel}”?</DialogTitle>
          <DialogDescription>
            {props.descendantCount > 0 ? `This also deletes its ${subcategories()}. ` : ''}
            Every memo and transaction in {props.descendantCount > 0 ? 'them' : 'it'} will become
            uncategorized. This can’t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => props.onCancel()}
            data-testid="budget-category-delete-cancel"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => props.onConfirm()}
            data-testid="budget-category-delete-confirm"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
