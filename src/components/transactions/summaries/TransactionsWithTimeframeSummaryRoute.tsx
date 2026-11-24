import { createEffect } from 'solid-js'
import { useParams } from '@solidjs/router'
import { selectMonthView, selectWeekView } from '@stores/transactionsStore'
import TransactionsTable from '../table/TransactionsTable'

/** Handles `/transactions/weeks/:week/summary` and `/transactions/months/:month/summary`. */
export default function TransactionsWithTimeframeSummaryRoute() {
  const params = useParams<{ week?: string; month?: string }>()
  createEffect(
    () => ({ w: params.week, m: params.month }),
    ({ w, m }) => {
      if (w != null && w !== '') {
        selectWeekView(w)
      } else if (m != null && m !== '') {
        selectMonthView(m)
      }
    },
  )
  return <TransactionsTable />
}
