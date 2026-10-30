import { delay, http, HttpResponse } from 'msw'
import type { RecurringSeries } from '@types'

export interface RecurringHandlerOptions {
  /** What GET `/recurring` answers. `loading` never resolves, so the pending state stays up. */
  list: 'ok' | 'loading' | 'error'
  /** What POST `/recurring/refresh` answers. */
  rescan?: 'ok' | 'error'
}

const clone = (rows: RecurringSeries[]): RecurringSeries[] => rows.map((row) => ({ ...row }))

/**
 * MSW handlers for the recurring page in Storybook: list, dismiss (PATCH), rescan, and the memo
 * write behind a conflict card's accept button. They keep the rows in memory, so dismissing or
 * accepting changes what the next refetch returns. `reset` restores the seed rows; stories call it
 * from a loader so every visit starts from the same data.
 *
 * Each path is served under both `/api/v1` (the Vite proxy) and `/api/gateway`, as the other
 * Storybook handlers do.
 */
export function createRecurringHandlers(seed: RecurringSeries[], options: RecurringHandlerOptions) {
  let rows = clone(seed)
  const reset = () => {
    rows = clone(seed)
  }

  const paths = (suffix: string) => [`/api/v1${suffix}`, `/api/gateway${suffix}`]

  const handlers = [
    http.head('/api/v1', () => new HttpResponse(null, { status: 200 })),
    http.head('/api/gateway', () => new HttpResponse(null, { status: 200 })),
    ...paths('/recurring').map((path) =>
      http.get(path, async ({ request }) => {
        if (options.list === 'loading') {
          await delay('infinite')
        }
        if (options.list === 'error') {
          return HttpResponse.json({ message: 'Recurring detection service is unavailable' }, { status: 500 })
        }
        const includeDismissed = new URL(request.url).searchParams.get('includeDismissed') === 'true'
        return HttpResponse.json(rows.filter((row) => includeDismissed || row.dismissedAt === null))
      }),
    ),
    ...paths('/recurring/refresh').map((path) =>
      http.post(path, async () => {
        await delay(900)
        if (options.rescan === 'error') {
          return HttpResponse.json({ message: 'Transaction scan timed out' }, { status: 502 })
        }
        return HttpResponse.json({ upserted: rows.length, deleted: 0 })
      }),
    ),
    ...paths('/recurring/:id').map((path) =>
      http.patch(path, async ({ params, request }) => {
        const body = (await request.json()) as { dismissed: boolean }
        const row = rows.find((r) => String(r.id) === params.id)
        if (!row) return HttpResponse.json({ message: 'Series not found' }, { status: 404 })
        row.dismissedAt = body.dismissed ? new Date().toISOString() : null
        return HttpResponse.json(row)
      }),
    ),
    ...paths('/memos/:id').map((path) =>
      http.patch(path, async ({ params, request }) => {
        const body = (await request.json()) as { name: string; recurring?: boolean; frequency?: string }
        for (const row of rows.filter((r) => String(r.memoId) === params.id)) {
          row.memoRecurring = body.recurring ?? row.memoRecurring
          row.memoFrequency = (body.frequency as RecurringSeries['memoFrequency']) ?? row.memoFrequency
        }
        return HttpResponse.json({ success: true, memo: { id: Number(params.id), ...body } })
      }),
    ),
  ]

  return { handlers, reset }
}
