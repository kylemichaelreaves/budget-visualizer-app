import { DateTime } from 'luxon'
import { For, Show, type JSX } from 'solid-js'
import BankGlyph, { inferBankId } from '@components/dataImport/BankGlyph'
import { useRecentCsvImports } from '@api/hooks/transactions/useRecentCsvImports'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const dt = DateTime.fromISO(iso)
  return dt.isValid ? dt.toFormat('LLL dd, yyyy') : ''
}

export default function RecentImportsList(): JSX.Element {
  const query = useRecentCsvImports()

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
            when={(query.data ?? []).length > 0}
            fallback={
              <div class="px-6 py-4 text-sm text-muted-foreground">
                No imports yet — your first CSV will appear here.
              </div>
            }
          >
            <For each={query.data ?? []}>
              {(item, idx) => (
                <div
                  class="grid items-center gap-6 px-6 py-3.5 text-sm"
                  classList={{
                    'border-b border-border': idx() < (query.data?.length ?? 0) - 1,
                  }}
                  style={{ 'grid-template-columns': '120px 1fr 140px' }}
                >
                  <div class="font-mono text-xs text-muted-foreground">{formatDate(item.lastModified)}</div>
                  <div class="flex items-center gap-2.5 min-w-0">
                    <BankGlyph id={inferBankId(item.key)} size={24} />
                    <div class="font-medium truncate" title={item.key}>
                      {item.key}
                    </div>
                  </div>
                  <div class="font-mono text-xs text-muted-foreground text-right">
                    {formatBytes(item.size)}
                  </div>
                </div>
              )}
            </For>
          </Show>
        </Show>
      </div>
    </section>
  )
}
