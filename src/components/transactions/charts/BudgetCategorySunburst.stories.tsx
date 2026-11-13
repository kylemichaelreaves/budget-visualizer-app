import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'
import BudgetCategorySunburst from './BudgetCategorySunburst'
import { budgetCategorySummaryStoryData } from './budgetCategorySummaryStoryData'

const sampleData = budgetCategorySummaryStoryData

const meta = {
  title: 'Transactions/BudgetCategorySunburst',
  component: BudgetCategorySunburst,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof BudgetCategorySunburst>

export default meta
type Story = StoryObj<typeof meta>
// Render-only stories build the component directly (local signals / no args).
type RenderStory = StoryObj

export const WithData: Story = {
  args: {
    data: sampleData,
    dataTestId: 'story-sunburst',
  },
}

export const Loading: Story = {
  args: {
    data: [],
    isLoading: true,
    dataTestId: 'story-sunburst-loading',
  },
}

export const Empty: Story = {
  args: {
    data: [],
    dataTestId: 'story-sunburst-empty',
  },
}

export const WithSliceClick: RenderStory = {
  render: () => {
    const [clicked, setClicked] = createSignal<string | null>(null)
    return (
      <div class="w-80 space-y-2 text-sm">
        <BudgetCategorySunburst
          data={sampleData}
          onSliceClick={(row) => setClicked(row.category_name)}
          dataTestId="story-sunburst-click"
        />
        <p class="text-muted-foreground">Last clicked: {clicked() ?? '—'}</p>
      </div>
    )
  },
}
