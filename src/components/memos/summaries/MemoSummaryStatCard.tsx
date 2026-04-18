import type { Accessor, JSX } from 'solid-js'
import { Card, CardContent } from '@components/ui/card'

const toneIconWrap: Record<'red' | 'green' | 'violet', string> = {
  red: 'rounded-full bg-negative-muted p-2',
  green: 'rounded-full bg-positive-muted p-2',
  violet: 'rounded-full bg-accent-purple-muted p-2',
}

export default function MemoSummaryStatCard(props: {
  tone: 'red' | 'green' | 'violet'
  label: Accessor<string>
  icon: JSX.Element
  children: JSX.Element
}) {
  return (
    <Card>
      <CardContent class="pt-5 pb-4">
        <div class="flex items-center gap-3 mb-3">
          <div class={toneIconWrap[props.tone]}>{props.icon}</div>
          <span class="text-sm font-medium text-muted-foreground">{props.label()}</span>
        </div>
        {props.children}
      </CardContent>
    </Card>
  )
}
