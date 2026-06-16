import { Show, type JSX } from 'solid-js'
import BankGlyph, { inferBankId } from '@components/dataImport/BankGlyph'
import Icon from '@components/dataImport/Icon'
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
    <div
      class="rounded-2xl border border-border bg-card px-9 pt-8 pb-7 text-center shadow-sm"
      role="alert"
      data-testid="data-import-error-card"
    >
      <div class="mb-4 inline-flex h-[52px] w-[52px] items-center justify-center rounded-full bg-caution-muted text-caution">
        <Icon name="alert" size={26} stroke={2} />
      </div>
      <div class="text-xl font-semibold tracking-tight">{props.title}</div>
      <div class="mx-auto mt-1.5 max-w-[460px] text-sm text-muted-foreground">{props.body}</div>

      <Show when={props.file}>
        {(file) => (
          <div class="mt-5 flex justify-center">
            <div class="inline-flex max-w-full items-center gap-3 rounded-[10px] border border-border bg-muted py-2 pr-3.5 pl-2 text-left">
              <BankGlyph id={inferBankId(file().name)} size={32} />
              <div class="min-w-0">
                <div class="truncate text-[13px] font-semibold">{file().name}</div>
                <div class="mt-px font-mono text-[11.5px] tabular-nums text-muted-foreground">
                  {formatBytes(file().size)} &middot; {file().type || 'unknown type'}
                </div>
              </div>
            </div>
          </div>
        )}
      </Show>

      <div class="mt-6 flex justify-center gap-2.5">
        <Button type="button" onClick={() => props.onChooseAnother()}>
          <Icon name="file" size={16} stroke={1.9} />
          Choose another file
        </Button>
        <Button type="button" variant="ghost" onClick={() => props.onCancel()}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
