import { createEffect } from 'solid-js'
import { useParams } from '@solidjs/router'
import { applyWeekSummaryRoute } from '@stores/transactionsStore'
import TransactionsTable from './TransactionsTable'

export default function TransactionsWithWeekSummary() {
  const params = useParams<{ week: string }>()
  createEffect(() => {
    applyWeekSummaryRoute(params.week)
  })
  return <TransactionsTable />
}
