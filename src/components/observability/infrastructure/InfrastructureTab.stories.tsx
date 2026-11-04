import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { delay, http, HttpResponse } from 'msw'
import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import InfrastructureTab from './InfrastructureTab'
import { fullMetrics, nullMetrics } from './observabilityStoryFixtures'

// Served under both `/api/v1` (the Vite proxy) and `/api/gateway`, as the other Storybook handlers are.
const PATHS = ['/api/v1/observability/metrics', '/api/gateway/observability/metrics']
const handlersFor = (respond: () => Response | Promise<Response>) => [
  http.head('/api/v1', () => new HttpResponse(null, { status: 200 })),
  http.head('/api/gateway', () => new HttpResponse(null, { status: 200 })),
  ...PATHS.map((path) => http.get(path, respond)),
]

const meta = {
  title: 'Observability/InfrastructureTab',
  component: InfrastructureTab,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { range: () => '24h' },
  // A fresh client per story render, so a cached response never leaks between stories.
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <div class="bg-background text-foreground p-4">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof InfrastructureTab>

export default meta
type Story = StoryObj<typeof meta>

/** Every metric present, with one slow p95 bucket and one gap in the latency bars. */
export const Full: Story = {
  parameters: { msw: { handlers: handlersFor(() => HttpResponse.json(fullMetrics)) } },
}

/** CloudWatch returned nothing: every value shows a dash and every badge reads "No data". */
export const AllNull: Story = {
  parameters: { msw: { handlers: handlersFor(() => HttpResponse.json(nullMetrics)) } },
}

/** The request never resolves, so the first-load skeletons stay up. */
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: handlersFor(async () => {
        await delay('infinite')
        return HttpResponse.json(fullMetrics)
      }),
    },
  },
}

/** A 502: the unavailable message with a Retry button. */
export const ErrorState: Story = {
  parameters: {
    msw: { handlers: handlersFor(() => HttpResponse.json({ message: 'Bad gateway' }, { status: 502 })) },
  },
}

/** A 403: the caller is not an admin. */
export const Forbidden: Story = {
  parameters: {
    msw: { handlers: handlersFor(() => HttpResponse.json({ message: 'Forbidden' }, { status: 403 })) },
  },
}
