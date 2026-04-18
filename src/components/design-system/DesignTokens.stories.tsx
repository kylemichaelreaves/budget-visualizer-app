import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { For } from 'solid-js'

const meta = {
  title: 'Design system / Theme tokens',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

/** CSS custom property names (no `--` prefix). */
const semanticTokens = [
  'positive',
  'positive-emphasis',
  'positive-muted',
  'positive-icon-wrap',
  'negative',
  'negative-emphasis',
  'negative-muted',
  'negative-icon-wrap',
  'success',
  'success-muted',
  'info',
  'info-muted',
  'warning',
  'caution',
  'caution-muted',
  'caution-on-muted',
  'accent-purple',
  'accent-purple-muted',
  'brand',
  'destructive',
] as const

const chartTokens = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'chart-fallback'] as const

/** Sample spacing steps (see `--space-*` and `--spacing-*` in theme.css). */
const spacingShowcase = ['1', '2', '3', '4', '6', '8', '12', '16'] as const

function swatchStyle(cssName: string): { 'background-color': string } {
  return { 'background-color': `var(--${cssName})` }
}

function spacingBarStyle(step: string): { width: string; height: string; 'background-color': string } {
  return {
    width: `var(--space-${step})`,
    height: 'var(--space-2)',
    'background-color': 'var(--foreground)',
  }
}

function TokenGrid() {
  return (
    <div class="max-w-3xl space-y-8">
      <div>
        <h2 class="text-lg font-semibold text-foreground m-0 mb-2">Semantic colors</h2>
        <p class="text-sm text-muted-foreground m-0 mb-4">
          Tokens live in <code class="text-foreground">src/styles/theme.css</code> and map to Tailwind via{' '}
          <code class="text-foreground">@theme inline</code>. Use utilities such as{' '}
          <code class="text-foreground">text-positive</code> instead of steps like{' '}
          <code class="text-foreground">text-green-600</code>.
        </p>
        <div class="grid gap-3 sm:grid-cols-2">
          <For each={[...semanticTokens]}>
            {(name) => (
              <div class="flex items-center gap-3 rounded-lg border border-border p-3 bg-card">
                <div class="size-12 shrink-0 rounded-md border border-border" style={swatchStyle(name)} />
                <div class="min-w-0">
                  <p class="text-sm font-medium text-foreground m-0">{name}</p>
                  <p class="text-xs text-muted-foreground m-0 font-mono">var(--{name})</p>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      <div>
        <h2 class="text-lg font-semibold text-foreground m-0 mb-2">Spacing scale</h2>
        <p class="text-sm text-muted-foreground m-0 mb-3">
          Primitives <code class="text-foreground">--space-*</code> in{' '}
          <code class="text-foreground">:root</code> map to Tailwind{' '}
          <code class="text-foreground">--spacing-*</code> so utilities like{' '}
          <code class="text-foreground">p-4</code> and <code class="text-foreground">gap-6</code> stay the
          same; change the variables to retune density globally.
        </p>
        <div class="flex flex-col gap-2 rounded-lg border border-border p-4 bg-card">
          <For each={[...spacingShowcase]}>
            {(step) => (
              <div class="flex items-center gap-3 text-xs">
                <span class="font-mono text-muted-foreground w-8 shrink-0">{step}</span>
                <div
                  class="rounded-sm opacity-80"
                  style={spacingBarStyle(step)}
                  title={`var(--space-${step})`}
                />
              </div>
            )}
          </For>
        </div>
      </div>

      <div>
        <h2 class="text-lg font-semibold text-foreground m-0 mb-2">Chart series</h2>
        <p class="text-sm text-muted-foreground m-0 mb-3">
          D3 charts read the same <code class="text-foreground">--chart-*</code> variables via{' '}
          <code class="text-foreground">getCssChartPalette()</code> in{' '}
          <code class="text-foreground">src/utils/chartPalette.ts</code>.
        </p>
        <div class="flex flex-wrap gap-2">
          <For each={[...chartTokens]}>
            {(name) => (
              <div class="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 bg-card text-xs">
                <span class="inline-block size-4 rounded border border-border" style={swatchStyle(name)} />
                <span class="font-mono text-foreground">{name}</span>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  )
}

export const SemanticPalette: Story = {
  render: () => <TokenGrid />,
}
