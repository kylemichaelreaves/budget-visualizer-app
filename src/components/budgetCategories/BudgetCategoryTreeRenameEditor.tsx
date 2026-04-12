import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { CheckIcon, XIcon } from './icons'
import { categoryTreeTestId } from './budgetCategoryTreeUtils'

export default function BudgetCategoryTreeRenameEditor(props: {
  pathValue: string
  renameValue: () => string
  onRenameValueChange: (v: string) => void
  renameError: () => string | null
  onConfirm: () => void
  onCancel: () => void
  onKeyDown: (e: KeyboardEvent) => void
}): JSX.Element {
  return (
    <div class="flex flex-col gap-1 flex-1 min-w-0">
      <div class="flex items-center gap-1">
        <Input
          type="text"
          value={props.renameValue()}
          onInput={(e) => {
            props.onRenameValueChange(e.currentTarget.value)
          }}
          onKeyDown={props.onKeyDown}
          autofocus
          class="h-7 text-sm flex-1 min-w-[80px]"
          data-testid={categoryTreeTestId('rename-input', props.pathValue)}
        />
        <Button
          variant="ghost"
          size="icon"
          class="size-7 text-green-600 hover:text-green-700"
          disabled={!props.renameValue().trim()}
          onClick={() => void props.onConfirm()}
          aria-label="Confirm rename"
          data-testid={categoryTreeTestId('rename-confirm', props.pathValue)}
        >
          <CheckIcon class="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="size-7 text-muted-foreground hover:text-foreground"
          onClick={() => props.onCancel()}
          aria-label="Cancel rename"
          data-testid={categoryTreeTestId('rename-cancel', props.pathValue)}
        >
          <XIcon class="size-3.5" />
        </Button>
      </div>
      <Show when={props.renameError()}>
        {(msg) => (
          <p
            class="text-destructive text-xs m-0"
            role="alert"
            data-testid={categoryTreeTestId('rename-validation-error', props.pathValue)}
          >
            {msg()}
          </p>
        )}
      </Show>
    </div>
  )
}
