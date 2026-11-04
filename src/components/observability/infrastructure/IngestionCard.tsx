import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@components/ui'
import HealthBadge from '@components/observability/HealthBadge'
import { ingestionHealth } from '@components/observability/helpers/healthStatus'
import { formatCount } from '@components/observability/helpers/formatMetric'
import type { LambdaMetrics } from '@types'

function Row(props: { label: string; value: string }) {
  return (
    <div class="flex items-baseline justify-between">
      <span class="text-muted-foreground text-sm">{props.label}</span>
      <span class="font-medium tabular-nums">{props.value}</span>
    </div>
  )
}

/** Recent runs arrive in phase 2, so this card shows the queue and the Lambda only. */
export default function IngestionCard(props: {
  dlqVisible: number | null
  lambda: LambdaMetrics | undefined
}) {
  return (
    <Card data-testid="observability-ingestion-card">
      <CardHeader>
        <CardTitle>CSV ingestion</CardTitle>
        <CardAction>
          <HealthBadge health={ingestionHealth(props.dlqVisible)} />
        </CardAction>
      </CardHeader>
      <CardContent class="flex flex-col gap-2">
        <Row label="Dead-letter queue depth" value={formatCount(props.dlqVisible)} />
        <Row label="Invocations" value={formatCount(props.lambda?.invocations ?? null)} />
        <Row label="Errors" value={formatCount(props.lambda?.errors ?? null)} />
      </CardContent>
    </Card>
  )
}
