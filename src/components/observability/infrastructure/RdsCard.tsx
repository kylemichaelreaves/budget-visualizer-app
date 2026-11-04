import { Show } from 'solid-js'
import { Card, CardContent, CardHeader, CardTitle, Progress } from '@components/ui'
import { formatCount, formatMs, formatPercent } from '@components/observability/helpers/formatMetric'
import { formatBytes } from '@utils/formatBytes'
import type { ObservabilityMetrics } from '@types'

function Row(props: { label: string; value: string }) {
  return (
    <div class="flex items-baseline justify-between">
      <span class="text-muted-foreground text-sm">{props.label}</span>
      <span class="font-medium tabular-nums">{props.value}</span>
    </div>
  )
}

export default function RdsCard(props: { rds: ObservabilityMetrics['rds'] }) {
  return (
    <Card data-testid="observability-rds-card">
      <CardHeader>
        <CardTitle>RDS</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-3">
        <div class="flex flex-col gap-1.5">
          <Row label="CPU" value={formatPercent(props.rds.cpuPercent)} />
          {/* No bar when CPU is unknown: an empty bar would read as 0%. */}
          <Show when={props.rds.cpuPercent}>
            {(cpu) => <Progress value={cpu()} minValue={0} maxValue={100} aria-label="CPU utilisation" />}
          </Show>
        </div>
        <Row label="Connections" value={formatCount(props.rds.connections)} />
        <Row
          label="Free storage"
          value={props.rds.freeStorageBytes === null ? '—' : formatBytes(props.rds.freeStorageBytes)}
        />
        <Row label="Read latency" value={formatMs(props.rds.readLatencyMs)} />
      </CardContent>
    </Card>
  )
}
