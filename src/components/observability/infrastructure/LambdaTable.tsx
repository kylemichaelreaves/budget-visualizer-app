import { For } from 'solid-js'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui'
import HealthBadge from '@components/observability/HealthBadge'
import { lambdaHealth } from '@components/observability/helpers/healthStatus'
import { formatCount, formatMs } from '@components/observability/helpers/formatMetric'
import type { LambdaMetrics } from '@types'

export default function LambdaTable(props: { lambdas: LambdaMetrics[] }) {
  return (
    <Card data-testid="observability-lambda-table">
      <CardHeader>
        <CardTitle>Lambda functions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Function</TableHead>
              <TableHead>Stack</TableHead>
              <TableHead class="text-right">Invocations</TableHead>
              <TableHead class="text-right">Errors</TableHead>
              <TableHead class="text-right">p95 duration</TableHead>
              <TableHead class="text-right">Throttles</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <For each={props.lambdas}>
              {(l) => (
                <TableRow data-testid="observability-lambda-row">
                  <TableCell class="font-medium">{l.functionName}</TableCell>
                  <TableCell class="text-muted-foreground">{l.stack}</TableCell>
                  <TableCell class="text-right tabular-nums">{formatCount(l.invocations)}</TableCell>
                  <TableCell class="text-right tabular-nums">{formatCount(l.errors)}</TableCell>
                  <TableCell class="text-right tabular-nums">{formatMs(l.p95DurationMs)}</TableCell>
                  <TableCell class="text-right tabular-nums">{formatCount(l.throttles)}</TableCell>
                  <TableCell>
                    <HealthBadge health={lambdaHealth(l)} />
                  </TableCell>
                </TableRow>
              )}
            </For>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
