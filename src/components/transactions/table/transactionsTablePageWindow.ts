/**
 * Pure page-window helpers for the transactions table.
 *
 * The table pages an offset-based infinite query: page N lives at offset
 * `(N-1) * limit`, and the query only ever appends. These functions read that
 * window directly instead of flattening every loaded row and re-slicing it, which
 * is what previously let the rendered rows drift from the server's row count.
 */

/**
 * Rows the server returned for `page` (1-based), or an empty array when that page
 * has not been fetched yet.
 *
 * Returns the stored page array by reference rather than a copy, so `<For>` sees a
 * stable identity across unrelated re-renders.
 */
export function rowsForPage<T>(pages: readonly T[][], page: number): readonly T[] {
  if (!Number.isFinite(page) || page < 1) return EMPTY
  return pages[page - 1] ?? EMPTY
}

const EMPTY: readonly never[] = []

/**
 * Largest offset that still lands on a page containing rows.
 *
 * A trailing empty page is normal: the query keeps requesting the next offset
 * until one comes back short, so the final fetch can return nothing. Anchoring to
 * the last page *with rows* means clamping never parks the user on a blank page.
 *
 * Returns 0 when nothing has loaded, so an unclamped offset falls back to page 1.
 */
export function maxOffsetForLoadedPages(pages: readonly unknown[][], limit: number): number {
  if (!Number.isFinite(limit) || limit <= 0) return 0
  const lastPageWithRows = pages.findLastIndex((page) => page.length > 0)
  return Math.max(0, lastPageWithRows) * limit
}
