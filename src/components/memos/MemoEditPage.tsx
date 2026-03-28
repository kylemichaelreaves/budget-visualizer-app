import type { JSX } from 'solid-js'
import { Show, createMemo } from 'solid-js'
import { useNavigate, useParams } from '@solidjs/router'
import { useMemoById } from '@api/hooks/memos/useMemoById'
import AlertComponent from '@components/shared/AlertComponent'
import MemoEditForm from './MemoEditForm'
import { Button } from '@components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'

export default function MemoEditPage(): JSX.Element {
  const params = useParams<{ memoId: string }>()
  const navigate = useNavigate()

  const memoId = createMemo(() => {
    const n = Number(params.memoId)
    return Number.isFinite(n) && !Number.isNaN(n) ? n : null
  })

  const q = useMemoById({ memoId: () => memoId() })

  const goAfterSave = () => {
    const id = memoId()
    if (id != null) {
      navigate(`/budget-visualizer/memos/${id}/summary`)
    } else {
      navigate('/budget-visualizer/memos')
    }
  }

  return (
    <div class="py-3 text-foreground">
      <header class="mb-4">
        <Button variant="outline" type="button" onClick={() => window.history.back()}>
          Back
        </Button>
        <h1 class="mt-3 text-xl font-semibold">Edit memo</h1>
      </header>

      <Show when={memoId() == null}>
        <AlertComponent
          type="warning"
          title="Invalid memo"
          message="The URL must include a numeric memo id."
          dataTestId="memo-edit-invalid-id"
        />
      </Show>

      <Show when={memoId() != null && q.isError && q.error}>
        {(err) => (
          <AlertComponent
            type="error"
            title={(err() as Error).name}
            message={(err() as Error).message}
            dataTestId="memo-edit-load-error"
          />
        )}
      </Show>

      <Show when={memoId() != null && (q.isLoading || q.isFetching)}>
        <p data-testid="memo-edit-loading">Loading\u2026</p>
      </Show>

      <Show when={memoId() != null && !q.isLoading && !q.isFetching && q.data}>
        {(m) => (
          <Card>
            <CardHeader>
              <CardTitle>Memo Details</CardTitle>
            </CardHeader>
            <CardContent>
              <MemoEditForm memo={m()} onSuccess={goAfterSave} dataTestId="memo-edit-form" />
            </CardContent>
          </Card>
        )}
      </Show>

      <Show when={memoId() != null && !q.isLoading && !q.isFetching && !q.data && !q.isError}>
        <AlertComponent
          type="warning"
          title="Not found"
          message="No memo matches this id."
          dataTestId="memo-edit-not-found"
        />
      </Show>
    </div>
  )
}
