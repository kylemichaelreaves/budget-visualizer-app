import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import StatisticComponent from './StatisticComponent'

const meta = {
  title: 'Shared/StatisticComponent',
  component: StatisticComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof StatisticComponent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Total transactions',
    value: 1234,
    dataTestId: 'story-statistic-default',
  },
}

export const WithPreviousIncrease: Story = {
  args: {
    title: 'Monthly spend',
    value: 520,
    previousValue: 400,
    dataTestId: 'story-statistic-increase',
  },
}

export const WithPreviousDecrease: Story = {
  args: {
    title: 'Monthly spend',
    value: 350,
    previousValue: 400,
    dataTestId: 'story-statistic-decrease',
  },
}

export const NoChange: Story = {
  args: {
    title: 'Monthly spend',
    value: 400,
    previousValue: 400,
    dataTestId: 'story-statistic-no-change',
  },
}

export const SmallSize: Story = {
  args: {
    title: 'Count',
    value: 42,
    size: 'small',
    dataTestId: 'story-statistic-small',
  },
}

export const LargeSize: Story = {
  args: {
    title: 'Grand total',
    value: 99999,
    size: 'large',
    dataTestId: 'story-statistic-large',
  },
}

export const WithPrecision: Story = {
  args: {
    title: 'Average debit',
    value: 123.456,
    precision: 2,
    dataTestId: 'story-statistic-precision',
  },
}
