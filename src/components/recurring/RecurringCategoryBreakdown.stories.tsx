import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import type { RecurringSeries } from '@types'
import RecurringCategoryBreakdown from './RecurringCategoryBreakdown'
import { fixture } from './recurringStoryFixtures'

const meta = {
  title: 'Recurring/RecurringCategoryBreakdown',
  component: RecurringCategoryBreakdown,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    series: fixture.all,
  },
} satisfies Meta<typeof RecurringCategoryBreakdown>

export default meta
type Story = StoryObj<typeof meta>

const template = fixture.all[0]

/** A copy of a fixture series with its own category, monthly figure and status. */
function spend(
  id: number,
  budgetCategory: string | null,
  monthlyNormalized: number,
  status: RecurringSeries['status'] = 'active',
): RecurringSeries {
  return { ...template, id: 1000 + id, memoId: 2000 + id, budgetCategory, monthlyNormalized, status }
}

/**
 * The shared fixture: Dropbox is dismissed and still counted; the two stopped series are left
 * out; the nameless memo falls under Uncategorized (grey).
 */
export const Populated: Story = {}

/** 97% / 3%: the small segment must still be visible. */
export const OneCategoryDominates: Story = {
  args: { series: [spend(1, 'Housing - Rent', 1650), spend(2, 'Software', 51)] },
}

/**
 * A long tail at realistic proportions: more categories than palette colours (so colours repeat,
 * never beside each other), and a category worth $0.07 listed as "<0.1%" yet drawn at the minimum
 * visible width.
 *
 * Read the bar as a visibility aid, not a measurement. Any category under 1% is drawn 1% wide, so
 * the floor **overstates the small segments** (here six of them) and, since the bar still totals
 * 100%, **understates the large ones**. The shortfall (about 3.3 points here) is shared by the
 * segments above the floor in proportion to their width, so each is drawn about 3.5% narrower than
 * its true share: Housing is listed at 68.8% and drawn at about 66.4%. The list and the bar's
 * aria-label are exact.
 */
export const LongTail: Story = {
  args: {
    series: [
      spend(1, 'Housing - Rent', 1650),
      spend(2, 'Food - Groceries', 311.46),
      spend(3, 'Insurance - Auto', 104.13),
      spend(4, 'Bills - Utilities', 97.15),
      spend(5, 'Bills - Phone', 85),
      spend(6, 'Software', 59.99),
      spend(7, 'Health - Fitness', 24.99),
      spend(8, 'Entertainment - Streaming', 17.99),
      spend(9, 'Health - Wellness', 12.99),
      spend(10, 'Entertainment - Music', 11.99),
      spend(11, 'Shopping', 11.58),
      spend(12, null, 9.99),
      spend(13, 'Food - Coffee', 0.07),
    ],
  },
}

/** Three equal shares: 33.4 / 33.3 / 33.3, so the list still totals 100%. */
export const EqualThirds: Story = {
  args: { series: [spend(1, 'Food', 10), spend(2, 'Software', 10), spend(3, 'Health', 10)] },
}

/** Nothing categorised: one grey Uncategorized segment spanning the bar. */
export const AllUncategorized: Story = {
  args: { series: [spend(1, null, 40), spend(2, null, 12.5)] },
}

/** Only live series count: this one is stopped, so there is nothing to break down. */
export const AllStopped: Story = {
  args: { series: [spend(1, 'Software', 40, 'stopped')] },
}

export const Empty: Story = { args: { series: [] } }
