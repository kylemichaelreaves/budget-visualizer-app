import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import RecurringTriageLane from './RecurringTriageLane'
import { FIXTURE_TODAY, fixture, withRecurringRouter } from './recurringStoryFixtures'

const meta = {
  title: 'Recurring/RecurringTriageLane',
  component: RecurringTriageLane,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  // The nameless conflict card renders a router link.
  decorators: [withRecurringRouter],
  args: {
    today: FIXTURE_TODAY,
    series: [],
  },
} satisfies Meta<typeof RecurringTriageLane>

export default meta
type Story = StoryObj<typeof meta>

/** One card per triage state, plus a second conflict kind and a conflict with no memo name. */
export const AllStates: Story = {
  args: {
    series: [
      fixture.priceUp,
      fixture.priceDown,
      fixture.late,
      fixture.conflictCadence,
      fixture.conflictNotRecurring,
      fixture.conflictNoName,
      fixture.stopped,
    ],
  },
}

export const PriceUp: Story = { args: { series: [fixture.priceUp] } }

export const PriceDown: Story = { args: { series: [fixture.priceDown] } }

export const Late: Story = { args: { series: [fixture.late] } }

/** Detected yearly, memo says monthly: "Set yearly" / "Keep monthly". */
export const ConflictCadence: Story = { args: { series: [fixture.conflictCadence] } }

/** Detected as recurring, memo marked not recurring: "Mark recurring" / "Keep not recurring". */
export const ConflictNotRecurring: Story = { args: { series: [fixture.conflictNotRecurring] } }

/** The memo has no name, so the accept button is disabled and a link explains why. */
export const ConflictWithoutName: Story = { args: { series: [fixture.conflictNoName] } }

export const Stopped: Story = { args: { series: [fixture.stopped] } }

/** Nothing to review: the lane renders nothing, heading included. */
export const NothingToReview: Story = {
  args: { series: fixture.all.filter((s) => s.memoName === 'SPOTIFY USA') },
}
