import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createRecurringHandlers } from '@mocks/storybookRecurringHandlers'
import RecurringPage from './RecurringPage'
import { buildRecurringFixture, withRecurringRouter } from './recurringStoryFixtures'
import { todayIso } from './recurringPageUtils'

const HOUR_MS = 3_600_000

// The page reads the real clock, so the data is built against it: late stays late, and the
// recently stopped series stays inside the review lane.
const today = todayIso()
const scannedRecently = new Date(Date.now() - 5 * HOUR_MS).toISOString()
const scannedLongAgo = new Date(Date.now() - 12 * 24 * HOUR_MS).toISOString()

const populated = createRecurringHandlers(buildRecurringFixture(today, scannedRecently).all, { list: 'ok' })
const stale = createRecurringHandlers(buildRecurringFixture(today, scannedLongAgo).all, { list: 'ok' })
const rescanFails = createRecurringHandlers(buildRecurringFixture(today, scannedRecently).all, {
  list: 'ok',
  rescan: 'error',
})
const loading = createRecurringHandlers([], { list: 'loading' })
const failing = createRecurringHandlers([], { list: 'error' })
const empty = createRecurringHandlers([], { list: 'ok' })

const meta = {
  title: 'Recurring/RecurringPage',
  component: RecurringPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withRecurringRouter],
} satisfies Meta<typeof RecurringPage>

export default meta
type Story = StoryObj<typeof meta>

/** The assembled page. Dismiss, accept and Rescan work against in-memory handlers. */
export const Default: Story = {
  parameters: { msw: { handlers: populated.handlers } },
  loaders: [populated.reset],
}

/** The last scan is 12 days old: the header and the snapshot note switch to the caution tone. */
export const StaleScan: Story = {
  parameters: { msw: { handlers: stale.handlers } },
  loaders: [stale.reset],
}

/** Rescan answers with an error: the destructive alert appears above the summary. */
export const RescanFails: Story = {
  parameters: { msw: { handlers: rescanFails.handlers } },
  loaders: [rescanFails.reset],
}

/** The list request never resolves. */
export const Loading: Story = {
  parameters: { msw: { handlers: loading.handlers } },
}

/** The list request fails with a 500. */
export const ErrorState: Story = {
  parameters: { msw: { handlers: failing.handlers } },
}

/** No series detected yet. */
export const Empty: Story = {
  parameters: { msw: { handlers: empty.handlers } },
}
