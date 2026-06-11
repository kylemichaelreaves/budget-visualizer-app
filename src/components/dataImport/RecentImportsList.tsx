import { For, Show, type JSX } from 'solid-js'
import BankGlyph, { inferBankId } from '@components/dataImport/BankGlyph'
import { useCsvImports } from '@api/hooks/transactions/useCsvImports'

export default function RecentImportsList(): JSX.Element {
  const query = useCsvImports()

  return (
    <section class="mt-9">
      <div class="flex items-baseline justify-between pb-3.5">
        <div class="text-[13px] font-semibold text-foreground">Recent imports</div>
        <div class="text-xs text-muted-foreground">From S3 bucket</div>
      </div>
      <div
        class="bg-card border border-border rounded-xl overflow-hidden"
        data-testid="data-import-recent-list"
      >
        <Show
          when={!query.isLoading}
          fallback={<div class="px-6 py-4 text-sm text-muted-foreground">Loading…</div>}
        >
          <Show
            when={!query.isError}
            fallback={
              <div class="px-6 py-4 text-sm text-destructive" data-testid="data-import-recent-error">
                Couldn't load recent imports
                {query.error instanceof Error ? `: ${query.error.message}` : '.'}
              </div>
            }
          >
            <Show
              when={(query.data ?? []).length > 0}
              fallback={
                <div class="px-6 py-4 text-sm text-muted-foreground">
                  No imports yet — your first CSV will appear here.
                </div>
              }
            >
              <For each={query.data ?? []}>
                {(filename, idx) => (
                  <div
                    class="flex items-center gap-2.5 px-6 py-3.5 text-sm min-w-0"
                    classList={{
                      'border-b border-border': idx() < (query.data?.length ?? 0) - 1,
                    }}
                  >
                    <BankGlyph id={inferBankId(filename)} size={24} />
                    <div class="font-medium truncate font-mono text-xs" title={filename}>
                      {filename}
                    </div>
                  </div>
                )}
              </For>
            </Show>
          </Show>
        </Show>
      </div>
    </section>
  )
}
