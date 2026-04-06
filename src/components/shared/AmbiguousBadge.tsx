import type { JSX } from 'solid-js'
import { Badge } from '@components/ui/badge'

export default function AmbiguousBadge(props: { ambiguous: boolean }): JSX.Element {
  return props.ambiguous ? (
    <Badge variant="outline" class="gap-1 border-amber-400 text-amber-600 dark:text-amber-400">
      <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      Yes
    </Badge>
  ) : (
    <Badge variant="outline" class="gap-1 border-emerald-400 text-emerald-600 dark:text-emerald-400">
      <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      No
    </Badge>
  )
}
