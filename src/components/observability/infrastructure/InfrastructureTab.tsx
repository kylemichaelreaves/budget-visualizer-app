import { Match, Switch } from 'solid-js'
import axios from 'axios'
import { Button, Skeleton } from '@components/ui'
import useObservabilityMetrics from '@api/hooks/observability/useObservabilityMetrics'
import ApiGatewayCard from './ApiGatewayCard'
import LambdaTable from './LambdaTable'
import IngestionCard from './IngestionCard'
import RdsCard from './RdsCard'
import type { ObservabilityRange } from '@types'

const isForbidden = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 403

export default function InfrastructureTab(props: { range: () => ObservabilityRange }) {
  const query = useObservabilityMetrics(() => props.range())

  return (
    <Switch>
      <Match when={query.data}>
        {(data) => (
          <div class="flex flex-col gap-4">
            <ApiGatewayCard api={data().api} />
            <LambdaTable lambdas={data().lambdas} />
            <div class="grid gap-4 md:grid-cols-2">
              <IngestionCard
                dlqVisible={data().ingestion.dlqVisible}
                lambda={data().lambdas.find((l) => l.key === 'ingestion')}
              />
              <RdsCard rds={data().rds} />
            </div>
          </div>
        )}
      </Match>
      <Match when={query.isError && isForbidden(query.error)}>
        <p data-testid="observability-forbidden" class="text-muted-foreground">
          You don't have access to observability.
        </p>
      </Match>
      <Match when={query.isError}>
        <div data-testid="observability-error" class="flex items-center gap-3">
          <p class="text-muted-foreground">Metrics are unavailable right now.</p>
          <Button
            variant="outline"
            size="sm"
            data-testid="observability-retry"
            onClick={() => query.refetch()}
          >
            Retry
          </Button>
        </div>
      </Match>
      <Match when={true}>
        <div data-testid="observability-loading" class="flex flex-col gap-4">
          <Skeleton class="h-56 w-full" />
          <Skeleton class="h-48 w-full" />
          <div class="grid gap-4 md:grid-cols-2">
            <Skeleton class="h-40" />
            <Skeleton class="h-40" />
          </div>
        </div>
      </Match>
    </Switch>
  )
}
