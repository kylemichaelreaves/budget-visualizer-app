import { createMemo, For, Show } from 'solid-js'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'
import CsvGlyph from '@components/dataImport/CsvGlyph'
import { useCsvImports } from '@api/hooks/transactions/useCsvImports'
import { groupImportsByPeriod } from '@components/dataImport/helpers/groupImportsByPeriod'
import type { JSX } from '@solidjs/web'
import { settledData } from '@api/helpers/settledData'
import { queryFlag } from '@api/helpers/queryFlag'

export default function RecentImportsList(): JSX.Element {
  const query = useCsvImports()
  const groups = createMemo(() => groupImportsByPeriod(settledData(query) ?? []))

  return (
    <section data-testid="data-import-recent-list" class="flex flex-col gap-3">
      <h2 class="text-[15px] font-semibold tracking-tight text-foreground">Recent imports</h2>

      <Show
        when={!queryFlag(query, 'isLoading')}
        fallback={<div class="px-1 py-2 text-sm text-muted-foreground">Loading&hellip;</div>}
      >
        <Show
          when={!query.isError}
          fallback={
            <div
              class="rounded-2xl border border-border bg-card px-6 py-4 text-sm text-destructive shadow-sm"
              data-testid="data-import-recent-error"
            >
              Couldn&rsquo;t load recent imports: {extractApiErrorMessage(query.error)}
            </div>
          }
        >
          <Show
            when={groups().length > 0}
            fallback={
              <div class="rounded-2xl border border-border bg-card px-6 py-4 text-sm text-muted-foreground shadow-sm">
                No imports yet &mdash; your first CSV will appear here.
              </div>
            }
          >
            <For each={groups()}>
              {(group) => (
                <div class="flex flex-col gap-[7px]">
                  <div class="px-0.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </div>
                  <div class="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <For each={group.files}>
                      {(filename, idx) => (
                        <div
                          class={[
                            'flex items-center gap-3 px-[18px] py-[13px]',
                            { 'border-t border-border': idx() > 0 },
                          ]}
                        >
                          <CsvGlyph size={34} />
                          <div
                            class="min-w-0 flex-1 truncate font-mono text-[13.5px] font-medium"
                            title={filename}
                            data-testid="data-import-recent-file"
                          >
                            {filename}
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              )}
            </For>
          </Show>
        </Show>
      </Show>
    </section>
  )
}
