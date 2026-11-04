import { Badge } from '@components/ui'
import { healthLabel, type Health } from '@components/observability/helpers/healthStatus'

const TONE: Record<Health, string> = {
  healthy: 'bg-success-muted text-success-on-muted',
  degraded: 'bg-caution-muted text-caution-on-muted',
  failing: 'bg-negative-muted text-negative-emphasis',
  unknown: 'bg-muted text-muted-foreground',
}

export default function HealthBadge(props: { health: Health }) {
  return (
    <Badge
      data-testid="observability-health-badge"
      data-health={props.health}
      class={`border-transparent ${TONE[props.health]}`}
    >
      {healthLabel(props.health)}
    </Badge>
  )
}
