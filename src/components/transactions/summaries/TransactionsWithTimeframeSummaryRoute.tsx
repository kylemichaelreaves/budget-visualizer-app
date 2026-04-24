import { createEffect } from 'solid-js'
import { useParams } from '@solidjs/router'
import { applyMonthSummaryRoute, applyWeekSummaryRoute } from '@stores/transactionsStore'
import TransactionsTable from '../table/TransactionsTable'

/** Handles `/transactions/weeks/:week/summary` and `/transactions/months/:month/summary`. */
export default function TransactionsWithTimeframeSummaryRoute() {
  const params = useParams<{ week?: string; month?: string }>()
  createEffect(() => {
    const w = params.week
    const m = params.month
    if (w != null && w !== '') {
      applyWeekSummaryRoute(w)
    } else if (m != null && m !== '') {
      applyMonthSummaryRoute(m)
    }
  })
  return <TransactionsTable />
}
