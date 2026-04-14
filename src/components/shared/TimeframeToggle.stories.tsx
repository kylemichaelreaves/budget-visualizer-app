import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'
import TimeframeToggle from './TimeframeToggle'

const meta = {
  title: 'Shared/TimeframeToggle',
  component: TimeframeToggle,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof TimeframeToggle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    const [value, setValue] = createSignal('monthly')
    return (
      <div class="min-w-[280px]">
        <TimeframeToggle value={value()} onChange={setValue} />
        <p class="text-muted-foreground mt-3 text-xs">Selected: {value()}</p>
      </div>
    )
  },
}

export const CustomOptions: Story = {
  render: () => {
    const [value, setValue] = createSignal('day')
    return (
      <div class="min-w-[320px]">
        <TimeframeToggle
          value={value()}
          onChange={setValue}
          options={[
            { label: 'Day', value: 'day' },
            { label: 'Week', value: 'week' },
            { label: 'Month', value: 'month' },
          ]}
        />
        <p class="text-muted-foreground mt-3 text-xs">Selected: {value()}</p>
      </div>
    )
  },
}
