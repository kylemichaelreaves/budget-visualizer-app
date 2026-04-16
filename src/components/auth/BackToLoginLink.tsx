import { A } from '@solidjs/router'
import { ArrowLeft } from 'lucide-solid'

export function BackToLoginLink(props: { class?: string }) {
  return (
    <div class="flex justify-center">
      <A
        href="/login"
        class={
          props.class ??
          'inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm'
        }
      >
        <ArrowLeft class="h-3.5 w-3.5" />
        Back to login
      </A>
    </div>
  )
}
