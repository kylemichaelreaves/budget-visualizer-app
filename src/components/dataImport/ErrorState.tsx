import { Show, type JSX } from 'solid-js'
import BankGlyph from '@components/dataImport/BankGlyph'
import { Button } from '@components/ui/button'
import { formatBytes } from '@utils/formatBytes'

export default function ErrorState(props: {
  title: string
  body: string
  file?: File
  onChooseAnother: () => void
  onCancel: () => void
}): JSX.Element {
  return (
    <div class="flex-1 px-9 py-10 flex flex-col">
      <div
        class="bg-card border border-border rounded-2xl px-9 pt-9 pb-8 max-w-2xl w-full mx-auto text-center"
        data-testid="data-import-error-card"
      >
        <div class="w-[3.25rem] h-[3.25rem] rounded-full bg-caution-muted text-caution-on-muted inline-flex items-center justify-center mb-4 p-3.5">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <div class="text-xl font-semibold tracking-tight mb-1.5">{props.title}</div>
        <div class="text-sm text-muted-foreground max-w-md mx-auto mb-6">{props.body}</div>

        <Show when={props.file}>
          {(file) => (
            <div class="inline-flex items-center gap-3 px-3.5 py-2.5 bg-muted border border-border rounded-xl mb-6 text-left">
              <BankGlyph id="csv" size={28} />
              <div>
                <div class="text-xs font-semibold">{file().name}</div>
                <div class="text-[11px] text-muted-foreground mt-0.5 font-mono">
                  {formatBytes(file().size)} · {file().type || 'unknown type'}
                </div>
              </div>
            </div>
          )}
        </Show>

        <div class="flex gap-2.5 justify-center">
          <Button type="button" onClick={() => props.onChooseAnother()}>
            Choose another file
          </Button>
          <Button type="button" variant="outline" onClick={() => props.onCancel()}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
