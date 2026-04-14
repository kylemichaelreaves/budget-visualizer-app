import { children, onMount, type JSX } from 'solid-js'
import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { storybookMemoSearchHandlers } from '@mocks/storybookMemoSearchHandlers'
import { clearAllFilters } from '@stores/transactionsStore'
import TransactionMemoFilterField from './TransactionMemoFilterField'

function ClearMemoFilterDecorator(props: { children: JSX.Element }) {
  const resolved = children(() => props.children)
  onMount(() => {
    clearAllFilters()
  })
  return <>{resolved()}</>
}

const meta = {
  title: 'Transactions/TransactionMemoFilterField',
  component: TransactionMemoFilterField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    msw: {
      handlers: [...storybookMemoSearchHandlers],
    },
  },
  decorators: [
    (Story) => (
      <ClearMemoFilterDecorator>
        <Story />
      </ClearMemoFilterDecorator>
    ),
  ],
} satisfies Meta<typeof TransactionMemoFilterField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    dataTestId: 'story-memo-filter-field',
  },
}
