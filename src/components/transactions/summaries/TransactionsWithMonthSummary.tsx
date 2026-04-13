import { createEffect } from 'solid-js'
import { useParams } from '@solidjs/router'
import { applyMonthSummaryRoute } from '@stores/transactionsStore'
import TransactionsTable from '../table/TransactionsTable'

export default function TransactionsWithMonthSummary() {
  const params = useParams<{ month: string }>()
  createEffect(() => {
    applyMonthSummaryRoute(params.month)
  })
  return <TransactionsTable />
}
