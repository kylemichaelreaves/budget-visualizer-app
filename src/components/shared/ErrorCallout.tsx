import { AlertCircle } from 'lucide-solid'

interface ErrorCalloutProps {
  title: string
  description: string
  'data-testid'?: string
}

export function ErrorCallout(props: ErrorCalloutProps) {
  return (
    <div
      role="alert"
      class="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3"
      data-testid={props['data-testid']}
    >
      <AlertCircle class="h-4 w-4 text-destructive mt-0.5 shrink-0" />
      <div class="flex flex-col gap-0.5">
        <p class="text-destructive text-[13px] font-medium">{props.title}</p>
        <p class="text-muted-foreground text-[13px]">{props.description}</p>
      </div>
    </div>
  )
}
