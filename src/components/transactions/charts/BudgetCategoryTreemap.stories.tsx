import { createSignal } from 'solid-js'
import { createJSXDecorator } from 'storybook-solidjs-vite'
import { budgetCategoryColorsFromData } from '@composables/budgetCategoryColors'
import BudgetCategoryTreemap from './BudgetCategoryTreemap'
import { budgetCategorySummaryStoryData } from './budgetCategorySummaryStoryData'

const sampleData = budgetCategorySummaryStoryData

/** @type {import('storybook-solidjs-vite').Meta<typeof BudgetCategoryTreemap>} */
const meta = {
  title: 'Transactions/BudgetCategoryTreemap',
  component: BudgetCategoryTreemap,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    createJSXDecorator((Story) => (
      <div style={{ width: '560px', height: '360px' }}>
        <Story />
      </div>
    )),
  ],
}

export default meta

/** @type {import('storybook-solidjs-vite').StoryObj<typeof meta>} */
export const WithData = {
  args: {
    data: sampleData,
    categoryColors: () => budgetCategoryColorsFromData(sampleData),
    dataTestId: 'story-treemap',
  },
}

/** @type {import('storybook-solidjs-vite').StoryObj<typeof meta>} */
export const Loading = {
  args: {
    data: [],
    categoryColors: () => budgetCategoryColorsFromData([]),
    isLoading: true,
    dataTestId: 'story-treemap-loading',
  },
}

/** @type {import('storybook-solidjs-vite').StoryObj<typeof meta>} */
export const Empty = {
  args: {
    data: [],
    categoryColors: () => budgetCategoryColorsFromData([]),
    dataTestId: 'story-treemap-empty',
  },
}

/** @type {import('storybook-solidjs-vite').StoryObj<typeof meta>} */
export const WithPeriodLabel = {
  args: {
    data: sampleData,
    categoryColors: () => budgetCategoryColorsFromData(sampleData),
    timeFrame: 'month',
    date: '2026-03',
    dataTestId: 'story-treemap-period',
  },
}

/** @type {import('storybook-solidjs-vite').StoryObj<typeof meta>} */
export const WithCellClick = {
  render: () => {
    const [clicked, setClicked] = createSignal('—')
    const colors = () => budgetCategoryColorsFromData(sampleData)
    return (
      <div class="space-y-2 text-sm">
        <div style={{ width: '560px', height: '360px' }}>
          <BudgetCategoryTreemap
            data={sampleData}
            categoryColors={colors}
            onCellClick={(row) => setClicked(row.category_name)}
            dataTestId="story-treemap-click"
          />
        </div>
        <p class="text-muted-foreground">Last clicked: {clicked()}</p>
      </div>
    )
  },
}
