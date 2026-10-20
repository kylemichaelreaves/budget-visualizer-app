import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import RecurringTable from './RecurringTable'
import { fixture } from './recurringStoryFixtures'

const meta = {
  title: 'Recurring/RecurringTable',
  component: RecurringTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    series: fixture.all,
  },
} satisfies Meta<typeof RecurringTable>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Every state at once: active, late (Planet Fitness), stopped (Disney Plus, Headspace: dimmed,
 * dashed sparkline tail, dashes for per-month and next expected, sunk to the bottom), dismissed
 * (Dropbox), weak confidence (Blue Bottle Coffee, the nameless memo) and a `null` memo name.
 */
export const AllStates: Story = {}

/** Only live series: no stopped rows, nothing dimmed. */
export const LiveOnly: Story = {
  args: { series: fixture.all.filter((s) => s.status !== 'stopped') },
}

/** One weakly detected row beside a strong one, to compare the confidence bars. */
export const ConfidenceBars: Story = {
  args: {
    series: [
      fixture.all.find((s) => s.memoName === 'RENT PAYMENT')!,
      fixture.all.find((s) => s.memoName === 'AMAZON PRIME*MEMBERSHIP')!,
      fixture.all.find((s) => s.memoName === 'BLUE BOTTLE COFFEE')!,
      fixture.conflictNoName,
    ],
  },
}

export const Empty: Story = { args: { series: [] } }
