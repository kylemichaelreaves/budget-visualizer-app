import type { Preview } from 'storybook-solidjs-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { initialize, mswLoader } from 'msw-storybook-addon'
import '../src/index.css'

initialize({
  onUnhandledRequest: 'bypass',
})

const storyQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

const preview: Preview = {
  loaders: [mswLoader],
  decorators: [
    (Story) => (
      <QueryClientProvider client={storyQueryClient}>
        <div class="min-h-[120px] bg-background p-4 text-foreground">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
