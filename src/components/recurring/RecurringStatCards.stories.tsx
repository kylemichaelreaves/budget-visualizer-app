import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import RecurringStatCards from './RecurringStatCards'
import { FIXTURE_TODAY, fixture } from './recurringStoryFixtures'

const meta = {
  title: 'Recurring/RecurringStatCards',
  component: RecurringStatCards,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    series: fixture.all,
    today: FIXTURE_TODAY,
  },
} satisfies Meta<typeof RecurringStatCards>

export default meta
type Story = StoryObj<typeof meta>

export const Populated: Story = {}

/** No series: every figure is zero. */
export const AllZero: Story = { args: { series: [] } }
