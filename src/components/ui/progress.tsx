import { splitProps } from 'solid-js'
import * as ProgressPrimitive from '@kobalte/core/progress'
import { cn } from '@utils/cn'

type ProgressProps = ProgressPrimitive.ProgressRootProps & { class?: string }

function Progress(props: ProgressProps) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <ProgressPrimitive.Root data-slot="progress" {...rest}>
      <ProgressPrimitive.Track
        class={cn('bg-primary/20 relative h-2 w-full overflow-hidden rounded-full', local.class)}
      >
        <ProgressPrimitive.Fill
          data-slot="progress-indicator"
          class="bg-primary h-full w-full flex-1 transition-all"
          style={{ transform: `translateX(-${100 - (rest.value || 0)}%)` }}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  )
}

export { Progress }
export type { ProgressProps }
