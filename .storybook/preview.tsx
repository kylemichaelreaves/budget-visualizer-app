import type { Preview } from 'storybook-solidjs-vite'
import { withThemeByClassName } from '@storybook/addon-themes'
import { initialGlobals as themeInitialGlobals } from '@storybook/addon-themes/preview'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { initialize, mswLoader } from 'msw-storybook-addon'
import { createJSXDecorator } from 'storybook-solidjs-vite'
import '../src/index.css'

initialize({
  onUnhandledRequest: 'bypass',
})

const preview: Preview = {
  initialGlobals: {
    ...themeInitialGlobals,
    theme: 'dark',
  },
  loaders: [mswLoader],
  decorators: [
    withThemeByClassName({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'dark',
    }),
    createJSXDecorator((Story) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      })
      return (
        <QueryClientProvider client={queryClient}>
          <div class="min-h-[120px] bg-background p-4 text-foreground">
            <Story />
          </div>
        </QueryClientProvider>
      )
    }),
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
