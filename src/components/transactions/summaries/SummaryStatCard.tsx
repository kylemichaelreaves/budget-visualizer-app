import type { JSX } from 'solid-js'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'

export default function SummaryStatCard(props: {
  title: string
  icon: JSX.Element
  value: JSX.Element
  subtitle?: string
  dataTestId?: string
}): JSX.Element {
  return (
    <Card data-testid={props.dataTestId}>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">{props.title}</CardTitle>
        {props.icon}
      </CardHeader>
      <CardContent>
        {props.value}
        {props.subtitle ? <p class="text-xs text-muted-foreground mt-1">{props.subtitle}</p> : null}
      </CardContent>
    </Card>
  )
}
