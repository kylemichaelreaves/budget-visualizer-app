import { Match, Show, Switch } from 'solid-js'
import axios from 'axios'
import { Button, Skeleton } from '@components/ui'
import type useObservabilityMetrics from '@api/hooks/observability/useObservabilityMetrics'
import ApiGatewayCard from './ApiGatewayCard'
import LambdaTable from './LambdaTable'
import IngestionCard from './IngestionCard'
import RdsCard from './RdsCard'
import { formatUpdatedAgo } from '@components/observability/helpers/formatUpdatedAgo'

const isForbidden = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 403

/** The page owns the query (Refresh and "Updated" live there); this tab only renders it. */
export default function InfrastructureTab(props: { query: ReturnType<typeof useObservabilityMetrics> }) {
  return (
    <Switch>
      <Match when={props.query.data}>
        {(data) => (
          <div class="flex flex-col gap-4">
            <Show when={props.query.isError}>
              <p
                data-testid="observability-stale"
                class="text-caution-on-muted bg-caution-muted rounded-md px-3 py-2 text-sm"
              >
                Couldn't refresh — showing data from{' '}
                {formatUpdatedAgo(props.query.dataUpdatedAt, Date.now()).replace(/^Updated /, '')}.
              </p>
            </Show>
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
      <Match when={props.query.isError && isForbidden(props.query.error)}>
        <p data-testid="observability-forbidden" class="text-muted-foreground">
          You don't have access to observability. If your role changed recently, sign out and back in.
        </p>
      </Match>
      <Match when={props.query.isError}>
        <div data-testid="observability-error" class="flex items-center gap-3">
          <p class="text-muted-foreground">Metrics are unavailable right now.</p>
          <Button
            variant="outline"
            size="sm"
            data-testid="observability-retry"
            onClick={() => void props.query.refetch()}
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
