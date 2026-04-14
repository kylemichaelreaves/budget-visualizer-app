import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'
import NavigationButtonGroup from './NavigationButtonGroup'

const meta = {
  title: 'Shared/NavigationButtonGroup',
  component: NavigationButtonGroup,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof NavigationButtonGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'Month',
    isFirst: false,
    isLast: false,
    goToPrevious: () => {},
    goToNext: () => {},
    dataTestId: 'story-nav-group',
  },
}

export const AtFirst: Story = {
  args: {
    label: 'Month',
    isFirst: true,
    isLast: false,
    goToPrevious: () => {},
    goToNext: () => {},
    dataTestId: 'story-nav-group-first',
  },
}

export const AtLast: Story = {
  args: {
    label: 'Month',
    isFirst: false,
    isLast: true,
    goToPrevious: () => {},
    goToNext: () => {},
    dataTestId: 'story-nav-group-last',
  },
}

export const WithReset: Story = {
  render: () => {
    const [index, setIndex] = createSignal(2)
    const total = 5
    return (
      <div class="space-y-2 text-sm">
        <NavigationButtonGroup
          label="Week"
          isFirst={index() === 0}
          isLast={index() === total - 1}
          goToPrevious={() => setIndex((i) => Math.min(i + 1, total - 1))}
          goToNext={() => setIndex((i) => Math.max(i - 1, 0))}
          reset={() => setIndex(2)}
          dataTestId="story-nav-group-reset"
        />
        <p class="text-muted-foreground">
          Position: {index()} of {total - 1}
        </p>
      </div>
    )
  },
}
