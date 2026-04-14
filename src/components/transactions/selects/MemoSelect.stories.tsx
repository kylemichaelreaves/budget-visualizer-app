import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'
import { storybookMemoSearchHandlers } from '@mocks/storybookMemoSearchHandlers'
import MemoSelect from './MemoSelect'

const meta = {
  title: 'Transactions/MemoSelect',
  component: MemoSelect,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    msw: {
      handlers: [...storybookMemoSearchHandlers],
    },
  },
} satisfies Meta<typeof MemoSelect>

export default meta
type Story = StoryObj<typeof meta>

export const SearchAndSelect: Story = {
  render: () => {
    const [value, setValue] = createSignal('')
    const [last, setLast] = createSignal<{ v: string; id?: number } | null>(null)
    return (
      <div class="w-96 space-y-2 text-sm">
        <MemoSelect
          value={value()}
          onChange={(v, memoId) => {
            setValue(v)
            setLast({ v, id: memoId })
          }}
          placeholder="Try “Coffee” (two memos) or “Rent”"
          dataTestId="story-memo-select"
        />
        <p class="text-muted-foreground">
          Last onChange: {last() ? `${last()!.v} (id: ${last()!.id ?? 'none'})` : '—'}
        </p>
      </div>
    )
  },
}

export const WithCommitOnBlur: Story = {
  render: () => {
    const [value, setValue] = createSignal('Rent')
    const [commits, setCommits] = createSignal<string[]>([])
    return (
      <div class="w-96 space-y-2 text-sm">
        <MemoSelect
          value={value()}
          onChange={setValue}
          onCommit={(v, memoId) => {
            setCommits((prev) => [...prev, `${v} / id=${memoId ?? 'null'}`])
          }}
          placeholder="Edit, then blur outside"
          dataTestId="story-memo-select-commit"
        />
        <p class="text-muted-foreground">Commits: {commits().length ? commits().join(' | ') : '—'}</p>
      </div>
    )
  },
}
