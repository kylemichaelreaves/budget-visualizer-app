import type { JSX } from 'solid-js'
import { Show, createSignal } from 'solid-js'
import { CheckIcon, XIcon } from './icons'
import { budgetCategorySegmentValidationError } from './budgetCategoryTreeUtils'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'

export default function BudgetCategoryInlineAddForm(props: {
  placeholder: string
  onSubmit: (name: string) => void | Promise<void>
  onCancel: () => void
  'data-testid'?: string
}): JSX.Element {
  const [name, setName] = createSignal('')
  const [submitting, setSubmitting] = createSignal(false)
  const [segmentError, setSegmentError] = createSignal<string | null>(null)

  const handleSubmit = async () => {
    const trimmed = name().trim()
    if (!trimmed || submitting()) return
    const err = budgetCategorySegmentValidationError(trimmed)
    if (err) {
      setSegmentError(err)
      return
    }
    setSegmentError(null)
    setSubmitting(true)
    try {
      await props.onSubmit(trimmed)
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      void handleSubmit()
    } else if (e.key === 'Escape') {
      props.onCancel()
    }
  }

  const fieldTestId = (suffix: string) => {
    const base = props['data-testid'] ?? 'inline-add'
    return `${base}-${suffix}`
  }

  return (
    <div class="flex flex-col gap-1 py-1 min-w-0" data-testid={props['data-testid']}>
      <div class="flex items-center gap-1.5">
        <Input
          type="text"
          placeholder={props.placeholder}
          value={name()}
          onInput={(e) => {
            setName(e.currentTarget.value)
            setSegmentError(null)
          }}
          onKeyDown={handleKeyDown}
          disabled={submitting()}
          autofocus
          class="h-7 text-sm flex-1 min-w-[120px]"
          data-testid={fieldTestId('input')}
        />
        <Button
          variant="ghost"
          size="icon"
          class="size-7 text-green-600 hover:text-green-700"
          disabled={!name().trim() || submitting()}
          onClick={() => void handleSubmit()}
          aria-label="Confirm add"
          data-testid={fieldTestId('confirm')}
        >
          <CheckIcon class="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="size-7 text-muted-foreground hover:text-foreground"
          onClick={props.onCancel}
          aria-label="Cancel add"
          data-testid={fieldTestId('cancel')}
        >
          <XIcon class="size-3.5" />
        </Button>
      </div>
      <Show when={segmentError()}>
        {(msg) => (
          <p class="text-destructive text-xs m-0" role="alert" data-testid={fieldTestId('validation-error')}>
            {msg()}
          </p>
        )}
      </Show>
    </div>
  )
}
