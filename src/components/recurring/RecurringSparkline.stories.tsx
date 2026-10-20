import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import type { JSX } from 'solid-js'
import type { RecurringAmountPoint } from '@types'
import RecurringSparkline from './RecurringSparkline'
import { monthlyHistory } from './recurringStoryFixtures'

const LAST_CHARGE = '2026-10-15'

const rise = monthlyHistory(LAST_CHARGE, [9.99, 9.99, 10.99, 11.99, 13.99])
const fall = monthlyHistory(LAST_CHARGE, [13.99, 11.99, 10.99, 9.99, 7.99])
const flat = monthlyHistory(LAST_CHARGE, [9.99, 9.99, 9.99, 9.99, 9.99])
const singleEntry = monthlyHistory(LAST_CHARGE, [9.99])
const steepClimb = monthlyHistory(LAST_CHARGE, [4.99, 4.99, 5.99, 9.99, 19.99, 49.99])

const meta = {
  title: 'Recurring/RecurringSparkline',
  component: RecurringSparkline,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    history: rise,
    stopped: false,
  },
} satisfies Meta<typeof RecurringSparkline>

export default meta
type Story = StoryObj<typeof meta>

/** The latest step went up: `--negative`. */
export const Rise: Story = { args: { history: rise } }

/** The latest step went down: `--positive`. Must not look like `Flat`. */
export const Fall: Story = { args: { history: fall } }

/** Nothing changed: a flat line in `--muted-foreground`. */
export const Flat: Story = { args: { history: flat } }

/** One charge so far: a single dot, centred, with no line. */
export const SingleEntry: Story = { args: { history: singleEntry } }

/** A tenfold climb, to check the line stays inside the viewBox at the extreme. */
export const SteepClimb: Story = { args: { history: steepClimb } }

/** No history at all: renders no marks. */
export const EmptyHistory: Story = { args: { history: [] } }

/** Last two charges dashed because the series has stopped. */
export const Stopped: Story = { args: { history: rise, stopped: true } }

function Sample(props: { label: string; history: RecurringAmountPoint[]; stopped?: boolean }): JSX.Element {
  return (
    <tr>
      <th scope="row" class="text-foreground py-2 pr-6 text-left text-sm font-medium">
        {props.label}
      </th>
      <td class="py-2 pr-6">
        <RecurringSparkline history={props.history} stopped={props.stopped} />
      </td>
      {/* The same mark scaled up, to judge its shape and colour at a glance. */}
      <td class="py-2">
        <div class="[&_svg]:h-[72px] [&_svg]:w-60">
          <RecurringSparkline history={props.history} stopped={props.stopped} />
        </div>
      </td>
    </tr>
  )
}

function ComparisonTable(props: { stopped?: boolean }): JSX.Element {
  return (
    <table class="border-separate border-spacing-0">
      <thead>
        <tr class="text-muted-foreground text-xs">
          <th class="pr-6 pb-1 text-left font-medium">Latest step</th>
          <th class="pr-6 pb-1 text-left font-medium">Actual size</th>
          <th class="pb-1 text-left font-medium">Magnified 3x</th>
        </tr>
      </thead>
      <tbody>
        <Sample label="Rise (price up)" history={rise} stopped={props.stopped} />
        <Sample label="Fall (price down)" history={fall} stopped={props.stopped} />
        <Sample label="Flat (no change)" history={flat} stopped={props.stopped} />
      </tbody>
    </table>
  )
}

/**
 * Rise, fall and flat together: the comparison a previous colour bug slipped through. Three
 * different tokens, so a price cut never reads as no change.
 */
export const RiseFallFlat: Story = {
  render: () => <ComparisonTable />,
}

/** The same trio once stopped: the trailing segment dashes and the colours must still differ. */
export const RiseFallFlatStopped: Story = {
  render: () => <ComparisonTable stopped />,
}

/** Every shape the sparkline can take, at actual size, as it sits in a table cell. */
export const AllShapes: Story = {
  render: () => (
    <table class="border-separate border-spacing-0">
      <tbody>
        <Sample label="Rise" history={rise} />
        <Sample label="Fall" history={fall} />
        <Sample label="Flat" history={flat} />
        <Sample label="Single entry" history={singleEntry} />
        <Sample label="Steep climb" history={steepClimb} />
        <Sample label="Empty history" history={[]} />
        <Sample label="Stopped" history={rise} stopped />
      </tbody>
    </table>
  ),
}
