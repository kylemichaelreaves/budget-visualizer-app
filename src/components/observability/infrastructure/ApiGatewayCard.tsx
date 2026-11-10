import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@components/ui'
import HealthBadge from '@components/observability/HealthBadge'
import LatencyBars from './LatencyBars'
import { apiHealth } from '@components/observability/helpers/healthStatus'
import { formatCount, formatMs } from '@components/observability/helpers/formatMetric'
import type { ObservabilityMetrics } from '@types'

function Stat(props: { label: string; value: string }) {
  return (
    <div>
      <div class="text-muted-foreground text-xs">{props.label}</div>
      <div class="text-lg font-medium tabular-nums">{props.value}</div>
    </div>
  )
}

export default function ApiGatewayCard(props: { api: ObservabilityMetrics['api'] }) {
  return (
    <Card data-testid="observability-api-card">
      <CardHeader>
        <CardTitle>API Gateway</CardTitle>
        <CardAction>
          <HealthBadge health={apiHealth(props.api)} />
        </CardAction>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Requests" value={formatCount(props.api.requests)} />
          <Stat label="4xx" value={formatCount(props.api.errors4xx)} />
          <Stat label="5xx" value={formatCount(props.api.errors5xx)} />
          <Stat
            label="p50 / p95 latency"
            value={`${formatMs(props.api.p50LatencyMs)} / ${formatMs(props.api.p95LatencyMs)}`}
          />
        </div>
        <div>
          <div class="text-muted-foreground mb-1 text-xs">p95 latency</div>
          <LatencyBars points={props.api.p95LatencySeries} />
        </div>
      </CardContent>
    </Card>
  )
}
