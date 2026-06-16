import { createSignal, For, type JSX } from 'solid-js'
import { Button } from '@components/ui/button'
import BankGlyph, { inferBankId } from '@components/dataImport/BankGlyph'
import Icon from '@components/dataImport/Icon'
import RecentImportsList from '@components/dataImport/RecentImportsList'

const SUPPORTED_BANKS = [
  { file: 'chase_2026_04.csv', label: 'Chase' },
  { file: 'amex_2026_04.csv', label: 'Amex' },
  { file: 'bofa_2026_04.csv', label: 'Bank of America' },
  { file: 'wells_2026_04.csv', label: 'Wells Fargo' },
  { file: 'export.csv', label: 'Generic CSV' },
]

function RulePill(props: { children: JSX.Element }): JSX.Element {
  return (
    <span class="inline-flex h-7 items-center gap-1.5 rounded-full bg-muted px-2.5 text-xs font-medium text-muted-foreground">
      {props.children}
    </span>
  )
}

export default function EmptyState(props: { onFileChosen: (file: File) => void }): JSX.Element {
  const [isDragging, setIsDragging] = createSignal(false)
  let inputRef: HTMLInputElement | undefined

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    props.onFileChosen(files[0])
  }

  const openPicker = () => inputRef?.click()

  return (
    <div class="flex flex-col gap-7">
      {/* Drop zone — brand carries upload intent only; primary CTAs stay neutral. */}
      <div
        data-testid="data-import-drop-zone"
        role="button"
        tabindex={0}
        aria-label="Drop a CSV file here or press Enter to browse"
        class="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed bg-card px-8 pt-[52px] pb-7 text-center shadow-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        classList={{
          'border-brand bg-brand/5': isDragging(),
          'border-foreground/20': !isDragging(),
        }}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openPicker()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleFiles(e.dataTransfer?.files ?? null)
        }}
      >
        <div class="mb-[18px] flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Icon name="upload" size={26} stroke={1.8} />
        </div>
        <div class="text-[19px] font-semibold tracking-tight">Drop your CSV file here</div>
        <div class="mt-1.5 max-w-[420px] text-sm text-muted-foreground">
          We&rsquo;ll detect your bank and map the columns automatically.
        </div>

        <div class="my-5 flex flex-wrap justify-center gap-2">
          <RulePill>
            <Icon name="file" size={13} stroke={2} />
            CSV files only
          </RulePill>
          <RulePill>
            <Icon name="check" size={13} stroke={2} />
            Up to 10 MB
          </RulePill>
          <RulePill>
            <Icon name="check" size={13} stroke={2} />
            Named&nbsp;<span class="font-mono tabular-nums">YYYY_MM.csv</span>
          </RulePill>
        </div>

        <Button
          type="button"
          variant="outline"
          data-testid="data-import-browse-button"
          onClick={(e) => {
            // Avoid bubbling to the drop zone's onClick (which also opens the picker).
            e.stopPropagation()
            openPicker()
          }}
        >
          <Icon name="file" size={14} stroke={1.9} />
          Browse files
        </Button>
        <input
          ref={(el) => (inputRef = el)}
          type="file"
          accept=".csv,text/csv,application/vnd.ms-excel"
          class="hidden"
          data-testid="data-import-file-input"
          onChange={(e) => {
            handleFiles(e.currentTarget.files)
            // Clear the input so picking the same file again still fires onChange.
            e.currentTarget.value = ''
          }}
        />

        {/* Supported banks strip — sets the expectation that bank/columns are inferred. */}
        <div class="mt-6 flex w-full flex-col items-center gap-3 border-t border-border pt-5">
          <div class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Detected automatically
          </div>
          <div class="flex flex-wrap justify-center gap-2">
            <For each={SUPPORTED_BANKS}>
              {(bank) => (
                <span class="inline-flex items-center gap-2 rounded-full border border-border bg-muted py-[5px] pr-3 pl-[5px] text-xs font-medium">
                  <BankGlyph id={inferBankId(bank.file)} size={22} />
                  {bank.label}
                </span>
              )}
            </For>
          </div>
        </div>
      </div>

      <RecentImportsList />
    </div>
  )
}
