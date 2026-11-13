import { httpClient } from '@api/httpClient'

/** `GET /memos?count=true` — total number of memos. */
export async function fetchMemosCount(): Promise<number> {
  const res = await httpClient.get<{ count: number | string }[]>('/memos', { params: { count: true } })
  // pg `COUNT(*)` without `::int` arrives as a string; coerce at the boundary.
  return Number(res.data[0]?.count ?? 0)
}
