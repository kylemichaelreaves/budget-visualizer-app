import { http, HttpResponse } from 'msw'
import type { Memo } from '@types'

/** Minimal memo rows for Storybook / MSW (matches `Memo` required fields). */
const storyMemos: Memo[] = [
  { id: 1, name: 'Coffee', recurring: false, necessary: false, ambiguous: false },
  { id: 2, name: 'Rent', recurring: true, necessary: true, ambiguous: false },
  { id: 3, name: 'Coffee', recurring: false, necessary: false, ambiguous: true },
  { id: 4, name: 'Utilities', recurring: true, necessary: true, ambiguous: false },
]

function filterByName(name: string | null): Memo[] {
  const q = (name ?? '').trim().toLowerCase()
  if (!q) return storyMemos
  return storyMemos.filter((m) => m.name.toLowerCase().includes(q))
}

/**
 * MSW handlers for `useMemoSearch` / `fetchMemos` in Storybook.
 * Covers `initBaseApiUrl` HEAD probe and GET list/search.
 */
export const storybookMemoSearchHandlers = [
  http.head('/api/v1', () => new HttpResponse(null, { status: 200 })),
  http.head('/api/gateway', () => new HttpResponse(null, { status: 200 })),
  http.get('/api/v1/memos', ({ request }) => {
    const url = new URL(request.url)
    const name = url.searchParams.get('name')
    const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 50)
    const rows = filterByName(name).slice(0, limit)
    return HttpResponse.json(rows)
  }),
  http.get('/api/gateway/memos', ({ request }) => {
    const url = new URL(request.url)
    const name = url.searchParams.get('name')
    const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 50)
    const rows = filterByName(name).slice(0, limit)
    return HttpResponse.json(rows)
  }),
]
