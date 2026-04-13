import { createEffect } from 'solid-js'
import { useParams } from '@solidjs/router'
import { applyMemoSummaryRoute } from '@stores/transactionsStore'
import MemoSummaryTable from './MemoSummaryTable'

export default function MemoSummaryPage() {
  const params = useParams<{ memoId: string }>()
  createEffect(() => {
    applyMemoSummaryRoute(params.memoId)
  })
  return <MemoSummaryTable />
}
