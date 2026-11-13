import { createSignal, onCleanup } from 'solid-js'
import { useSearchParams } from '@solidjs/router'
import { Button } from '@components/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs'
import useObservabilityMetrics from '@api/hooks/observability/useObservabilityMetrics'
import RangeToggle from '@components/observability/RangeToggle'
import InfrastructureTab from '@components/observability/infrastructure/InfrastructureTab'
import { parseObservabilityRange } from '@components/observability/helpers/observabilityRange'
import { formatUpdatedAgo } from '@components/observability/helpers/formatUpdatedAgo'

export default function ObservabilityPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const range = () => {
    const raw = searchParams.range
    return parseObservabilityRange(typeof raw === 'string' ? raw : undefined)
  }
  // The page owns the query so Refresh and "Updated N min ago" share it with the tab.
  const query = useObservabilityMetrics(range)

  const [now, setNow] = createSignal(Date.now())
  const timer = setInterval(() => setNow(Date.now()), 30_000)
  onCleanup(() => clearInterval(timer))

  return (
    <div data-testid="observability-page" class="flex flex-col gap-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold">Observability</h1>
          <p class="text-muted-foreground text-sm">Health of the budget-visualizer backend.</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <RangeToggle
            value={range()}
            onChange={(next) => setSearchParams({ range: next }, { replace: true })}
          />
          <span data-testid="observability-updated" class="text-muted-foreground text-sm">
            {formatUpdatedAgo(query.dataUpdatedAt, now())}
          </span>
          <Button
            variant="outline"
            size="sm"
            data-testid="observability-refresh"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Refresh
          </Button>
        </div>
      </div>
      <Tabs defaultValue="infrastructure">
        <TabsList>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
        </TabsList>
        <TabsContent value="infrastructure">
          <InfrastructureTab query={query} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
