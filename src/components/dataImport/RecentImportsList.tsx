import { createMemo, For, Show, type JSX } from 'solid-js'
import BankGlyph, { inferBankId } from '@components/dataImport/BankGlyph'
import { useCsvImports } from '@api/hooks/transactions/useCsvImports'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

type Group = { key: string; label: string; files: string[] }

// Filenames follow YYYY_MM.csv, so the period is derivable from the name itself —
// no extra API data is needed to group the list by month.
function groupByPeriod(files: string[]): Group[] {
  const byKey = new Map<string, Group>()
  for (const file of files) {
    const m = file.match(/(\d{4})[_-](\d{2})/)
    const monthIdx = m ? Number(m[2]) - 1 : -1
    const key = m ? `${m[1]}_${m[2]}` : 'other'
    const label = m && monthIdx >= 0 && monthIdx < 12 ? `${MONTHS[monthIdx]} ${m[1]}` : 'Other files'
    if (!byKey.has(key)) byKey.set(key, { key, label, files: [] })
    byKey.get(key)!.files.push(file)
  }
  // Most-recent period first; the catch-all "other" bucket sinks to the bottom.
  return [...byKey.values()].sort((a, b) => {
    if (a.key === 'other') return 1
    if (b.key === 'other') return -1
    return b.key.localeCompare(a.key)
  })
}

export default function RecentImportsList(): JSX.Element {
  const query = useCsvImports()
  const groups = createMemo(() => groupByPeriod(query.data ?? []))

  return (
    <section data-testid="data-import-recent-list" class="flex flex-col gap-3">
      <h2 class="text-[15px] font-semibold tracking-tight text-foreground">Recent imports</h2>

      <Show
        when={!query.isLoading}
        fallback={<div class="px-1 py-2 text-sm text-muted-foreground">Loading&hellip;</div>}
      >
        <Show
          when={!query.isError}
          fallback={
            <div
              class="rounded-2xl border border-border bg-card px-6 py-4 text-sm text-destructive shadow-sm"
              data-testid="data-import-recent-error"
            >
              Couldn&rsquo;t load recent imports
              {query.error instanceof Error ? `: ${query.error.message}` : '.'}
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
                          class="flex items-center gap-3 px-[18px] py-[13px]"
                          classList={{ 'border-t border-border': idx() > 0 }}
                        >
                          <BankGlyph id={inferBankId(filename)} size={34} />
                          <div
                            class="min-w-0 flex-1 truncate font-mono text-[13.5px] font-medium"
                            title={filename}
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
