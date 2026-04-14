import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'
import { storybookBudgetCategoryHandlers } from '@mocks/storybookBudgetCategoryHandlers'
import CategoryTreeSelectDialog from './CategoryTreeSelectDialog'

const meta = {
  title: 'Transactions/CategoryTreeSelectDialog',
  component: CategoryTreeSelectDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    msw: {
      handlers: [...storybookBudgetCategoryHandlers],
    },
  },
} satisfies Meta<typeof CategoryTreeSelectDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Interactive: Story = {
  render: () => {
    const [open, setOpen] = createSignal(true)
    const [value, setValue] = createSignal('Food - Groceries')
    const [log, setLog] = createSignal<string[]>([])
    return (
      <div class="flex w-full max-w-md flex-col gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="rounded-md border border-border bg-secondary px-3 py-1.5 text-sm"
            onClick={() => setOpen(true)}
          >
            Open dialog
          </button>
          <span class="text-muted-foreground text-sm">Value: {value() || '(none)'}</span>
        </div>
        <CategoryTreeSelectDialog
          open={open()}
          onOpenChange={setOpen}
          value={value()}
          onSelect={(v) => {
            setValue(v)
            setLog((prev) => [...prev, v])
            setOpen(false)
          }}
          title="Assign budget category"
          subtitle="Storybook fixture tree"
        />
        <p class="text-muted-foreground text-xs">Selections: {log().length ? log().join(' → ') : '—'}</p>
      </div>
    )
  },
}
